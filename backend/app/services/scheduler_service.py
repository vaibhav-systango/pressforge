import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.database.database import SessionLocal
from app.repositories.oauth_state_repository import oauth_state_repository
from app.services.social_platform_registry import get_all_social_platform_services

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None

# How often to drain the approved publish queue & check workspace schedules
PUBLISH_QUEUE_INTERVAL_SECONDS = 60
WORKSPACE_SCHEDULE_INTERVAL_SECONDS = 30


def _parse_schedule_time(time_str: str | None) -> datetime | None:
    if not time_str:
        return None
    time_str = time_str.strip()
    try:
        clean_str = time_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        pass

    for fmt in (
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y, %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
    ):
        try:
            dt = datetime.strptime(time_str, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            pass

    return None


def _run_token_refresh() -> None:
    db = SessionLocal()
    try:
        total = 0
        for service in get_all_social_platform_services():
            count = service.refresh_expiring_tokens(db)
            total += count
        if total:
            logger.info("Refreshed %s social account token(s)", total)
    except Exception as exc:
        logger.error("Token refresh job failed: %s", exc)
    finally:
        db.close()


def _cleanup_oauth_states() -> None:
    db = SessionLocal()
    try:
        deleted = oauth_state_repository.delete_expired(db)
        if deleted:
            db.commit()
            logger.info("Cleaned up %s expired OAuth state(s)", deleted)
    except Exception as exc:
        logger.error("OAuth state cleanup failed: %s", exc)
        db.rollback()
    finally:
        db.close()


def _run_publish_queue() -> None:
    from app.services.publish_service import publish_service

    db = SessionLocal()
    try:
        result = publish_service.process_publish_queue(db)
        if result["published"] or result["failed"]:
            logger.info(
                "Publish queue: published=%s skipped=%s failed=%s",
                result["published"],
                result["skipped"],
                result["failed"],
            )
    except Exception as exc:
        logger.error("Publish queue job failed: %s", exc)
        db.rollback()
    finally:
        db.close()


def _process_workspace_schedules() -> None:
    """
    Checks workspace schedule windows and automatically generates LinkedIn/social posts
    based on workspace brand details, saving them as pending approval and notifying clients.
    """
    from app.models.workspace_schedule import WorkspaceSchedule
    from app.models.workspace import Workspace
    from app.models.draft import Draft
    from app.providers.gemini_content_provider import gemini_content_provider
    from app.services.notification_service import notification_service

    db = SessionLocal()
    try:
        enabled_schedules = (
            db.query(WorkspaceSchedule)
            .filter(WorkspaceSchedule.enabled == True)
            .all()
        )
        if not enabled_schedules:
            return

        now = datetime.now(timezone.utc)
        for schedule in enabled_schedules:
            scheduled_time = _parse_schedule_time(schedule.nextRun or schedule.datetime)
            if not scheduled_time:
                continue

            if scheduled_time <= now:
                workspace = (
                    db.query(Workspace)
                    .filter(Workspace.id == schedule.workspaceId, Workspace.isActive == True)
                    .first()
                )
                if not workspace:
                    logger.warning("Workspace %s for schedule %s not found", schedule.workspaceId, schedule.id)
                    schedule.enabled = False
                    db.add(schedule)
                    db.commit()
                    continue

                target_platform = schedule.platform or "linkedin"
                prompt_text = schedule.label or f"Scheduled {target_platform.capitalize()} post for {workspace.name}"
                keywords = workspace.keywords or []
                rules = workspace.rules or []

                caption = ""
                hashtags: list[str] = []
                image_brief = ""
                li_caption = ""
                li_hashtags: list[str] = []
                li_image_brief = ""
                image_url = ""

                import concurrent.futures

                try:
                    def _call_ai():
                        return gemini_content_provider.generate_variations(
                            prompt=prompt_text,
                            goal="Brand Awareness",
                            cta="Learn More",
                            visual_style="Professional & Modern",
                            platforms=[target_platform, "instagram"],
                            brand_name=workspace.name,
                            tone=workspace.tone or "professional",
                            keywords=keywords,
                            target_audience=workspace.targetAudience or "Professional audience",
                            brand_voice=workspace.brandVoice or "",
                            description=workspace.description or "",
                            rules=rules,
                        )

                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(_call_ai)
                        gen_result = future.result(timeout=5)

                    variations = gen_result.get("variations") or []
                    if variations:
                        var = variations[0]
                        caption = var.get("caption") or ""
                        hashtags = var.get("hashtags") or []
                        image_brief = var.get("imageBrief") or ""
                        li_caption = var.get("liCaption") or caption
                        li_hashtags = var.get("liHashtags") or hashtags
                        li_image_brief = var.get("liImageBrief") or image_brief
                        image_url = var.get("imageUrl") or ""
                    else:
                        raise ValueError("No content variations returned by AI")
                except Exception as exc:
                    logger.warning("AI generation skipped/failed for schedule %s (using brand fallback): %s", schedule.id, exc)
                    clean_brand = workspace.name.replace(" ", "")
                    caption = f"Exciting updates from {workspace.name}! We're continuously delivering innovation and value to our community."
                    hashtags = [str(k) for k in keywords[:5]] if keywords else ["Innovation", "Business", "Growth"]
                    image_brief = f"Modern branded social graphic for {workspace.name}"
                    li_caption = f"Key updates from {workspace.name}:\n\n{workspace.description or workspace.brandVoice or 'We are committed to delivering excellence and innovation.'}\n\n#{clean_brand} #Innovation #Leadership"
                    li_hashtags = [str(k) for k in keywords[:5]] if keywords else ["Professional", "Leadership", "Growth"]
                    li_image_brief = image_brief
                    image_url = workspace.logoUrl or ""

                now_iso = now.isoformat()
                draft = Draft(
                    workspaceId=workspace.id,
                    prompt=prompt_text,
                    status="pending_approval",
                    platform=target_platform,
                    version=1,
                    scheduledAt=now_iso,
                    caption=caption,
                    hashtags=hashtags,
                    imageBrief=image_brief,
                    imageUrl=image_url,
                    liCaption=li_caption,
                    liHashtags=li_hashtags,
                    liImageBrief=li_image_brief,
                    goal="Brand Awareness",
                    cta="Learn More",
                    visualStyle="Professional & Modern",
                    history=[{
                        "version": 1,
                        "timestamp": now_iso,
                        "action": f"Automated schedule ({schedule.label or 'LinkedIn Post'}) generated post for client approval",
                        "caption": caption,
                        "hashtags": hashtags,
                        "imageBrief": image_brief,
                        "liCaption": li_caption,
                        "liHashtags": li_hashtags,
                        "liImageBrief": li_image_brief,
                        "imageUrl": image_url,
                    }],
                )

                db.add(draft)
                db.commit()
                db.refresh(draft)

                # Dispatch notification to allocated clients
                try:
                    notification_service.dispatch_draft_notification(db, draft)
                    logger.info("Dispatched notification for automated draft %s to workspace clients", draft.id)
                except Exception as n_exc:
                    logger.error("Failed to send draft notification: %s", n_exc)

                # Update recurrence / next run time
                recurrence = (schedule.recurrence or "none").lower()
                if recurrence == "daily":
                    next_time = scheduled_time + timedelta(days=1)
                    schedule.nextRun = next_time.isoformat()
                elif recurrence == "weekly":
                    next_time = scheduled_time + timedelta(days=7)
                    schedule.nextRun = next_time.isoformat()
                elif recurrence == "monthly":
                    next_time = scheduled_time + timedelta(days=30)
                    schedule.nextRun = next_time.isoformat()
                else:
                    schedule.enabled = False
                    schedule.nextRun = None

                db.add(schedule)
                db.commit()
                logger.info("Automated workspace schedule %s processed successfully for workspace %s", schedule.id, workspace.name)
    except Exception as exc:
        logger.error("Workspace schedule processor job failed: %s", exc)
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    scheduler = BackgroundScheduler()
    scheduler.add_job(_run_token_refresh, CronTrigger(hour=2, minute=0), id="social_token_refresh")
    scheduler.add_job(_cleanup_oauth_states, IntervalTrigger(hours=1), id="oauth_state_cleanup")
    scheduler.add_job(
        _run_publish_queue,
        IntervalTrigger(seconds=PUBLISH_QUEUE_INTERVAL_SECONDS),
        id="publish_queue",
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        _process_workspace_schedules,
        IntervalTrigger(seconds=WORKSPACE_SCHEDULE_INTERVAL_SECONDS),
        id="workspace_schedule_processor",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    _scheduler = scheduler
    logger.info("Background scheduler started")
    return scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")
    _scheduler = None

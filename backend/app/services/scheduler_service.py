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
WORKSPACE_SCHEDULE_INTERVAL_SECONDS = 120


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

    The full flow:
    1. Find enabled schedules whose nextRun/datetime is due.
    2. Call Gemini AI to generate proper text content (captions, hashtags, image briefs).
    3. Wait for AI image generation via Pollinations + Cloudinary rehost (no artificial timeout).
    4. Save the draft as "pending_approval".
    5. Send email notification to allocated workspace clients.
    6. Advance the schedule recurrence.
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

                # ── Step 1: Call AI to generate content (NO artificial timeout) ──
                # generate_variations() internally:
                #   a) Calls Gemini API for text (up to 90s per attempt with retries)
                #   b) Downloads AI image from Pollinations (up to 120s)
                #   c) Rehosts to Cloudinary
                # We call it directly so it runs to completion.
                try:
                    logger.info(
                        "Schedule %s: Starting AI content generation for workspace '%s' (platform=%s)",
                        schedule.id, workspace.name, target_platform,
                    )

                    gen_result = gemini_content_provider.generate_variations(
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

                        logger.info(
                            "Schedule %s: AI generation complete — caption=%d chars, image_url=%s",
                            schedule.id,
                            len(li_caption if target_platform == "linkedin" else caption),
                            "present" if image_url else "missing",
                        )
                    else:
                        raise ValueError("No content variations returned by AI")

                except Exception as exc:
                    logger.warning(
                        "Schedule %s: AI generation failed (using brand fallback): %s",
                        schedule.id, exc,
                    )
                    clean_brand = workspace.name.replace(" ", "")
                    caption = (
                        f"Exciting updates from {workspace.name}! "
                        f"We're continuously delivering innovation and value to our community."
                    )
                    hashtags = (
                        [str(k) for k in keywords[:5]]
                        if keywords
                        else ["Innovation", "Business", "Growth"]
                    )
                    image_brief = f"Modern branded social graphic for {workspace.name}"
                    li_caption = (
                        f"Key updates from {workspace.name}:\n\n"
                        f"{workspace.description or workspace.brandVoice or 'We are committed to delivering excellence and innovation.'}"
                        f"\n\n#{clean_brand} #Innovation #Leadership"
                    )
                    li_hashtags = (
                        [str(k) for k in keywords[:5]]
                        if keywords
                        else ["Professional", "Leadership", "Growth"]
                    )
                    li_image_brief = image_brief

                    # ── Fallback image: still try to generate one from the brief ──
                    try:
                        logger.info("Schedule %s: Attempting fallback image generation...", schedule.id)
                        pollinations_url = gemini_content_provider.build_pollinations_url(image_brief)
                        rehosted = gemini_content_provider._rehost_image(pollinations_url)
                        image_url = rehosted or pollinations_url
                    except Exception as img_exc:
                        logger.warning("Schedule %s: Fallback image generation also failed: %s", schedule.id, img_exc)
                        image_url = workspace.logoUrl or ""

                # ── Step 2: For LinkedIn platform, use LinkedIn-specific fields as primary ──
                draft_caption = li_caption if target_platform == "linkedin" and li_caption else caption
                draft_hashtags = li_hashtags if target_platform == "linkedin" and li_hashtags else hashtags

                now_iso = now.isoformat()
                draft = Draft(
                    workspaceId=workspace.id,
                    prompt=prompt_text,
                    status="pending_approval",
                    platform=target_platform,
                    version=1,
                    scheduledAt=now_iso,
                    caption=draft_caption,
                    hashtags=draft_hashtags,
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
                        "caption": draft_caption,
                        "hashtags": draft_hashtags,
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
                logger.info(
                    "Schedule %s: Draft %s saved as pending_approval (image=%s)",
                    schedule.id, draft.id, "yes" if image_url else "no",
                )

                # ── Step 3: Email notification to allocated clients ──
                try:
                    notification_service.dispatch_draft_notification(db, draft)
                    logger.info("Schedule %s: Notification dispatched for draft %s", schedule.id, draft.id)
                except Exception as n_exc:
                    logger.error("Schedule %s: Failed to send draft notification: %s", schedule.id, n_exc)

                # ── Step 4: Advance recurrence / next run time ──
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
                logger.info(
                    "Schedule %s: Processed successfully for workspace '%s' (next=%s)",
                    schedule.id, workspace.name, schedule.nextRun or "disabled",
                )
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

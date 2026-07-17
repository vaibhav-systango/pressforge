import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.database.database import SessionLocal
from app.repositories.oauth_state_repository import oauth_state_repository
from app.services.social_platform_registry import get_all_social_platform_services

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None

# How often to drain the approved publish queue
PUBLISH_QUEUE_INTERVAL_SECONDS = 60


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

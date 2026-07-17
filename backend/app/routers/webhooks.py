import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.services.instagram_service import instagram_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/meta", summary="Meta webhook verification")
async def verify_meta_webhook(
    hub_mode: str | None = Query(default=None, alias="hub.mode"),
    hub_verify_token: str | None = Query(default=None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(default=None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.META_WEBHOOK_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


@router.post("/meta", summary="Meta webhook events")
async def handle_meta_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    if not instagram_service.verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

    try:
        body = json.loads(payload.decode())
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            field = change.get("field")
            value = change.get("value", {})
            if field == "instagram" and value.get("verb") == "revoke":
                ig_user_id = str(value.get("id", ""))
                if ig_user_id:
                    instagram_service.revoke_account_by_external_id(db, ig_user_id)

    return {"success": True}

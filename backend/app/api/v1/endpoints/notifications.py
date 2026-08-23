from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime
import uuid
import secrets
import httpx
import json

from app.core.database import get_db
from app.models.webhook import WebhookSubscription
from app.services.webhook_service import generate_hmac_signature

router = APIRouter(prefix="/notifications", tags=["Webhooks & Notifications"])


class WebhookCreateRequest(BaseModel):
    name: str = Field(..., example="Slack Alert Integration")
    url: str = Field(..., example="https://hooks.slack.com/services/T00/B00/X00")
    events: List[str] = Field(default_factory=lambda: ["task.completed", "competitor.alert"])


class WebhookResponse(BaseModel):
    id: str
    name: str
    url: str
    secret: str
    events: List[str]
    is_active: bool
    created_at: datetime


@router.post("/webhooks", response_model=WebhookResponse, summary="Register Webhook Endpoint")
def create_webhook(payload: WebhookCreateRequest, db: Session = Depends(get_db)):
    """Registers a new webhook endpoint for automated system notifications."""
    sub = WebhookSubscription(
        id=str(uuid.uuid4()),
        name=payload.name,
        url=payload.url,
        secret=f"whsec_{secrets.token_hex(16)}",
        events=payload.events,
        is_active=True
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/webhooks", response_model=List[WebhookResponse], summary="List Webhook Subscriptions")
def list_webhooks(db: Session = Depends(get_db)):
    """Lists all registered webhook subscriptions."""
    return db.query(WebhookSubscription).all()


@router.delete("/webhooks/{webhook_id}", summary="Delete Webhook Subscription")
def delete_webhook(webhook_id: str, db: Session = Depends(get_db)):
    """Deletes a registered webhook subscription."""
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.id == webhook_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Webhook subscription not found.")
    db.delete(sub)
    db.commit()
    return {"status": "deleted", "id": webhook_id}


@router.post("/webhooks/{webhook_id}/test", summary="Trigger Test Ping Payload")
async def test_webhook(webhook_id: str, db: Session = Depends(get_db)):
    """Triggers a live test ping payload to verify webhook endpoint delivery."""
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.id == webhook_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Webhook subscription not found.")

    test_payload = {
        "event": "test.ping",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "message": "JIGYASA AI Webhook Test Verification Payload",
            "webhook_id": sub.id,
            "status": "connected"
        }
    }
    payload_json = json.dumps(test_payload)
    signature = generate_hmac_signature(sub.secret, payload_json)

    headers = {
        "Content-Type": "application/json",
        "X-Jigyasa-Event": "test.ping",
        "X-Jigyasa-Signature": f"sha256={signature}",
        "User-Agent": "JIGYASA-Webhook-Tester/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(sub.url, content=payload_json, headers=headers)
            return {
                "success": True,
                "status_code": res.status_code,
                "endpoint_url": sub.url,
                "signature": f"sha256={signature}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "endpoint_url": sub.url,
            "signature": f"sha256={signature}"
        }


# ─── SSE Real-Time Notification Stream ────────────────────────────────────────

from fastapi.responses import StreamingResponse
import asyncio

@router.get("/stream", summary="Real-Time Server-Sent Events (SSE) Notification Stream")
async def stream_notifications():
    """
    Establishes an SSE event stream connection pushing real-time activity updates.
    """
    async def event_generator():
        yield f"data: {json.dumps({'event': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
        while True:
            await asyncio.sleep(15)
            ping_data = {
                "event": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "unread_count": 0,
            }
            yield f"data: {json.dumps(ping_data)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


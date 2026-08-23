import hmac
import hashlib
import json
import logging
from typing import Dict, Any
import httpx

from app.core.database import SessionLocal
from app.models.webhook import WebhookSubscription

logger = logging.getLogger(__name__)


def generate_hmac_signature(secret: str, payload_str: str) -> str:
    """Generates an HMAC-SHA256 signature for webhook payload verification."""
    return hmac.new(secret.encode('utf-8'), payload_str.encode('utf-8'), hashlib.sha256).hexdigest()


async def dispatch_webhook_event(event_type: str, data: Dict[str, Any]):
    """
    Asynchronously dispatches webhook event to all subscribed active webhooks.
    """
    db = SessionLocal()
    try:
        subscriptions = db.query(WebhookSubscription).filter(
            WebhookSubscription.is_active == True
        ).all()

        targets = [sub for sub in subscriptions if event_type in (sub.events or [])]
        if not targets:
            return

        payload = {
            "event": event_type,
            "timestamp": str(data.get("timestamp", "")),
            "data": data
        }
        payload_json = json.dumps(payload)

        async with httpx.AsyncClient(timeout=10.0) as client:
            for sub in targets:
                signature = generate_hmac_signature(sub.secret, payload_json)
                headers = {
                    "Content-Type": "application/json",
                    "X-Jigyasa-Event": event_type,
                    "X-Jigyasa-Signature": f"sha256={signature}",
                    "User-Agent": "JIGYASA-Webhook-Dispatcher/1.0"
                }
                try:
                    res = await client.post(sub.url, content=payload_json, headers=headers)
                    logger.info(f"Dispatched webhook '{event_type}' to {sub.url} -> Status {res.status_code}")
                except Exception as e:
                    logger.warning(f"Failed to dispatch webhook to {sub.url}: {e}")
    finally:
        db.close()

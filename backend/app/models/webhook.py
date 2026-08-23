from sqlalchemy import Column, String, Boolean, DateTime, JSON
from datetime import datetime
import uuid

from app.core.database import Base


class WebhookSubscription(Base):
    """
    SQLAlchemy model for enterprise webhook endpoints.
    """
    __tablename__ = "webhook_subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    url = Column(String, nullable=False)
    secret = Column(String, nullable=False)
    events = Column(JSON, nullable=False, default=list)  # e.g., ["task.completed", "competitor.alert"]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

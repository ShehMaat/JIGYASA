from sqlalchemy import Column, String, DateTime, Text
from datetime import datetime
import uuid

from app.core.database import Base


class ActivityEvent(Base):
    """
    SQLAlchemy model for platform-wide activity audit trail.
    Captures research completions, document uploads, competitor additions, and comments.
    """
    __tablename__ = "activity_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)
    # e.g. "research.completed", "document.ingested", "competitor.added", "comment.posted"
    entity_type = Column(String, nullable=True)
    # e.g. "report", "document", "monitor", "comment"
    entity_id = Column(String, nullable=True, index=True)
    description = Column(Text, nullable=False)
    actor = Column(String, nullable=True, default="System")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

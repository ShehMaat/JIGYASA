from sqlalchemy import Column, String, Boolean, DateTime, Text
from datetime import datetime
import uuid

from app.core.database import Base


class PromptTemplate(Base):
    """
    SQLAlchemy model for AI agent system prompt templates.
    """
    __tablename__ = "prompt_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    system_prompt = Column(Text, nullable=False)
    category = Column(String, default="General")  # e.g., "Strategy", "Financial", "Product", "VC"
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

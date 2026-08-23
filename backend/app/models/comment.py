from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
import uuid

from app.core.database import Base


class DossierComment(Base):
    """
    SQLAlchemy model for analyst comments & annotations on market dossiers.
    """
    __tablename__ = "dossier_comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, nullable=False, index=True)
    author_name = Column(String, nullable=False, default="Anonymous Analyst")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

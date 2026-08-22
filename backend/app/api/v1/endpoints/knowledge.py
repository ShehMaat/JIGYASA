from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.services.rag_service import RAGKnowledgeService

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & RAG"])


class KnowledgeIndexRequest(BaseModel):
    title: str = Field(..., example="Stripe 2024 Enterprise Pricing Updates")
    content: str = Field(..., example="Stripe updated its custom enterprise tiers to include volume discounts starting at $10M ARR...")
    source_url: Optional[str] = Field(default=None, example="https://stripe.com/pricing")
    doc_metadata: Optional[Dict[str, Any]] = Field(default={})


class KnowledgeQueryRequest(BaseModel):
    query: str = Field(..., example="What are Stripe's enterprise pricing volume discounts?")
    top_k: Optional[int] = Field(default=4, ge=1, le=10)


@router.post("/index", summary="Index Document into Vector Knowledge Base")
def index_document(payload: KnowledgeIndexRequest, db: Session = Depends(get_db)):
    """
    Indexes a new research snippet or web article into the vector knowledge base for RAG search.
    """
    doc = RAGKnowledgeService.index_document(
        db=db,
        title=payload.title,
        content=payload.content,
        source_url=payload.source_url,
        doc_metadata=payload.doc_metadata
    )
    return {
        "id": doc.id,
        "title": doc.title,
        "message": f"Document '{doc.title}' successfully indexed into vector store.",
        "created_at": doc.created_at
    }


@router.post("/query", summary="Semantic RAG Search Query")
def query_knowledge_base(payload: KnowledgeQueryRequest, db: Session = Depends(get_db)):
    """
    Executes a semantic vector similarity search over indexed intelligence documents
    and returns a synthesized, evidence-backed answer with citations.
    """
    result = RAGKnowledgeService.query_knowledge_base(
        db=db,
        query=payload.query,
        top_k=payload.top_k or 4
    )
    return result

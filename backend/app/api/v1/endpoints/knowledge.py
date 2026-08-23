from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import io
import pypdf

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


@router.post("/upload", summary="Upload Document File (PDF, TXT, MD) to Knowledge Base")
async def upload_document_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Parses an uploaded PDF, TXT, or Markdown document, chunks content into ~500-word segments,
    and indexes them into the vector knowledge base.
    """
    filename = file.filename or "uploaded_doc"
    ext = filename.split(".")[-1].lower()

    content_bytes = await file.read()
    extracted_text = ""

    if ext == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            pages_text = [page.extract_text() for page in reader.pages if page.extract_text()]
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF file: {e}")
    else:
        try:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode text file: {e}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file contained no extractable text.")

    # Chunk text into ~500-word blocks
    words = extracted_text.split()
    chunk_size = 500
    chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

    indexed_count = 0
    for idx, chunk in enumerate(chunks):
        title = f"{filename} (Part {idx + 1}/{len(chunks)})" if len(chunks) > 1 else filename
        RAGKnowledgeService.index_document(
            db=db,
            title=title,
            content=chunk,
            source_url=f"file://{filename}",
            doc_metadata={"filename": filename, "chunk_index": idx, "total_chunks": len(chunks)}
        )
        indexed_count += 1

    return {
        "filename": filename,
        "chunks_indexed": indexed_count,
        "message": f"Successfully indexed {indexed_count} vector chunk(s) from '{filename}'.",
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

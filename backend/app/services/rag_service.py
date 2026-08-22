import json
import math
import re
import logging
import uuid

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.intelligence import VectorDocument
from app.agents.research_agent import get_llm_client, _safe_parse_json
from app.core.config import settings

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> List[str]:
    """Tokenize text into lowercase alphanumeric words."""
    return re.findall(r'\b\w+\b', text.lower())


def _compute_tf_idf_vector(text: str, vocabulary: List[str]) -> List[float]:
    """Computes a simple normalized TF-IDF vector over a given vocabulary."""
    tokens = _tokenize(text)
    if not tokens:
        return [0.0] * len(vocabulary)

    total = len(tokens)
    tf = {word: tokens.count(word) / total for word in set(tokens)}

    vec = [tf.get(word, 0.0) for word in vocabulary]
    # Cosine normalization
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two float vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    return max(0.0, min(1.0, dot))


class RAGKnowledgeService:
    """
    RAG & Knowledge Base engine for indexing market research, competitor notes,
    and live web evidence with semantic vector query retrieval.
    """

    @staticmethod
    def index_document(
        db: Session,
        title: str,
        content: str,
        source_url: Optional[str] = None,
        doc_metadata: Optional[Dict[str, Any]] = None
    ) -> VectorDocument:
        """Indexes a new document text chunk into the vector database."""
        # Simple token vector representation
        tokens = _tokenize(content)
        vocab = list(dict.fromkeys(tokens))[:200]
        vec = _compute_tf_idf_vector(content, vocab)

        doc = VectorDocument(
            id=str(uuid.uuid4()),
            title=title,
            source_url=source_url,
            content=content,
            embedding_json=vec,
            doc_metadata=doc_metadata or {},
            created_at=datetime.utcnow()
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @classmethod
    def query_knowledge_base(
        cls,
        db: Session,
        query: str,
        top_k: int = 4
    ) -> Dict[str, Any]:
        """
        Queries the knowledge base for top matching document chunks
        and synthesizes a verified answer with citations.
        """
        all_docs = db.query(VectorDocument).all()

        if not all_docs:
            # Return empty response if no indexed documents exist yet
            return {
                "query": query,
                "synthesized_answer": f"No indexed knowledge base documents found. Run a market research task first to index real-time web evidence.",
                "relevant_chunks": [],
                "confidence_score": 0.0
            }

        # Build vocabulary from all documents + query
        query_tokens = _tokenize(query)
        vocab_set = set(query_tokens)
        for doc in all_docs:
            vocab_set.update(_tokenize(doc.content[:300]))
        vocabulary = list(vocab_set)[:300]

        query_vec = _compute_tf_idf_vector(query, vocabulary)

        scored_docs = []
        for doc in all_docs:
            doc_vec = _compute_tf_idf_vector(doc.content, vocabulary)
            score = _cosine_similarity(query_vec, doc_vec)
            scored_docs.append((doc, score))

        scored_docs.sort(key=lambda x: x[1], reverse=True)
        top_matches = scored_docs[:top_k]

        relevant_chunks = [
            {
                "id": doc.id,
                "title": doc.title,
                "source_url": doc.source_url,
                "content_snippet": doc.content[:280] + "..." if len(doc.content) > 280 else doc.content,
                "relevance_score": round(score, 3)
            }
            for doc, score in top_matches if score > 0.05
        ]

        # Synthesize verified RAG answer
        synthesized_answer = cls._synthesize_rag_answer(query, relevant_chunks)

        return {
            "query": query,
            "synthesized_answer": synthesized_answer,
            "relevant_chunks": relevant_chunks,
            "confidence_score": round(top_matches[0][1], 2) if top_matches else 0.5
        }

    @classmethod
    def _synthesize_rag_answer(cls, query: str, chunks: List[Dict[str, Any]]) -> str:
        """Synthesizes a precise strategic answer from retrieved evidence chunks."""
        if not chunks:
            return f"Based on indexed market signals, no direct evidence was found matching '{query}'. Try running a comprehensive research task."

        client = get_llm_client()
        if client and (settings.GROQ_API_KEY or settings.OPENAI_API_KEY):
            prompt = f"""
You are Alkame's Strategic RAG Analyst.
Answer the user's question directly and concisely based ONLY on the provided evidence chunks:

USER QUESTION:
"{query}"

EVIDENCE CHUNKS:
{json.dumps(chunks, indent=2)}

Provide a clear 2-3 paragraph strategic answer with direct facts from the evidence chunks.
"""
            try:
                response = client.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a helpful Market Intelligence Analyst. Always give factual, evidence-backed answers."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=600
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"RAG LLM synthesis failed ({e}). Returning fallback evidence synthesis.")

        # Fallback synthesis directly from chunk text
        summary_snippets = [f"• {c['title']}: {c['content_snippet']}" for c in chunks[:3]]
        return f"Key evidence matches for '{query}':\n\n" + "\n\n".join(summary_snippets)

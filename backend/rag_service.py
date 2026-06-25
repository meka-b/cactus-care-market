import numpy as np
import requests
import logging
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from db_models import DBRagDocument, DBRagChunk
from ai_service import _keys

logger = logging.getLogger(__name__)

MISTRAL_EMBED_URL = "https://api.mistral.ai/v1/embeddings"
MISTRAL_EMBED_MODEL = "mistral-embed"


import re

def chunk_text(text: str, source_type: str = "markdown", chunk_chars: int = 1000, overlap_chars: int = 200) -> list[str]:
    """Markdown-aware text chunker. Preserves header context across chunks."""
    lines = text.split('\n')
    chunks = []
    current_chunk = []
    current_len = 0
    
    current_h1 = ""
    current_h2 = ""
    current_h3 = ""
    
    for line in lines:
        stripped = line.strip()
        if source_type == "markdown":
            m1 = re.match(r'^#\s+(.*)', stripped)
            m2 = re.match(r'^##\s+(.*)', stripped)
            m3 = re.match(r'^###\s+(.*)', stripped)
            
            if m1:
                current_h1 = m1.group(1).strip()
                current_h2 = ""
                current_h3 = ""
            elif m2:
                current_h2 = m2.group(1).strip()
                current_h3 = ""
            elif m3:
                current_h3 = m3.group(1).strip()

        words = line.split()
        if not words:
            # maintain paragraph spacing
            if current_chunk and current_chunk[-1] != "\n":
                current_chunk.append("\n")
            continue
            
        for word in words:
            current_chunk.append(word)
            current_len += len(word) + 1
            
            if current_len >= chunk_chars:
                # Time to yield a chunk
                # Build context prefix
                context = []
                if current_h1: context.append(current_h1)
                if current_h2: context.append(current_h2)
                if current_h3: context.append(current_h3)
                
                context_prefix = f"[Bağlam: {' > '.join(context)}]\n" if (context and source_type == "markdown") else ""
                
                chunk_str = context_prefix + " ".join(current_chunk).replace(" \n ", "\n\n")
                chunks.append(chunk_str)
                
                # Overlap
                overlap_words = []
                ov_len = 0
                for w in reversed(current_chunk):
                    if w == "\n": continue
                    if ov_len + len(w) + 1 > overlap_chars:
                        break
                    overlap_words.insert(0, w)
                    ov_len += len(w) + 1
                
                current_chunk = overlap_words if overlap_words else current_chunk[-5:]
                current_len = sum(len(w) + 1 for w in current_chunk)

    if current_chunk and len(" ".join(current_chunk).strip()) > 50:
        context = []
        if current_h1: context.append(current_h1)
        if current_h2: context.append(current_h2)
        if current_h3: context.append(current_h3)
        context_prefix = f"[Bağlam: {' > '.join(context)}]\n" if (context and source_type == "markdown") else ""
        chunks.append(context_prefix + " ".join(current_chunk).replace(" \n ", "\n\n"))

    return chunks


async def get_embedding(text: str, db) -> list[float]:
    """Get embedding vector from Mistral."""
    keys = await _keys(db)
    if not keys["mistral"]:
        raise ValueError("Mistral API anahtarı tanımlı değil")
        
    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": MISTRAL_EMBED_MODEL,
        "input": [text]
    }
    r = requests.post(MISTRAL_EMBED_URL, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    return data["data"][0]["embedding"]


async def get_embeddings_batch(texts: list[str], db) -> list[list[float]]:
    """Get embeddings for multiple chunks in one API call."""
    keys = await _keys(db)
    if not keys["mistral"]:
        raise ValueError("Mistral API anahtarı tanımlı değil")
        
    headers = {"Authorization": f"Bearer {keys['mistral']}", "Content-Type": "application/json"}
    payload = {
        "model": MISTRAL_EMBED_MODEL,
        "input": texts
    }
    r = requests.post(MISTRAL_EMBED_URL, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    return [item["embedding"] for item in data["data"]]


from sqlalchemy import delete

async def ingest_document(filename: str, source_type: str, content: str, db) -> DBRagDocument:
    """Chunks text, gets embeddings, and saves to DB."""
    # Delete existing if any
    existing_res = await db.execute(select(DBRagDocument).where(DBRagDocument.filename == filename))
    existing = existing_res.scalars().first()
    if existing:
        await db.execute(delete(DBRagChunk).where(DBRagChunk.document_id == existing.id))
        await db.delete(existing)
        await db.commit()
        
    doc = DBRagDocument(
        filename=filename,
        source_type=source_type,
        char_count=len(content)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    chunks = chunk_text(content, source_type)
    if not chunks:
        return doc
        
    # Mistral allows up to 1024 inputs per request usually, but let's batch in 50s just in case
    BATCH_SIZE = 50
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i+BATCH_SIZE]
        embeddings = await get_embeddings_batch(batch, db)
        
        for j, text in enumerate(batch):
            chunk_record = DBRagChunk(
                document_id=doc.id,
                content=text,
                embedding=embeddings[j],
                chunk_index=i + j
            )
            db.add(chunk_record)
            
    await db.commit()
    return doc


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))


async def search_rag(query: str, db, top_k: int = 3) -> list[dict]:
    """Search for relevant chunks."""
    try:
        query_emb = await get_embedding(query, db)
    except Exception as e:
        logger.error(f"RAG embedding failed: {e}")
        return []
        
    # Fetch all chunks
    result = await db.execute(select(DBRagChunk))
    chunks = result.scalars().all()
    
    if not chunks:
        return []
        
    scored_chunks = []
    for c in chunks:
        if not c.embedding:
            continue
        score = cosine_similarity(query_emb, c.embedding)
        scored_chunks.append({
            "content": c.content,
            "score": score,
            "doc_id": c.document_id
        })
        
    # Sort descending
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]

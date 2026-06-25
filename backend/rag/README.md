# AI Document Intelligence Studio

A production-grade, premium desktop application for converting PDFs into high-quality RAG-ready datasets.

Built with **Electron + React + TypeScript + Tailwind + ShadCN** for the frontend and **Python + FastAPI** for the backend.

---

## API Keys Configured

| Service | Purpose | Status |
|---|---|---|
| **LlamaParse** (LlamaCloud) | Cloud PDF parsing (fallback, agentic tier) | ✅ Configured |
| **Unstructured Platform API** | Cloud document partition (hi-res) | ✅ Configured |
| **Datalab / Marker API** | Cloud Marker PDF→Markdown conversion | ✅ Configured |
| **Mistral API** | Vision image captioning (Pixtral) | ⚠️ Add your key in Settings |

---

## Quick Start

### 1. Start the Backend

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 2. Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

This starts Electron with the Vite dev server embedded.

---

## Architecture

```
frontend/                  ← Electron + React + TypeScript + Tailwind
├── src/main/              ← Electron main process
├── src/preload/           ← Context bridge
└── src/renderer/src/      ← React application
    ├── App.tsx
    ├── pages/
    │   ├── WorkspacePage.tsx    ← Upload, library, processing
    │   ├── PipelinePage.tsx     ← Live pipeline visualization
    │   ├── PlaygroundPage.tsx   ← RAG search interface
    │   ├── ExportPage.tsx       ← Export format selector
    │   └── SettingsPage.tsx     ← API keys & model config
    ├── components/
    └── stores/                  ← Zustand state

backend/                   ← Python + FastAPI
├── app/
│   ├── api/               ← REST + WebSocket endpoints
│   ├── services/
│   │   ├── classifier.py       ← PDF type detection
│   │   ├── ocr.py              ← PaddleOCR + Tesseract
│   │   ├── orchestrator.py     ← Extractor strategy engine
│   │   ├── extractors/         ← 6 extractor implementations
│   │   ├── images.py           ← Image extraction + Mistral captioning
│   │   ├── chunker.py          ← 5 chunking strategies
│   │   ├── embedder.py         ← sentence-transformers + ChromaDB
│   │   ├── exporter.py         ← 8 export formats
│   │   └── pipeline.py         ← Full async pipeline runner
│   └── main.py
└── .env                   ← API keys (DO NOT COMMIT)
```

---

## PDF Processing Pipeline

```
PDF Upload
  → Classification (native/scanned/academic/book/etc.)
  → OCR Detection (PaddleOCR if no text layer)
  → Extraction (PyMuPDF → Docling → Marker API → Unstructured API → LlamaParse)
  → Image Analysis (Mistral Pixtral captioning)
  → Chunking (smart/semantic/heading-aware/parent-child/table-aware)
  → Embedding (sentence-transformers → ChromaDB)
  → Export (JSON/Markdown/LangChain/LlamaIndex/MongoDB/Qdrant/Pinecone)
```

---

## Export Formats

| Format | Use Case |
|---|---|
| Structured JSON | General purpose, includes images |
| Markdown | Human-readable, for documentation |
| Chunks JSON | Raw chunk inspection |
| LangChain Documents | Drop into any LangChain pipeline |
| LlamaIndex TextNodes | Drop into any LlamaIndex pipeline |
| MongoDB Atlas | Atlas Vector Search upsert |
| Qdrant Points | Qdrant collection upload |
| Pinecone Vectors | Pinecone index upsert |

---

## Adding Your Mistral API Key

1. Open the app → Settings
2. Enter your Mistral API key
3. Enable **Full Vision Analysis** in the processing config
4. Process any PDF with images to get AI-generated captions

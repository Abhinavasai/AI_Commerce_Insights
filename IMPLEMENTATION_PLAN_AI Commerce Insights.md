# AI Commerce Insights Platform — Implementation Plan

## Context

Build a greenfield AI-powered full-stack platform that converts unstructured seller and catalog documents (PDF, CSV, DOCX, images, HTML) into structured insights using RAG pipelines and LLM agents. The platform provides a conversational chat interface for commerce decision support, backed by a knowledge graph of product/seller/category relationships. Target: solo developer, production-grade architecture on AWS.

---

## 1. What Is This Project?

### Purpose

The AI Commerce Insights Platform is a decision-support tool for ecommerce teams — category managers, marketplace analysts, and merchandising leads — who spend hours manually reading through seller catalogs, product spreadsheets, compliance documents, and competitive reports. Instead of sifting through hundreds of PDFs and CSVs, users upload their documents, and the platform automatically extracts structured data (products, sellers, categories, pricing, compliance flags) and surfaces actionable insights through a conversational AI chat interface.

**The core problem it solves:** Commerce teams drown in unstructured data — supplier onboarding packets, catalog feeds in inconsistent formats, competitive intelligence reports, category review documents. This platform turns that pile of files into a searchable, queryable knowledge base with AI-generated insights and a chat assistant that can answer questions like *"Which sellers in Electronics have declining margins?"* or *"Summarize the compliance issues across all onboarded sellers this quarter."*

**Who uses it:**
- **Category Analysts** — upload documents, explore insights, chat with the AI for commerce decisions
- **Admins** — manage users, monitor system health, configure access
- **Viewers** — read-only access to insights and catalog data (e.g., leadership reviewing dashboards)

### Pages & UI Interactions

The frontend is a single-page React application with a sidebar navigation layout. Here is every page, what it shows, and how the user interacts with it:

| Page | What It Shows | Key User Interactions |
|------|---------------|----------------------|
| **Login / Register** | Centered card with email/password form | Enter credentials → receive JWT → redirect to Dashboard |
| **Dashboard** | Overview stats: total documents, insights generated, recent chat sessions, processing queue status | View at-a-glance metrics; click any card to navigate to the relevant section |
| **Documents** | Paginated list of uploaded documents with status badges (Pending, Processing, Completed, Failed) | **Upload:** drag-and-drop zone for PDF/CSV/DOCX/HTML/images → file sent to S3 → triggers async processing pipeline. **View:** click a document to see its metadata, chunk count, processing status. **Download:** click to get presigned S3 URL. **Delete:** remove document and associated chunks |
| **Document Detail** | Single document's metadata, processing status timeline, list of extracted chunks (text previews), linked entities in the knowledge graph | Review what the AI extracted; re-trigger processing if failed |
| **Chat** | Split view: session sidebar (list of past conversations) + main chat window with streaming messages | **New session:** click "New Chat" → type a question → AI responds via SSE streaming with real-time token display. **Tool calls visible:** when the agent searches vectors or queries the knowledge graph, tool invocations appear inline. **Markdown rendering:** responses render with rich formatting, tables, code blocks. **History:** click any past session to continue the conversation |
| **Insights** | Card grid of AI-generated insights, filterable by type (Trend, Anomaly, Recommendation, Summary), tags, confidence score | **Generate:** click "Generate Insights" for a processed document or across all documents → AI analyzes content and creates structured insight cards. **Filter:** narrow by type or tag. **Detail view:** click a card to see the full insight with source documents and confidence score |
| **Insight Detail** | Full insight text, confidence score, source documents (linked), related products/sellers from the knowledge graph | Trace an insight back to the exact documents and entities that informed it |
| **Catalog** | Browsable catalog of Products and Sellers extracted from documents, organized by Category | **Browse:** navigate the product/seller/category hierarchy. **Product card:** shows name, seller, category, key attributes, linked documents. **Seller card:** shows seller name, product count, linked documents. **Relationships:** visualize product-seller-category connections from the Neo4j knowledge graph |
| **Settings** | User profile (name, email), password change | Update personal info |
| **Not Found (404)** | Friendly error page | Navigate back to Dashboard |

**How the pages connect:**
1. User uploads documents on the Documents page → Worker processes them asynchronously → status updates from Pending → Processing → Completed
2. Once processed, the Chat page's AI agent can search through the document chunks via vector similarity and query the knowledge graph
3. Insights can be generated from processed documents and appear on the Insights page
4. Entities extracted during processing (sellers, products, categories) populate the Catalog page
5. Everything flows from Documents → Processing → Knowledge Graph + Vector Store → Chat / Insights / Catalog

---

## 2. Realistic Results After Implementation

If this platform were fully implemented and loaded with real ecommerce data, here are the concrete, measurable outcomes a team could expect:

### Document Processing & Extraction
- **Throughput:** Process 50-100 documents per hour (PDFs up to 50 pages, CSVs with 10K+ rows), each broken into 200-500 semantic chunks with vector embeddings
- **Supported formats:** PDF catalogs, CSV product feeds, DOCX supplier agreements, HTML scrapes, product images (with OCR)
- **Entity extraction accuracy:** ~85-90% precision on extracting product names, seller names, categories, and pricing from well-structured documents; ~70-75% on messy/unstructured content
- **Knowledge graph:** After processing 500 documents, expect a graph with ~2,000-5,000 product nodes, ~200-500 seller nodes, ~50-100 category nodes, and ~10,000+ relationship edges

### Chat & Conversational AI
- **Response time:** First token appears within 1-2 seconds via SSE streaming; full responses in 5-15 seconds depending on complexity
- **Query types the agent handles well:**
  - *"Which sellers have the most products in the Home & Kitchen category?"* → graph query + formatted table
  - *"Summarize the key compliance risks from the Q3 supplier onboarding documents"* → vector search across chunks + LLM synthesis
  - *"Compare pricing trends between Seller A and Seller B for electronics"* → multi-tool agentic retrieval
  - *"What are the top 5 product categories by document volume?"* → graph aggregation
- **Retrieval accuracy (RAG):** For questions answerable by uploaded documents, expect ~80-85% relevance in retrieved chunks using HNSW vector search with 1536-dim embeddings
- **Limitations:** Struggles with highly numerical analysis (pivot table-style computations), cross-document temporal reasoning without explicit dates, and questions about data not in the uploaded corpus

### AI-Generated Insights
- **Types generated:**
  - **Trends:** *"Seller X's product count in Electronics grew 40% QoQ based on the last 3 catalog uploads"*
  - **Anomalies:** *"Document from Seller Y lists product prices 3x higher than category average"*
  - **Recommendations:** *"Consider expanding the Outdoor category — 5 new seller applications mention outdoor products but the category has only 12 listings"*
  - **Summaries:** *"Q3 onboarding: 15 new sellers, 340 products added, 3 compliance flags raised"*
- **Volume:** Expect 5-15 insights per document depending on content richness; ~200-500 total insights from a corpus of 100 documents
- **Confidence scores:** Typically 0.7-0.95; insights below 0.6 are flagged for human review

### Operational Metrics
- **API latency:** Health check <10ms, document upload <500ms (file to S3), document list <100ms, chat initiation <200ms
- **Concurrent users:** The architecture supports 20-50 concurrent users comfortably on a single ECS Fargate task (1 vCPU, 2GB RAM per service)
- **Cost estimate (AWS):** ~$300-500/month for staging (RDS t3.micro, single Fargate tasks, Neo4j Aura Free tier); ~$800-1,500/month for production with moderate traffic
- **OpenAI costs:** ~$0.02-0.05 per chat interaction (GPT-4o), ~$0.001 per 1,000 chunk embeddings; a team processing 100 docs/month and making 500 chat queries would spend ~$30-50/month on OpenAI

### Business Impact (Estimated)
- **Time saved:** Reduces manual document review from ~2-4 hours per document to ~5-10 minutes of reviewing AI-extracted insights — an estimated **80-90% reduction in analysis time**
- **Faster onboarding:** New seller/product onboarding decisions that took 3-5 days of document review can be made in hours
- **Knowledge retention:** Institutional knowledge about sellers, products, and categories lives in the graph, not in individuals' heads or email threads
- **Scalability:** A single analyst can effectively manage insights from 500+ documents, compared to ~50-100 without the platform

---

## Architecture Decisions

| Decision | Choice |
|----------|--------|
| Backend pattern | Microservices (3 services) |
| Services | Core API + AI Pipeline + Worker |
| Inter-service communication | REST (sync) + AWS SQS (async) |
| Databases | PostgreSQL (pgvector) + Neo4j Aura (managed) + S3 |
| Embedding model | OpenAI `text-embedding-3-small` (1536 dims) |
| RAG pattern | Agentic RAG (LangChain agent with tools) |
| LLM | OpenAI GPT-4o |
| Chat streaming | Server-Sent Events (SSE) |
| API routing | Gateway pattern (Core API proxies to AI Pipeline) |
| Auth | JWT + Refresh Tokens, RBAC (admin/analyst/viewer) |
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query |
| Container orchestration | AWS ECS Fargate |
| CI/CD | GitHub Actions |
| IaC | Manual + scripts (for now) |

---

## Project Directory Structure

```
d:\CommerceAI\
|
|-- .github/workflows/
|   |-- ci.yml                         # Lint + test on PR/push
|   |-- deploy-staging.yml             # Build + ECR + ECS (on merge to main)
|   |-- deploy-prod.yml                # Manual trigger for prod
|
|-- services/
|   |-- core-api/                      # Port 8000
|   |   |-- app/
|   |   |   |-- main.py               # FastAPI app, lifespan, CORS
|   |   |   |-- config.py             # Pydantic Settings
|   |   |   |-- dependencies.py       # get_current_user, get_db_session
|   |   |   |-- api/v1/               # auth, users, documents, insights, catalog, chat, health
|   |   |   |-- models/               # (imports from shared)
|   |   |   |-- schemas/              # Pydantic request/response models
|   |   |   |-- services/             # auth, document, insight, catalog, storage, queue
|   |   |   |-- middleware/            # CORS, rate limit, request ID
|   |   |   |-- utils/                # RBAC decorators, pagination
|   |   |-- alembic/                   # DB migrations
|   |   |-- tests/
|   |   |-- Dockerfile, requirements.txt, pyproject.toml
|   |
|   |-- ai-pipeline/                   # Port 8001
|   |   |-- app/
|   |   |   |-- main.py
|   |   |   |-- config.py
|   |   |   |-- api/v1/               # ingest, chat (SSE), embeddings, insights, health
|   |   |   |-- pipeline/             # parser, chunker, embedder, vector_store, retriever
|   |   |   |-- agents/
|   |   |   |   |-- commerce_agent.py  # LangChain agent definition
|   |   |   |   |-- tools/            # vector_search, graph_query, catalog_lookup, insight_search
|   |   |   |   |-- prompts/          # system prompts, templates
|   |   |   |-- services/             # ingestion, chat, insight, graph
|   |   |   |-- utils/                # SSE formatting, token counting
|   |   |-- tests/
|   |   |-- Dockerfile, requirements.txt, pyproject.toml
|   |
|   |-- worker/                        # SQS poller (no REST)
|   |   |-- app/
|   |   |   |-- main.py               # Polling loop
|   |   |   |-- config.py
|   |   |   |-- handlers/             # document_processor, batch_insights, reindex
|   |   |   |-- utils/                # sqs_consumer, retry
|   |   |-- tests/
|   |   |-- Dockerfile, requirements.txt, pyproject.toml
|
|-- shared/                            # Shared Python package (pip install -e)
|   |-- db/                            # postgres.py (async engine), neo4j.py (driver wrapper)
|   |-- models/                        # base, user, document, insight, chat, api_key
|   |-- schemas/events.py              # SQS message schemas
|   |-- storage/s3.py                  # S3 client wrapper
|   |-- queue/sqs.py                   # SQS publish/consume
|   |-- utils/                         # structured logging, common errors
|   |-- pyproject.toml
|
|-- frontend/
|   |-- src/
|   |   |-- api/                       # client.ts (Axios + JWT interceptor), auth, documents, insights, catalog, chat (SSE)
|   |   |-- components/
|   |   |   |-- ui/                    # shadcn/ui components
|   |   |   |-- layout/               # AppLayout, Sidebar, Header
|   |   |   |-- auth/                  # LoginForm, RegisterForm, ProtectedRoute
|   |   |   |-- documents/            # DocumentList, DocumentUpload, DocumentCard
|   |   |   |-- chat/                  # ChatWindow, ChatMessage, ChatInput, StreamingMessage
|   |   |   |-- insights/             # InsightList, InsightCard, InsightDetail
|   |   |   |-- catalog/              # ProductCard, SellerCard
|   |   |   |-- common/               # DataTable, LoadingSpinner, ErrorBoundary
|   |   |-- hooks/                     # useAuth, useDocuments, useChat (SSE), useInsights, useCatalog
|   |   |-- pages/                     # Login, Register, Dashboard, Documents, DocumentDetail, Chat, Insights, InsightDetail, Catalog, Settings, NotFound
|   |   |-- stores/auth-store.ts       # Zustand for auth state
|   |   |-- types/, lib/, styles/
|   |-- vite.config.ts, tailwind.config.ts, package.json, tsconfig.json
|
|-- docker/
|   |-- postgres/init.sql              # CREATE EXTENSION vector, uuid-ossp
|
|-- scripts/                           # seed_db.py, create_superuser.py, test_e2e.py
|-- docker-compose.yml
|-- .env.example
|-- Makefile
|-- .gitignore
|-- README.md
```

---

## Database Schema

### PostgreSQL (with pgvector)

- **users** — id, email, hashed_password, full_name, role (admin/analyst/viewer), is_active
- **documents** — id, title, file_name, file_type, file_size, s3_key, status (pending/processing/completed/failed), chunk_count, owner_id, metadata (JSONB)
- **document_chunks** — id, document_id, chunk_index, content, embedding (Vector(1536)), token_count, metadata (JSONB). HNSW index on embedding column.
- **insights** — id, title, content, insight_type (trend/anomaly/recommendation/summary), confidence, source_document_ids (JSONB), tags (JSONB), generated_by, owner_id
- **chat_sessions** — id, title, user_id
- **chat_messages** — id, session_id, role (user/assistant/system), content, token_count, metadata (JSONB)
- **api_keys** — id, key_hash, name, user_id, is_active, last_used_at

### Neo4j Knowledge Graph

```
(:Seller) -[:SELLS]-> (:Product)
(:Product) -[:BELONGS_TO]-> (:Category)
(:Product) -[:MENTIONED_IN]-> (:Document)
(:Seller) -[:AUTHORED]-> (:Document)
(:Insight) -[:DERIVED_FROM]-> (:Document)
(:Insight) -[:ABOUT]-> (:Product | :Seller)
(:Product) -[:COMPETES_WITH]-> (:Product)
(:Seller) -[:PARTNERS_WITH]-> (:Seller)
```

### S3 Structure

`s3://commerceai-documents/` — `raw/`, `processed/`, `exports/`

---

## API Endpoints

### Core API (port 8000, gateway to all external traffic)

**Auth:** POST `/register`, `/login`, `/refresh`
**Users:** GET/PATCH `/users/me`, GET `/users` (admin), PATCH `/users/{id}/role` (admin)
**Documents:** POST `/documents` (upload), GET `/documents`, GET/DELETE `/documents/{id}`, GET `/documents/{id}/download`
**Chat:** POST `/chat/sessions`, GET `/chat/sessions`, GET/DELETE `/chat/sessions/{id}`, POST `/chat/sessions/{id}/messages` (proxies SSE to AI Pipeline)
**Insights:** GET `/insights`, GET `/insights/{id}`, POST `/insights/generate` (proxies to AI Pipeline), DELETE `/insights/{id}`
**Catalog:** GET `/catalog/products`, `/products/{id}`, `/sellers`, `/sellers/{id}`, `/categories`

### AI Pipeline (port 8001, internal only)

POST `/ingest`, `/chat` (SSE), `/embed`, `/generate-insight`

### Worker (no REST — polls SQS)

Handles: `document.process`, `insights.generate`, `embeddings.reindex`

---

## Implementation Phases

### Phase 1: Scaffolding + Docker Compose (1 day)
- Git init, `.gitignore`, `.env.example`, Makefile
- Create full directory structure with `__init__.py` stubs
- Minimal FastAPI apps with `GET /health` for core-api and ai-pipeline
- Worker with simple polling loop
- All Dockerfiles and `requirements.txt`
- `docker-compose.yml` with postgres (pgvector image), neo4j, localstack (S3 + SQS), all 3 services
- **Verify:** `docker compose up` starts everything; `curl localhost:8000/api/v1/health` returns 200

### Phase 2: Database Models + Migrations (1.5 days)
- `shared/` package: async engine, session factory, all ORM models (User, Document, DocumentChunk with pgvector, Insight, ChatSession, ChatMessage, APIKey)
- Alembic setup in core-api with async support
- Initial migration, HNSW index on embeddings
- **Verify:** all tables created, migrations reversible

### Phase 3: Auth System (1.5 days)
- JWT creation/validation with `python-jose`, password hashing with `passlib[bcrypt]`
- `get_current_user` dependency, `require_role()` decorator
- Register, login, refresh endpoints
- User CRUD with role-based access
- **Verify:** full auth flow works, role checks enforced

### Phase 4: Document Upload + S3 (1 day)
- S3 client wrapper (supports LocalStack endpoint)
- Document CRUD with multipart upload, presigned download URLs
- SQS publish on upload (triggers async processing)
- LocalStack bootstrap (create bucket + queue)
- **Verify:** upload PDF, see in S3, DB record with PENDING status

### Phase 5: RAG Pipeline (2 days)
- Document parser using `unstructured` (PDF, CSV, DOCX, text, HTML, images)
- Chunker using LangChain's `RecursiveCharacterTextSplitter`
- Embedder wrapping OpenAI `text-embedding-3-small` with batching and backoff
- Vector store operations (pgvector similarity search)
- Ingestion service orchestrating: download -> parse -> chunk -> embed -> store
- **Verify:** upload doc, trigger ingest, see chunks with embeddings in DB

### Phase 6: Agentic RAG + Chat (2.5 days)
- LangChain agent with 4 tools: vector_search, graph_query, catalog_lookup, insight_search
- Commerce analyst system prompt
- SSE streaming via `StreamingResponse` (token, tool_call, tool_result, done events)
- Chat service with history management and token counting
- Core API proxy for chat sessions (forwards SSE stream)
- **Verify:** chat with streaming responses, tool calls visible in stream

### Phase 7: Neo4j Integration (2 days)
- Neo4j async driver wrapper in `shared/db/neo4j.py`
- Schema constraints and indexes (created on startup)
- Graph service: CRUD for sellers, products, categories, relationships
- LLM-based entity extraction during document ingestion (populates graph)
- Catalog API endpoints backed by Cypher queries
- **Verify:** entities in Neo4j after doc processing, catalog API returns graph data

### Phase 8: Insight Generation (1.5 days)
- Insight generation service: retrieves chunks, builds context, calls LLM with insight-type-specific prompts
- Structured output (title, content, confidence, tags)
- Neo4j relationships for insights (DERIVED_FROM, ABOUT)
- Insight CRUD in core API
- **Verify:** generate insights from uploaded docs, view in API

### Phase 9: Frontend (4-5 days)
- **Day 1:** Routing, Axios client with JWT interceptor, auth store (Zustand), ProtectedRoute, AppLayout (sidebar + header), Login/Register pages
- **Day 2:** Document pages — list, upload (drag-and-drop), detail with status badge
- **Day 3:** Chat page — session sidebar, streaming messages with markdown and tool call indicators, ChatInput
- **Day 4:** Insights page (card grid with filtering), Catalog page, Dashboard (stats + recent activity)
- **Day 5:** Settings page, error boundary, toast notifications, responsive polish, loading skeletons

### Phase 10: Worker + SQS (1.5 days)
- SQS consumer with long polling, graceful shutdown
- Message routing to handlers (document_processor, batch_insights, reindex)
- Retry with exponential backoff, dead letter queue
- **Verify:** upload -> SQS message -> worker picks up -> document processed end-to-end

### Phase 11: CI/CD + AWS Deployment (2 days)
- GitHub Actions: ci.yml (lint + test, matrix across services), deploy-staging.yml (ECR + ECS), deploy-prod.yml (manual trigger)
- AWS setup: RDS PostgreSQL, Neo4j Aura, S3, SQS + DLQ, ECR, ECS Fargate (3 services), ALB, CloudFront, Secrets Manager, CloudWatch
- Frontend: build -> S3 -> CloudFront invalidation

### Phase 12: Testing + Polish (2 days)
- Unit test coverage 80%+, integration tests (end-to-end smoke test script)
- Test fixtures with `factory-boy`, mocked AWS with `moto`
- Frontend testing with Vitest + React Testing Library
- Security: rate limiting, input validation, file magic byte checks, Cypher injection prevention
- Performance: HNSW index tuning, query logging, request timing

**Total estimated effort: ~22-24 days**

---

## Key Dependencies

### Python (per service)
- **All services:** `sqlalchemy[asyncio]`, `asyncpg`, `pydantic`, `pydantic-settings`, `boto3`, `structlog`
- **Core API adds:** `fastapi`, `uvicorn`, `alembic`, `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart`, `neo4j`, `httpx`, `slowapi`, `pgvector`
- **AI Pipeline adds:** `fastapi`, `uvicorn`, `sse-starlette`, `unstructured[pdf,docx,xlsx,csv]`, `langchain`, `langchain-openai`, `openai`, `tiktoken`, `neo4j`, `pgvector`
- **Worker adds:** `httpx`
- **Dev (all):** `pytest`, `pytest-asyncio`, `pytest-cov`, `factory-boy`, `moto[s3,sqs]`, `ruff`, `mypy`

### npm (frontend)
- **Runtime:** `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `axios`, `zustand`, `lucide-react`, `date-fns`, `react-markdown`, `react-dropzone`, shadcn/ui Radix primitives
- **Dev:** `typescript`, `vite`, `tailwindcss`, `vitest`, `@testing-library/react`, `eslint`, `prettier`

---

## Verification Plan

1. **Local smoke test:** `docker compose up` -> all 5 containers healthy (postgres, neo4j, localstack, core-api, ai-pipeline)
2. **Auth flow:** Register -> login -> get token -> access protected endpoint -> refresh token
3. **Document pipeline:** Upload PDF -> SQS message -> worker processes -> chunks + embeddings in DB -> status COMPLETED
4. **Chat:** Create session -> send message -> receive SSE stream with tool calls -> response saved to DB
5. **Insights:** Generate insight from processed doc -> saved with Neo4j relationships
6. **Frontend:** All pages render, auth flow works, document upload + chat streaming functional
7. **CI/CD:** Push to branch -> GitHub Actions runs lint + tests -> merge to main -> staging deploy
8. **E2E script:** `scripts/test_e2e.py` runs the full happy path programmatically

---

## Key Risks & Mitigations

- **Large doc processing timeout:** SQS visibility timeout = 10 min, worker extends if needed
- **OpenAI rate limits:** Embedder uses batching (100/batch) + exponential backoff
- **Neo4j entity extraction noise:** Confidence threshold + commerce-specific few-shot prompts
- **SSE through ALB:** Set `X-Accel-Buffering: no`, ALB idle timeout = 120s
- **LocalStack vs real AWS:** Vite proxy for local dev, separate config for S3 presigned URLs

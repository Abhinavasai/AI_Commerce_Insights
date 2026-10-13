# AWS Production Deploy Notes

## Resources

- **RDS PostgreSQL** (enable `pgvector` extension)
- **Neo4j Aura** (or self-managed Neo4j)
- **S3** bucket `commerceai-documents` with prefixes `raw/`, `processed/`, `exports/`
- **SQS** queue `commerceai-jobs` + DLQ
- **ECR** repositories for `core-api`, `ai-pipeline`, `worker`
- **ECS Fargate** services (3 tasks) behind an **ALB** (path `/` → core-api; internal service discovery for ai-pipeline)
- **Secrets Manager**: `JWT_SECRET`, `DATABASE_URL`, `NEO4J_*`, `OPENAI_API_KEY`
- **Frontend**: deploy `frontend/` to **Vercel** with `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` (local default API port is **8100**)

## Environment

```bash
RUNTIME_MODE=aws
DATABASE_URL=postgresql+asyncpg://...
NEO4J_URI=neo4j+s://....databases.neo4j.io
S3_BUCKET=commerceai-documents
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/ACCOUNT/commerceai-jobs
AWS_REGION=us-east-1
OPENAI_API_KEY=sk-...
JWT_SECRET=...
CORS_ORIGINS=https://your-frontend.vercel.app
AI_PIPELINE_URL=http://ai-pipeline:8001
```

Task roles should grant `s3:*` on the bucket and `sqs:*` on the queues (tighten for production).

## Local AWS simulation

```bash
cp .env.example .env
# set RUNTIME_MODE=aws and LocalStack keys (test/test)
docker compose up --build
```

## Build & push (sketch)

```bash
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR
docker build -f services/core-api/Dockerfile -t $ECR/commerceai-core-api:latest .
docker push $ECR/commerceai-core-api:latest
# repeat for ai-pipeline and worker
```

Update ECS service to new task definition.

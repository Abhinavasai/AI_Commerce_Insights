FROM python:3.12-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY shared /app/shared
COPY services/ai-pipeline /app/services/ai-pipeline

RUN pip install --no-cache-dir -e /app/shared && pip install --no-cache-dir fastapi uvicorn[standard] httpx sse-starlette

ENV PYTHONPATH=/app/services/ai-pipeline:/app/shared
WORKDIR /app/services/ai-pipeline
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

FROM python:3.12-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY shared /app/shared
COPY services/worker /app/services/worker

RUN pip install --no-cache-dir -e /app/shared && pip install --no-cache-dir httpx

ENV PYTHONPATH=/app/services/worker:/app/shared
WORKDIR /app/services/worker
CMD ["python", "-m", "app.main"]

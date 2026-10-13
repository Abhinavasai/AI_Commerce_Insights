.PHONY: install seed api pipeline worker frontend dev e2e

install:
	python -m pip install -e ./shared
	python -m pip install fastapi "uvicorn[standard]" python-multipart httpx sse-starlette email-validator
	cd frontend && npm install

seed:
	python scripts/seed_db.py

api:
	cd services/core-api && set PYTHONPATH=../../shared;. && uvicorn app.main:app --reload --port 8100

pipeline:
	cd services/ai-pipeline && set PYTHONPATH=../../shared;. && uvicorn app.main:app --reload --port 8001

worker:
	cd services/worker && set PYTHONPATH=../../shared;. && python -m app.main

frontend:
	cd frontend && npm run dev

e2e:
	python scripts/test_e2e.py

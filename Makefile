.PHONY: help install backend-install frontend-install \
        run dev backend-dev frontend-dev \
        test backend-test frontend-test \
        build

help:
	@echo "make install         install backend + frontend dependencies"
	@echo "make run             run backend + frontend together (Ctrl+C stops both)"
	@echo "make backend-dev     run only the FastAPI backend (http://localhost:8091, docs at /docs)"
	@echo "make frontend-dev    run only the frontend dev server (http://localhost:5173)"
	@echo "make test            run backend + frontend test suites"
	@echo "make build           build the frontend for production"

install: backend-install frontend-install

backend-install:
	cd backend && uv sync

frontend-install:
	cd frontend && npm install

run:
	@trap 'kill 0' EXIT INT TERM; \
	(cd backend && uv run uvicorn app.main:app --reload --port 8091) & \
	(cd frontend && npm run dev) & \
	wait

dev: run

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --port 8091

frontend-dev:
	cd frontend && npm run dev

test: backend-test frontend-test

backend-test:
	cd backend && uv run pytest

frontend-test:
	cd frontend && npm test

build:
	cd frontend && npm run build

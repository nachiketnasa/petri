import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db, store
from app.routers import auth, experiments, shared, users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db.init_db()
    if not store.has_any_users():
        store.seed_demo_data()
    yield


app = FastAPI(title="Petri API", version="0.1.0", lifespan=lifespan)

_default_origins = "http://localhost:5173,http://localhost:5183"
_cors_origins = os.environ.get("CORS_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(experiments.router)
app.include_router(shared.router)

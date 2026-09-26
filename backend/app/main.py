from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.database import engine
from app.errors import ApiError, api_error_handler
from app.routers import course, dev, gamification, me, sessions
from app.seed.seed import ensure_seeded


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_seeded(engine)
    yield


app = FastAPI(
    title="Duolingo Clone API",
    version="1.0.0",
    description="Learning path, lesson loop and gamification (XP, streaks, hearts, leagues).",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(ApiError, api_error_handler)

for router in (me.router, course.router, sessions.router, gamification.router):
    app.include_router(router)
if config.ENABLE_DEV_TOOLS:
    app.include_router(dev.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}

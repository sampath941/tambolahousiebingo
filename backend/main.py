from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import auth, players, games
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Tambola Caller API", version="1.0.0")

# CORS — only needed for local dev (frontend at localhost:5173 hitting backend at localhost:8000)
# In production both are served from the same origin, so CORS headers are irrelevant
_origins_env = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(players.router)
app.include_router(games.router)

@app.get("/health")
def health():
    return {"status": "ok"}

# ── Serve built React frontend ────────────────────────────────────────────────
# dist/ is copied into the Docker image by the root Dockerfile.
# In local dev (no dist/) this block is skipped so the Vite dev server handles the frontend.

dist_dir = os.path.join(os.path.dirname(__file__), "dist")

if os.path.exists(dist_dir):
    # Hashed JS/CSS bundles — static mount is efficient and handles Range requests
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Pre-recorded audio files (990 MP3s) — StaticFiles handles browser Range requests properly
    audio_dir = os.path.join(dist_dir, "audio")
    if os.path.exists(audio_dir):
        app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")

    # Catch-all: serve specific static files (icons, sw.js, workbox-*.js, etc.)
    # then fall back to index.html so React Router handles client-side navigation
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

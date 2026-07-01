from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, players, games

app = FastAPI(title="Thambolahousie API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tightened to the deployed frontend URL in production
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

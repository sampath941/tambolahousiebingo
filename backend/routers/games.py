from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Game, GamePlayer, CalledNumber, GameClaim
from schemas import GameSyncRequest, GameOut
from dependencies import get_current_player
from datetime import datetime
from typing import List

router = APIRouter(prefix="/games", tags=["games"])

@router.post("/sync")
def sync_game(
    req: GameSyncRequest,
    db: Session = Depends(get_db),
    player_id: str = Depends(get_current_player),
):
    # Delete existing records if game already synced (re-sync / update)
    existing = db.query(Game).filter(Game.id == req.id).first()
    if existing:
        if existing.host_id != player_id:
            raise HTTPException(status_code=403, detail="Not your game")
        db.delete(existing)
        db.flush()

    game = Game(
        id=req.id,
        host_id=player_id,
        mode=req.mode,
        claims_config=req.claims_config,
        started_at=req.started_at,
        ended_at=req.ended_at,
        synced_at=datetime.utcnow(),
    )
    db.add(game)
    db.flush()

    for p in req.players:
        db.add(GamePlayer(game_id=game.id, player_id=p.player_id, nickname=p.nickname))

    for i, n in enumerate(req.called_numbers):
        db.add(CalledNumber(
            game_id=game.id,
            number=n.number,
            sequence_order=n.sequence_order,
            called_at=n.called_at,
        ))

    for c in req.claims:
        db.add(GameClaim(
            game_id=game.id,
            claim_type=c.claim_type,
            winner_player_id=c.winner_player_id,
            won_at=c.won_at,
        ))

    db.commit()
    return {"status": "ok", "game_id": game.id}

@router.get("", response_model=List[GameOut])
def get_games(
    db: Session = Depends(get_db),
    player_id: str = Depends(get_current_player),
):
    games = (
        db.query(Game)
        .filter(Game.host_id == player_id)
        .order_by(Game.synced_at.desc())
        .all()
    )

    result = []
    for g in games:
        result.append(GameOut(
            id=g.id,
            mode=g.mode,
            claims_config=g.claims_config,
            started_at=g.started_at,
            ended_at=g.ended_at,
            synced_at=g.synced_at,
            players=[{"player_id": p.player_id, "nickname": p.nickname} for p in g.players],
            claims=[{
                "claim_type": c.claim_type,
                "winner_player_id": c.winner_player_id,
                "won_at": c.won_at.isoformat() if c.won_at else None,
            } for c in g.claims],
        ))
    return result

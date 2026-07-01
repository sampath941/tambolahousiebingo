from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Player
from schemas import PlayerOut
from dependencies import get_current_player
from typing import List

router = APIRouter(prefix="/players", tags=["players"])

@router.get("", response_model=List[PlayerOut])
def get_players(
    db: Session = Depends(get_db),
    player_id: str = Depends(get_current_player),
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return [player]

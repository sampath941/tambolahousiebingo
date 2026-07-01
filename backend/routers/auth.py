from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Player
from schemas import RegisterRequest, LoginRequest, AuthResponse
from security import hash_pin, verify_pin, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Player).filter(Player.phone == req.phone).first():
        raise HTTPException(status_code=409, detail="Phone number already registered")

    player = Player(phone=req.phone, nickname=req.nickname, pin_hash=hash_pin(req.pin))
    db.add(player)
    db.commit()
    db.refresh(player)

    return AuthResponse(token=create_token(player.id), player_id=player.id, nickname=player.nickname)

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.phone == req.phone).first()
    if not player or not verify_pin(req.pin, player.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or PIN")

    return AuthResponse(token=create_token(player.id), player_id=player.id, nickname=player.nickname)

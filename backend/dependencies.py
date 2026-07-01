from fastapi import Header, HTTPException
from typing import Optional
from security import decode_token

def get_current_player(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    player_id = decode_token(authorization[7:])
    if not player_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return player_id

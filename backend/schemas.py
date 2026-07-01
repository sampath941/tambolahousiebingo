from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    phone:    str
    pin:      str
    nickname: str

    @field_validator("phone")
    @classmethod
    def phone_ten_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Phone must be exactly 10 digits")
        return v

    @field_validator("pin")
    @classmethod
    def pin_length(cls, v: str) -> str:
        if not v.isdigit() or not (4 <= len(v) <= 6):
            raise ValueError("PIN must be 4–6 digits")
        return v

class LoginRequest(BaseModel):
    phone: str
    pin:   str

class AuthResponse(BaseModel):
    token:     str
    player_id: str
    nickname:  str

# ── Players ───────────────────────────────────────────────────────────────────

class PlayerOut(BaseModel):
    id:         str
    phone:      str
    nickname:   str
    created_at: datetime

    model_config = {"from_attributes": True}

# ── Games ─────────────────────────────────────────────────────────────────────

class CalledNumberIn(BaseModel):
    number:         int
    sequence_order: int
    called_at:      Optional[datetime] = None

class GameClaimIn(BaseModel):
    claim_type:       str
    winner_player_id: Optional[str] = None
    won_at:           Optional[datetime] = None

class GamePlayerIn(BaseModel):
    player_id: Optional[str] = None
    nickname:  str

class GameSyncRequest(BaseModel):
    id:            str
    mode:          str
    claims_config: Optional[list] = None
    started_at:    Optional[datetime] = None
    ended_at:      Optional[datetime] = None
    players:       List[GamePlayerIn]    = []
    called_numbers: List[CalledNumberIn] = []
    claims:        List[GameClaimIn]     = []

class GameOut(BaseModel):
    id:            str
    mode:          str
    claims_config: Optional[list]
    started_at:    Optional[datetime]
    ended_at:      Optional[datetime]
    synced_at:     Optional[datetime]
    players:       List[dict]
    claims:        List[dict]

    model_config = {"from_attributes": True}

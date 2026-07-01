from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

def new_id():
    return str(uuid.uuid4())

class Player(Base):
    __tablename__ = "players"

    id         = Column(String(36), primary_key=True, default=new_id)
    phone      = Column(String(10), unique=True, nullable=False, index=True)
    nickname   = Column(String(100), nullable=False)
    pin_hash   = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Game(Base):
    __tablename__ = "games"

    id            = Column(String(36), primary_key=True)  # client-generated UUID (offline-first)
    host_id       = Column(String(36), ForeignKey("players.id"), nullable=False)
    mode          = Column(String(10), nullable=False)    # 'quick' | 'full'
    status        = Column(String(20), nullable=False, default="completed")
    claims_config = Column(JSON, nullable=True)
    started_at    = Column(DateTime, nullable=True)
    ended_at      = Column(DateTime, nullable=True)
    synced_at     = Column(DateTime, default=datetime.utcnow)

    players        = relationship("GamePlayer",   back_populates="game", cascade="all, delete-orphan")
    called_numbers = relationship("CalledNumber", back_populates="game", cascade="all, delete-orphan")
    claims         = relationship("GameClaim",    back_populates="game", cascade="all, delete-orphan")

class GamePlayer(Base):
    __tablename__ = "game_players"

    id        = Column(String(36), primary_key=True, default=new_id)
    game_id   = Column(String(36), ForeignKey("games.id"), nullable=False)
    player_id = Column(String(36), ForeignKey("players.id"), nullable=True)  # null = guest
    nickname  = Column(String(100), nullable=False)

    game = relationship("Game", back_populates="players")

class CalledNumber(Base):
    __tablename__ = "called_numbers"

    id             = Column(String(36), primary_key=True, default=new_id)
    game_id        = Column(String(36), ForeignKey("games.id"), nullable=False)
    number         = Column(Integer, nullable=False)
    sequence_order = Column(Integer, nullable=False)
    called_at      = Column(DateTime, nullable=True)

    game = relationship("Game", back_populates="called_numbers")

class GameClaim(Base):
    __tablename__ = "game_claims"

    id               = Column(String(36), primary_key=True, default=new_id)
    game_id          = Column(String(36), ForeignKey("games.id"), nullable=False)
    claim_type       = Column(String(50), nullable=False)
    winner_player_id = Column(String(36), ForeignKey("players.id"), nullable=True)
    won_at           = Column(DateTime, nullable=True)

    game = relationship("Game", back_populates="claims")

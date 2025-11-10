from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class Game_Base(BaseModel):
    id: Optional[int] = None
    max_players: int
    min_players: int
    status: str
    name: str

class Log_Response(BaseModel):
    log_id: int
    created_at: datetime
    type: str
    player_id: int
    card_name: Optional[str] = None
    set_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class Game_Response(BaseModel):
    game_id: Optional[int] = None
    max_players: int
    min_players: int
    status: str
    name: str
    players_amount: int
    current_turn: Optional[int] = None
    cards_left: Optional[int] = None
    direction_folly: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
    log: list[Log_Response] = []


class Game_Initialized(BaseModel):
    game_id: int
    status: str
    name: str
    players_amount: int

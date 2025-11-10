from fastapi import APIRouter, Depends, HTTPException
from src.database.models import Log, Player, Event, Set
from sqlalchemy.orm import Session
from src.database.database import get_db
from src.database.services.services_cards import register_cancelable_event, register_cancelable_set
from src.database.services.services_websockets import broadcast_last_cancelable_event, broadcast_last_cancelable_set, broadcast_game_information

log = APIRouter()

@log.post("/event/Not_so_fast/{card_id}", status_code=200, tags=["Events"])
async def activate_cancelable_event(card_id: int, db: Session = Depends(get_db)):

    game_id = register_cancelable_event(card_id , db)
    if game_id:
        await broadcast_last_cancelable_event(card_id) # Para el timer
        await broadcast_game_information(game_id)
    else: 
        raise HTTPException(status_code=404, detail="You can not play anymore")
    

@log.post("/set/Not_so_fast/{set_id}", status_code=200, tags=["Sets"])
async def activate_cancelable_set(set_id: int, db: Session = Depends(get_db)):

    game_id = register_cancelable_set(set_id , db)
    if game_id:
        await broadcast_last_cancelable_set(set_id) # Para el timer
        await broadcast_game_information(game_id)
    else: 
        raise HTTPException(status_code=404, detail="Error")

@log.get("/logs/{game_id}", status_code=200, tags=["Logs"])
def get_logs(game_id: int, db: Session = Depends(get_db)):
    
    logs_data = db.query(Log, Player, Event, Set) \
        .join(Player, Log.player_id == Player.player_id) \
        .outerjoin(Event, Log.card_id == Event.card_id) \
        .outerjoin(Set, Log.set_id == Set.set_id) \
        .filter(Log.game_id == game_id) \
        .order_by(Log.created_at.asc()) \
        .all()
            
    if not logs_data:
        return []

    formatted_logs = []
    for log, player, event, set_item in logs_data:
        formatted_logs.append({
            "log_id": log.log_id,
            "created_at": log.created_at.isoformat(), # Convertir fecha a string
            "type": log.type,
            "player_id": player.player_id,
            "card_name": event.name if event else None,
            "set_name": set_item.name if set_item else None
        })
            
    return formatted_logs
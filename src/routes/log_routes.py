from fastapi import APIRouter, Depends, HTTPException
from src.database.models import Log
from sqlalchemy.orm import Session
from src.database.database import get_db
from src.database.services.services_cards import register_cancelable_event, register_cancelable_set
from src.database.services.services_websockets import broadcast_last_cancelable_event, broadcast_last_cancelable_set

log = APIRouter()

@log.post("/event/Not_so_fast/{card_id}", status_code=200, tags=["Events"])
async def activate_cancelable_event(card_id: int, db: Session = Depends(get_db)):

    valid = register_cancelable_event(card_id , db)
    if valid:
        await broadcast_last_cancelable_event(card_id)
    else: 
        raise HTTPException(status_code=404, detail="You can not play anymore")
    

@log.post("/set/Not_so_fast/{card_id}", status_code=200, tags=["Sets"])
async def activate_cancelable_set(set_id: int, db: Session = Depends(get_db)):

    valid = register_cancelable_set(set_id , db)
    if valid:
        await broadcast_last_cancelable_set(set_id)
    else: 
        raise HTTPException(status_code=404, detail="Error")

@log.get("/logs/{game_id}", status_code=200, tags=["Logs"])
def get_logs(game_id: int, db: Session = Depends(get_db)):
    logs = db.query(Log).filter(Log.game_id == game_id).order_by(Log.created_at.desc()).all()
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found for this game.")
    return [log.__dict__ for log in logs]
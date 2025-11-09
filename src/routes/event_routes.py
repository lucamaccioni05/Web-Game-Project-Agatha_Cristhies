from fastapi import APIRouter, Depends, HTTPException
from pydantic import Secret
from sqlalchemy.orm import Session
from sqlalchemy import desc, func  
from src.database.database import SessionLocal, get_db
from src.database.models import Card , Game , Detective , Event, Secrets, Set, Player, ActiveTrade
from src.database.services.services_cards import only_6 , replenish_draft_pile
from src.database.services.services_games import finish_game
from src.schemas.card_schemas import Card_Response, Discard_List_Request
from src.schemas.secret_schemas import Secret_Response
from src.database.services.services_websockets import broadcast_blackmailed, broadcast_last_discarted_cards, broadcast_game_information , broadcast_player_state, broadcast_card_draft
from src.database.services.services_events import cards_off_table, look_into_ashes, one_more, early_train_paddington, delay_the_murderers_escape, point_your_suspicion, end_point_your_suspicion, initiate_card_trade, select_card_for_trade_service
import random

events = APIRouter()

@events.put("/event/cards_off_table/{player_id}", status_code=200, tags=["Events"])
async def activate_cards_off_table_event(player_id: int, db: Session = Depends(get_db)):
    """
    Activa el evento 'Cards off the table': descarta las cartas not so fast de un jugador.
    """
    player= db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")
    result = cards_off_table(player_id=player_id, db=db)
 
    await broadcast_game_information(player.game_id)
    await broadcast_last_discarted_cards(player.player_id)
    return result

@events.put("/event/one_more/{new_secret_player_id},{secret_id}", status_code=200, tags=["Events"])
async def activate_one_more_event(new_secret_player_id: int, secret_id: int, db: Session = Depends(get_db)):
    """
    Activa el evento 'One More': elige un secreto revelado y lo asigna boca abajo a otro jugador.
    """
    # Validar game_id
    # Validar new_secret_player_id
    new_secret_player = db.query(Player).filter(Player.player_id == new_secret_player_id).first()
    if not new_secret_player:
        raise HTTPException(status_code=404, detail="New secret Player not found.")

    # Validar secret_id y esté revelado
    secret = db.query(Secrets).filter(
        Secrets.secret_id == secret_id,
        Secrets.revelated == True  # Solo se pueden robar secretos revelados
    ).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found or is not revealed.")

    updated_secret = one_more(new_secret_player_id, secret_id, db=db)
    await broadcast_game_information(new_secret_player.game_id)
    return updated_secret

@events.put("/event/early_train_paddington/{game_id},{player_id}", status_code=200, tags=["Events"])
async def activate_early_train_paddington_event(game_id: int, player_id: int, db: Session = Depends(get_db)):
    """
    Activa el evento 'Early Train to Paddington': Toma hasta 6 cartas del mazo y las coloca boca arriba en la pila de descarte.
    """
    # Validar game_id
    game = db.query(Game).filter(Game.game_id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found.")
    
    # Validar player_id
    player = db.query(Player).filter(Player.player_id == player_id, Player.game_id == game_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found in this game.")
    
    result = await early_train_paddington(game_id=game_id, db=db)
    await broadcast_game_information(game_id)
    await broadcast_last_discarted_cards(player_id)
    return result

@events.put("/event/look_into_ashes/{player_id},{card_id}", status_code=200, tags=["Events"], response_model=Card_Response)
async def activate_look_into_ashes_event(player_id: int, card_id: int, db: Session = Depends(get_db)):
    # Validar player_id
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")
    # Validar card_id
    card = db.query(Card).filter(Card.card_id == card_id, Card.dropped == True).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    
    taken_card = look_into_ashes(player_id=player_id, card_id=card_id, db=db)
    await broadcast_game_information(player.game_id)
    await broadcast_last_discarted_cards(player_id)
    return taken_card

@events.put ("/event/delay_escape/{game_id},{player_id}", status_code=  200,response_model= list[Card_Response] ,tags = ["Events"]) 
async def activate_delay_murderers_escape (game_id :int, player_id: int, discard_cards : Discard_List_Request , db : Session = Depends(get_db)) : 
    game = db.query(Game).filter(Game.game_id == game_id).first()
    if not game : 
        raise HTTPException(status_code=404, detail="Game not found.")
    
    # Validar player_id
    player = db.query(Player).filter(Player.player_id == player_id, Player.game_id == game_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found in this game.")
    
    discarded_cards_ids = discard_cards.card_ids
    discarded_cards = delay_the_murderers_escape(game_id, discarded_cards_ids ,db)
    await broadcast_game_information(game_id)
    await broadcast_last_discarted_cards(player_id)
    return discarded_cards

@events.put ("/event/point_your_suspicion/{game_id}", status_code = 200,tags = ["Events"])
async def activate_point_your_suspicion (game_id : int, db : Session = Depends(get_db)) :
    pys = point_your_suspicion(game_id, db)
    await broadcast_game_information(game_id)

    return pys 

@events.put ("/event/end/point_your_suspicion/{game_id}", status_code = 200,tags = ["Events"])
async def ending_point_your_suspicion (game_id : int, db : Session = Depends(get_db)) :
    pys = end_point_your_suspicion(game_id, db)
    await broadcast_game_information(game_id)

    return pys


@events.post("/event/card_trade/initiate/{trader_id},{tradee_id},{card_id}", status_code=200, tags=["Events"])
async def activate_card_trade_initiate(trader_id: int, tradee_id: int, card_id: int, db: Session = Depends(get_db)):
    """
    Ruta: Inicia el 'Card Trade', creando la acción y seteando 'pending_action'.
    """
    result = initiate_card_trade(
        trader_id=trader_id, 
        tradee_id=tradee_id, 
        card_id=card_id, # <-- Pasa el ID al servicio
        db=db
    )
    
    trader = db.query(Player).filter(Player.player_id == trader_id).first()
    if trader:
        await broadcast_game_information(trader.game_id)
    
    return result
@events.post("/event/card_trade/select_card/{player_id}/{card_id}", status_code=200, tags=["Events"])
async def activate_card_trade_select_card(player_id: int, card_id: int, db: Session = Depends(get_db)):
    """
    Ruta: Un jugador selecciona una carta para el trade.
    El servicio maneja la lógica de esperar o ejecutar.
    """
    # El servicio maneja toda la lógica
    result = select_card_for_trade_service(player_id=player_id, card_id=card_id, db=db)
    
    # El broadcast se queda aquí
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if player:
        await broadcast_game_information(player.game_id)
        
    return result

@events.post("/event/blackmailed/{player_id_from}, {player_id_to}, {secret_id}", status_code= 200, response_model= Secret_Response,  tags = ["Events"])
async def activate_blackmailed(player_id_showing : int, player_id_to_show : int, secret_id : int, db : Session = Depends (get_db)) :
    player_showing =  db.query(Player).filter(Player.player_id == player_id_showing).first()
    player_showed = db.query(Player).filter(Player.player_id == player_id_to_show).first()
    if not player_showed or player_showing : 
        raise HTTPException(status_code=404, detail="Players not found.")
    game_id = player_showed.game_id
    player_showing.pending_action = "BLACKMAILED"
    player_showed.pending_action = "BLACKMAILED"
    secret = db.query(Secrets).filter(Secrets.secret_id == secret_id).first()
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error executing 'Blackmail' event: {str(e)}",
        )
    await broadcast_blackmailed(game_id)

    return secret 


@events.post("/event/blackmailed/deactivate/{player_id_from}, {player_id_to}", status_code= 200, response_model= Secret_Response,  tags = ["Events"])
async def deactivate_blackmailed(player_id_showing : int, player_id_to_show : int, db : Session = Depends (get_db)) :
    player_showing =  db.query(Player).filter(Player.player_id == player_id_showing).first()
    player_showed = db.query(Player).filter(Player.player_id == player_id_to_show).first()
    if not player_showed or player_showing : 
        raise HTTPException(status_code=404, detail="Players not found.")
    game_id = player_showed.game_id
    player_showing.pending_action = None
    player_showed.pending_action = None
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Error executing 'Blackmail' event: {str(e)}",
        )
    await broadcast_game_information(game_id)

    return None 





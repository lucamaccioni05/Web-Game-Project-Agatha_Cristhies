import random
from fastapi import Depends
from sqlalchemy import desc, func
from src.database.database import SessionLocal, get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.database.models import Player, Card , Detective , Event, Secrets, Game, Set, ActiveTrade
from src.database.services.services_games import finish_game
from src.database.services.services_secrets import steal_secret as steal_secret_service
from typing import List 

def cards_off_table(player_id: int, db: Session):
    """
    descarta las cartas not so fast de un jugador
    """
    nsf = db.query(Event).filter(Event.name == "Not so fast", Event.player_id == player_id, Event.dropped == False).all()

    if not nsf:
        # No hay cartas "Not so fast" para este jugador, no hay nada que hacer
        return {"message": "No 'Not so fast' cards found for this player to discard."}
    try:
        for event in nsf:
            event.dropped = True        
        db.commit() # se descartan las cartas nsf del jugador
    except Exception as e:
        db.rollback() 
        raise HTTPException(status_code=400, detail=f"Error discarding 'Not so fast' cards: {str(e)}")

def look_into_ashes(player_id: int, card_id: int, db: Session):
    """
    mira las ultimas 5 cartas de la pila de descarte y toma una 
    en realidad le llega una card_id del front que. esta la funcion que le muestra las 5 
    cartas del descarte. entonces en el endpoint que llama esta funcion solo elije una de esas 5 cartas
    y le cambio dueno y dropped por true
    """
    card = db.query(Card).filter(Card.card_id == card_id, Card.dropped == True).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    try:
        card.dropped = False
        card.player_id = player_id
        card.discardInt = 0 #la carta vuelve a estar en juego
        card.picked_up=True
        db.commit()
        db.refresh(card)
        return card 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error assigning card to player: {str(e)}")

def one_more(receive_secret_player_id: int, secret_id: int, db: Session):
    """
    Choose one revealed secret card and add it, face-down, to any player's secrets, 
    including your own. This may remove social disgrace.
    """
    try:
        stolen_secret = steal_secret_service(receive_secret_player_id, secret_id, db)
        return stolen_secret
    except HTTPException as e:
        # Re-lanzar excepciones específicas de steal_secret si es necesario
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error executing 'One More' event: {str(e)}")


def delay_the_murderers_escape(game_id: int, db: Session):
    """
    Implementa el efecto de la carta 'Delay the Murderer's Escape!'.
    Toma hasta 5 cartas de la pila de descarte y las devuelve al mazo.
    La carta de evento se retira del juego.
    """

    game = db.query(Game).filter(Game.game_id == game_id).first()
    if not game : 
        raise HTTPException(status_code=404, detail="No game found ")
    

    # Agarrro maximo las ultimas 5 cartas descartadas 
    last_discarded_cards = db.query(Card).filter(
        Card.game_id == game_id,
        Card.dropped == True
    ).order_by(desc(Card.discardInt)).limit(5).all()

    if not last_discarded_cards:
        raise HTTPException(status_code=404, detail="No cards found in the discard pile for this game.")
    for card in last_discarded_cards : 
        card.dropped = False 
        card.picked_up = False 
        card.draft = False
        card.player_id = None  
        card.discardInt = -1 
        game.cards_left += 1 
    try : 
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error executing 'Delay murderer escapes' event: {str(e)}")
    

    return last_discarded_cards
    


def early_train_paddington(game_id: int, db: Session):
    """
    Implement the effect of the 'Early Train to Paddington' event.
    """
    deck = db.query(Card).filter(Card.game_id == game_id, Card.player_id == None, Card.draft == False).all()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found.")
    
    if len(deck)<6:
        finish_game(game_id) # se termina el juego si no hay mas cartas en el mazo
        return {"message": "Not enough cards in the deck. The game has ended."}
    
    random.shuffle(deck)
    max_discardInt = db.query(func.max(Card.discardInt)).filter(Card.game_id == game_id).scalar() or 0
    cards_to_discard = deck[:6]
    for card in cards_to_discard:
        card.dropped = True
        card.picked_up = False
        max_discardInt += 1
        card.discardInt = max_discardInt # Asigna el siguiente valor en la secuencia
    try:
        db.commit()
        for card in cards_to_discard:
            db.refresh(card)
        return {"message": "Early Train to Paddington event executed successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error executing 'Early Train to Paddington' event: {str(e)}")

def _execute_trade(trader_id: int, trader_card_id: int, tradee_id: int, tradee_card_id: int, db: Session):
    """
    Helper INTERNO: Intercambia la propiedad de dos cartas.
    """
    trader_card = db.query(Card).filter(Card.card_id == trader_card_id, Card.player_id == trader_id).first()
    tradee_card = db.query(Card).filter(Card.card_id == tradee_card_id, Card.player_id == tradee_id).first()

    if not all([trader_card, tradee_card]):
        raise HTTPException(status_code=404, detail="Una o ambas cartas no se encontraron durante el intercambio final.")

    trader_card.player_id = tradee_id
    tradee_card.player_id = trader_id
    # No hay commit aquí, se maneja afuera


# --- ¡FUNCIÓN CORREGIDA! ---
def initiate_card_trade(trader_id: int, tradee_id: int, card_id: int, db: Session):
    """
    Servicio: Crea ActiveTrade, setea pending_action Y descarta la carta de evento.
    ¡AHORA ES ATÓMICO!
    """
    trader = db.query(Player).filter(Player.player_id == trader_id).first()
    tradee = db.query(Player).filter(Player.player_id == tradee_id).first()
    card_to_discard = db.query(Card).filter(Card.card_id == card_id, Card.player_id == trader_id).first()
    
    if not trader or not tradee or not card_to_discard:
        raise HTTPException(status_code=404, detail="Jugador, oponente o carta de evento no encontrados.")
    
    try:
        # 1. Crear el registro de la acción
        new_trade = ActiveTrade(
            game_id=trader.game_id,
            player_one_id=trader.player_id,
            player_two_id=tradee.player_id
        )
        db.add(new_trade)
        
        # 2. Asignar la acción pendiente
        trader.pending_action = "SELECT_TRADE_CARD"
        tradee.pending_action = "SELECT_TRADE_CARD"
        
        # 3. Descartar la carta de evento (¡NUEVO!)
        card_to_discard.dropped = True
        card_to_discard.player_id = None
        # (Añade aquí tu lógica de 'discardInt' si es necesaria)
        
        db.commit() # Un solo commit para toda la operación
    except Exception as e:
        db.rollback() # Revierte TODO (trade y descarte) si algo falla
        raise HTTPException(status_code=400, detail=f"Error iniciando el trade: {str(e)}")
    
    return {"message": "Trade initiated and card discarded."}


# --- (Tu función select_card_for_trade_service ya está bien como la tenías) ---
def select_card_for_trade_service(player_id: int, card_id: int, db: Session):
    """
    Servicio: Un jugador selecciona una carta para el trade.
    Si ambos jugadores han seleccionado, ejecuta el trade llamando a _execute_trade.
    """
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado.")

    if player.pending_action not in ["SELECT_TRADE_CARD", "WAITING_FOR_TRADE_PARTNER"]:
        raise HTTPException(status_code=400, detail="No es una acción válida para este jugador.")

    trade = db.query(ActiveTrade).filter(
        ActiveTrade.game_id == player.game_id,
        (ActiveTrade.player_one_id == player_id) | (ActiveTrade.player_two_id == player_id)
    ).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade activo no encontrado.")

    try:
        if trade.player_one_id == player_id:
            if trade.player_one_card_id:
                 raise HTTPException(status_code=400, detail="Carta ya seleccionada.")
            trade.player_one_card_id = card_id
        else:
            if trade.player_two_card_id:
                 raise HTTPException(status_code=400, detail="Carta ya seleccionada.")
            trade.player_two_card_id = card_id
        
        player.pending_action = "WAITING_FOR_TRADE_PARTNER"

        if trade.player_one_card_id and trade.player_two_card_id:
            _execute_trade(
                trader_id=trade.player_one_id,
                trader_card_id=trade.player_one_card_id,
                tradee_id=trade.player_two_id,
                tradee_card_id=trade.player_two_card_id,
                db=db
            )
            
            player_one = db.query(Player).filter(Player.player_id == trade.player_one_id).first()
            player_two = db.query(Player).filter(Player.player_id == trade.player_two_id).first()
            
            if player_one: player_one.pending_action = None
            if player_two: player_two.pending_action = None
            
            db.delete(trade)
            
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al seleccionar carta para trade: {str(e)}")

    return {"message": "Card selected."}

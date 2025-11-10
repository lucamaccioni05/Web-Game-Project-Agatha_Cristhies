from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException, WebSocket
from sqlalchemy import desc, select, true, orm
from sqlalchemy.orm import Session, selectinload
from src.schemas.card_schemas import Card_Response, AllCardsResponse
from src.database.database import SessionLocal
from src.schemas.secret_schemas import Secret_Response
from src.database.models import Detective, Game, Player, Card, Event,Secrets, Set, Log
from src.schemas.games_schemas import Game_Response
from src.schemas.set_schemas import Set_Response
from src.webSocket.connection_manager import lobbyManager, gameManager
from src.schemas.players_schemas import Player_Base, Player_State
import json
from sqlalchemy.orm import joinedload
from pydantic import TypeAdapter
from typing import Dict, Any
from src.database.models import Secrets
from src.schemas.secret_schemas import Secret_Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session 
from src.database.database import get_db 
from fastapi import Depends, HTTPException 


async def broadcast_available_games(db: Session):

    # games = db.query(Game).filter(
    #   (Game.status == "bootable") | (Game.status == "waiting players")
    # ).all()

    games = db.query(Game).all()
    # Se convierten los objetos orm a un pydntic gameResponse para que se puedan leer los atributos de games luego
    gamesResponse = [Game_Response.model_validate(game) for game in games]

    # se lo pasa a formato json
    gamesResponseJson = jsonable_encoder(gamesResponse)

    # manager.broadcast espera un string, así que convertimos la lista a un JSON string.

    await lobbyManager.broadcast(json.dumps(gamesResponseJson))


async def broadcast_lobby_information(db: Session, game_id: int):
    game = db.query(Game).filter(Game.game_id == game_id).first()
    if not game:
        # Si el juego ya no existe, no hacemos nada.
        print(f"Intento de broadcast para un juego no existente: {game_id}")
        return

    players = db.query(Player).filter(Player.game_id == game_id).all()

    gameResponse = Game_Response.model_validate(game).model_dump_json()
    playersResponse = [Player_Base.model_validate(player) for player in players]
    playersResponseJson = jsonable_encoder(playersResponse)
    await gameManager.broadcast(
        json.dumps({"type": "game", "data": gameResponse}), game_id
    )

    await gameManager.broadcast(
        json.dumps({"type": "players", "data": playersResponseJson}), game_id
    )


async def broadcast_game_information(game_id: int):
    db = SessionLocal()
    try:
        game = (
            db.query(Game)
            .options(
                selectinload(Game.log).selectinload(Log.player),
                selectinload(Game.log).selectinload(Log.card.of_type(Event)),
                selectinload(Game.log).selectinload(Log.set)
            )
            .filter(Game.game_id == game_id)
            .first()
        )
        if not game:
            # Si el juego ya no existe, no hacemos nada.
            print(f"Intento de broadcast para un juego no existente: {game_id}")
            return

        players = (
            db.query(Player)
            .options(joinedload(Player.cards), joinedload(Player.secrets))
            .filter(Player.game_id == game_id)
            .all()
        )

        # a. Validamos el 'game' (Pydantic ignorará el 'log' porque no está en el dict)
        game_dict = Game_Response.model_validate(game).model_dump()
        
        # b. Formateamos el log manualmente (reutilizando tu lógica de 'get_logs')
        formatted_logs = []
        for log in game.log: # 'game.log' está cargado gracias a selectinload
            formatted_logs.append({
                "log_id": log.log_id,
                "created_at": log.created_at.isoformat(),
                "type": log.type,
                "player_id": log.player.player_id if log.player else None, 
                "card_name": log.card.name if log.card and hasattr(log.card, 'name') else None,
                "set_name": log.set.name if log.set else None
            })
        
        # c. Añadimos el log formateado al diccionario
        game_dict['log'] = formatted_logs
        
        # d. Convertimos el diccionario final (y limpio) a JSON
        gameResponse = json.dumps(game_dict)

        playersStateResponse = [
            Player_State.model_validate(player) for player in players
        ]
        playersStateResponseJson = jsonable_encoder(playersStateResponse)

        await gameManager.broadcast(
            json.dumps({"type": "gameUpdated", "data": gameResponse}), game_id
        )

        await gameManager.broadcast(
            json.dumps({"type": "playersState", "data": playersStateResponseJson}),
            game_id,
        )
    finally:
        db.close()  # cierro la conecxion para evitar saturacion de conexiones en la bdd


async def broadcast_player_state(game_id: int):

    db = SessionLocal()  # Abre una nueva sesión para esta función
    try:
        # Obtiene todos los jugadores y sus cartas (manos)
        players = (
            db.query(Player)
            .options(joinedload(Player.cards), joinedload(Player.secrets))
            .filter(Player.game_id == game_id)
            .all()
        )

        # Convierte a Pydantic Player_State
        playersStateResponse = [
            Player_State.model_validate(player) for player in players
        ]
        playersStateResponseJson = jsonable_encoder(playersStateResponse)

        # Emite el WS de "playersState"
        await gameManager.broadcast(
            json.dumps({"type": "playersState", "data": playersStateResponseJson}),
            game_id,
        )
    finally:
        db.close()


async def broadcast_last_discarted_cards(player_id: int):
    db = SessionLocal()
    try:
        player = db.query(Player).filter(Player.player_id == player_id).first()
        game_id = player.game_id
        polymorphic_loader = orm.with_polymorphic(Card, [Detective, Event])
        stmt = (
            select(polymorphic_loader)
            .where(Card.game_id == game_id, Card.dropped == True)
            .order_by(desc(Card.discardInt))
            .limit(5)
        )
        cardsDropped = db.execute(stmt).scalars().all()
        if not cardsDropped:
            raise HTTPException(
                status_code=404,
                detail="No cards found in the discard pile for this game.",
            )

        # actualizo mano de jugador
        players = (
            db.query(Player)
            .options(joinedload(Player.cards), joinedload(Player.secrets))
            .filter(Player.game_id == game_id)
            .all()
        )
        playersStateResponse = [
            Player_State.model_validate(player) for player in players
        ]
        playersStateResponseJson = jsonable_encoder(playersStateResponse)
        await gameManager.broadcast(
            json.dumps({"type": "playersState", "data": playersStateResponseJson}),
            game_id,
        )
        # Se usa typeAdapter por una cuestion de compatibilidad de versiones entre python y pydantic
        card_list_adapter = TypeAdapter(list[AllCardsResponse])

        # Ahora validamos la lista completa contra el adaptador de listas.
        cardsDroppedResponse = card_list_adapter.validate_python(
            cardsDropped, from_attributes=True
        )

        cardsResponseJson = jsonable_encoder(cardsDroppedResponse)
        await gameManager.broadcast(
            json.dumps({"type": "droppedCards", "data": cardsResponseJson}), game_id
        )
    finally:
        db.close()


async def broadcast_card_draft(game_id: int):
    db = SessionLocal()
    try:
        polymorphic_loader = orm.with_polymorphic(Card, [Detective, Event])
        stmt = (
            select(polymorphic_loader)
            .where(Card.game_id == game_id, Card.draft == True)
            .limit(3)
        )
        cardsDraft = db.execute(stmt).scalars().all()
        if not cardsDraft:
            raise HTTPException(
                status_code=404,
                detail="No cards found in the draft pile for this game.",
            )

        # Se usa typeAdapter por una cuestion de compatibilidad de versiones entre python y pydantic
        card_list_adapter = TypeAdapter(list[AllCardsResponse])

        # Ahora validamos la lista completa contra el adaptador de listas.
        cardsDraftResponse = card_list_adapter.validate_python(
            cardsDraft, from_attributes=True
        )

        cardsResponseJson = jsonable_encoder(cardsDraftResponse)
        await gameManager.broadcast(
            json.dumps({"type": "draftCards", "data": cardsResponseJson}), game_id
        )
    finally:
        db.close()

async def broadcast_blackmailed(game_id: int, secret : Secrets): # Acepta el objeto Secret
    db = SessionLocal()
    try:
        game = db.query(Game).filter(Game.game_id == game_id).first()
        if not game:
            print(f"Intento de broadcast para un juego no existente: {game_id}")
            return

        players = (
            db.query(Player)
            .options(joinedload(Player.cards), joinedload(Player.secrets))
            .filter(Player.game_id == game_id)
            .all()
        )

        secretResponse = Secret_Response.model_validate(secret).model_dump_json()
        playersStateResponse = [
            Player_State.model_validate(player) for player in players
        ]
        playersStateResponseJson = jsonable_encoder(playersStateResponse)

        # Broadcast del secreto (con el 'type' correcto para el frontend)
        await gameManager.broadcast(
            json.dumps({"type": "blackmailed", "data": secretResponse}), game_id
        )

        # Broadcast del estado de jugadores (aún necesario)
        await gameManager.broadcast(
            json.dumps({"type": "playersState", "data": playersStateResponseJson}),
            game_id,
        )
    finally:
        db.close()
async def broadcast_last_cancelable_event(card_id : int):
    db = SessionLocal()
    try:
        polymorphic_loader = orm.with_polymorphic(Card, [Detective, Event])
        stmt = select(polymorphic_loader).where(Card.card_id == card_id)
        card = db.execute(stmt).scalar_one_or_none()

        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        game_id = card.game_id

        card_adapter = TypeAdapter(AllCardsResponse)
        card_response = card_adapter.validate_python(card, from_attributes=True)

        card_json = jsonable_encoder(card_response)

        await gameManager.broadcast(json.dumps({
            "type": "cardResponse",
            "data": card_json
        }), game_id)

    finally:
        db.close()   

async def broadcast_last_cancelable_set(set_id : int):
    db = SessionLocal()
    try:
        stmt = select(Set).where(Set.set_id == set_id)
        set = db.execute(stmt).scalar_one_or_none()

        if not set:
            raise HTTPException(status_code=404, detail="Set not found")

        game_id = set.game_id

        set_adapter = TypeAdapter(Set_Response)
        set_response = set_adapter.validate_python(set, from_attributes=True)

        set_json = jsonable_encoder(set_response)

        await gameManager.broadcast(json.dumps({
            "type": "setResponse",
            "data": set_json
        }), game_id)

    finally:
        db.close()   
 





         
    

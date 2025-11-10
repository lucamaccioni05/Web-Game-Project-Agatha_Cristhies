import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket  #te permite definir las rutas o subrutas por separado
from sqlalchemy.orm import Session  
from src.database.database import SessionLocal, get_db
from src.database.models import Game, Log, Player 
from src.schemas.games_schemas import Game_Base, Game_Response, Game_Initialized
from src.database.services.services_games import assign_turn_to_players
from src.database.services.services_cards import init_detective_cards , init_event_cards, deal_cards_to_players, setup_initial_draft_pile , deal_NSF
from src.database.services.services_secrets import init_secrets, deal_secrets_to_players
from src.database.services.services_websockets import broadcast_available_games, broadcast_card_draft, broadcast_game_information
from src.webSocket.connection_manager import lobbyManager, gameManager


game = APIRouter()


@game.get("/games",tags = ["Games"])
def list_games (db: Session = Depends(get_db)) :
    return db.query(Game).all()

@game.get("/games/availables",tags = ["Games"])
def list_available_games (db : Session = Depends (get_db)): 
    return db.query(Game).filter((Game.status == "bootable") |  (Game.status == "waiting players")).all()

@game.post ("/games", status_code=201, response_model = Game_Response,tags = ["Games"]) #devolvia un int y queria devolver una response con el schema de game_base
async def create_game (game : Game_Base, db: Session = Depends(get_db)) : 
    new_game = Game (status = game.status,
                        max_players = game.max_players,
                        min_players = game.min_players,
                        name = game.name,
                        players_amount = 0)
    db.add(new_game)
    try:
        db.commit()
        db.refresh(new_game)
        await broadcast_available_games(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating game: {str(e)}")
    return new_game


@game.delete("/game/{game_id}", status_code=204, tags = ["Games"])
async def delete_game(game_id: int, db:Session = Depends(get_db)):
    game = db.get(Game, game_id) 
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    try:
        db.delete(game)
        db.commit()
        await broadcast_available_games(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error deleting game: {str(e)}")
    return None



@game.post("/game/beginning/{game_id}", status_code = 202,response_model= Game_Response, tags = ["Games"] ) 
async def initialize_game (game_id : int, db : Session = Depends(get_db)):
    game = db.query(Game).where(Game.game_id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.status == "in course":
        raise HTTPException(status_code=400, detail="Game already started")
    if game.players_amount >= game.min_players :  
        turns_assigned = assign_turn_to_players (game_id, db)
        detectives_initialized = init_detective_cards (game_id, db)
        events_initialized = init_event_cards(game_id , db)
        secrets_initialized = init_secrets(game_id, db)
        nsf_dealt = deal_NSF(game_id , db)
        cards_dealt = deal_cards_to_players (game_id, db)
        secrets_dealt = deal_secrets_to_players (game_id, db)
        draft_pile_initialized = setup_initial_draft_pile(game_id, db)
        game.cards_left = 61 - (game.players_amount * 6) - 3 #Se le resta el draft y las cartas repartidas
        game.status = "in course"
        
        try:
            db.commit()
            db.refresh(game)
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error updating turn's game: {str(e)}")
        
        await broadcast_game_information(game_id)
        await broadcast_available_games(db)
    else : 
        raise HTTPException(status_code=424, detail=f"Error, you need more players to start game")
    return game


@game.put ("/game/update_turn/{game_id}", status_code = 202, tags = ["Games"])
async def update_turn (game_id : int , db: Session = Depends(get_db)) : 
    game = db.query(Game).where(Game.game_id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.current_turn < game.players_amount : 
        game.current_turn += 1 
    else : 
        game.current_turn = 1
    
    next_player = db.query(Player).filter(
        Player.game_id == game_id,
        Player.turn_order == game.current_turn # Usamos el 'game.current_turn' ya actualizado
    ).first()

    if not next_player:
        raise HTTPException(status_code=404, detail="Next player not found for the new turn")

    log_turn_change = Log(
        game_id=game_id,
        player_id=next_player.player_id, # El ID del jugador que *empieza*
        type="TurnChange"
    )
    db.add(log_turn_change)
    
    try:
        db.commit()
        # Tu broadcast_game_information (asumo) envía el estado actualizado
        # del juego, que ahora incluye el nuevo log. ¡Esto es perfecto!
        await broadcast_game_information(game_id) 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating turn's game: {str(e)}")

    return game

@game.get("/games/{game_id}", tags=["Games"])
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game
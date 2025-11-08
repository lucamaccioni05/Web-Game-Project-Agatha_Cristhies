from fastapi import APIRouter,Depends,HTTPException  # te permite definir las rutas o subrutas por separado
from sqlalchemy.orm import Session
from src.database.services.services_websockets import  broadcast_game_information,broadcast_player_state
from src.database.database import SessionLocal, get_db
from src.database.models import Game, Player
from src.schemas.players_schemas import Player_Base
from src.database.services.services_games import update_players_on_game
from sqlalchemy import desc, func

player = APIRouter()  # ahora el player es lo mismo que hacer app

# FALTA MANEJO  DE ERRORES por ids inexistentes de parametros, sobre todo que no haya internal server error (sucede al crear un player con un game id inexistente)
# Luego list players cuando le paso un game id inexistente no debe responder 200 sino que 404 NOT FOUND

# En general falta la estructura de si salta exception agarrarla y devolver el codigo correspondientev


@player.get("/lobby/players/{game_id}", tags=["Players"])
def list_players(game_id: int, db: Session = Depends(get_db)):
    players = ( db.query(Player).filter(Player.game_id == game_id).all())  # .all() me devuelve una lista, si no hay nada devuelve lista vacia
    if not players:
        raise HTTPException(status_code=404, detail="game not found or no players in this game")
    return players


@player.post("/players", status_code=201, tags=["Players"])
def create_player(player: Player_Base, db: Session = Depends(get_db)):
    new_player = Player(
        name=player.name,
        host=player.host,
        game_id=player.game_id,
        birth_date=player.birth_date,
        avatar=player.avatar,
    )
    game = db.get(Game, new_player.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    updated_game = update_players_on_game(new_player.game_id, db)
    if not updated_game:
        raise HTTPException(status_code=400, detail=f"Game already full")
    else:
        db.add(new_player)
        try:
            db.commit()
            db.refresh(new_player)  # aca traigo el id generado por la db
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=400, detail=f"Error creating player: {str(e)}"
            )
    return new_player


@player.delete("/players/{player_id}", status_code=204, tags=["Players"])
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    try:
        db.delete(player)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error deleting player: {str(e)}")
    return None


# el punto de esto es que al seleccionar un jugador le permitimos hacer acciones fuera de su turno, en eventos como en los cuales debe elegir un secretoa revelar y asi


@player.put("/select/player/{player_id}", status_code=201, tags={"Players"})
async def select_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    game_id = player.game_id
    player.pending_action = "REVEAL_SECRET" 
    try : 
        db.commit()
        await broadcast_player_state(game_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error selecting player: {str(e)}")
    return None


@player.put("/unselect/player/{player_id}", status_code=201, tags={"Players"})
async def unselect_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    game_id = player.game_id
    player.pending_action = None
    try : 
        db.commit()
        await broadcast_player_state(game_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error selecting player: {str(e)}")
    return None


@player.put("/vote/player/{player_id_voted}/{player_id_voting}", status_code=201,tags=["Players"])
async def vote_player(player_id_voting: int, player_id_voted: int, db: Session = Depends(get_db)):
    player_to_vote = (db.query(Player).filter(Player.player_id == player_id_voted).first())
    player_voting = (db.query(Player).filter(Player.player_id == player_id_voting).first())

    if not player_to_vote:
        raise HTTPException(status_code=404, detail="Player to vote not found")
    if not player_voting:
        raise HTTPException(status_code=404, detail="Player voting not found")

    game_id = player_to_vote.game_id
    player_to_vote.votes_received += 1
    # El jugador espera
    player_voting.pending_action = "WAITING_VOTING_TO_END"

    game = db.query(Game).filter(Game.game_id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game.amount_votes += 1
    if game.amount_votes == game.players_amount:

        # Obtener el ganador de la votación
        winning_player = (
            db.query(Player)
            .filter(Player.game_id == game_id)
            .order_by(desc(Player.votes_received))
            .first()
        )

        # Reiniciar contador de votos en el juego
        game.amount_votes = 0

        all_players = db.query(Player).filter(Player.game_id == game_id).all()

        # Iterar sobre todos para limpiar VOTOS y PENDING_ACTION

        for p in all_players:
            # Limpiar votos de todos
            p.votes_received = 0

            if winning_player and p.player_id == winning_player.player_id:
                p.pending_action = "REVEAL_SECRET"
            elif p.player_id == game.current_turn and (
                not winning_player or p.player_id != winning_player.player_id
            ):
                p.pending_action = "WAITING_REVEAL_SECRET"
            else:
                p.pending_action = "Clense"
    try:
        db.commit()
        await broadcast_game_information(game_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error seleccionando jugador: {str(e)}")

    return None

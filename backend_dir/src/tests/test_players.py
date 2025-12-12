"""
Tests exhaustivos para los endpoints de Player, usando fixtures de pytest para aislamiento.
"""
import datetime
import pytest
from unittest.mock import patch, AsyncMock

from sqlalchemy import desc
from sqlalchemy.orm import Session # ¡Asegúrate de importar Session!
from src.database.models import Game, Player

# --- Tests for Player Creation (POST /players) ---

def test_create_player_success(client, db_session):
    """
    Verifica que un jugador puede ser creado y añadido a una partida disponible.
    """
    # Arrange
    game = Game(name="Waiting Game", status="waiting players", max_players=4, min_players=2, players_amount=0)
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)
    game_id = game.game_id

    player_data = {"name": "New Player", "host": True, "game_id": game_id, "birth_date": "2000-01-01"}

    # Act
    response = client.post("/players", json=player_data)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Player"
    assert data["host"] is True
    assert data["game_id"] == game_id
    assert "player_id" in data

    # Verifica en DB
    player_in_db = db_session.query(Player).filter(Player.player_id == data["player_id"]).one()
    assert player_in_db.name == "New Player"
    game_in_db = db_session.query(Game).filter(Game.game_id == game_id).one()
    assert game_in_db.players_amount == 1

def test_create_player_game_not_found(client):
    """
    Verifica que crear un jugador para una partida no existente devuelve 404.
    """
    player_data = {"name": "Lost Player", "host": False, "game_id": 999, "birth_date": "2000-01-01"}
    response = client.post("/players", json=player_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Game not found"

def test_create_player_game_full(client, db_session):
    """
    Verifica que intentar unirse a una partida llena devuelve 400.
    """
    # Arrange
    game = Game(name="Full Game", status="Full", max_players=2, min_players=2, players_amount=2)
    db_session.add(game)
    db_session.commit()

    player_data = {"name": "Late Player", "host": False, "game_id": game.game_id, "birth_date": "2000-01-01"}

    # Act
    response = client.post("/players", json=player_data)

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Game already full"

def test_create_player_invalid_data(client, db_session):
    """
    Verifica que crear un jugador con datos inválidos (campos faltantes) devuelve 422.
    """
    game = Game(name="Test Game", status="waiting players", max_players=4, min_players=2, players_amount=0)
    db_session.add(game)
    db_session.commit()

    # Faltan 'name' y 'birth_date'
    invalid_player_data = {"host": True, "game_id": game.game_id}
    response = client.post("/players", json=invalid_player_data)
    assert response.status_code == 422

def test_create_player_duplicate_name_handling(client, db_session):
    """
    Verifica que la lógica de nombres duplicados funciona.
    Prueba: juan, juan (2), juan (3).
    """
    # Arrange
    game = Game(name="Duplicate Game", status="waiting players", max_players=4, min_players=2, players_amount=0)
    db_session.add(game)
    db_session.commit()
    game_id = game.game_id

    player_data = {"name": "juan", "host": True, "game_id": game_id, "birth_date": "2000-01-01"}

    # Act 1: Crear "juan"
    response1 = client.post("/players", json=player_data)
    assert response1.status_code == 201
    assert response1.json()["name"] == "juan"

    # Act 2: Crear "juan" de nuevo
    response2 = client.post("/players", json=player_data)
    assert response2.status_code == 201
    assert response2.json()["name"] == "juan (2)"

    # Act 3: Crear "juan" por tercera vez
    response3 = client.post("/players", json=player_data)
    assert response3.status_code == 201
    assert response3.json()["name"] == "juan (3)"


# --- Tests for Listing Players (GET /lobby/players/{game_id}) ---

def test_list_players_success(client, db_session):
    """
    Verifica que todos los jugadores de una partida se listan correctamente.
    """
    # Arrange
    game = Game(name="Popular Game", status="waiting players", max_players=4, min_players=2, players_amount=2)
    player1 = Player(name="Player One", game=game, host=True, birth_date=datetime.date(2000, 1, 1))
    player2 = Player(name="Player Two", game=game, host=False, birth_date=datetime.date(2001, 1, 1))
    db_session.add_all([game, player1, player2])
    db_session.commit()

    # Act
    response = client.get(f"/lobby/players/{game.game_id}")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    player_names = {p['name'] for p in data}
    assert "Player One" in player_names
    assert "Player Two" in player_names

def test_list_players_game_not_found(client):
    """
    Verifica que listar jugadores de una partida no existente devuelve 404.
    """
    response = client.get("/lobby/players/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "game not found or no players in this game"

def test_list_players_game_with_no_players(client, db_session):
    """
    Verifica que listar jugadores de una partida vacía devuelve 404.
    """
    # Arrange
    game = Game(name="Empty Game", status="waiting players", max_players=4, min_players=2, players_amount=0)
    db_session.add(game)
    db_session.commit()

    # Act
    response = client.get(f"/lobby/players/{game.game_id}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "game not found or no players in this game"


# --- Tests for Deleting a Player (DELETE /players/{player_id}) ---

def test_delete_player_success(client, db_session):
    """
    Verifica que un jugador puede ser borrado exitosamente.
    """
    # Arrange
    game = Game(name="Test Game", status="waiting players", max_players=4, min_players=2, players_amount=1)
    player_to_delete = Player(name="Leaver", game=game, host=False, birth_date=datetime.date(2000, 1, 1))
    db_session.add_all([game, player_to_delete])
    db_session.commit()
    player_id = player_to_delete.player_id

    # Act
    delete_response = client.delete(f"/players/{player_id}")

    # Assert
    assert delete_response.status_code == 204

    # Verifica en DB
    player_in_db = db_session.query(Player).filter(Player.player_id == player_id).first()
    assert player_in_db is None

def test_delete_player_not_found(client):
    """
    Verifica que intentar borrar un jugador no existente devuelve 404.
    """
    response = client.delete("/players/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Player not found"

# --- Tests for Selecting a Player (PUT /select/player/{player_id}) ---

@pytest.mark.asyncio
@patch("src.routes.players_routes.broadcast_player_state", new_callable=AsyncMock)
async def test_select_player_success(mock_broadcast, client, db_session):
    """
    Verifica que 'select_player' actualiza 'pending_action' y llama al broadcast.
    """
    # Arrange
    game = Game(name="Select Game", status="in progress", max_players=4, min_players=2, players_amount=1)
    player = Player(name="Selector", game=game, host=True, birth_date=datetime.date(2000, 1, 1), pending_action=None)
    db_session.add_all([game, player])
    db_session.commit()
    player_id = player.player_id
    game_id = game.game_id # <-- Guardamos el ID antes de que 'game' quede obsoleto

    # Act
    response = client.put(f"/select/player/{player_id}")

    # Assert
    assert response.status_code == 201
    
    player_from_db = db_session.get(Player, player_id)
    assert player_from_db.pending_action == "REVEAL_SECRET"
    # --- CORRECCIÓN ---
    # Usamos la variable 'game_id' en lugar del objeto 'game' obsoleto
    mock_broadcast.assert_called_once_with(game_id)

@pytest.mark.asyncio
async def test_select_player_not_found(client):
    """ Verifica el 404 si el jugador no existe. """
    response = client.put("/select/player/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Player not found"


# --- Tests for Unselecting a Player (PUT /unselect/player/{player_id}) ---

@pytest.mark.asyncio
@patch("src.routes.players_routes.broadcast_player_state", new_callable=AsyncMock)
async def test_unselect_player_success(mock_broadcast, client, db_session):
    """
    Verifica que 'unselect_player' limpia 'pending_action' y llama al broadcast.
    """
    # Arrange
    game = Game(name="Unselect Game", status="in progress", max_players=4, min_players=2, players_amount=1)
    player = Player(name="Unselector", game=game, host=True, birth_date=datetime.date(2000, 1, 1), pending_action="REVEAL_SECRET")
    db_session.add_all([game, player])
    db_session.commit()
    player_id = player.player_id
    game_id = game.game_id # <-- Guardamos el ID

    # Act
    response = client.put(f"/unselect/player/{player_id}")

    # Assert
    assert response.status_code == 201
    
    player_from_db = db_session.get(Player, player_id)
    assert player_from_db.pending_action is None
    # --- CORRECCIÓN ---
    # Usamos la variable 'game_id'
    mock_broadcast.assert_called_once_with(game_id)

@pytest.mark.asyncio
async def test_unselect_player_not_found(client):
    """ Verifica el 404 si el jugador no existe. """
    response = client.put("/unselect/player/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Player not found"


# --- Tests for Voting (PUT /vote/player/...) ---

@pytest.mark.asyncio
@patch("src.routes.players_routes.broadcast_game_information", new_callable=AsyncMock)
async def test_vote_player_success_mid_round(mock_broadcast, client, db_session):
    """
    Verifica que un voto simple (que NO termina la votación) funciona.
    """
    # Arrange
    game = Game(name="Vote Game", status="in progress", max_players=3, min_players=3, players_amount=3, amount_votes=0, current_turn=1)
    p1_voting = Player(name="P1", game=game, host=True, birth_date=datetime.date(2000, 1, 1))
    p2_voted = Player(name="P2", game=game, host=False, birth_date=datetime.date(2001, 1, 1))
    p3 = Player(name="P3", game=game, host=False, birth_date=datetime.date(2002, 1, 1))
    db_session.add_all([game, p1_voting, p2_voted, p3])
    db_session.commit()
    
    # Guardamos los IDs
    p1_id = p1_voting.player_id
    p2_id = p2_voted.player_id
    game_id = game.game_id
    
    # Act
    response = client.put(f"/vote/player/{p2_id}/{p1_id}")

    # Assert
    assert response.status_code == 201
    
    p1_from_db = db_session.get(Player, p1_id)
    p2_from_db = db_session.get(Player, p2_id)
    game_from_db = db_session.get(Game, game_id)
    
    assert p2_from_db.votes_received == 1
    assert p1_from_db.pending_action == "WAITING_VOTING_TO_END"
    assert game_from_db.amount_votes == 1
    
    mock_broadcast.assert_called_once_with(game_id)


@pytest.mark.asyncio
@patch("src.routes.players_routes.broadcast_game_information", new_callable=AsyncMock)
async def test_vote_player_ends_voting_round(mock_broadcast, client, db_session):
    """
    Verifica la lógica compleja de fin de votación.
    """
    # Arrange
    game = Game(name="Vote Game", status="in progress", max_players=3, min_players=3, players_amount=3, amount_votes=2, current_turn=1)
    p1 = Player(name="P1", game=game, host=True, birth_date=datetime.date(2000, 1, 1), votes_received=0)
    p2 = Player(name="P2 (Winner)", game=game, host=False, birth_date=datetime.date(2001, 1, 1), votes_received=2) # P2 va ganando
    p3 = Player(name="P3", game=game, host=False, birth_date=datetime.date(2002, 1, 1), votes_received=0)
    db_session.add_all([game, p1, p2, p3])
    db_session.commit()
    
    # Guardamos IDs
    p1_id = p1.player_id
    p2_id = p2.player_id
    p3_id = p3.player_id
    game_id = game.game_id
    
    game.current_turn = p1_id
    db_session.commit()
    
    # Act
    response = client.put(f"/vote/player/{p3_id}/{p1_id}")

    # Assert
    assert response.status_code == 201
    
    p1_from_db = db_session.get(Player, p1_id)
    p2_from_db = db_session.get(Player, p2_id)
    p3_from_db = db_session.get(Player, p3_id)
    game_from_db = db_session.get(Game, game_id)

    assert game_from_db.amount_votes == 0
    
    assert p2_from_db.pending_action == "REVEAL_SECRET"
    assert p2_from_db.votes_received == 0
    
    assert p1_from_db.pending_action == "WAITING_REVEAL_SECRET"
    assert p1_from_db.votes_received == 0
    
    assert p3_from_db.pending_action == "Clense"
    assert p3_from_db.votes_received == 0
    
    mock_broadcast.assert_called_once_with(game_id)


@pytest.mark.asyncio
async def test_vote_player_not_found_errors(client, db_session):
    """ Verifica 404 para jugadores o juego inexistentes. """
    game = Game(name="Vote Game", status="in progress", max_players=3, min_players=3, players_amount=3)
    p1 = Player(name="P1", game=game, host=True, birth_date=datetime.date(2000, 1, 1))
    db_session.add_all([game, p1])
    db_session.commit()

    # Votado no existe
    response_voted_404 = client.put(f"/vote/player/999/{p1.player_id}")
    assert response_voted_404.status_code == 404
    assert response_voted_404.json()["detail"] == "Player to vote not found"
    
    # Votante no existe
    response_voting_404 = client.put(f"/vote/player/{p1.player_id}/999")
    assert response_voting_404.status_code == 404
    assert response_voting_404.json()["detail"] == "Player voting not found"
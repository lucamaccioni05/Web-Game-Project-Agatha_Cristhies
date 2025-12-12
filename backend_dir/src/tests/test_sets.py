"""
Tests for the Set creation and manipulation endpoints.
"""
import datetime
import pytest
from unittest.mock import patch, ANY
from sqlalchemy.orm import Session # Importa Session para el patch

# Import models
from src.database.models import Game, Player, Detective, Set, Card

# --- Fixture de Setup Mejorada ---

@pytest.fixture
def setup_data(db_session):
    """
    (FIXTURE MEJORADA)
    Crea un estado limpio con más variedad de cartas y jugadores.
    """
    game = Game(game_id=1, name="Test Game", status="in course", max_players=6, min_players=2, players_amount=2)
    player1 = Player(player_id=1, name="Player1", host=True, birth_date=datetime.date(2000, 1, 1), turn_order=1, game_id=1)
    player2 = Player(player_id=2, name="Player2", host=False, birth_date=datetime.date(2000, 1, 2), turn_order=2, game_id=1)
    db_session.add_all([game, player1, player2])
    
    # Crear cartas de detective para Player 1
    detectives_p1 = [
        Detective(card_id=1, type="detective", name="Parker Pyne", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
        Detective(card_id=2, type="detective", name="Parker Pyne", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
        Detective(card_id=3, type="detective", name="Harley Quin Wildcard", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
        Detective(card_id=4, type="detective", name="Miss Marple", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=3),
        Detective(card_id=5, type="detective", name="Miss Marple", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=3),
        Detective(card_id=6, type="detective", name="Miss Marple", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=3),
        Detective(card_id=7, type="detective", name="Tommy Beresford", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
        Detective(card_id=8, type="detective", name="Tuppence Beresford", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
        Detective(card_id=9, type="detective", name="Hercule Poirot", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=3),
        Detective(card_id=10, type="detective", name="Mr Satterthwaite", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
        Detective(card_id=11, type="detective", name="Adriane Oliver", picked_up=True, dropped=False, player_id=1, game_id=1, quantity_set=2),
    ]
    # Cartas para Player 2
    detectives_p2 = [
        Detective(card_id=12, type="detective", name="Miss Marple", picked_up=True, dropped=False, player_id=2, game_id=1, quantity_set=3),
        Detective(card_id=13, type="detective", name="Harley Quin Wildcard", picked_up=True, dropped=False, player_id=2, game_id=1, quantity_set=2),
        Detective(card_id=14, type="detective", name="Mr Satterthwaite", picked_up=True, dropped=False, player_id=2, game_id=1, quantity_set=2),
        Detective(card_id=15, type="detective", name="Tuppence Beresford", picked_up=True, dropped=False, player_id=2, game_id=1, quantity_set=2),
    ]
    
    db_session.add_all(detectives_p1)
    db_session.add_all(detectives_p2)
    db_session.commit()
    
    # Crear un set para Player 1 (para tests de steal y add_detective)
    set_marple = Set(set_id=1, name="Miss Marple", player_id=1, game_id=1)
    db_session.add(set_marple) # <-- ARREGLO: Añadido el set que faltaba
    
    # Asignar cartas 4, 5, 6 a ese set
    c4 = db_session.get(Card, 4); c5 = db_session.get(Card, 5); c6 = db_session.get(Card, 6)
    c4.set_id = 1; c5.set_id = 1; c6.set_id = 1
    c4.player_id = None; c5.player_id = None; c6.player_id = None
    
    db_session.commit()
    return db_session


# --- Tests para Sets de 2 Cartas ---

def test_set_of2_same_name(client, setup_data):
    response = client.post("/sets_of2/1,2") # Parker Pyne x2
    assert response.status_code == 201
    data = response.json() # <-- ARREGLO: Definir 'data'
    assert data["name"] == "Parker Pyne"

def test_set_of2_with_wildcard(client, setup_data):
    response = client.post("/sets_of2/1,3") # Parker Pyne + Wildcard
    assert response.status_code == 201
    data = response.json() # <-- ARREGLO: Definir 'data'
    assert data["name"] == "Parker Pyne"
    
    response2 = client.post("/sets_of2/3,2") # Wildcard + Parker Pyne
    assert response2.status_code == 201
    data2 = response2.json() # <-- ARREGLO: Definir 'data2'
    assert data2["name"] == "Parker Pyne"

def test_set_of2_beresford_brothers(client, setup_data):
    response = client.post("/sets_of2/7,8") # Tommy + Tuppence
    assert response.status_code == 201
    data = response.json() # <-- ARREGLO: Definir 'data'
    assert data["name"] == "Beresford brothers"

def test_set_of2_invalid_card_id(client, setup_data):
    response = client.post("/sets_of2/1,99")
    assert response.status_code == 400
    assert "Invalid card_id" in response.json()["detail"]

def test_set_of2_wrong_quantity(client, setup_data):
    response = client.post("/sets_of2/4,5") # Miss Marple (q=3)
    assert response.status_code == 400
    assert "You need one more detective" in response.json()["detail"]

def test_set_of2_not_compatible(client, setup_data):
    response = client.post("/sets_of2/1,7") # Parker Pyne + Tommy
    assert response.status_code == 400
    assert "not two compatible detectives" in response.json()["detail"]

def test_set_of2_two_wildcards(client, setup_data):
    """Verifica el error al jugar dos wildcards juntas."""
    response = client.post("/sets_of2/3,13") # P1 Wildcard, P2 Wildcard
    assert response.status_code == 400
    assert "You can't play this set" in response.json()["detail"]
 
    
def test_set_of2_db_commit_error(client, setup_data, mocker):
    """Verifica el manejo de excepciones (try...except)."""
    mocker.patch.object(Session, 'commit', side_effect=Exception("DB Commit Error"))
    
    response = client.post("/sets_of2/1,2")
    
    assert response.status_code == 400
    assert "Error creating set" in response.json()["detail"]

# --- Tests para Sets de 3 Cartas ---

def test_set_of3_same_name(client, setup_data):
    # Arrange: Liberamos las cartas 4 y 5 del set de la fixture
    db = setup_data
    c4 = db.get(Card, 4); c5 = db.get(Card, 5)
    c4.set_id = None; c5.set_id = None
    c4.player_id = 1; c5.player_id = 1
    db.commit()

    # Act: P1 (4, 5) y P2 (12)
    response = client.post("/sets_of3/4,5,12")
    assert response.status_code == 201
    assert response.json()["name"] == "Miss Marple"

def test_set_of3_with_wildcard(client, setup_data):
    db = setup_data
    c4 = db.get(Card, 4); c5 = db.get(Card, 5)
    c4.set_id = None; c5.set_id = None
    c4.player_id = 1; c5.player_id = 1
    db.commit()

    # Act: P1 (Wildcard=3, Marple=4, Marple=5)
    response = client.post("/sets_of3/3,4,5")
    assert response.status_code == 201
    assert response.json()["name"] == "Miss Marple"

def test_set_of3_invalid_card_id(client, setup_data):
    response = client.post("/sets_of3/4,5,99")
    assert response.status_code == 400
    assert "Invalid card_id" in response.json()["detail"]

def test_set_of3_wrong_quantity_mix(client, setup_data):
    """Verifica el mensaje de error de cantidad."""
    db = setup_data
    c4 = db.get(Card, 4); c5 = db.get(Card, 5)
    c4.set_id = None; c5.set_id = None
    c4.player_id = 1; c5.player_id = 1
    db.commit()
    
    # P1: Parker Pyne (1, q=2), Miss Marple (4, q=3), Miss Marple (5, q=3)
    response = client.post("/sets_of3/1,4,5")
    assert response.status_code == 400
    assert "You need just 2 cards to play this set" in response.json()["detail"]

def test_set_of3_wildcard_middle_position(client, setup_data):
    """Verifica el 'elif' para wildcard en posición 2 o 3."""
    db = setup_data
    c4 = db.get(Card, 4); c5 = db.get(Card, 5)
    c4.set_id = None; c5.set_id = None
    c4.player_id = 1; c5.player_id = 1
    db.commit()

    # Act: Marple=4, Wildcard=3, Marple=5
    response = client.post("/sets_of3/4,3,5")
    assert response.status_code == 201
    assert response.json()["name"] == "Miss Marple"

def test_set_of3_not_compatible_pure(client, setup_data):
    """Verifica el 'else' final (3 cartas incompatibles, q=3)."""
    db = setup_data
    c4 = db.get(Card, 4); c5 = db.get(Card, 5)
    c4.set_id = None; c5.set_id = None
    c4.player_id = 1; c5.player_id = 1
    db.commit()

    response = client.post("/sets_of3/4,5,9") # Marple, Marple, Poirot
    assert response.status_code == 400
    assert "not three compatible detectives" in response.json()["detail"]


# --- Tests para Endpoints Adicionales ---

def test_get_set_player_success(client, setup_data):
    """Verifica la URL correcta y el resultado."""
    response = client.get(f"/sets/list/1") # ID del Jugador 1
    assert response.status_code == 201 
    data = response.json()
    assert data["player_id"] == 1
    assert data["name"] == "Miss Marple"

def test_get_set_player_not_found(client, setup_data):
    """(TEST CORREGIDO) Verifica el 400 si el jugador no tiene sets."""
    # La fixture ahora (correctamente) NO le da sets a P2.
    response = client.get(f"/sets/list/2") # ID del Jugador 2
    assert response.status_code == 400
    assert "Player does not have that set" in response.json()["detail"]

def test_steal_set_success(client, setup_data):
    """Verifica el robo de set."""
    # Act: Player 2 (ID 2) roba el Set 1 (de P1)
    response = client.put(f"/sets/steal/2/1") # {player_id_to}/{set_id}
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["player_id"] == 2 # El Set ahora pertenece a Player 2

def test_steal_set_set_not_found(client, setup_data):
    """Verifica 400 si el Set no existe."""
    response = client.put(f"/sets/steal/2/99")
    assert response.status_code == 400
    assert "Player does not have that set" in response.json()["detail"]

def test_steal_set_player_not_found(client, setup_data):
    """Verifica 400 si el Player (ladrón) no existe."""
    response = client.put(f"/sets/steal/99/1")
    assert response.status_code == 400
    assert "Player id 2 does not exist" in response.json()["detail"]


def test_add_detective_success_same_name(client, setup_data):
    """Añadir una carta del mismo tipo a un set existente."""
    db = setup_data
    c12 = db.get(Card, 12) # Marple de P2
    c12.player_id = 1 # P1 toma la carta
    db.commit()

    response = client.put(f"/add/detective/12/1") # P1 añade Marple (12) a Set (1)
    
    assert response.status_code == 201
    assert response.json()["set_id"] == 1
    c12_after = db.get(Card, 12)
    assert c12_after.player_id is None
    assert c12_after.set_id == 1

def test_add_detective_success_adriane_oliver(client, setup_data):
    """P1 usa "Adriane Oliver" (ID 11) para añadir a su Set (ID 1)."""
    db = setup_data
    
    response = client.put(f"/add/detective/11/1") # Card 11 (Oliver) a Set 1 (Marple)
    
    assert response.status_code == 201
    c11_after = db.get(Card, 11)
    assert c11_after.player_id is None
    assert c11_after.set_id == 1

def test_add_detective_success_satterthwaite_special(client, setup_data):
    """Añadir Satterthwaite (q=2) a un set de Satterthwaite+Wildcard (q=2)."""
    db = setup_data
    # P2 (ID 2) tiene Satterthwaite (ID 14)
    # Creamos un set especial para P2
    set_satt = Set(set_id=3, name="Mr Satterthwaite + Harley Quin", player_id=2, game_id=1)
    db.add(set_satt)
    db.commit()
    
    response = client.put(f"/add/detective/14/3")
    
    assert response.status_code == 201
    assert response.json()["set_id"] == 3
    c14_after = db.get(Card, 14)
    assert c14_after.set_id == 3

def test_add_detective_success_beresford(client, setup_data):
    """Añadir "Tuppence Beresford" (ID 15) al set de "Beresford brothers" (ID 2)."""
    db = setup_data
    # Creamos el Set Beresford (ID 2) para P2
    set_b = Set(set_id=2, name="Beresford brothers", player_id=2, game_id=1)
    db.add(set_b)
    db.commit()
    
    # Act: P2 añade a Tuppence (15) a su set (2)
    response = client.put(f"/add/detective/15/2")
    assert response.status_code == 201
    assert response.json()["set_id"] == 2
    c15_after = db.get(Card, 15)
    assert c15_after.set_id == 2

def test_add_detective_fail_not_your_set(client, setup_data):
    """P2 (ID 2) intenta añadir su carta (ID 12) al Set de P1 (ID 1)."""
    response = client.put(f"/add/detective/12/1")
    assert response.status_code == 400
    assert "This is not your set" in response.json()["detail"]

def test_add_detective_fail_not_compatible(client, setup_data):
    """(TEST CORREGIDO) P1 intenta añadir "Poirot" (ID 9) a su set de "Marple" (ID 1)."""
    
    response = client.put(f"/add/detective/9/1")
    
    # Este test pasará porque tu ruta (que me mostraste)
    # ahora tiene el 'else: raise HTTPException' al final.
    assert response.status_code == 400
    assert "Card is not compatible" in response.json()["detail"]


def test_add_detective_fail_invalid_ids(client, setup_data):
    """Verifica el 400 si la carta o el set no existen."""
    response1 = client.put(f"/add/detective/99/1")
    assert response1.status_code == 400
    assert "Invalid card or set id" in response1.json()["detail"]
    
    response2 = client.put(f"/add/detective/1/99")
    assert response2.status_code == 400
    assert "Invalid card or set id" in response2.json()["detail"]

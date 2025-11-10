import datetime
import pytest
from unittest.mock import patch, AsyncMock

# Importar modelos y esquemas necesarios para los tests
from src.database.models import Game, Player, Event, Secrets, Detective, Card, ActiveTrade, Log
from src.schemas.card_schemas import Discard_List_Request

@pytest.fixture
def setup_events_data(db_session):
    """
    Fixture para crear un estado de juego consistente y rico para los tests de eventos.
    Se ejecuta para cada test, garantizando un estado limpio y aislado.
    """
    # --- Juego y Jugadores ---
    game = Game(game_id=1, name="Event Test Game", status="in course", max_players=4, min_players=4, players_amount=4, cards_left=20)
    
    # P1: Actor principal, tiene varias cartas de evento
    p1 = Player(player_id=1, name="Player 1", host=True, birth_date=datetime.date(2000, 1, 1), game_id=1, turn_order=1)
    
    # P2: Oponente para intercambios y otras interacciones
    p2 = Player(player_id=2, name="Player 2", host=False, birth_date=datetime.date(2001, 1, 1), game_id=1, turn_order=2)

    # P3 y P4: Para el evento 'Dead Card Folly'
    p3 = Player(player_id=3, name="Player 3", host=False, birth_date=datetime.date(2002, 2, 2), game_id=1, turn_order=3)
    p4 = Player(player_id=4, name="Player 4", host=False, birth_date=datetime.date(2003, 3, 3), game_id=1, turn_order=4)

    # --- Cartas en Mano ---
    # P1
    nsf_card = Event(card_id=1, name="Not so fast", picked_up=True, player_id=1, game_id=1)
    trade_event_card = Event(card_id=2, name="Card trade", picked_up=True, player_id=1, game_id=1)
    p1_card_to_trade = Detective(card_id=3, name="P1's Card", picked_up=True, player_id=1, game_id=1, quantity_set=1)
    folly_event_card = Event(card_id=5, name="Dead card folly", picked_up=True, player_id=1, game_id=1)
    
    # P2
    p2_card_to_trade = Detective(card_id=4, name="P2's Card", picked_up=True, player_id=2, game_id=1, quantity_set=1)

    # P3 y P4
    p3_card = Detective(card_id=6, name="P3's Card", picked_up=True, player_id=3, game_id=1, quantity_set=1)
    p4_card = Detective(card_id=7, name="P4's Card", picked_up=True, player_id=4, game_id=1, quantity_set=1)

    # --- Secretos ---
    revealed_secret = Secrets(secret_id=1, revelated=True, player_id=1, game_id=1)
    unrevealed_secret = Secrets(secret_id=2, revelated=False, player_id=3, game_id=1)

    # --- Pila de Descarte ---
    discarded_cards = [
        Detective(card_id=10 + i, name=f"Discard {i}", picked_up=True, dropped=True, game_id=1, quantity_set=1, discardInt=i+1) for i in range(7)
    ]
    
    # --- Mazo ---
    deck_cards = [Detective(name=f"Deck Card {i}", game_id=1, quantity_set=1) for i in range(20)]

    db_session.add_all([game, p1, p2, p3, p4, nsf_card, trade_event_card, folly_event_card, p1_card_to_trade, p2_card_to_trade, p3_card, p4_card, revealed_secret, unrevealed_secret] + discarded_cards + deck_cards)
    db_session.commit()
    return db_session

# === Tests para 'Cards off the table' ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_cards_off_table_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data):
    """Verifica que 'Cards off the table' descarta las cartas 'Not so fast'."""
    db_session = setup_events_data
    response = client.put("/event/cards_off_table/1")
    assert response.status_code == 200
    
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_cards_off_table_player_not_found(client, db_session):
    """Verifica el error 404 cuando el jugador no existe."""
    response = client.put("/event/cards_off_table/999")
    assert response.status_code == 404

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_cards_off_table_no_nsf_cards(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data):
    """Verifica el comportamiento correcto cuando un jugador no tiene cartas 'Not so fast'."""
    response = client.put("/event/cards_off_table/2") # Player 2 no tiene cartas NSF
    assert response.status_code == 200
    assert "No 'Not so fast' cards found" in response.json()["message"]
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(2)

# === Tests para 'One More' ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_one_more_success(mock_broadcast, client, setup_events_data):
    """Verifica que 'One More' reasigna un secreto revelado."""
    db_session = setup_events_data
    response = client.put("/event/one_more/2,1")
    assert response.status_code == 200
    
    secret = db_session.get(Secrets, 1)
    assert secret.player_id == 2
    assert secret.revelated is False
    mock_broadcast.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_one_more_target_player_not_found(client, setup_events_data):
    """Verifica el error si el jugador objetivo del secreto no existe."""
    response = client.put("/event/one_more/999,1")
    assert response.status_code == 404
    assert "New secret Player not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_one_more_secret_not_found_or_not_revealed(client, setup_events_data):
    """Verifica el error si el secreto no existe o no está revelado."""
    response_not_found = client.put("/event/one_more/2,999")
    assert response_not_found.status_code == 404
    
    response_not_revealed = client.put("/event/one_more/2,2") # Secret 2 no está revelado
    assert response_not_revealed.status_code == 404

# === Tests para 'Early Train to Paddington' ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_early_train_paddington_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data):
    """Verifica que el evento descarta 6 cartas del mazo."""
    db_session = setup_events_data
    game_before = db_session.get(Game, 1)
    initial_cards_left = game_before.cards_left
    
    response = client.put("/event/early_train_paddington/1,1")
    assert response.status_code == 200
    
    game_after = db_session.get(Game, 1)
    assert game_after.cards_left == initial_cards_left - 6
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_early_train_paddington_game_not_found(client):
    """Verifica el 404 si la partida no existe."""
    response = client.put("/event/early_train_paddington/999,1")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_early_train_paddington_player_not_in_game(client, setup_events_data):
    """Verifica el 404 si el jugador no está en la partida especificada."""
    response = client.put("/event/early_train_paddington/1,999")
    assert response.status_code == 404

@pytest.mark.asyncio
@patch('src.database.services.services_events.finish_game', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_early_train_paddington_not_enough_cards_ends_game(mock_broadcast_game, mock_broadcast_discard, mock_finish_game, client, db_session):
    """Verifica que la partida termina si no hay suficientes cartas para descartar."""
    game = Game(game_id=2, name="Short Deck", status="in course", players_amount=2, max_players=4, min_players=2, cards_left=5)
    player = Player(player_id=5, name="P5", game_id=2, birth_date=datetime.date(2000,1,1))
    deck_cards = [Detective(name=f"Card {i}", game_id=2, quantity_set=1) for i in range(5)]
    db_session.add_all([game, player] + deck_cards)
    db_session.commit()

    response = client.put("/event/early_train_paddington/2,5")
    assert response.status_code == 200
    assert "Not enough cards" in response.json()["message"]
    mock_finish_game.assert_awaited_once_with(2)

# === Tests para 'Look into the ashes' ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_look_into_ashes_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data):
    """Verifica que un jugador puede tomar una carta de la pila de descarte."""
    db_session = setup_events_data
    response = client.put("/event/look_into_ashes/2,10")
    assert response.status_code == 200
    
    card = db_session.get(Card, 10)
    assert card.player_id == 2
    assert card.dropped is False
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(2)

@pytest.mark.asyncio
async def test_look_into_ashes_player_not_found(client, setup_events_data):
    """Verifica el 404 si el jugador no existe."""
    response = client.put("/event/look_into_ashes/999,10")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_look_into_ashes_card_not_in_discard_pile(client, setup_events_data):
    """Verifica el 404 si la carta no está en la pila de descarte."""
    response = client.put("/event/look_into_ashes/2,999") # Carta no existe
    assert response.status_code == 404
    response_in_hand = client.put("/event/look_into_ashes/2,3") # Carta en mano de P1
    assert response_in_hand.status_code == 404

# === Tests para 'Delay the Murderer's Escape' ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_delay_escape_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data):
    """Verifica que el evento devuelve cartas del descarte al mazo."""
    db_session = setup_events_data
    game = db_session.get(Game, 1)
    initial_cards_left = game.cards_left
    
    card_ids_to_return = [10, 11, 12]
    response = client.put(
        "/event/delay_escape/1,1",
        json={"card_ids": card_ids_to_return}
    )
    assert response.status_code == 200
    
    game_after = db_session.get(Game, 1)
    assert game_after.cards_left == initial_cards_left + len(card_ids_to_return)
    
    returned_card = db_session.get(Card, 10)
    assert returned_card.dropped is False
    assert returned_card.player_id is None
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_delay_escape_no_cards_found(client, setup_events_data):
    """Verifica el 404 si no se encuentran cartas válidas en el descarte."""
    response = client.put("/event/delay_escape/1,1", json={"card_ids": [998, 999]})
    assert response.status_code == 404

# === Tests para 'Card Trade' (Multi-Paso) ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_card_trade_initiate_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data):
    """Verifica que el Paso 1 de 'Card Trade' crea la acción y el estado pendiente."""
    db_session = setup_events_data
    response = client.post("/event/card_trade/initiate/1,2,2")
    assert response.status_code == 200
    
    trade = db_session.query(ActiveTrade).filter_by(game_id=1).one()
    assert trade.player_one_id == 1
    assert trade.player_two_id == 2
    
    p1, p2 = db_session.get(Player, 1), db_session.get(Player, 2)
    assert p1.pending_action == "SELECT_TRADE_CARD"
    assert p2.pending_action == "SELECT_TRADE_CARD"
    
    event_card = db_session.get(Event, 2)
    assert event_card.dropped is True

@pytest.mark.asyncio
async def test_card_trade_initiate_player_not_found(client, setup_events_data):
    """Verifica el 404 si el iniciador o el objetivo no existen."""
    response = client.post("/event/card_trade/initiate/999,2,2")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_dead_card_folly_initiate_invalid_direction(client, setup_events_data):
    """Verifica el error al iniciar folly con una dirección inválida."""
    response = client.post("/event/dead_card_folly/initiate/1/1/5/up")
    assert response.status_code == 400
    assert "Dirección inválida" in response.json()["detail"]



# === Tests para 'Point your suspicion' ===

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_point_your_suspicion_success(mock_broadcast, client, setup_events_data):
    """Verifica que 'Point your suspicion' establece la acción pendiente VOTE para todos los jugadores."""
    db_session = setup_events_data
    response = client.put("/event/point_your_suspicion/1")
    assert response.status_code == 200
    
    players = db_session.query(Player).filter_by(game_id=1).all()
    for p in players:
        assert p.pending_action == "VOTE"
    mock_broadcast.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_point_your_suspicion_game_not_found(client):
    """Verifica el 404 si la partida no se encuentra para 'Point your suspicion'."""
    response = client.put("/event/point_your_suspicion/999")
    assert response.status_code == 404

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_end_point_your_suspicion_success(mock_broadcast, client, setup_events_data):
    """Verifica que el evento de finalización restablece el estado de la partida."""
    db_session = setup_events_data
    game = db_session.get(Game, 1)
    game.status = "point of suspicion"
    db_session.commit()

    response = client.put("/event/end/point_your_suspicion/1")
    assert response.status_code == 200
    
    game_after = db_session.get(Game, 1)
    assert game_after.status == "in course"
    mock_broadcast.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_end_point_your_suspicion_game_not_found(client):
    """Verifica el 404 si la partida no se encuentra para finalizar 'Point your suspicion'."""
    response = client.put("/event/end/point_your_suspicion/999")
    assert response.status_code == 404

# === Test para el endpoint 'count_NSF' ===

def test_count_nsf_success(client, setup_events_data):
    """Verifica el conteo de cartas 'Not so fast' para un evento cancelable."""
    db_session = setup_events_data
    game = db_session.get(Game, 1)
    player = db_session.get(Player, 1)
    
    log_entry = Log(game_id=game.game_id, player_id=player.player_id, card_id=2, type="event") # Evento Card Trade
    db_session.add(log_entry)
    db_session.commit()

    response = client.get(f"/events/count/Not_so_fast/{game.game_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Card trade"

def test_count_nsf_game_not_found(client):
    """Verifica el 404 si la partida no se encuentra para contar NSF."""
    response = client.get("/events/count/Not_so_fast/999")
    assert response.status_code == 404

def test_count_nsf_no_logs(client, setup_events_data):
    """Verifica el 404 si no hay logs para la partida."""
    response = client.get(f"/events/count/Not_so_fast/1")
    assert response.status_code == 404
    assert "There are no events to count" in response.json()["detail"]
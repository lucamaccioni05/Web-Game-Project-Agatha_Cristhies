"""
Exhaustive tests for the Event endpoints and services, using pytest fixtures for isolation.
"""
import datetime
import pytest
from unittest.mock import patch, AsyncMock

# Import models and schemas needed for setting up test data and requests
from src.database.models import Game, Player, Event, Secrets, Detective, Card, ActiveTrade, Log
from src.schemas.card_schemas import Discard_List_Request

@pytest.fixture
def setup_events_data(db_session):
    """
    Fixture to create a consistent and rich set of data for event-related tests.
    This runs for each test, ensuring a clean state.
    """
    game = Game(game_id=1, name="Event Test Game", status="in course", max_players=4, min_players=4, players_amount=4, cards_left=20)
    
    # Player 1: The main actor for many events
    p1 = Player(player_id=1, name="Player 1", host=True, birth_date=datetime.date(2000, 1, 1), game_id=1, turn_order=1)
    nsf_card = Event(card_id=1, name="Not so fast", picked_up=True, player_id=1, game_id=1)
    trade_event_card = Event(card_id=2, name="Card trade", picked_up=True, player_id=1, game_id=1)
    p1_card_to_trade = Detective(card_id=3, name="P1's Card", picked_up=True, player_id=1, game_id=1, quantity_set=1)
    folly_event_card = Event(card_id=5, name="Dead card folly", picked_up=True, player_id=1, game_id=1)

    # Player 2: The target for trades and other events
    p2 = Player(player_id=2, name="Player 2", host=False, birth_date=datetime.date(2001, 1, 1), game_id=1, turn_order=2)
    p2_card_to_trade = Detective(card_id=4, name="P2's Card", picked_up=True, player_id=2, game_id=1, quantity_set=1)

    # Player 3 & 4 for Folly event
    p3 = Player(player_id=3, name="Player 3", host=False, birth_date=datetime.date(2002, 2, 2), game_id=1, turn_order=3)
    p3_card = Detective(card_id=6, name="P3's Card", picked_up=True, player_id=3, game_id=1, quantity_set=1)
    p4 = Player(player_id=4, name="Player 4", host=False, birth_date=datetime.date(2003, 3, 3), game_id=1, turn_order=4)
    p4_card = Detective(card_id=7, name="P4's Card", picked_up=True, player_id=4, game_id=1, quantity_set=1)

    # A revealed secret for 'one_more'
    revealed_secret = Secrets(secret_id=1, revelated=True, player_id=1, game_id=1)
    
    # Discard pile for 'look_into_ashes' and 'delay_escape'
    discarded_cards = [
        Detective(card_id=10 + i, name=f"Discard {i}", picked_up=True, dropped=True, game_id=1, quantity_set=1, discardInt=i+1) for i in range(7)
    ]
    
    # Deck with plenty of cards
    deck_cards = [Detective(name=f"Deck Card {i}", game_id=1, quantity_set=1) for i in range(20)]

    db_session.add_all([game, p1, p2, p3, p4, nsf_card, trade_event_card, folly_event_card, p1_card_to_trade, p2_card_to_trade, p3_card, p4_card, revealed_secret] + discarded_cards + deck_cards)
    db_session.commit()

# --- Tests for 'Cards off the table' Event ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_cards_off_table_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies that 'Cards off the table' discards 'Not so fast' cards."""
    response = client.put("/event/cards_off_table/1")
    assert response.status_code == 200
    
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_cards_off_table_player_not_found(client):
    """Verifies error when the player does not exist."""
    response = client.put("/event/cards_off_table/999")
    assert response.status_code == 404

# --- Tests for 'One More' Event ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_one_more_success(mock_broadcast, client, setup_events_data, db_session):
    """Verifies that 'One More' reassigns a revealed secret."""
    response = client.put("/event/one_more/2,1")
    assert response.status_code == 200
    
    secret = db_session.get(Secrets, 1)
    assert secret.player_id == 2
    assert secret.revelated is False
    mock_broadcast.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_one_more_secret_not_found(client, setup_events_data):
    """Verifies error if the secret does not exist or is not revealed."""
    response = client.put("/event/one_more/2,999")
    assert response.status_code == 404

# --- Tests for 'Early Train to Paddington' Event ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_early_train_paddington_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies the event discards 6 cards from the deck."""
    game = Game(game_id=3, name="success paddington", status="in course", players_amount=2, max_players=4, min_players=2, cards_left=16)
    player = Player(player_id=6, name="P5", game_id=3, birth_date=datetime.date(2000,1,1))
    deck_cards = [Detective(name=f"Deck Card {i}", type='detective', game_id=3, quantity_set=1, dropped=False, picked_up=False, draft=False) for i in range(16)]
    db_session.add_all([game, player] + deck_cards)
    db_session.commit()
    initial_discard_count = db_session.query(Card).filter(Card.game_id == 3, Card.dropped == True).count()
    
    response = client.put("/event/early_train_paddington/3,6")
    assert response.status_code == 200
    
    final_discard_count = db_session.query(Card).filter(Card.game_id == 3, Card.dropped == True).count()
    assert final_discard_count == initial_discard_count + 6
    mock_broadcast_game.assert_awaited_once_with(3)
    mock_broadcast_discard.assert_awaited_once_with(6)

@pytest.mark.asyncio
@patch('src.database.services.services_events.finish_game', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_early_train_paddington_not_enough_cards_ends_game(mock_broadcast_game, mock_broadcast_discard, mock_finish_game, client, db_session):
    """Verifies the game ends if there are not enough cards to discard."""
    game = Game(game_id=2, name="Short Deck", status="in course", players_amount=2, max_players=4, min_players=2, cards_left=5)
    player = Player(player_id=5, name="P5", game_id=2, birth_date=datetime.date(2000,1,1))
    deck_cards = [Detective(name=f"Card {i}", game_id=2, quantity_set=1) for i in range(5)]
    db_session.add_all([game, player] + deck_cards)
    db_session.commit()

    response = client.put("/event/early_train_paddington/2,5")
    assert response.status_code == 200
    assert "Not enough cards" in response.json()["message"]
    mock_finish_game.assert_awaited_once_with(2)

# --- Tests for 'Look into the ashes' Event ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_look_into_ashes_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies a player can take a card from the discard pile."""
    response = client.put("/event/look_into_ashes/2,10")
    assert response.status_code == 200
    
    card = db_session.get(Card, 10)
    assert card.player_id == 2
    assert card.dropped is False
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(2)

# --- Tests for 'Delay the Murderer's Escape' Event ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_delay_escape_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies the event returns cards from the discard pile to the deck."""
    game_before = db_session.get(Game, 1)
    initial_cards_left = game_before.cards_left
    
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

# --- Tests for 'Card Trade' Event (Multi-Step) ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_card_trade_initiate_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies Step 1 of 'Card Trade' creates the action and sets pending state."""
    response = client.post("/event/card_trade/initiate/1,2,2")
    assert response.status_code == 200
    
    trade = db_session.query(ActiveTrade).filter_by(game_id=1).one()
    assert trade.player_one_id == 1
    assert trade.player_two_id == 2
    
    p1 = db_session.get(Player, 1)
    p2 = db_session.get(Player, 2)
    assert p1.pending_action == "SELECT_TRADE_CARD"
    assert p2.pending_action == "SELECT_TRADE_CARD"
    
    event_card = db_session.get(Event, 2)
    assert event_card.dropped is True

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_card_trade_select_and_resolve_success(mock_broadcast_game, client, setup_events_data, db_session):
    """Verifies Step 2 of 'Card Trade' correctly swaps cards when both players select."""
    # Initiate trade first
    client.post("/event/card_trade/initiate/1,2,2")
    
    # Player 1 selects their card
    response1 = client.post("/event/card_trade/select_card/1/3")
    assert response1.status_code == 200
    
    p1_after_select = db_session.get(Player, 1)
    assert p1_after_select.pending_action == "WAITING_FOR_TRADE_PARTNER"
    
    # Player 2 selects their card, which should resolve the trade
    response2 = client.post("/event/card_trade/select_card/2/4")
    assert response2.status_code == 200
    
    # Verify cards are swapped
    card_from_p1 = db_session.get(Card, 3)
    card_from_p2 = db_session.get(Card, 4)
    assert card_from_p1.player_id == 2
    assert card_from_p2.player_id == 1
    
    # Verify state is cleaned up
    p1_after_resolve = db_session.get(Player, 1)
    p2_after_resolve = db_session.get(Player, 2)
    assert p1_after_resolve.pending_action is None
    assert p2_after_resolve.pending_action is None
    assert db_session.query(ActiveTrade).filter_by(game_id=1).count() == 0

# --- Tests for 'Dead Card Folly' Event (Multi-Step) ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_dead_card_folly_initiate_success(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies initiation of 'Dead Card Folly' sets direction and pending actions."""
    response = client.post("/event/dead_card_folly/initiate/1/1/5/right")
    assert response.status_code == 200
    
    game = db_session.get(Game, 1)
    assert game.direction_folly == "right"
    
    players = db_session.query(Player).filter_by(game_id=1).all()
    for p in players:
        assert p.pending_action == "SELECT_FOLLY_CARD"

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_dead_card_folly_resolve_flow_right(mock_broadcast_game, client, setup_events_data, db_session):
    """Verifies the full card passing flow for 'Dead Card Folly' to the right."""
    # Initiate
    client.post("/event/dead_card_folly/initiate/1/1/5/right")
    
    # Each player passes their card to the player on their right
    # P1 (turn 1) -> P2 (turn 2)
    client.post("/event/dead_card_folly/select_card/1/2/3")
    # P2 (turn 2) -> P3 (turn 3)
    client.post("/event/dead_card_folly/select_card/2/3/4")
    # P3 (turn 3) -> P4 (turn 4)
    client.post("/event/dead_card_folly/select_card/3/4/6")
    # P4 (turn 4) -> P1 (turn 1)
    final_response = client.post("/event/dead_card_folly/select_card/4/1/7")
    
    assert "Todos los jugadores completaron" in final_response.json()["message"]
    
    # Verify final card owners
    assert db_session.get(Card, 3).player_id == 2
    assert db_session.get(Card, 4).player_id == 3
    assert db_session.get(Card, 6).player_id == 4
    assert db_session.get(Card, 7).player_id == 1
    
    # Verify state is cleaned up
    players = db_session.query(Player).filter_by(game_id=1).all()
    for p in players:
        assert p.pending_action is None

# --- Tests for 'Point your suspicion' Event ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_point_your_suspicion_success(mock_broadcast, client, setup_events_data, db_session):
    """Verifies that 'Point your suspicion' sets the VOTE pending action for all players."""
    response = client.put("/event/point_your_suspicion/1")
    assert response.status_code == 200
    
    players = db_session.query(Player).filter_by(game_id=1).all()
    for p in players:
        assert p.pending_action == "VOTE"
    mock_broadcast.assert_awaited_once_with(1)

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_end_point_your_suspicion_success(mock_broadcast, client, setup_events_data, db_session):
    """Verifies that the ending event resets the game status."""
    game = db_session.get(Game, 1)
    game.status = "point of suspicion"
    db_session.commit()

    response = client.put("/event/end/point_your_suspicion/1")
    assert response.status_code == 200
    
    game_after = db_session.get(Game, 1)
    assert game_after.status == "in course"
    mock_broadcast.assert_awaited_once_with(1)

# --- NEW EXHAUSTIVE TESTS ---

@pytest.mark.asyncio
@patch('src.routes.event_routes.broadcast_last_discarted_cards', new_callable=AsyncMock)
@patch('src.routes.event_routes.broadcast_game_information', new_callable=AsyncMock)
async def test_cards_off_table_no_nsf_cards(mock_broadcast_game, mock_broadcast_discard, client, setup_events_data, db_session):
    """Verifies correct behavior when a player has no 'Not so fast' cards."""
    # Player 2 is created by the fixture without 'Not so fast' cards
    response = client.put("/event/cards_off_table/2")
    assert response.status_code == 200
    assert "No 'Not so fast' cards found" in response.json()["message"]
    mock_broadcast_game.assert_awaited_once_with(1)
    mock_broadcast_discard.assert_awaited_once_with(2)

@pytest.mark.asyncio
async def test_one_more_target_player_not_found(client, setup_events_data):
    """Verifies error if the target player for the secret does not exist."""
    response = client.put("/event/one_more/999,1")
    assert response.status_code == 404
    assert "New secret Player not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_early_train_paddington_game_not_found(client):
    """Verifies 404 if the game does not exist."""
    response = client.put("/event/early_train_paddington/999,1")
    assert response.status_code == 404
    assert "Game not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_early_train_paddington_player_not_in_game(client, setup_events_data):
    """Verifies 404 if the player is not in the specified game."""
    response = client.put("/event/early_train_paddington/1,999")
    assert response.status_code == 404
    assert "Player not found in this game" in response.json()["detail"]

@pytest.mark.asyncio
async def test_look_into_ashes_player_not_found(client, setup_events_data):
    """Verifies 404 if the player does not exist."""
    response = client.put("/event/look_into_ashes/999,10")
    assert response.status_code == 404
    assert "Player not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_look_into_ashes_card_not_found(client, setup_events_data):
    """Verifies 404 if the card is not in the discard pile."""
    response = client.put("/event/look_into_ashes/2,999")
    assert response.status_code == 404
    assert "Card not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delay_escape_no_cards_found(client, setup_events_data):
    """Verifies 404 if no valid cards are found in the discard pile from the request."""
    response = client.put("/event/delay_escape/1,1", json={"card_ids": [998, 999]})
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_card_trade_initiate_player_not_found(client, setup_events_data):
    """Verifies 404 if the trader or tradee does not exist."""
    response_trader = client.post("/event/card_trade/initiate/999,2,2")
    assert response_trader.status_code == 404
    response_tradee = client.post("/event/card_trade/initiate/1,999,2")
    assert response_tradee.status_code == 404

@pytest.mark.asyncio
async def test_card_trade_select_card_no_active_trade(client, setup_events_data):
    """Verifies error when selecting a card without an active trade."""
    response = client.post("/event/card_trade/select_card/1/3")
    assert response.status_code == 400
    assert "No es una acción válida para este jugador." in response.json()["detail"]

@pytest.mark.asyncio
async def test_card_trade_select_card_twice(client, setup_events_data):
    """Verifies error when a player tries to select a card twice."""
    client.post("/event/card_trade/initiate/1,2,2")
    client.post("/event/card_trade/select_card/1/3")
    
    response = client.post("/event/card_trade/select_card/1/3")
    assert response.status_code == 400
    assert "Carta ya seleccionada" in response.json()["detail"]

@pytest.mark.asyncio
async def test_dead_card_folly_initiate_invalid_direction(client, setup_events_data):
    """Verifies error on initiating folly with an invalid direction."""
    response = client.post("/event/dead_card_folly/initiate/1/1/5/up")
    assert response.status_code == 400
    assert "Dirección inválida" in response.json()["detail"]

@pytest.mark.asyncio
async def test_dead_card_folly_select_card_not_owned(client, setup_events_data):
    """Verifies error if a player tries to pass a card they don't own."""
    client.post("/event/dead_card_folly/initiate/1/1/5/right")
    # Player 1 (from_player_id=1) tries to pass Player 2's card (card_id=4)
    response = client.post("/event/dead_card_folly/select_card/1/2/4")
    assert response.status_code == 404
    assert "no pertenece al jugador origen" in response.json()["detail"]

@pytest.mark.asyncio
async def test_point_your_suspicion_game_not_found(client):
    """Verifies 404 if game is not found for 'Point your suspicion'."""
    response = client.put("/event/point_your_suspicion/999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_end_point_your_suspicion_game_not_found(client):
    """Verifies 404 if game is not found for ending 'Point your suspicion'."""
    response = client.put("/event/end/point_your_suspicion/999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_point_your_suspicion_no_players_in_game(client, db_session):
    """Verifies error if 'Point your suspicion' is called on a game with no players."""
    game = Game(
        game_id=99, 
        name="Empty Game", 
        status="in course",
        max_players=4,      # <-- AÑADIR
        min_players=2,      # <-- AÑADIR
        players_amount=0    # <-- AÑADIR
    )
    db_session.add(game)
    db_session.commit()
    response = client.put("/event/point_your_suspicion/99")
    assert response.status_code == 404
    assert "Players not found" in response.json()["detail"]

def test_count_nsf_success(client, setup_events_data, db_session):
    """Verifies the count of 'Not so fast' cards for a cancelable event."""
    game = db_session.get(Game, 1)
    player = db_session.get(Player, 1)
    
    # Log a cancelable event (Card Trade, card_id=2)
    log_entry = Log(game_id=game.game_id, player_id=player.player_id, card_id=2)
    db_session.add(log_entry)
    db_session.commit()

    response = client.get(f"/events/count/Not_so_fast/{game.game_id}")
    assert response.status_code == 200
    # Since there are no NSF cards played, the original event should be returned
    assert response.json()["name"] == "Card trade"

def test_count_nsf_game_not_found(client):
    """Verifies 404 if game is not found for counting NSF."""
    response = client.get("/events/count/Not_so_fast/999")
    assert response.status_code == 404

def test_count_nsf_no_logs(client, setup_events_data):
    """Verifies 404 if there are no logs for the game."""
    response = client.get(f"/events/count/Not_so_fast/1")
    assert response.status_code == 404
    assert "There are no events to count" in response.json()["detail"]

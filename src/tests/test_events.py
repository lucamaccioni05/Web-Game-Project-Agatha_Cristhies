"""
Exhaustive tests for the Event endpoints and services, using pytest fixtures for isolation.
"""
import datetime
import pytest
from unittest.mock import patch, AsyncMock

# Import models and schemas needed for setting up test data and requests
from src.database.models import Game, Player, Event, Secrets, Detective, Card, ActiveTrade
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

import datetime
from fastapi import HTTPException
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy import false
from src.database.models import Game, Player, Card, Event, Secrets, Set # Importa tus modelos
from src.database.services.services_websockets import broadcast_available_games, broadcast_game_information, broadcast_last_discarted_cards, broadcast_lobby_information, broadcast_last_cancelable_event,broadcast_last_cancelable_set, broadcast_blackmailed, broadcast_card_draft, broadcast_player_state

pytestmark = pytest.mark.asyncio


@pytest.fixture
def mock_db_session():
    """Crea un mock de la sesión de SQLAlchemy."""
    return MagicMock()

# Usamos 'patch' para reemplazar los managers globales con mocks durante la prueba
@patch('src.database.services.services_websockets.lobbyManager', new_callable=AsyncMock)
async def test_broadcast_available_games(mock_lobby_manager, mock_db_session):
    # 1. Preparación (Arrange)
    
    # Simular los datos que devolvería la base de datos
    mock_game_1 = Game(game_id=1, name="Partida 1", status="waiting players", max_players = 6, min_players = 3, players_amount = 2)
    mock_game_2 = Game(game_id=2, name="Partida 2", status="bootable", max_players = 6, min_players = 2, players_amount = 2)
    
    # Configurar el mock de la DB para que devuelva los datos simulados
    mock_db_session.query.return_value.all.return_value = [mock_game_1, mock_game_2]
    
    # 2. Actuación (Act)
    await broadcast_available_games(mock_db_session)

    # 3. Aserción (Assert)

    # Verificar que se llamó al broadcast del manager
    mock_lobby_manager.broadcast.assert_awaited_once()

    # Verificar que los datos enviados son correctos
    # Obtenemos los argumentos con los que fue llamado el mock
    call_args, _ = mock_lobby_manager.broadcast.call_args
    sent_json_str = call_args[0]
    
    # Convertimos el string JSON enviado a un objeto Python para compararlo
    sent_data = json.loads(sent_json_str)

    assert len(sent_data) == 2
    assert sent_data[0]['name'] == "Partida 1"
    assert sent_data[1]['status'] == "bootable"

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
async def test_broadcast_lobby_information_success(mock_game_manager, mock_db_session):
    # 1. Arrange: Preparamos los datos simulados que devolverá la DB
    game_id = 1
    mock_game = Game(
        game_id=game_id, name="Lobby de Prueba", status="waiting players",
        max_players=6, min_players=4, players_amount=2
    )
    mock_players = [
        Player(player_id=1, name="Jugador 1", game_id=1, host=True, birth_date = datetime.date(2000, 1, 1)),
        Player(player_id=2, name="Jugador 2", game_id=1, host=False, birth_date= datetime.date(2000, 4, 4))
    ]
    # Configuramos el mock de la DB para que devuelva nuestros datos
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_game
    mock_db_session.query.return_value.filter.return_value.all.return_value = mock_players
    
    # 2. Act: Llamamos a la función
    await broadcast_lobby_information(mock_db_session, game_id)

    # 3. Assert: Verificamos que se hicieron dos broadcasts
    assert mock_game_manager.broadcast.await_count == 2
    
    # Verificamos la primera llamada (información del juego)
    first_call_args = mock_game_manager.broadcast.await_args_list[0].args
    first_call_data = json.loads(first_call_args[0])
    assert first_call_data['type'] == 'game'
    assert json.loads(first_call_data['data'])['name'] == "Lobby de Prueba"
    assert first_call_args[1] == game_id # Verifica el game_id

    # Verificamos la segunda llamada (información de los jugadores)
    second_call_args = mock_game_manager.broadcast.await_args_list[1].args
    second_call_data = json.loads(second_call_args[0])
    assert second_call_data['type'] == 'players'
    assert len(second_call_data['data']) == 2
    assert second_call_data['data'][0]['name'] == "Jugador 1"
    assert second_call_args[1] == game_id # Verifica el game_id

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
async def test_broadcast_lobby_information_game_not_found(mock_game_manager, mock_db_session):
    # 1. Arrange: Configuramos la DB para que no encuentre el juego
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # 2. Act
    await broadcast_lobby_information(mock_db_session, game_id=999)

    # 3. Assert: Verificamos que NO se llamó al broadcast
    mock_game_manager.broadcast.assert_not_awaited()



@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_game_information_success(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    game_id = 1

    # Añadimos TODOS los campos que Game_Response espera
    mock_game = Game(
        game_id=game_id, name="Partida en Juego", status="in progress",
        max_players=6, min_players=4, players_amount=4
    )
    mock_game.log = []  # El servicio itera sobre 'game.log'
    mock_game.current_turn = 1 # Requerido por Game_Response
    mock_game.cards_left = 50  # Requerido por Game_Response
    mock_game.direction_folly = "right" # Requerido por Game_Response (y en tu error)
    
    # Añadimos TODOS los campos que Player_State espera
    mock_player_1 = Player(
        player_id=1, name="Jugador 1",game_id = 1,host = True, turn_order=2,
        birth_date = datetime.date(2000, 1, 1), 
        cards=[], secrets=[], social_disgrace = False,
        avatar="avatar1.png", # Requerido por Player_Base
        sets=[] # Requerido por Player_State
    )
    mock_player_1.pending_action = None # Requerido por Player_State
    mock_player_1.votes_received = 0  # Requerido por Player_State

    mock_player_2 = Player(
        player_id=2, name="Jugador 2",game_id = 1 ,host = False,turn_order=1,
        birth_date = datetime.date(2000, 4, 4) , 
        cards=[], secrets=[], social_disgrace = False,
        avatar="avatar2.png", # Requerido por Player_Base
        sets=[] # Requerido por Player_State
    )
    mock_player_2.pending_action = None # Requerido por Player_State
    mock_player_2.votes_received = 0  # Requerido por Player_State
    
    mock_players = [mock_player_1, mock_player_2]
    
    # Mock para la primera llamada: db.query(Game)...
    mock_game_query = MagicMock()
    mock_game_query.options.return_value.filter.return_value.first.return_value = mock_game

    # Mock para la segunda llamada: db.query(Player)...
    mock_players_query = MagicMock()
    mock_players_query.options.return_value.filter.return_value.all.return_value = mock_players
    
    # Le decimos a mock_db_session que devuelva estos mocks en orden
    mock_db_session.query.side_effect = [
        mock_game_query,    # Primera vez que se llama a db.query()
        mock_players_query  # Segunda vez que se llama a db.query()
    ]
    
    # 2. Act
    await broadcast_game_information(game_id)

    # 3. Assert
    assert mock_game_manager.broadcast.await_count == 2
    
    # Verificamos la llamada para "gameUpdated"
    game_updated_call_args = mock_game_manager.broadcast.await_args_list[0].args
    game_updated_data = json.loads(game_updated_call_args[0])
    assert game_updated_data['type'] == 'gameUpdated'
    
    # El 'data' de gameUpdated es un string JSON, por eso el doble load
    game_data_dict = json.loads(game_updated_data['data'])
    assert game_data_dict['status'] == 'in progress'
    assert game_data_dict['name'] == 'Partida en Juego'
    assert game_data_dict['log'] == [] 

    # Verificamos la llamada para "playersState"
    players_state_call_args = mock_game_manager.broadcast.await_args_list[1].args
    players_state_data = json.loads(players_state_call_args[0])
    assert players_state_data['type'] == 'playersState'
    assert len(players_state_data['data']) == 2
# --- Pruebas para broadcast_last_discarted_cards ---

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_last_discarted_cards_success(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    player_id = 1
    game_id = 10
    
    # Creamos el mock_player y le añadimos los campos que Pydantic (Player_State) espera
    mock_player = Player(
        player_id=player_id, name="Jugador 1",game_id = game_id,host = True, 
        turn_order=2,birth_date = datetime.date(2000, 1, 1), 
        cards=[], secrets=[], sets = [], social_disgrace = False,
        avatar="avatar1.png" # Requerido por Player_Base
    )
    # Atributos extra requeridos por Player_State
    mock_player.pending_action = None
    mock_player.votes_received = 0 # ¡Este era el error! Debe ser un int, no None.
    # --- Fin del cambio ---

    mock_cards = [
        Event(card_id=101, type="event", game_id=game_id,player_id= player_id, dropped=True,picked_up = True,draft = False ,discardInt=5, name = "Dead card folly"),
        Event(card_id=102, type="event", game_id=game_id,player_id = player_id, dropped=True,picked_up = True ,draft = False,discardInt=4, name = "Point your suspicions")
    ]
    
    mock_player_query_first = MagicMock()
    mock_player_query_first.filter.return_value.first.return_value = mock_player
    
    mock_player_query_all = MagicMock()
    mock_player_query_all.options.return_value.filter.return_value.all.return_value = [mock_player]
    
    mock_db_session.query.side_effect = [
        mock_player_query_first,
        mock_player_query_all
    ]
    
    mock_execute_result = MagicMock()
    mock_execute_result.scalars.return_value.all.return_value = mock_cards
    mock_db_session.execute.return_value = mock_execute_result

    # 2. Act
    await broadcast_last_discarted_cards(player_id)

    # 3. Assert
    assert mock_game_manager.broadcast.await_count == 2

    calls = mock_game_manager.broadcast.await_args_list

    call1_args = calls[0].args
    data1 = json.loads(call1_args[0])
    assert data1['type'] == 'playersState'
    assert call1_args[1] == game_id 

    call2_args = calls[1].args
    data2 = json.loads(call2_args[0])
    assert data2['type'] == 'droppedCards'
    assert len(data2['data']) == 2
    assert call2_args[1] == game_id
    

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_last_discarted_cards_no_cards_found(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    player_id = 1
    game_id = 10
    mock_player = Player(player_id=player_id, name="Jugador 1",game_id = game_id,host = True, turn_order=2,birth_date = datetime.date(2000, 1, 1), cards=[], secrets=[],sets = [], social_disgrace=False)
        # Configura los diferentes resultados para las llamadas a la DB
     # Configura el mock para la primera llamada a la DB: db.query(Player)
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_player

    # Configura el mock para la segunda llamada a la DB: db.execute(stmt)
    mock_execute_result = MagicMock()
    # La clave es devolver una lista vacía aquí para simular que no se encontraron cartas
    mock_execute_result.scalars.return_value.all.return_value = [] 
    mock_db_session.execute.return_value = mock_execute_result

    # 2. Act & 3. Assert (el resto de la prueba no cambia)
    with pytest.raises(HTTPException) as exc_info:
        await broadcast_last_discarted_cards(player_id)
    
    assert exc_info.value.status_code == 404
    mock_game_manager.broadcast.assert_not_awaited()

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_player_state_success(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    game_id = 1
    
    # Creamos un mock de jugador que satisfaga el schema Player_State
    mock_player_1 = Player(
        player_id=1, name="Jugador 1", game_id=game_id, host=True, turn_order=2,
        birth_date=datetime.date(2000, 1, 1), 
        cards=[], secrets=[], social_disgrace=False,
        avatar="avatar1.png", sets=[]
    )
    mock_player_1.pending_action = None
    mock_player_1.votes_received = 0
    
    mock_players_list = [mock_player_1]

    # Configuramos el mock de la DB
    mock_db_session.query.return_value.options.return_value.filter.return_value.all.return_value = mock_players_list

    # 2. Act
    await broadcast_player_state(game_id)

    # 3. Assert
    mock_game_manager.broadcast.assert_awaited_once()
    call_args = mock_game_manager.broadcast.await_args_list[0].args
    data = json.loads(call_args[0])
    
    assert data['type'] == 'playersState'
    assert len(data['data']) == 1
    assert data['data'][0]['name'] == 'Jugador 1'
    assert call_args[1] == game_id


# --- Tests para broadcast_card_draft ---

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_card_draft_success(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    game_id = 1
    
    # --- CAMBIO 2: Mock de Cartas (Event) ---
    # Añadimos TODOS los campos que el modelo base 'Card' espera
    mock_cards = [
        Event(card_id=101, type="event", game_id=game_id, name="Carta Draft 1",
              picked_up=False, dropped=False, player_id=None, draft=True, discardInt=0),
        Event(card_id=102, type="event", game_id=game_id, name="Carta Draft 2",
              picked_up=False, dropped=False, player_id=None, draft=True, discardInt=0)
    ]
    
    mock_execute_result = MagicMock()
    mock_execute_result.scalars.return_value.all.return_value = mock_cards
    mock_db_session.execute.return_value = mock_execute_result
    
    # 2. Act
    await broadcast_card_draft(game_id)
    
    # 3. Assert
    mock_game_manager.broadcast.assert_awaited_once()
    call_args = mock_game_manager.broadcast.await_args_list[0].args
    data = json.loads(call_args[0])
    
    assert data['type'] == 'draftCards'
    assert len(data['data']) == 2
    assert data['data'][0]['name'] == 'Carta Draft 1'
    assert call_args[1] == game_id

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_card_draft_no_cards_found(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    
    mock_execute_result = MagicMock()
    mock_execute_result.scalars.return_value.all.return_value = [] # Lista vacía
    mock_db_session.execute.return_value = mock_execute_result
    
    # 2. Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await broadcast_card_draft(game_id=1)
    
    assert exc_info.value.status_code == 404
    mock_game_manager.broadcast.assert_not_awaited()


# --- Test para broadcast_blackmailed ---

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_blackmailed(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    game_id = 1
    
    # Preparamos el mock del secreto (que se pasa como argumento)
    mock_secret = Secrets(
        secret_id=5, player_id=1, game_id=game_id, 
        murderer=True, acomplice=False, revelated=False
    )
    
    # Preparamos los mocks de Game y Player (para las queries internas)
    mock_game = Game(game_id=game_id, name="Game", status="in progress")
    mock_player = Player(
        player_id=1, name="Jugador 1", game_id=game_id, host=True, turn_order=1,
        birth_date=datetime.date(2000, 1, 1), 
        cards=[], secrets=[mock_secret], social_disgrace=False,
        avatar="avatar1.png", sets=[]
    )
    mock_player.pending_action = "BLACKMAILED"
    mock_player.votes_received = 0

    mock_game_query = MagicMock()
    mock_game_query.filter.return_value.first.return_value = mock_game
    
    mock_players_query = MagicMock()
    mock_players_query.options.return_value.filter.return_value.all.return_value = [mock_player]

    mock_db_session.query.side_effect = [mock_game_query, mock_players_query]

    # 2. Act
    await broadcast_blackmailed(game_id, mock_secret)

    # 3. Assert
    assert mock_game_manager.broadcast.await_count == 2
    
    calls = mock_game_manager.broadcast.await_args_list
    
    # Verifica el broadcast "blackmailed"
    data1 = json.loads(calls[0].args[0])
    assert data1['type'] == 'blackmailed'
    assert json.loads(data1['data'])['secret_id'] == 5
    assert json.loads(data1['data'])['murderer'] == True

    # Verifica el broadcast "playersState"
    data2 = json.loads(calls[1].args[0])
    assert data2['type'] == 'playersState'
    assert data2['data'][0]['pending_action'] == "BLACKMAILED"


# --- Test para broadcast_last_cancelable_event ---

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_last_cancelable_event(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    card_id = 101
    game_id = 1
    
    # --- CAMBIO 3: Mock de Carta (Event) ---
    # Añadimos TODOS los campos que el modelo base 'Card' espera
    mock_card = Event(
        card_id=card_id, type="event", game_id=game_id, 
        name="Evento Cancelable", dropped=True,
        picked_up=False, player_id=None, draft=False, discardInt=0 
    )
    
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = mock_card
    mock_db_session.execute.return_value = mock_execute_result
    
    # 2. Act
    await broadcast_last_cancelable_event(card_id)
    
    # 3. Assert
    mock_game_manager.broadcast.assert_awaited_once()
    call_args = mock_game_manager.broadcast.await_args_list[0].args
    data = json.loads(call_args[0])
    
    assert data['type'] == 'cardResponse'
    assert data['data']['name'] == 'Evento Cancelable'
    assert data['data']['card_id'] == card_id
    assert call_args[1] == game_id

# --- Test para broadcast_last_cancelable_set ---

@patch('src.database.services.services_websockets.gameManager', new_callable=AsyncMock)
@patch('src.database.services.services_websockets.SessionLocal')
async def test_broadcast_last_cancelable_set(mock_session_local, mock_game_manager, mock_db_session):
    # 1. Arrange
    mock_session_local.return_value = mock_db_session
    set_id = 1
    game_id = 1
    
    # (El NameError se arregló con la importación del modelo 'Set')
    mock_set = Set(
        set_id=set_id, game_id=game_id, player_id=1,
        name="Set de Poirot"
    )
    
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = mock_set
    mock_db_session.execute.return_value = mock_execute_result
    
    # 2. Act
    await broadcast_last_cancelable_set(set_id)
    
    # 3. Assert
    mock_game_manager.broadcast.assert_awaited_once()
    call_args = mock_game_manager.broadcast.await_args_list[0].args
    data = json.loads(call_args[0])
    
    assert data['type'] == 'setResponse'
    assert data['data']['name'] == 'Set de Poirot'
    assert data['data']['set_id'] == set_id
    assert call_args[1] == game_id
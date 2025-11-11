import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.database.models import Game
# Importar la función de la ruta que quieres probar
from src.routes.websocket_routes import ws_available_games, ws_list_players , ws_info_from_game

pytestmark = pytest.mark.asyncio

@pytest.fixture
def mock_websocket():
    ws = AsyncMock()
    ws.accept = AsyncMock()
    # Simular que el cliente se desconecta después de un ciclo
    ws.receive_text.side_effect = [ "ping", Exception("Client disconnected") ]
    return ws

@pytest.fixture
def mock_db():
    return MagicMock()

# Parcheamos las dependencias de la ruta: el manager y la función de servicio
@patch('src.routes.websocket_routes.broadcast_available_games', new_callable=AsyncMock)
@patch('src.routes.websocket_routes.lobbyManager', new_callable=AsyncMock)
async def test_ws_available_games_flow(mock_lobby_manager, mock_broadcast, mock_websocket, mock_db):
    # Llamamos a la función de la ruta como si FastAPI lo hiciera
    await ws_available_games(websocket=mock_websocket, db=mock_db)
    
    # 1. Verificar la conexión inicial
    mock_lobby_manager.connect.assert_awaited_once_with(mock_websocket)
    
    # 2. Verificar que se envían los datos iniciales
    mock_broadcast.assert_awaited_once_with(mock_db)
    
    # 3. Verificar la desconexión
    # El receive_text lanza una excepción simulada, lo que debe llevar al bloque finally
    mock_lobby_manager.disconnect.assert_called_once_with(mock_websocket)

@patch('src.routes.websocket_routes.gameManager', new_callable=AsyncMock)
async def test_ws_list_players_game_not_found(mock_game_manager, mock_websocket, mock_db):
    game_id = 999
    
    # Simular que la DB no encuentra la partida
    mock_db.query.return_value.filter.return_value.first.return_value = None

    await ws_list_players(websocket=mock_websocket, game_id=game_id, db=mock_db)

    # Verificar que la conexión se cierra con el código de error correcto
    mock_websocket.close.assert_awaited_once_with(code=4004, reason="Game not found")
    
    # Verificar que nunca se intentó conectar al manager
    mock_game_manager.connect.assert_not_awaited()

@patch('src.routes.websocket_routes.broadcast_lobby_information', new_callable=AsyncMock)
@patch('src.routes.websocket_routes.gameManager', new_callable=AsyncMock)
async def test_ws_list_players_success_flow(mock_game_manager, mock_broadcast_lobby, mock_websocket, mock_db):
    """
    Testea el flujo exitoso de un cliente conectándose al lobby.
    """
    game_id = 1
    
    # 1. Arrange: Simular que la DB SÍ encuentra la partida
    mock_game = Game(game_id=game_id, name="Test Game", status="waiting players")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_game

    # 2. Act: Llamamos a la función de la ruta
    await ws_list_players(websocket=mock_websocket, game_id=game_id, db=mock_db)

    # 3. Assert
    
    # Verificar que el juego se buscó correctamente
    mock_db.query.return_value.filter.assert_called_once()
    
    # Verificar que el cliente se conectó al manager correcto
    mock_game_manager.connect.assert_awaited_once_with(mock_websocket, game_id)
    
    # Verificar que se llamó al broadcast inicial
    mock_broadcast_lobby.assert_awaited_once_with(mock_db, game_id)
    
    # Verificar que el cliente se desconectó al final (por el side_effect)
    mock_game_manager.disconnect.assert_called_once_with(mock_websocket, game_id)


# --- Tests para ws_info_from_game ---

@patch('src.routes.websocket_routes.gameManager', new_callable=AsyncMock)
async def test_ws_info_from_game_not_found(mock_game_manager, mock_websocket, mock_db):
    """
    Testea que la conexión al juego falle si el game_id no existe.
    """
    game_id = 999
    
    # 1. Arrange: Simular que la DB no encuentra la partida
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # 2. Act
    await ws_info_from_game(websocket=mock_websocket, game_id=game_id, db=mock_db)

    # 3. Assert
    # Verificar que la conexión se cierra con el código de error
    mock_websocket.close.assert_awaited_once_with(code=4004, reason="Game not found")
    
    # Verificar que nunca se intentó conectar al manager
    mock_game_manager.connect.assert_not_awaited()

@patch('src.routes.websocket_routes.broadcast_card_draft', new_callable=AsyncMock)
@patch('src.routes.websocket_routes.broadcast_game_information', new_callable=AsyncMock)
@patch('src.routes.websocket_routes.gameManager', new_callable=AsyncMock)
async def test_ws_info_from_game_success_flow(mock_game_manager, mock_broadcast_game, mock_broadcast_draft, mock_websocket, mock_db):
    """
    Testea el flujo exitoso de un cliente conectándose a una partida en curso.
    """
    game_id = 1
    
    # 1. Arrange: Simular que la DB SÍ encuentra la partida
    mock_game = Game(game_id=game_id, name="Test Game", status="in course")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_game

    # 2. Act
    await ws_info_from_game(websocket=mock_websocket, game_id=game_id, db=mock_db)

    # 3. Assert
    
    # Verificar que el juego se buscó
    mock_db.query.return_value.filter.assert_called_once()
    
    # Verificar que el cliente se conectó al manager
    mock_game_manager.connect.assert_awaited_once_with(mock_websocket, game_id)
    
    # Verificar que se llamaron AMBOS broadcasts iniciales
    mock_broadcast_game.assert_awaited_once_with(game_id)
    mock_broadcast_draft.assert_awaited_once_with(game_id)
    
    # Verificar que el cliente se desconectó al final
    mock_game_manager.disconnect.assert_called_once_with(mock_websocket, game_id)
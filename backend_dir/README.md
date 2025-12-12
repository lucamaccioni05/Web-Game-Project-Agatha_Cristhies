# Backend - Agatha Christie's Death on the Cards API

Backend construido con FastAPI y SQLAlchemy para manejar juegos, jugadores, cartas, sets, eventos y websockets en tiempo real.

## Tecnologías

- FastAPI
- SQLAlchemy (ORM)
- Pydantic (schemas)
- WebSockets (FastAPI)
- PyTest (tests)
- CORS Middleware

## Estructura

```
backend_dir/
  create_batadase.py
  README.md
  src/
    __init__.py
    main.py
    database/
      models.py
      database.py
      services/
        services_cards.py
        services_games.py
        services_events.py
        services_websockets.py
    routes/
      games_routes.py
      players_routes.py
      cards_routes.py
      set_routes.py
      event_routes.py
      secrets_routes.py
      websocket_routes.py
      log_routes.py
    tests/
      test_games.py
      test_cards_endpoints.py
      test_websockets_routes.py
    webSocket/
      connection_manager.py
```

## Arranque rápido

- Requisitos: Python 3.11+, pip, virtualenv
- Instalar dependencias:
````sh
# Crear entorno
python -m venv .venv
source .venv/bin/activate  # en Windows: .venv\Scripts\activate

# Instalar
pip install -r requirements.txt
import "./Lobby.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import playerService from "../../services/playerService";
import type { PlayerResponse } from "../../services/playerService";
import gameService from "../../services/gameService";
import { httpServerUrl } from "../../services/config";

function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();

  const { game, player } = location.state || {};

  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [error, setError] = useState<string>("");
  const [isHost, setIsHost] = useState<boolean>(false);

  useEffect(() => {
    if (!game?.game_id) return;

    // CONSTRUCCIÓN DE LA URL WS
    const wsURL = `${httpServerUrl.replace("http", "ws")}/ws/lobby/${
      game.game_id
    }`;

    // Se crea la conexión WebSocket
    const ws = new WebSocket(wsURL);

    // La conexión se establece
    ws.onopen = () => {
      console.log("✅ Conectado al WebSocket del lobby:", wsURL);
      setError("");
    };

    // Llega un mensaje del servidor
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("MSJ WS", message);
        // Si el mensaje tiene un objeto "data" que es un string, lo parseamos también
        // Esto es común cuando un JSON anida a otro JSON como string.
        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;

        if (message.type === "players") {
          const receivedPlayers: PlayerResponse[] = dataContent;
          setPlayers(receivedPlayers);

          const currentUser = receivedPlayers.find(
            (p: PlayerResponse) => p.player_id === player.player_id
          );
          setIsHost(currentUser?.host ?? false);
        } else if (message.type === "game" || message.type === "gameUpdated") {
          const gameData = JSON.parse(message.data);
          console.log("Datos del juego parseados:", gameData);

          // iniciar
          if (gameData.status === "in course")
            navigate("/game", {
              state: { game: dataContent, player },
            });
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    // Manejo de errores
    ws.onerror = (event) => {
      console.error("❌ Error en WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    // cierre
    ws.onclose = () => {
      console.log("🔌 Conexión WebSocket cerrada.");
    };

    return () => {
      ws.close();
    };
  }, [game, player, navigate]);

  const validate = () => {
    if (players.length < (game?.min_players ?? 1)) {
      setError(
        `La partida necesita al menos ${
          game?.min_players ?? 1
        } jugadores para iniciar.`
      );
      return false;
    }
    setError("");
    return true;
  };

  const handleStartClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        await gameService.startGame(game.game_id);
        // avisar al resto que el juego cambió de estado
      } catch (err) {
        console.error("Error iniciando el juego:", err);
      }
    }
  };

  if (!players.length) return <p>Cargando jugadores...</p>;

  return (
    <div className="lobby-page">
      <h1 className="lobby-title">DEATH ON THE CARDS</h1>
      <section className="lobby-card" aria-label="Sala de espera">
        {/* Slots de jugadores */}
        <div className="lobby-slots" aria-label="Jugadores">
          {players.map((p, index) => (
            <div key={index} className="lobby-slot filled">
              <div className="player-info">
                <div className="player-name">
                  {p.name}{" "}
                  {p.host && <span className="host-badge">(HOST)</span>}
                </div>
                <div className="player-date">{p.birth_date}</div>
                <div className="player-avatar">
                  {p.avatar ? (
                    <img src={p.avatar} alt={`${p.name} avatar`} />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Acción de iniciar o mensaje de espera */}
        <div className="lobby-actions">
          {isHost ? (
            <>
              <p className={`start-error ${error ? "active" : ""}`}>
                {error || " "}
              </p>
              <button
                type="button"
                className="start-button shake"
                onClick={handleStartClick}
              >
                Iniciar
              </button>
            </>
          ) : (
            <p className="waiting-text">
              Esperando a que el anfitrión inicie la partida ...
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Lobby;

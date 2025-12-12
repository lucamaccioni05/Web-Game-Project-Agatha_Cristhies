import "./ListGames.css";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import destinations from "../../navigation/destinations";

import type { Game, GameResponse } from "../../services/gameService";
import playerService from "../../services/playerService";

export default function ListGames() {
  const [partidas, setPartidas] = useState<GameResponse[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { playerName, playerDate, playerAvatar } = location.state || {};

  useEffect(() => {
    const wsURL = "ws://localhost:8000/ws/games/availables";
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log("Conexión WebSocket establecida para la lista de partidas.");
      setError("");
    };

    ws.onmessage = (event) => {
      const updatedGames = JSON.parse(event.data);
      setPartidas(updatedGames);
    };

    ws.onerror = (event) => {
      console.error("Error en el WebSocket:", event);
      setError(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      );
    };

    ws.onclose = () => {
      console.log("Conexión WebSocket cerrada.");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleJoin = async (game: Game) => {
    if (!playerName || !playerDate) {
      setError("No se encontró información del jugador");
      return;
    }

    try {
      const newPlayer = await playerService.createPlayer({
        name: playerName,
        birth_date: playerDate,
        host: false,
        game_id: game.game_id!,
        avatar: playerAvatar,
      });

      navigate(destinations.lobby, {
        state: { game, player: newPlayer, playerAvatar },
      });
    } catch (err) {
      console.error(err);
      setError("Error al unirse a la partida");
    }
  };

  function getOrder(status: string) {
    if (status === "waiting players") return 1;
    if (status === "bootable") return 2;
    if (status === "full") return 3;
    if (status === "in course") return 4;
    return 5;
  }

  const sortedPartidas = [...partidas].sort((a, b) => {
    return getOrder(a.status) - getOrder(b.status);
  });

  function getStatusMessage(status: string) {
    switch (status) {
      case "waiting players":
        return "En espera ";
      case "bootable":
        return "En espera";
      case "full":
        return "En espera";
      case "in course":
        return "En curso";
      case "finished":
        return "Finalizada";
      default:
        return "";
    }
  }

  return (
    <div className="list-page">
      <div className="list-container">
        <h1 className="container-title">Partidas disponibles</h1>
        <p className={`list-error-message ${error ? "active" : ""}`}>{error}</p>

        <ul className="game-list">
          {sortedPartidas.map((partida) => {
            const isJoinable =
              partida.status === "waiting players" ||
              partida.status === "bootable";

            return (
              <li key={partida.game_id} className="list-item">
                <div className="side-info">
                  <div className="item-title">{partida.name}</div>
                  <div className="item-data">
                    De {partida.min_players} a {partida.max_players} jugadores.
                    Lugares disponibles:{" "}
                    {partida.max_players - partida.players_amount} <br />
                    <span
                      className={`status-message ${partida.status.replace(
                        " ",
                        "-"
                      )}`}
                    >
                      {getStatusMessage(partida.status)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  label="Unirme"
                  onClick={() => handleJoin(partida)}
                  disabled={!isJoinable}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

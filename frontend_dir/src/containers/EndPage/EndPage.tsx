import { useLocation, useNavigate } from "react-router-dom";
import type { PlayerStateResponse } from "../../services/playerService";
import type { GameResponse } from "../../services/gameService";
import "./EndPage.css";
import destinations from "../../navigation/destinations"; // Importamos destinations

export default function EndPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Leemos mensaje de juego finalizado
  const { players, game, myPlayerId } = (location.state as {
    players: PlayerStateResponse[];
    game: GameResponse;
    myPlayerId: number;
  }) ?? { players: [], game: null, myPlayerId: -1 };

  // 1. Encontrar los roles
  const murderer = players.find((p) => p.secrets.some((s) => s.murderer));
  const accomplice = players.find((p) => p.secrets.some((s) => s.accomplice));

  // 2. Determinar el resultado
  const deckRanOut = game?.cards_left === 0;
  const me = players.find((p) => p.player_id === myPlayerId);

  const iAmMurderer = me?.player_id === murderer?.player_id;
  const iAmAccomplice = me?.player_id === accomplice?.player_id;
  const iAmBadGuy = iAmMurderer || iAmAccomplice;

  let titleMessage = ""; // "¡Ganaste!" o "¡Perdiste!"
  let summaryMessage = ""; // "¡Has logrado escapar!" o "¡Te descubrieron!"
  let iAmWinner = false;

  if (deckRanOut) {
    iAmWinner = iAmBadGuy;
    titleMessage = iAmWinner ? "¡Ganaste!" : "¡Perdiste!";
    summaryMessage = iAmBadGuy
      ? "¡Has logrado escapar!"
      : "El asesino ha escapado.";
  } else {
    iAmWinner = !iAmBadGuy;
    titleMessage = iAmWinner ? "¡Ganaste!" : "¡Perdiste!";
    summaryMessage = iAmBadGuy
      ? "¡Te descubrieron!"
      : "¡El asesino ha sido descubierto!";
  }

  // --- 1. FUNCIÓN AYUDANTE ---
  // Devuelve el rol de un jugador como string
  const getPlayerRole = (player: PlayerStateResponse): string => {
    if (player.player_id === murderer?.player_id) {
      return "Asesino";
    }
    if (player.player_id === accomplice?.player_id) {
      return "Cómplice";
    }
    return "Ciudadano";
  };

  if (!game || players.length === 0) {
    // Fallback por si se llega a esta página sin estado
    return (
      <div className="end-page">
        <h1>Error al cargar resultados</h1>
        <p>No se encontró la información de fin de partida.</p>
        <button
          className="lobby-button"
          onClick={() => navigate(destinations.home)} // Usamos destinations
        >
          Volver al Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="end-page">
      <h1>Partida Finalizada</h1>
      <h2 className={`winner-message ${iAmWinner ? "win" : "lose"}`}>
        {titleMessage}
      </h2>
      <h3 className="result-summary">{summaryMessage}</h3>

      {/* --- 2. LISTA DE ROLES (REEMPLAZA A .roles-reveal) --- */}
      <div className="player-list">
        <h3>Revelación de Roles:</h3>
        <ul>
          {players.map((p) => {
            const role = getPlayerRole(p); // Obtenemos el rol
            return (
              <li key={p.player_id}>
                {/* Mostramos el nombre */}
                <span className="player-name">{p.name}</span>

                {/* Mostramos el rol con una clase CSS dinámica */}
                <span className={`player-role role-${role.toLowerCase()}`}>
                  {role}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        className="lobby-button"
        onClick={() => navigate(destinations.home)} // Usamos destinations
      >
        Volver al inicio
      </button>
    </div>
  );
}

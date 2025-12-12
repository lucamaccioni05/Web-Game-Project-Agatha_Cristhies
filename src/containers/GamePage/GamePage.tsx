import { useLocation } from "react-router-dom";
import "./GamePage.css";
import { GameProvider } from "../../context/GameContext"; // 1. Importa el Provider
import Gameboard from "./Gameboard"; // 2. Importa el nuevo componente del tablero

export default function GamePage() {
  const location = useLocation();
  const { game, player } = location.state ?? {};

  // Este chequeo de seguridad se mantiene
  if (!game || !player) {
    return (
      <div className="game-page">
        <div className="inline-error">
          Falta el contexto de la partida. Volvé al lobby e ingresá nuevamente.
        </div>
      </div>
    );
  }

  // 3. Envuelve tu lógica del juego con el Provider
  // Le pasamos el estado inicial que obtuvimos de `location`.
  return (
    <GameProvider initialGame={game} myPlayerId={player.player_id}>
      <Gameboard />
    </GameProvider>
  );
}

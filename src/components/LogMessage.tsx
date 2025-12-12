import { useGameContext, type LogEntry } from "../context/GameContext";
import "./LogMessage.css";

interface LogMessageProps {
  log: LogEntry;
}

export const LogMessage = ({ log }: LogMessageProps) => {
  const { state } = useGameContext();
  const { players } = state;

  const getPlayerName = (playerId: number): string => {
    const player = players.find((p) => p.player_id === playerId);
    return player?.name ?? `Jugador ${playerId}`;
  };

  const formatMessage = () => {
    const playerName = getPlayerName(log.player_id);
    // --- LÓGICA DE EVENTOS ---
    if (log.type === "event") {
      if (log.card_name === "Not so fast") {
        return `🚫 ${playerName} responde con "Not So Fast!".`;
      } else {
        return `⚠️ ${playerName} intenta jugar "${log.card_name}".`;
      }
    }
    if (log.type === "Set") {
      return `🧩 ${playerName} intenta jugar el set "${log.set_name}".`;
    }
    if (log.type == "TurnChange") {
      return `➡️ Es el turno de ${playerName}.`;
    }

    // Fallback por si acaso
    return `Log: ${log.type} (ID: ${log.log_id})`;
  };

  return <p className="log-message">{formatMessage()}</p>;
};

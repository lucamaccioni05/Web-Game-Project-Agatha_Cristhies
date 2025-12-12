import { useState, useEffect } from "react";
import playerService from "../../../services/playerService";
import { useGameContext } from "../../../context/GameContext";

export const useVote = () => {
  const { state } = useGameContext();
  const myId = state.myPlayerId;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const [voted, setVoted] = useState(false);

  useEffect(() => {
    // Si mi pendingAction se limpia a None o REVEAL_SECRET, limpiamos el voto.
    const playerState = state.players.find((p) => p.player_id === myId);
    if (
      playerState &&
      playerState.pending_action !== "VOTE" &&
      playerState.pending_action !== "WAITING_VOTING_TO_END"
    ) {
      sessionStorage.removeItem(`voted_${myId}`);
      setVoted(false);
    }
  }, [state.players, myId]);

  const handleVote = async (targetPlayerId: number) => {
    if (lock || voted || !myId) return;

    setLock(true);
    setMessage("");
    try {
      await playerService.votePlayer(targetPlayerId, myId);
      setVoted(true);
      sessionStorage.setItem(`voted_${myId}`, "true");
      setMessage("Voto registrado correctamente.");
      // Corregir setInterval por setTimeout para un solo mensaje
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error al votar:", error);
      setMessage("No se pudo registrar el voto.");
    } finally {
      setLock(false);
    }
  };

  return {
    lock,
    message,
    voted,
    handleVote,
  };
};

import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import playerService from "../../../services/playerService";

export const useSelectPlayerReveal = () => {
  const { state, dispatch } = useGameContext();
  const { selectedTargetPlayer } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const confirmPlayerReveal = async () => {
    if (lock || !selectedTargetPlayer) {
      setMessage("Debe seleccionar un jugador.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      await playerService.selectPlayer(selectedTargetPlayer.player_id);
      dispatch({ type: "SET_STEP", payload: "wait_reveal_secret" });
    } catch (err) {
      console.error("Error al seleccionar jugador para revelar:", err);
      setMessage("Error al seleccionar jugador. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  return { lock, message, confirmPlayerReveal };
};

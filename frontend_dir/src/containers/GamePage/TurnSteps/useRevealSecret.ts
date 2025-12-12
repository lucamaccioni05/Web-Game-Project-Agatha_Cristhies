import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import secretService from "../../../services/secretService";

export const useRevealSecret = () => {
  const { state, dispatch } = useGameContext();
  const { selectedSecret } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const revealSecret = async () => {
    if (lock) return;
    setMessage("");
    if (selectedSecret === null) {
      setMessage("Debe seleccionar un secreto para revelar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      await secretService.revealSecret(selectedSecret.secret_id);
      dispatch({ type: "SET_SELECTED_SECRET", payload: null });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    } catch (err) {
      console.error("Error al revelar secreto:", err);
      setMessage("Error al revelar secreto. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  return { lock, message, revealSecret };
};

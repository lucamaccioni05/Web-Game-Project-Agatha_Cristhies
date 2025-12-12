import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import secretService from "../../../services/secretService";

export const useHideSecret = () => {
  const { state, dispatch } = useGameContext();
  const { selectedSecret } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const hideSecret = async () => {
    if (lock) return;
    setMessage("");
    if (selectedSecret === null) {
      setMessage("Debe seleccionar un secreto para ocultar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      await secretService.hideSecret(selectedSecret.secret_id);

      dispatch({ type: "SET_SELECTED_SECRET", payload: null });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    } catch (err) {
      console.error("Error al ocultar secreto:", err);
      setMessage("Error al ocultar secreto. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  // Este paso no tiene "Cancelar", es obligatorio
  return { lock, message, hideSecret };
};

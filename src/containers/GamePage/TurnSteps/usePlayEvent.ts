import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import logService from "../../../services/logService"; // ¡Usamos el nuevo servicio!

export const usePlayEvent = () => {
  const { state, dispatch } = useGameContext();
  const { selectedCard } = state;
  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const playEvent = async () => {
    if (lock) return;
    setMessage("");
    if (!selectedCard || selectedCard.type !== "event") {
      setMessage(`Seleccione un evento valido.`);
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);

    try {
      dispatch({ type: "SET_ACTIVE_EVENT", payload: selectedCard });
      // switch para no cancelables
      switch (selectedCard.name) {
        default:
          await logService.registerCancelableEvent(selectedCard.card_id);
          dispatch({ type: "SET_STEP", payload: "wait_event_resolution" });
      }
    } catch (err) {
      console.error("Error al registrar evento:", err);
      setMessage(err instanceof Error ? err.message : "Evento inválido.");
      setTimeout(() => setMessage(""), 3000);
      dispatch({ type: "CLEAR_SELECTIONS" });
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, playEvent, cancel };
};

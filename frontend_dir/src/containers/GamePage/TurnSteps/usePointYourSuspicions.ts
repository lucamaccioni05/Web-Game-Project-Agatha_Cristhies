import { useState } from "react";
import cardService from "../../../services/cardService";
import { useGameContext } from "../../../context/GameContext";
import eventService from "../../../services/eventService";

// En usePointYourSuspicions.ts

export const usePointYourSuspicions = () => {
  const { state, dispatch } = useGameContext();
  const { activeEventCard, myPlayerId, game } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const PointYourSuspicions = async () => {
    if (lock) return;
    setMessage("");

    setLock(true);
    try {
      // 1. Iniciar la votación (backend pone pending_action: "VOTE" en todos)
      await eventService.pointYourSuspicions(game.game_id);

      // 2. Descartar la carta de evento. (Se debe hacer aquí, pues es una acción de coste)
      if (activeEventCard) {
        await cardService.discardSelectedList(myPlayerId, [
          activeEventCard.card_id,
        ]);
      }

      // 3. LIMPIAR ESTADO LOCAL DEL EVENTO JUGADO
      dispatch({ type: "SET_ACTIVE_EVENT", payload: null });

      // 4. ¡ÚLTIMO PASO! Mover el flujo a la espera.
      dispatch({ type: "SET_STEP", payload: "wait_voting_to_end" });
    } catch (err) {
      console.error("Error al ejecutar evento:", err);
      setMessage("Error al ejecutar el evento.");
      setTimeout(() => setMessage(""), 3000);

      // Si falla, limpiar todo y volver a start.
      dispatch({ type: "CLEAR_SELECTIONS" });
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, PointYourSuspicions, cancel };
};

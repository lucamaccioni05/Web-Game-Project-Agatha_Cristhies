import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import eventService from "../../../services/eventService";
// (No necesitas cardService aquí)

export const useDeadCardFolly = () => {
  const { state, dispatch } = useGameContext();
  const { game, myPlayerId, activeEventCard } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  // (He renombrado la función para que coincida con la que usas en el Step)
  const confirmDeadCardFolly = async (direction: "left" | "right") => {
    if (lock) return;

    if (!activeEventCard || !myPlayerId || !game) {
      setMessage("Error interno: Faltan datos del juego.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      // 1. Llama al backend. El backend actualiza 'game.direction_folly'
      //    Y pone 'pending_action = "SELECT_FOLLY_CARD"' a todos.
      await eventService.initiateFolly(
        myPlayerId,
        game.game_id,
        activeEventCard.card_id,
        direction
      );

      dispatch({ type: "SET_ACTIVE_EVENT", payload: null });
      dispatch({ type: "SET_STEP", payload: "draw" }); // O "discard_op" si es el final
    } catch (err) {
      console.error("Error al iniciar Dead Card Folly:", err);
      setMessage(
        err instanceof Error
          ? err.message
          : "Error al iniciar Folly. Intenta de nuevo."
      );
      dispatch({ type: "CLEAR_SELECTIONS" }); // Resetea si falla
    } finally {
      setLock(false);
    }
  };

  return { lock, message, confirmDeadCardFolly };
};

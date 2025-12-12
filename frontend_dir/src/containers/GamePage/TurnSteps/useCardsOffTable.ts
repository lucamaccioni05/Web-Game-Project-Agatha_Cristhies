import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";
import eventService from "../../../services/eventService";

export const useCardsOffTable = () => {
  const { state, dispatch } = useGameContext();
  const { selectedTargetPlayer, activeEventCard, myPlayerId } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const cardsOffTheTable = async () => {
    if (lock) return;
    setMessage("");

    if (!selectedTargetPlayer || !activeEventCard) {
      setMessage("Debe seleccionar un jugador.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await eventService.cardsOffTheTable(selectedTargetPlayer.player_id);
      await cardService.discardSelectedList(myPlayerId, [
        activeEventCard.card_id,
      ]);
      setMessage("Cartas 'Not So Fast' eliminadas correctamente.");

      dispatch({ type: "CLEAR_SELECTIONS" });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    } catch (err) {
      console.error("Error al ejecutar Cards Off The Table:", err);
      const errorMessage =
        (err as any).response?.data?.message ||
        (err as Error).message ||
        "Error desconocido al ejecutar el evento.";
      setMessage(`Error: ${errorMessage}`);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, cardsOffTheTable, cancel, setMessage };
};

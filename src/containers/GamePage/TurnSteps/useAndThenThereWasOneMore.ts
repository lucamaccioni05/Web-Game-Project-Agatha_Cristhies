import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";
import eventService from "../../../services/eventService";

export const useAndThenThereWasOneMore = () => {
  const { state, dispatch } = useGameContext();
  const { selectedTargetPlayer, selectedSecret, activeEventCard, myPlayerId } =
    state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const andThenThereWasOneMore = async () => {
    if (lock) return;
    setMessage("");

    if (!selectedSecret) {
      setMessage("Debe seleccionar un secreto.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!selectedTargetPlayer) {
      setMessage("Debe seleccionar un jugador.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!selectedSecret.revelated) {
      setMessage("Solo puede ocultar secretos revelados.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLock(true);
    try {
      await eventService.andThenThereWasOneMore(
        selectedTargetPlayer.player_id,
        selectedSecret.secret_id
      );

      if (activeEventCard) {
        await cardService.discardSelectedList(myPlayerId, [
          activeEventCard.card_id,
        ]);
      }
      setMessage("Evento ejecutado exitosamente.");
      setTimeout(() => {
        dispatch({ type: "CLEAR_SELECTIONS" });
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }, 2000);
    } catch (err) {
      console.error("Error al ejecutar evento:", err);
      setMessage("Error al ejecutar el evento.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, andThenThereWasOneMore, cancel };
};

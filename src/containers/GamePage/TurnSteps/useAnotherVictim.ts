import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import setService, { type SetResponse } from "../../../services/setService";
import cardService from "../../../services/cardService";

export const useAnotherVictim = () => {
  const { state, dispatch } = useGameContext();
  // El 'activeEventCard' lo leemos del context
  const { selectedSet, activeEventCard, myPlayerId } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const stealSet = async () => {
    if (lock) return;
    setMessage("");
    if (!selectedSet || !activeEventCard) {
      setMessage("Debe seleccionar un set para robar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      const stolenSet: SetResponse = await setService.stealSet(
        myPlayerId,
        selectedSet.set_id
      );
      await cardService.discardSelectedList(myPlayerId, [
        activeEventCard.card_id,
      ]);

      dispatch({ type: "CLEAR_SELECTIONS" }); // Limpia todo

      if (!stolenSet) {
        dispatch({ type: "SET_STEP", payload: "discard_op" });
        return;
      }
      // Avanzamos al paso de acción del set robado
      switch (stolenSet.name) {
        case "Hercule Poirot":
        case "Miss Marple":
          dispatch({ type: "SET_STEP", payload: "sel_reveal_secret" });
          break;
        case "Mr Satterthwaite":
        case "Lady Eileen 'Bundle' Brent":
        case "Tommy Beresford":
        case "Tuppence Beresford":
        case "Beresford brothers":
          dispatch({ type: "SET_STEP", payload: "sel_player_reveal" });
          break;
        case "Parker Pyne":
          dispatch({ type: "SET_STEP", payload: "sel_hide_secret" });
          break;
        default:
          dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    } catch (err) {
      console.error("Error al robar set:", err);
      setMessage("Error al robar set. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
      dispatch({ type: "CLEAR_SELECTIONS" }); // Volver a 'start'
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, stealSet, cancel };
};

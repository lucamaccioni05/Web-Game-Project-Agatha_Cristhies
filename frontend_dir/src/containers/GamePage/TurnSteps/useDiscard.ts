import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";

export const useDiscard = () => {
  const { state, dispatch, isSocialDisgrace } = useGameContext();
  const { selectedCardIds, myPlayerId } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const discardSelected = async () => {
    if (lock) return;
    if (!selectedCardIds || selectedCardIds.length === 0) {
      setMessage("No seleccionaste ninguna carta.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      await cardService.discardSelectedList(myPlayerId, selectedCardIds);
      dispatch({ type: "SET_SELECTED_CARD", payload: null }); // Limpia selección
      dispatch({ type: "SET_STEP", payload: "draw" }); // Avanza a robar
    } catch (err) {
      console.error("Error al descartar cartas seleccionadas:", err);
      setMessage("Error al descartar cartas seleccionadas. Intenta de nuevo.");
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    // Solo puedes volver si NO estás en desgracia social
    if (!isSocialDisgrace) {
      dispatch({ type: "CLEAR_SELECTIONS" }); // Vuelve a 'start'
    }
  };

  const skipDiscard = () => {
    // Si 'discard_op', puedes saltear
    dispatch({ type: "SET_STEP", payload: "draw" });
  };

  return { lock, message, discardSelected, cancel, skipDiscard };
};

import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";

export const useLookIntoAshes = () => {
  const { state, dispatch } = useGameContext();
  const { selectedCard, activeEventCard, myPlayerId, discardPile } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const pickUpFromDiscard = async () => {
    if (lock) return;
    setMessage("");
    if (!selectedCard || !activeEventCard) {
      setMessage("Debe seleccionar una carta del descarte.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      // 1. Robar del descarte
      await cardService.pickUpFromDiscard(myPlayerId, selectedCard.card_id);
      // 2. Descartar el evento
      await cardService.discardSelectedList(myPlayerId, [
        activeEventCard.card_id,
      ]);

      // 3. Limpiar y avanzar
      dispatch({ type: "CLEAR_SELECTIONS" });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    } catch (err) {
      console.error("Error al robar del descarte:", err);
      setMessage("Error al robar del descarte. Intenta de nuevo.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  /**
   * Maneja la selección de una carta del descarte.
   * Guarda la carta en 'selectedCard' en el contexto.
   */
  const handleDiscardCardSelect = (clickedCardId: number) => {
    const card = discardPile.find((c) => c.card_id === clickedCardId) ?? null;
    if (!card) return;

    // Si la carta ya está seleccionada, la deselecciona, si no, la selecciona.
    const newValue =
      selectedCard && selectedCard.card_id === card.card_id ? null : card;
    dispatch({ type: "SET_SELECTED_CARD", payload: newValue });
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, pickUpFromDiscard, handleDiscardCardSelect, cancel };
};

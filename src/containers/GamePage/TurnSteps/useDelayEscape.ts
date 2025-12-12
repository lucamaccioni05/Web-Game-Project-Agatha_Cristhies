import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";
import eventService from "../../../services/eventService";

export const useDelayEscape = () => {
  const { state, dispatch } = useGameContext();
  const { game, activeEventCard, myPlayerId, discardPile } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");
  // Este estado es local para este paso
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<number[]>([]);

  const delayEscape = async () => {
    if (lock || !activeEventCard) return;
    if (
      !selectedDiscardIds ||
      selectedDiscardIds.length === 0 ||
      selectedDiscardIds.length > 5
    ) {
      setMessage("Debes seleccionar entre 1 y 5 cartas del descarte.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    setMessage("Devolviendo cartas al mazo...");
    try {
      await eventService.delayEscape(
        game.game_id,
        myPlayerId,
        selectedDiscardIds
      );
      await cardService.discardSelectedList(myPlayerId, [
        activeEventCard.card_id,
      ]);
      setMessage("¡Cartas devueltas al mazo! Evento retirado.");
      setTimeout(() => {
        dispatch({ type: "CLEAR_SELECTIONS" });
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }, 2000);
    } catch (err) {
      console.error("Error en Delay Escape:", err);
      setMessage(
        err instanceof Error
          ? err.message
          : "Error desconocido al ejecutar Delay Escape."
      );
    } finally {
      // Limpieza local
      setSelectedDiscardIds([]);
      setLock(false);
    }
  };

  /**
   * Maneja la selección MÚLTIPLE de cartas del descarte.
   */
  const handleDiscardCardSelect = (clickedCardId: number) => {
    const card = discardPile.find((c) => c.card_id === clickedCardId) ?? null;
    if (!card) return;

    setSelectedDiscardIds((prevIds: number[]) => {
      if (prevIds.includes(clickedCardId)) {
        return prevIds.filter((id) => id !== clickedCardId);
      } else if (prevIds.length < 5) {
        return [...prevIds, clickedCardId];
      }
      return prevIds; // No hacer nada si ya hay 5
    });
    // Limpiamos la selección global por si acaso
    dispatch({ type: "SET_SELECTED_CARD", payload: null });
  };

  const cancel = () => {
    setSelectedDiscardIds([]);
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return {
    lock,
    message,
    selectedDiscardIds,
    delayEscape,
    handleDiscardCardSelect,
    cancel,
  };
};

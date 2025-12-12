import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";
import gameService from "../../../services/gameService";

export const useDraw = () => {
  const { state, dispatch, currentPlayer } = useGameContext();
  const { game, selectedCard, myPlayerId } = state;

  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");

  const cardCount = currentPlayer?.cards.length ?? 0;

  const drawFromDeck = async () => {
    setDrawing(true);
    try {
      await cardService.drawCard(myPlayerId, game.game_id);
      // El WS se encarga de actualizar la mano
    } catch (err) {
      console.error("Error al robar carta:", err);
      alert("Error al robar carta. Intenta de nuevo.");
    }
    setDrawing(false);
    // Nota: El turno no termina hasta que el jugador tenga 6 cartas
  };

  const drawDraft = async () => {
    if (drawing || !selectedCard) return;
    setDrawing(true);
    try {
      await cardService.pickUpDraftCard(
        game.game_id,
        selectedCard.card_id,
        myPlayerId
      );
      dispatch({ type: "SET_SELECTED_CARD", payload: null });
      // El WS se encarga de actualizar la mano y el draft
    } catch (err) {
      console.error("Error al robar del draft:", err);
      alert("Error al robar la carta del draft. Intenta de nuevo.");
    } finally {
      setDrawing(false);
    }
  };

  const endTurn = async () => {
    try {
      await gameService.updateTurn(game.game_id);
    } catch (err) {
      console.error("Error al finalizar el turno:", err);
      setMessage("Error al finalizar turno. Intenta de nuevo.");
    }
  };

  return { drawing, message, cardCount, drawFromDeck, drawDraft, endTurn };
};

import { useEffect, useState, useCallback } from "react"; // <-- 1. Importa useCallback
import { useGameContext } from "../../../context/GameContext";
import cardService from "../../../services/cardService";
import eventService from "../../../services/eventService";
import { usePrevious } from "../../../hooks/usePrevious";

const RESPONSE_WINDOW_MS = 5000;

export const useWaitEventResolution = () => {
  const { state, dispatch } = useGameContext();
  const { activeEventCard, lastCancelableEvent, myPlayerId, game } = state;

  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const prevLastEvent = usePrevious(lastCancelableEvent);

  const resolveEventStack = useCallback(async () => {
    if (!activeEventCard) {
      console.error("No hay evento activo para resolver.");
      dispatch({ type: "SET_STEP", payload: "discard_op" });
      return;
    }

    try {
      const resolvedCard = await eventService.countNSF(game.game_id);

      if (resolvedCard.card_id !== activeEventCard.card_id) {
        console.log(`Evento "${activeEventCard.name}" fue cancelado por NSF.`);
      } else {
        console.log(`Evento "${activeEventCard.name}" se resuelve.`);
        switch (activeEventCard.name) {
          case "Card trade":
            dispatch({ type: "SET_STEP", payload: "card_trade" });
            return; // Salimos antes de registrarlo
          case "Point your suspicions":
            dispatch({ type: "SET_STEP", payload: "point_your_suspicions" });
            return;
          case "Another Victim":
            dispatch({ type: "SET_STEP", payload: "another_victim" });
            return;
          case "Look into the ashes":
            dispatch({ type: "SET_STEP", payload: "look_into_the_ashes" });
            return;
          case "Cards off the table":
            dispatch({ type: "SET_STEP", payload: "cards_off_the_table" });
            return;
          case "And then there was one more...":
            dispatch({
              type: "SET_STEP",
              payload: "and_then_there_was_one_more",
            });
            return;
          case "Delay the murderer's escape!":
            dispatch({ type: "SET_STEP", payload: "delay_escape_selection" });
            return;
          case "Early train to paddington":
            await eventService.earlyTrainPaddington(game.game_id, myPlayerId);
            break;
          case "Dead card folly":
            dispatch({ type: "SET_STEP", payload: "dead_card_folly" });
            return;
          default:
            break;
        }
      }

      await cardService.discardSelectedList(myPlayerId, [
        activeEventCard.card_id,
      ]);
      dispatch({ type: "SET_ACTIVE_EVENT", payload: null });
      dispatch({ type: "SET_SELECTED_CARD", payload: null });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    } catch (err) {
      console.error("Error al resolver la pila de eventos:", err);
      dispatch({ type: "SET_ACTIVE_EVENT", payload: null });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    }
  }, [activeEventCard, game, myPlayerId, dispatch]);

  useEffect(() => {
    if (
      lastCancelableEvent &&
      prevLastEvent?.log_id !== lastCancelableEvent.log_id
    ) {
      console.log("Not So Fast! detectado. Reiniciando timer.");
      if (timerId) clearTimeout(timerId);
      const newTimerId = setTimeout(resolveEventStack, RESPONSE_WINDOW_MS);
      setTimerId(newTimerId);
    }
  }, [lastCancelableEvent, prevLastEvent, timerId, resolveEventStack]);

  useEffect(() => {
    console.log(
      `Iniciando timer de ${RESPONSE_WINDOW_MS}ms para ${activeEventCard?.name}`
    );
    const newTimerId = setTimeout(resolveEventStack, RESPONSE_WINDOW_MS);
    setTimerId(newTimerId);

    return () => {
      if (newTimerId) clearTimeout(newTimerId);
    };
  }, [activeEventCard?.name, resolveEventStack]);
};

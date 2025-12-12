import { useEffect } from "react";
import { useGameContext } from "../../../context/GameContext";
import { usePrevious } from "../../../hooks/usePrevious";

export const useWaitTrade = () => {
  const { state, dispatch, isMyTurn, currentPlayer } = useGameContext();
  const { currentStep } = state;
  const pendingAction = currentPlayer?.pending_action;
  const prevPendingAction = usePrevious(pendingAction);

  useEffect(() => {
    // Si no es mi turno o no estamos en este paso, no hacemos nada
    if (!isMyTurn || currentStep !== "wait_trade") {
      return;
    }

    if (
      prevPendingAction === "SELECT_TRADE_CARD" ||
      prevPendingAction === "WAITING_FOR_TRADE_PARTNER"
    ) {
      if (pendingAction === null || pendingAction === undefined) {
        console.log(
          "Trade completado (detectado por hook). Avanzando a 'discard_op'."
        );
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    }
  }, [isMyTurn, currentStep, pendingAction, prevPendingAction, dispatch]);
};

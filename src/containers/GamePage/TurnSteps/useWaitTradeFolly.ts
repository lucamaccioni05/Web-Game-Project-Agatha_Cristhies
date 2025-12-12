// En: ./TurnSteps/useWaitTradeFolly.ts
import { useEffect, useMemo } from "react";
import { useGameContext } from "../../../context/GameContext";
import { usePrevious } from "../../../hooks/usePrevious"; // (Ajusta la ruta si es necesario)

export const useWaitTradeFolly = () => {
  const { state, dispatch, isMyTurn } = useGameContext();
  const { players, currentStep } = state;

  // 1. Determinamos si "alguien" todavía está ocupado con el Folly
  const isWaitingOnFolly = useMemo(() => {
    // Estamos esperando si CUALQUIER jugador (incluyéndote a ti)
    // todavía tiene una de estas acciones pendientes.
    return players.some(
      (p) =>
        p.pending_action === "SELECT_FOLLY_CARD" ||
        p.pending_action === "WAITING_FOR_FOLLY_TRADE"
    );
  }, [players]);

  // 2. Obtenemos el estado de espera del render anterior
  const prevIsWaitingOnFolly = usePrevious(isWaitingOnFolly);

  // 3. El Effect "listener"
  useEffect(() => {
    if (currentStep !== "wait_trade_folly") {
      return;
    }
    if (prevIsWaitingOnFolly === true && isWaitingOnFolly === false) {
      console.log(
        "Dead Card Folly completado por todos los jugadores. Avanzando turno."
      );

      // 5. ...entonces, solo si era mi turno, avanzo mi
      //    propio 'step' al siguiente paso (Robar).
      if (isMyTurn) {
        dispatch({ type: "SET_STEP", payload: "draw" }); // O "discard_op"
      }
    }
  }, [currentStep, isWaitingOnFolly, prevIsWaitingOnFolly, isMyTurn, dispatch]);

  // Este hook no devuelve nada, solo ejecuta su 'useEffect'
};

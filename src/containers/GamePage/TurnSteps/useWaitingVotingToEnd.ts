import { useEffect } from "react";
import { useGameContext } from "../../../context/GameContext";
import { usePrevious } from "../../../hooks/usePrevious";

export const useWaitingVotingToEnd = () => {
  const { state, dispatch, isMyTurn } = useGameContext();
  const { currentStep, players } = state;

  // 1. Obtenemos el jugador activo (para obtener su pendingAction)
  const currentPlayer = players.find((p) => p.player_id === state.myPlayerId);
  const pendingAction = currentPlayer?.pending_action;

  // 2. Obtenemos el pendingAction anterior
  const prevPendingAction = usePrevious(pendingAction);

  useEffect(() => {
    // Solo me interesa esta lógica si soy el jugador activo y estoy en el paso de espera.
    if (!isMyTurn || currentStep !== "wait_voting_to_end") {
      return;
    }
    if (pendingAction !== "VOTE" && pendingAction !== "WAITING_VOTING_TO_END") {
      console.log("Votación finalizada (Jugador activo). Avanzando.");
      if (pendingAction === "REVEAL_SECRET") {
        console.log(
          "Turno se detiene. Esperando revelación forzada del ganador."
        );
      } else {
        // Si perdiste o todo terminó, voy a descarte.
        dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    }
  }, [isMyTurn, currentStep, pendingAction, prevPendingAction, dispatch]);
};

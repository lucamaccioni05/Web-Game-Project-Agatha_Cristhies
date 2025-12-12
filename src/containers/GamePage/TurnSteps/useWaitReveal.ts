import { useEffect, useMemo } from "react";
import { useGameContext } from "../../../context/GameContext";
import { usePrevious } from "../../../hooks/usePrevious";

/**
 * Este hook no devuelve nada. Su único trabajo es ejecutar un efecto
 * que "escuche" los cambios en el estado 'players' (que viene por WS)
 * para saber cuándo el oponente ha terminado de actuar.
 */
export const useWaitReveal = () => {
  const { state, dispatch } = useGameContext();
  const { players, currentStep, myPlayerId } = state;

  const isWaitingForReveal = useMemo(() => {
    // Esto ahora funciona porque 'myPlayerId' está definido
    return players.some(
      (p) => p.player_id !== myPlayerId && p.pending_action === "REVEAL_SECRET"
    );
  }, [players, myPlayerId]);

  const prevIsWaitingForReveal = usePrevious(isWaitingForReveal);

  useEffect(() => {
    // Solo nos importa la lógica si estamos en el paso de espera
    if (currentStep !== "wait_reveal_secret") {
      return;
    }

    if (prevIsWaitingForReveal === true && isWaitingForReveal === false) {
      console.log(
        "Revelación completada (detectada por useWaitReveal). Avanzando a 'discard_op'."
      );

      dispatch({ type: "SET_SELECTED_TARGET_PLAYER", payload: null });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    }
  }, [currentStep, isWaitingForReveal, prevIsWaitingForReveal, dispatch]);

  // Este hook no necesita devolver nada a la UI
};

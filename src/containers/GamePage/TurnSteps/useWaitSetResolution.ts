import { useEffect, useState, useCallback } from "react";
import { useGameContext } from "../../../context/GameContext";
import eventService from "../../../services/eventService";
// (No necesitas setService aquí, solo eventService para 'count')
import { usePrevious } from "../../../hooks/usePrevious"; // (Necesitas este hook)

const RESPONSE_WINDOW_MS = 5000; // 5 segundos

export const useWaitSetResolution = () => {
  const { state, dispatch } = useGameContext();

  const { activeSet, lastCancelableEvent, game } = state;

  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const prevLastEvent = usePrevious(lastCancelableEvent);

  const resolveSetStack = useCallback(async () => {
    // ¡Comprueba 'activeSet'!
    if (!activeSet || !game) {
      console.error("No hay set activo o juego para resolver.");
      dispatch({ type: "SET_STEP", payload: "discard_op" });
      return;
    }

    try {
      // 2. Llama al mismo endpoint 'count'
      // (¡ADVERTENCIA! Tu 'eventService.ts' dice que esto devuelve
      // CardResponse, pero tu backend devuelve SetResponse si no se cancela.
      // Usamos 'any' para evitar un error de TypeScript aquí.)
      const resolvedItem: any = await eventService.countNSF(game.game_id);

      // 3. Comparamos si la carta devuelta es el set original
      //    (Si NO es un NSF, tu backend devuelve el 'target_item', que es el Set)
      if (resolvedItem.set_id === activeSet.set_id) {
        // ¡El Set SE EJECUTA!
        console.log(`Set "${activeSet.name}" se resuelve.`);

        // ¡Aquí va la lógica del 'switch' de tu 'usePlaySet.ts' original!
        switch (activeSet.name) {
          case "Hercule Poirot":
          case "Miss Marple":
            dispatch({ type: "SET_STEP", payload: "sel_reveal_secret" });
            break; // Avanza al 'finally'
          case "Mr Satterthwaite":
          case "Lady Eileen 'Bundle' Brent":
          case "Tommy Beresford":
          case "Tuppence Beresford":
          case "Beresford brothers":
            dispatch({ type: "SET_STEP", payload: "sel_player_reveal" });
            break; // Avanza al 'finally'
          case "Parker Pyne":
            dispatch({ type: "SET_STEP", payload: "sel_hide_secret" });
            break; // Avanza al 'finally'
          default:
            // Set sin acción (ej. Ariadne Oliver)
            dispatch({ type: "SET_ACTIVE_SET", payload: null }); // Limpia
            dispatch({ type: "SET_STEP", payload: "discard_op" });
            return; // Salimos
        }
      } else {
        // ¡El Set FUE CANCELADO!
        console.log(`Efecto del set "${activeSet.name}" cancelado por NSF.`);

        // Limpiamos y avanzamos a descarte
        dispatch({ type: "SET_ACTIVE_SET", payload: null });
        dispatch({ type: "SET_STEP", payload: "discard_op" });
        return; // Salimos
      }
    } catch (err) {
      console.error("Error al resolver la pila de sets:", err);
      dispatch({ type: "SET_ACTIVE_SET", payload: null });
      dispatch({ type: "SET_STEP", payload: "discard_op" });
    }
    dispatch({ type: "SET_ACTIVE_SET", payload: null });
  }, [activeSet, game, dispatch]); // Dependencias de la función

  // --- 2. Lógica del Timer (Idéntica a la de Eventos) ---

  // Efecto 1: Reinicia el timer si alguien juega un NSF
  useEffect(() => {
    if (
      lastCancelableEvent &&
      prevLastEvent?.log_id !== lastCancelableEvent.log_id
    ) {
      console.log("NSF detectado. Reiniciando timer.");
      if (timerId) clearTimeout(timerId);
      const newTimerId = setTimeout(resolveSetStack, RESPONSE_WINDOW_MS);
      setTimerId(newTimerId);
    }
  }, [lastCancelableEvent, prevLastEvent, timerId, resolveSetStack]);

  // Efecto 2: Inicia el timer cuando entramos al paso
  useEffect(() => {
    console.log(
      `Iniciando timer de ${RESPONSE_WINDOW_MS}ms para ${activeSet?.name}`
    );
    const newTimerId = setTimeout(resolveSetStack, RESPONSE_WINDOW_MS);
    setTimerId(newTimerId);

    return () => {
      if (newTimerId) clearTimeout(newTimerId);
    };
  }, [activeSet?.name, resolveSetStack]);

  // Este hook no devuelve nada, solo ejecuta su efecto
};

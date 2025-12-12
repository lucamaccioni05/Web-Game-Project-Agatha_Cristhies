import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import setService, { type SetResponse } from "../../../services/setService";
import logService from "../../../services/logService";

export const usePlaySet = () => {
  const { state, dispatch } = useGameContext();
  const { selectedCardIds } = state;

  // El estado local (lock, message) ahora vive aquí
  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const playSet = async () => {
    if (lock) return;
    setMessage("");

    if (!selectedCardIds || selectedCardIds.length < 2) {
      setMessage("Seleccione un set válido");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);
    try {
      // 1. Jugamos el set (el backend lo crea en la BD)
      let playedSet: SetResponse | null = null;
      if (selectedCardIds.length === 2) {
        playedSet = await setService.playSet2(
          selectedCardIds[0],
          selectedCardIds[1]
        );
      } else {
        playedSet = await setService.playSet3(
          selectedCardIds[0],
          selectedCardIds[1],
          selectedCardIds[2]
        );
      }

      if (!playedSet) {
        throw new Error("Set inválido.");
      }
      dispatch({ type: "SET_ACTIVE_SET", payload: playedSet });
      // switch para no cancelables
      switch (playedSet.name) {
        default:
          await logService.registerCancelableSet(playedSet.set_id);
          dispatch({ type: "SET_STEP", payload: "wait_set_resolution" });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Set inválido.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, playSet, cancel };
};

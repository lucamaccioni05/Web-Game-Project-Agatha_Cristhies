import { useState } from "react";
import { useGameContext } from "../../../context/GameContext";
import setService, { type SetResponse } from "../../../services/setService";

export const useAddDetective = () => {
  const { state, dispatch } = useGameContext();
  const { selectedCard, selectedSet } = state;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const addDetective = async () => {
    if (lock) return;
    setMessage("");

    if (!selectedCard || !selectedSet) {
      setMessage("Seleccione un detective válido");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLock(true);

    console.log("Card ID a añadir:", selectedCard.card_id, selectedCard.name);
    console.log("Set ID objetivo:", selectedSet.set_id, selectedSet.name);

    let boostedSet: SetResponse | null = null;
    try {
      boostedSet = await setService.addDetective(
        selectedCard.card_id,
        selectedSet.set_id
      );
      setMessage("");

      // Limpiamos la selección
      dispatch({ type: "SET_SELECTED_CARD", payload: null });
      dispatch({ type: "SET_SELECTED_SET", payload: null });

      if (!boostedSet) {
        dispatch({ type: "SET_STEP", payload: "discard_op" });
        return;
      }

      switch (boostedSet.name) {
        case "Hercule Poirot":
        case "Miss Marple":
          dispatch({ type: "SET_STEP", payload: "sel_reveal_secret" });
          break;
        case "Mr Satterthwaite":
        case "Lady Eileen 'Bundle' Brent":
        case "Tommy Beresford":
        case "Tuppence Beresford":
        case "Beresford brothers":
          dispatch({ type: "SET_STEP", payload: "sel_player_reveal" });
          break;
        case "Parker Pyne":
          dispatch({ type: "SET_STEP", payload: "sel_hide_secret" });
          break;
        default:
          dispatch({ type: "SET_STEP", payload: "discard_op" });
      }
    } catch (err) {
      setMessage("Detective inválido. Elija otro");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLock(false);
    }
  };

  const cancel = () => {
    dispatch({ type: "CLEAR_SELECTIONS" });
  };

  return { lock, message, addDetective, cancel };
};

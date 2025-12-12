import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useAnotherVictim } from "./useAnotherVictim";

export const AnotherVictimStep = () => {
  const { lock, message, stealSet, cancel } = useAnotherVictim();
  const { state } = useGameContext();
  const { selectedSet } = state; // Para deshabilitar el botón

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione un set para robar"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={stealSet}
          disabled={lock || !selectedSet}
        >
          {lock ? "Robando..." : "Robar"}
        </button>
        <button className="action-button" onClick={cancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

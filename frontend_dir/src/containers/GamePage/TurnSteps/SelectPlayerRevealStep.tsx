import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useSelectPlayerReveal } from "./useSelectPlayerReveal";

export const SelectPlayerRevealStep = () => {
  const { lock, message, confirmPlayerReveal } = useSelectPlayerReveal();
  const { state } = useGameContext();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione un jugador para que revele un secreto"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={confirmPlayerReveal}
          disabled={lock || !state.selectedTargetPlayer}
        >
          {lock ? "Seleccionando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
};

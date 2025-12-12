import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useHideSecret } from "./useHideSecret";

export const HideSecretStep = () => {
  const { lock, message, hideSecret } = useHideSecret();
  const { state } = useGameContext();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione un secreto para ocultar"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={hideSecret}
          disabled={lock || !state.selectedSecret}
        >
          {lock ? "Ocultando..." : "Ocultar"}
        </button>
      </div>
    </div>
  );
};

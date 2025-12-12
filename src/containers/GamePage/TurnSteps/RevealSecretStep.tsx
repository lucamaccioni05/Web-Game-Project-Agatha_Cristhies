import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useRevealSecret } from "./useRevealSecret";

export const RevealSecretStep = () => {
  const { lock, message, revealSecret } = useRevealSecret();
  const { state } = useGameContext();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione un secreto para revelar"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={revealSecret}
          disabled={lock || !state.selectedSecret}
        >
          {lock ? "Revelando..." : "Revelar"}
        </button>
      </div>
    </div>
  );
};

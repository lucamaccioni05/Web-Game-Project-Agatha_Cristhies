import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useDiscard } from "./useDiscard";

export const DiscardStep = () => {
  const { state, isSocialDisgrace } = useGameContext();
  const { currentStep } = state;
  const { lock, message, discardSelected, cancel, skipDiscard } = useDiscard();

  const isSkipStep = currentStep === "discard_skip";

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}

      {isSkipStep ? (
        <TextType
          text={["Debes descartar una o más cartas"]}
          typingSpeed={40}
          key="social-disgrace-discard"
        />
      ) : (
        <TextType
          text={["Selecciona una o más cartas para descartar"]}
          typingSpeed={50}
        />
      )}

      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={discardSelected}
          disabled={lock}
        >
          {lock ? "Descartando..." : "Descartar Selección"}
        </button>

        {/* El botón 'Volver' o 'No Descartar' depende del paso */}
        {isSkipStep ? (
          !isSocialDisgrace && (
            <button className="action-button" onClick={cancel}>
              Volver
            </button>
          )
        ) : (
          <button className="action-button" onClick={skipDiscard}>
            No Descartar
          </button>
        )}
      </div>
    </div>
  );
};

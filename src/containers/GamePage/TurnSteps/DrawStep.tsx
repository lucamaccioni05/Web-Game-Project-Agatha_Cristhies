import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useDraw } from "./useDraw";

export const DrawStep = () => {
  const { drawing, message, cardCount, drawFromDeck, drawDraft, endTurn } =
    useDraw();
  const { state } = useGameContext();
  const { selectedCard } = state; // Para deshabilitar el botón de draft

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}

      {cardCount < 6 ? (
        <>
          <TextType
            className="menu-indications"
            text={["Elige de dónde robar"]}
            typingSpeed={35}
          />
          <div className="action-buttons-group">
            <button
              className="action-button"
              onClick={drawFromDeck}
              disabled={drawing}
            >
              Robar Mazo Principal
            </button>
            <button
              className="action-button"
              onClick={drawDraft}
              disabled={drawing || !selectedCard}
            >
              Robar Mazo Draft
            </button>
          </div>
        </>
      ) : (
        <button className="action-button" onClick={endTurn}>
          Finalizar Turno
        </button>
      )}
    </div>
  );
};

import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useDelayEscape } from "./useDelayEscape";
import Detective from "../../../components/Cards/Detectives";
import Event from "../../../components/Cards/Events";

export const DelayEscapeStep = () => {
  const {
    lock,
    message,
    selectedDiscardIds,
    delayEscape,
    handleDiscardCardSelect,
    cancel,
  } = useDelayEscape();
  const { state } = useGameContext();
  const { discardPile } = state;

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Selecciona hasta 5 cartas del descarte para devolver al mazo."]}
        typingSpeed={35}
      />
      <div className="discard-preview visible">
        {discardPile.map((card) => (
          <div
            key={card.card_id}
            className={`card-container ${
              selectedDiscardIds.includes(card.card_id) ? "isSelected" : ""
            }`}
            onClick={() => handleDiscardCardSelect(card.card_id)}
          >
            {card.type === "detective" ? (
              <Detective
                card_id={card.card_id}
                shown={true}
                size="medium"
                name={card.name}
              />
            ) : (
              <Event
                card_id={card.card_id}
                shown={true}
                size="medium"
                name={card.name}
              />
            )}
          </div>
        ))}
      </div>
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={delayEscape}
          disabled={lock || selectedDiscardIds.length === 0}
        >
          {lock
            ? "Procesando..."
            : `Devolver ${selectedDiscardIds.length} Cartas`}
        </button>
        <button className="action-button" onClick={cancel} disabled={lock}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

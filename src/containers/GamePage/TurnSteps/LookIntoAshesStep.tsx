import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useLookIntoAshes } from "./useLookIntoAshes";
import Detective from "../../../components/Cards/Detectives";
import Event from "../../../components/Cards/Events";

export const LookIntoAshesStep = () => {
  const { lock, message, pickUpFromDiscard, handleDiscardCardSelect, cancel } =
    useLookIntoAshes();
  const { state } = useGameContext();
  const { discardPile, selectedCard } = state;

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-inducations"
        text={["Seleccione la carta a robar."]}
        typingSpeed={35}
      />
      <div className="discard-preview visible">
        {discardPile.map((card) => (
          <div
            key={card.card_id}
            className={`card-container ${
              selectedCard?.card_id === card.card_id ? "isSelected" : ""
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
          onClick={pickUpFromDiscard}
          disabled={lock || !selectedCard}
        >
          {lock ? "Robando..." : "Robar Carta"}
        </button>
        <button className="action-button" onClick={cancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

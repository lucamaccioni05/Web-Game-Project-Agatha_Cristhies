import { useState } from "react";
import "./DraftPile.css";
import type { CardResponse } from "../services/cardService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";
import Button from "./Button";

interface DraftPileProps {
  cards: CardResponse[];
  selectedCard: CardResponse | null;
  onCardSelect: (card: CardResponse) => void;
  isMyTurn: boolean;
}

export default function DraftPile({
  cards,
  selectedCard,
  onCardSelect,
  isMyTurn,
}: DraftPileProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const cardSize = isExpanded ? "large" : "medium";

  return (
    <div className="draft-pile-wrapper">
      {/* El botón "Ver Draft" ahora está a la izquierda y solo se muestra si no está expandido */}
      {!isExpanded && (
        <div className="draft-toggle-button-container">
          <Button label="Ver Draft" onClick={toggleExpansion} />
        </div>
      )}

      {/* Contenedor principal que se convierte en modal */}
      <div
        className={`draft-pile-container ${isExpanded ? "expanded-mode" : ""}`}
      >
        <div className={`draft-pile ${isExpanded ? "expanded" : ""}`}>
          {cards.length > 0
            ? cards.map((card) => {
                const isSelected = card.card_id === selectedCard?.card_id;
                return (
                  <div
                    key={card.card_id}
                    className={`draft-card-container ${
                      isMyTurn ? "clickable" : ""
                    } ${isSelected ? "selected" : ""}`}
                    onClick={() => isMyTurn && onCardSelect(card)}
                  >
                    {card.type === "detective" ? (
                      <Detective
                        card_id={card.card_id}
                        shown={true}
                        size={cardSize}
                        name={card.name}
                      />
                    ) : (
                      <Event
                        card_id={card.card_id}
                        shown={true}
                        size={cardSize}
                        name={card.name}
                      />
                    )}
                  </div>
                );
              })
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`draft-placeholder ${cardSize}`} />
              ))}
        </div>
        {/* El botón "Cerrar" aparece debajo de las cartas en la vista expandida */}
        {isExpanded && (
          <div className="draft-controls-row">
            <Button label="Volver" onClick={toggleExpansion} />
          </div>
        )}
      </div>
    </div>
  );
}

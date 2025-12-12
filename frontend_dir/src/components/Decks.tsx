import CardBase from "./Cards/CardBase";
import type { CardResponse } from "../services/cardService";
import "./Decks.css";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";

interface DeckProps {
  discardedCards: CardResponse[];
  cardsLeftCount: number | null;
}
export default function Decks({ discardedCards, cardsLeftCount }: DeckProps) {
  const lastDiscarded = discardedCards.length > 0 ? discardedCards[0] : null;
  return (
    <div className="decks">
      <div className="deck draw-deck" title="Mazo para robar">
        {cardsLeftCount !== null && cardsLeftCount >= 0 && (
          <div className="card-counter">{cardsLeftCount}</div>
        )}
        <CardBase key="draw" shown={false} size="medium" />
      </div>

      <div className="deck discard-deck" title="Descarte (tope visible)">
        {lastDiscarded ? (
          lastDiscarded.type === "detective" ? (
            <Detective
              key={lastDiscarded.card_id}
              card_id={lastDiscarded.card_id}
              shown={true}
              size="medium"
              name={lastDiscarded.name}
            />
          ) : (
            <Event
              key={lastDiscarded.card_id}
              card_id={lastDiscarded.card_id}
              shown={true}
              size="medium"
              name={lastDiscarded.name}
            />
          )
        ) : (
          <p></p>
        )}
      </div>
    </div>
  );
}

import type { CardResponse } from "../services/cardService";
import type { SetResponse } from "../services/setService";
import Detective from "./Cards/Detectives";
import "./Set.css";

interface SetProps {
  game_id: number;
  player_id: number;
  set_id: number;
  name: string;
  cards: CardResponse[];
  isSelected: boolean;
  onSetClick?: (set: SetResponse | undefined) => void;
}

export default function Set({
  game_id,
  player_id,
  set_id,
  name,
  cards,
  isSelected,
  onSetClick,
}: SetProps) {
  const handleClick = () => {
    if (onSetClick) {
      const setResponse: SetResponse = {
        game_id: game_id,
        player_id: player_id,
        set_id: set_id,
        name: name,
        detective: cards,
      };
      onSetClick(setResponse);
    }
  };
  return (
    <div
      className={`set ${isSelected ? "selected" : "table"}`}
      onClick={handleClick}
      set-data={`set-${set_id}`}
      role="button"
      aria-label={`Set ${name}`}
    >
      {cards.map((card) => (
        <Detective
          key={card.card_id}
          card_id={card.card_id}
          shown={true}
          size="mini"
          name={card.name}
        />
      ))}
    </div>
  );
}

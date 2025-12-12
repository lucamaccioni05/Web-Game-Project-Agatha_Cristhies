import cardBack from "/src/assets/01-card_back.png";
import d1 from "/src/assets/07-detective_poirot.png";
import d2 from "/src/assets/08-detective_marple.png";
import d3 from "/src/assets/09-detective_satterthwaite.png";
import d4 from "/src/assets/10-detective_pyne.png";
import d5 from "/src/assets/11-detective_brent.png";
import d6 from "/src/assets/12-detective_tommyberesford.png";
import d7 from "/src/assets/13-detective_tuppenceberesford.png";
import d8 from "/src/assets/14-detective_quin.png";
import d9 from "/src/assets/15-detective_oliver.png";

type CardSize = "mini" | "medium" | "large";

export type DetectiveProps = {
  card_id?: number;
  shown: boolean;
  name: string;
  size?: CardSize;
  onCardClick?: (cardId: number | undefined) => void;
  isSelected?: boolean;
};

export default function Detective({
  card_id,
  shown,
  name,
  size = "medium",
  onCardClick,
  isSelected,
}: DetectiveProps) {
  const handleClick = () => {
    if (onCardClick) {
      onCardClick(card_id);
    }
  };

  let imgSrc: string;
  switch (name) {
    case "Hercule Poirot":
      imgSrc = d1;
      break;
    case "Miss Marple":
      imgSrc = d2;
      break;
    case "Mr Satterthwaite":
      imgSrc = d3;
      break;
    case "Parker Pyne":
      imgSrc = d4;
      break;
    case "Lady Eileen 'Bundle' Brent":
      imgSrc = d5;
      break;
    case "Tommy Beresford":
      imgSrc = d6;
      break;
    case "Tuppence Beresford":
      imgSrc = d7;
      break;
    case "Harley Quin Wildcard":
      imgSrc = d8;
      break;
    case "Adriane Oliver":
      imgSrc = d9;
      break;
    default: // This is the "otherwise" part
      imgSrc = cardBack;
      break;
  }

  return (
    <div
      className={`card card-${size} ${isSelected ? "selected" : ""}`}
      data-card-id={card_id}
      onClick={handleClick}
    >
      <img src={shown ? imgSrc : cardBack} alt={`card-${card_id}`} />
    </div>
  );
}

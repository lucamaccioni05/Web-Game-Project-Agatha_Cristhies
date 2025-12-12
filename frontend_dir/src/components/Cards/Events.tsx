import cardBack from "/src/assets/01-card_back.png";
import cardsoff from "/src/assets/17-event_cardsonthetable.png";
import anothervictim from "/src/assets/18-event_anothervictim.png";
import deadcardfolly from "/src/assets/19-event_deadcardfolly.png";
import lookashes from "/src/assets/20-event_lookashes.png";
import cardtrade from "/src/assets/21-event_cardtrade.png";
import onemore from "/src/assets/22-event_onemore.png";
import delayescape from "/src/assets/23-event_delayescape.png";
import earlytrain from "/src/assets/24-event_earlytrain.png";
import pointsuspicions from "/src/assets/25-event_pointsuspicions.png";
import notsofast from "/src/assets/16-Instant_notsofast.png";
import fauxpas from "/src/assets/27-devious_fauxpas.png";
import blackmailed from "/src/assets/26-devious_blackmailed.png";

type CardSize = "mini" | "medium" | "large";

export type EventProps = {
  card_id?: number;
  shown: boolean;
  name: string;
  size?: CardSize;
  onCardClick?: (cardId: number | undefined) => void;
  isSelected?: boolean;
};

export default function Event({
  card_id,
  shown,
  name,
  size = "medium",
  onCardClick,
  isSelected,
}: EventProps) {
  const handleClick = () => {
    if (onCardClick) {
      onCardClick(card_id);
    }
  };

  let imgSrc: string;
  switch (name) {
    case "Cards off the table":
      imgSrc = cardsoff;
      break;
    case "Another Victim":
      imgSrc = anothervictim;
      break;
    case "Dead card folly":
      imgSrc = deadcardfolly;
      break;
    case "Look into the ashes":
      imgSrc = lookashes;
      break;
    case "Card trade":
      imgSrc = cardtrade;
      break;
    case "And then there was one more...":
      imgSrc = onemore;
      break;
    case "Delay the murderer's escape!":
      imgSrc = delayescape;
      break;
    case "Early train to paddington":
      imgSrc = earlytrain;
      break;
    case "Point your suspicions":
      imgSrc = pointsuspicions;
      break;
    case "Not so fast":
      imgSrc = notsofast;
      break;
    case "Social Faux Pas":
      imgSrc = fauxpas;
      break;
    case "Blackmailed":
      imgSrc = blackmailed;
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

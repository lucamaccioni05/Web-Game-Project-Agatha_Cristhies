import "./CardBase.css";
import cardBack from "/src/assets/01-card_back.png";
type CardSize = "mini" | "medium" | "large";

export type CardBaseProps = {
  card_id?: number;
  shown: boolean;
  size?: CardSize;
  image?: string;
  onCardClick?: (cardId: number | undefined) => void;
  isSelected?: boolean;
};

export default function CardBase({
  card_id,
  shown,
  size = "medium",
  image,
  onCardClick,
  isSelected,
}: CardBaseProps) {
  const handleClick = () => {
    if (onCardClick) {
      onCardClick(card_id);
    }
  };
  // Si no hay imagen, usamos el back por defecto
  const imgSrc = shown ? image ?? cardBack : cardBack;

  return (
    <div
      className={`card card-${size} ${isSelected ? "selected" : ""}`}
      data-card-id={card_id}
      onClick={handleClick}
    >
      <img src={imgSrc} alt={`card-${card_id}`} />
    </div>
  );
}

import "./Secret.css";
import s_murderer from "/src/assets/03-secret_murderer.png";
import s_accomplice from "/src/assets/04-secret_accomplice.png";
import s_back from "/src/assets/05-secret_back.png";
import s_base from "/src/assets/06-secret_front.png";

type CardSize = "mini" | "medium" | "large";

export type SecretBaseProps = {
  secret_id?: number;
  size?: CardSize;
  mine: boolean;
  revealed: boolean;
  murderer: boolean;
  accomplice: boolean;
  isSelected: boolean;
  onClick?: () => void;
};

export default function Secret({
  secret_id,
  size = "medium",
  mine,
  revealed,
  murderer,
  accomplice,
  isSelected,
  onClick,
}: SecretBaseProps) {
  let imgFront, imgToDisplay: string;

  if (murderer) {
    imgFront = s_murderer;
  } else if (accomplice) {
    imgFront = s_accomplice;
  } else {
    imgFront = s_base;
  }

  if (mine) {
    // Si es TU secreto, siempre ves el frente (tu requisito)
    imgToDisplay = imgFront;
  } else {
    // Si es del oponente (!mine)
    if (revealed) {
      // Si está revelado, ve el frente
      imgToDisplay = imgFront;
    } else {
      // Si NO está revelado, ve el dorso
      imgToDisplay = s_back;
    }
  }

  const unrevealedClass = mine && !revealed ? "unrevealed" : "";
  const clickableClass = onClick ? "clickable" : "";
  return (
    <div
      className={`secret secret-${size} ${
        mine ? "mine" : ""
      } ${unrevealedClass} ${isSelected ? "selected" : ""} ${clickableClass}`}
      data-secret-id={secret_id}
      onClick={onClick}
    >
      <img src={imgToDisplay} alt={`Secret ${secret_id}`} />
    </div>
  );
}

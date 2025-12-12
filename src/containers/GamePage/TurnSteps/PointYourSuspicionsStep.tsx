import TextType from "../../../components/TextType";
import { usePointYourSuspicions } from "./usePointYourSuspicions";

export const PointYourSuspicionsStep = () => {
  const { lock, message, PointYourSuspicions, cancel } =
    usePointYourSuspicions();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}

      <TextType
        className="menu-indications"
        text={["¿Listo para votar?"]}
        typingSpeed={35}
      />

      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={PointYourSuspicions}
          disabled={lock}
        >
          Avanzar
        </button>

        <button className="action-button" onClick={cancel} disabled={lock}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

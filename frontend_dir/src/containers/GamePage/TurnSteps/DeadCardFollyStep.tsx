import TextType from "../../../components/TextType";
import { useDeadCardFolly } from "./useDeadCardFolly";
export const DeadCardFollyStep = () => {
  const { lock, message, confirmDeadCardFolly } = useDeadCardFolly();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Elija una dirección para el pasaje de cartas"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={() => confirmDeadCardFolly("left")}
          disabled={lock}
        >
          Izquierda
        </button>
        <button
          className="action-button"
          onClick={() => confirmDeadCardFolly("right")}
          disabled={lock}
        >
          Derecha
        </button>
      </div>
    </div>
  );
};

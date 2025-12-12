import TextType from "../../../components/TextType";
import { usePlayEvent } from "./usePlayEvent";

export const PlayEventStep = () => {
  const { lock, message, playEvent, cancel } = usePlayEvent();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione carta de evento"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button className="action-button" onClick={playEvent} disabled={lock}>
          Jugar Evento Seleccionado
        </button>
        <button className="action-button" onClick={cancel}>
          Volver
        </button>
      </div>
    </div>
  );
};

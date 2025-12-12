import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useAndThenThereWasOneMore } from "./useAndThenThereWasOneMore";

export const AndThenThereWasOneMoreStep = () => {
  const { lock, message, andThenThereWasOneMore, cancel } =
    useAndThenThereWasOneMore();
  const { state } = useGameContext();
  const { selectedTargetPlayer, selectedSecret } = state;

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        key={selectedTargetPlayer ? "secret" : "player"}
        className="menu-indications"
        text={
          selectedTargetPlayer
            ? ["Seleccione un secreto revelado para ocultar."]
            : ["Clickee el nombre de un jugador que recibirá el secreto."]
        }
        typingSpeed={35}
      />

      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={andThenThereWasOneMore}
          disabled={
            lock ||
            !selectedTargetPlayer ||
            !selectedSecret ||
            !selectedSecret.revelated
          }
        >
          Ejecutar Evento
        </button>
        <button className="action-button" onClick={cancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

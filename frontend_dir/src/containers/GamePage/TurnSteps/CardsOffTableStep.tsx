import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useCardsOffTable } from "./useCardsOffTable";

export const CardsOffTableStep = () => {
  const { lock, message, cardsOffTheTable, cancel, setMessage } =
    useCardsOffTable();
  const { state } = useGameContext();
  const { selectedTargetPlayer } = state;

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione un jugador para descartar sus cartas 'Not So Fast'"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={async () => {
            // Validación en la UI para feedback inmediato
            if (!selectedTargetPlayer) {
              setMessage("Debe seleccionar un jugador.");
              setTimeout(() => setMessage(""), 3000);
              return;
            }
            await cardsOffTheTable();
          }}
          disabled={!selectedTargetPlayer || lock}
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

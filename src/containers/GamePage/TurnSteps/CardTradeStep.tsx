import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useCardTrade } from "./useCardTrade";
export const CardTradeStep = () => {
  const { lock, message, confirmCardTrade } = useCardTrade();
  const { state } = useGameContext();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Selecciona un jugador con quien intercambiar una carta"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={confirmCardTrade}
          disabled={lock || !state.selectedTargetPlayer}
        >
          {lock ? "Iniciando..." : "Confirmar Intercambio"}
        </button>
      </div>
    </div>
  );
};

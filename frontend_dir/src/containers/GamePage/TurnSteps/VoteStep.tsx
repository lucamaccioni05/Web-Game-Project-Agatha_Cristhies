import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useVote } from "./useVote";

export const VoteStep = () => {
  const { state } = useGameContext();
  const { players } = state;

  const { lock, message, voted, handleVote } = useVote();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}

      {!voted ? (
        <>
          <TextType
            className="menu-indications"
            text={["Elige a quién votar"]}
            typingSpeed={35}
          />

          <div className="vote-buttons-group">
            {players.map((player) => (
              <button
                key={player.player_id}
                className="action-button"
                onClick={() => handleVote(player.player_id)}
                disabled={lock}
              >
                {player.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <TextType
          className="menu-indications"
          text={["Has votado. Esperando resultados..."]}
          typingSpeed={35}
        />
      )}
    </div>
  );
};

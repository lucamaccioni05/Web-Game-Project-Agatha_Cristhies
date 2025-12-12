import type { PlayerStateResponse } from "../services/playerService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";
import Set from "./Set";
import Secret from "./Cards/Secret";
import "./Opponent.css";
import type { SetResponse } from "../services/setService";
import type { SecretResponse } from "../services/secretService";

interface OpponentProps {
  player: PlayerStateResponse;
  isMyTurn: boolean;
  onSetClick: (set: SetResponse | undefined) => void;
  selectedSet: SetResponse | null;
  isSetSelectionStep: boolean;
  onSecretClick: (secret: SecretResponse) => void;
  selectedSecret: SecretResponse | null;
  isSecretSelectionStep: boolean;
  onClick?: () => void;
  isSelected: boolean;
  selectable: boolean;
}

export default function Opponent({
  player,
  isMyTurn,
  onSetClick,
  selectedSet,
  isSetSelectionStep,
  onSecretClick,
  selectedSecret,
  isSecretSelectionStep,
  onClick,
  isSelected = false,
  selectable = false,
}: OpponentProps) {
  const isSecretClickable = (secret: SecretResponse): boolean => {
    if (!isSecretSelectionStep) return false;

    // Si el paso es REVELAR, solo secretos no revelados son cliqueables
    if (isSecretSelectionStep && !secret.revelated) {
      // Asumimos que "reveal_secret" es el único paso donde !secret.revealed es válido en oponentes.
      return true;
    }

    // Si el paso es OCULTAR, solo secretos revelados son cliqueables
    if (isSecretSelectionStep && secret.revelated) {
      // Asumimos que "hide_secret" es el único paso donde secret.revealed es válido en oponentes.
      return true;
    }

    return false;
  };

  return (
    <div className="opponent">
      <div
        className={`op-name ${isMyTurn ? "myturn" : ""} ${
          isSelected ? "selected" : ""
        } ${selectable ? "selectable" : ""}`}
        onClick={selectable ? onClick : undefined}
      >
        {player.name}
      </div>

      <div className="op-hand">
        {/* Mapeamos directamente desde player.cards que viene en las props */}
        {player.cards.map((card, index) =>
          card.type === "detective" ? (
            <Detective
              key={`op-card-${player.player_id}-${index}`}
              card_id={card.card_id}
              shown={false} // Para oponentes, las cartas están boca abajo
              size="mini"
              name={card.name}
            />
          ) : (
            <Event
              key={`op-card-${player.player_id}-${index}`}
              card_id={card.card_id}
              shown={false} // Para oponentes, las cartas están boca abajo
              size="mini"
              name={card.name}
            />
          )
        )}
      </div>

      <div className="op-secrets">
        {/* Mapeamos directamente desde player.secrets que viene en las props */}
        {player.secrets.map((secret) => (
          <Secret
            key={`op-secret-${player.player_id}-${secret.secret_id}`}
            secret_id={secret.secret_id}
            mine={false}
            revealed={secret.revelated}
            murderer={secret.murderer}
            accomplice={secret.accomplice}
            size="mini"
            isSelected={secret.secret_id === selectedSecret?.secret_id}
            onClick={
              isSecretClickable(secret)
                ? () => onSecretClick(secret)
                : undefined
            }
          />
        ))}
      </div>

      <div className="op-sets">
        {player.sets.map((set) => (
          <Set
            key={set.set_id}
            game_id={set.game_id}
            player_id={set.player_id}
            set_id={set.set_id}
            name={set.name}
            cards={set.detective}
            isSelected={set.set_id == selectedSet?.set_id}
            onSetClick={isSetSelectionStep ? onSetClick : undefined}
          />
        ))}
      </div>
    </div>
  );
}

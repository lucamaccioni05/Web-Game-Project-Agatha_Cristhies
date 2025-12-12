import type { PlayerStateResponse } from "../services/playerService";
import Detective from "./Cards/Detectives";
import Event from "./Cards/Events";
import Secret from "./Cards/Secret";
import Set from "./Set.tsx";
import "./MyHand.css";
import type { CardResponse } from "../services/cardService.ts";
import type { SecretResponse } from "../services/secretService.ts";
import { useState } from "react";
import Button from "./Button.tsx";
import type { SetResponse } from "../services/setService.ts";

interface YouProps {
  player: PlayerStateResponse;
  onCardsSelected: (card: CardResponse) => void;
  selectedCardIds: number[];
  isMyTurn: boolean;
  selectedCard: CardResponse | null;
  onSecretClick: (secret: SecretResponse) => void;
  selectedSecret: SecretResponse | null;
  isSecretSelectionStep: boolean;
  onClick?: () => void;
  isSelected: boolean;
  selectable: boolean;
  isSocialDisgrace: boolean;
  onSetClick?: (set: SetResponse | undefined) => void;
  selectedSet: SetResponse | null;
  isSetSelectionStep: boolean;
}

export default function You({
  player,
  onCardsSelected,
  selectedCardIds,
  selectedCard,
  isMyTurn,
  onSecretClick,
  selectedSecret,
  isSecretSelectionStep,
  onSetClick,
  selectedSet,
  isSetSelectionStep,
  onClick,
  isSelected = false,
  selectable = false,
  isSocialDisgrace,
}: YouProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const cardSize = isExpanded ? "large" : "medium";

  const handleCardClick = (card: CardResponse) => {
    onCardsSelected(card);
  };

  return (
    <div className="you">
      <div
        className={`you-name ${isMyTurn ? "myturn" : ""} ${
          isSelected ? "selected" : ""
        } ${selectable ? "selectable" : ""}`}
        onClick={selectable ? onClick : undefined}
      >
        {player.name}
      </div>

      {/* Contenedor principal para la estructura: Secretos | Área Central */}
      <div className="player-cards-container">
        {/* Lado Izquierdo: Secretos */}
        <div className="you-secrets">
          {isSocialDisgrace && (
            <div className="social-disgrace-banner">DESGRACIA SOCIAL</div>
          )}
          <div className="secrets-list">
            {player.secrets.map((secret) => {
              return (
                <Secret
                  key={secret.secret_id}
                  secret_id={secret.secret_id}
                  mine={true}
                  revealed={secret.revelated}
                  murderer={secret.murderer}
                  accomplice={secret.accomplice}
                  size="large"
                  isSelected={secret.secret_id == selectedSecret?.secret_id}
                  onClick={
                    isSecretSelectionStep
                      ? () => onSecretClick(secret)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Área Central: Sets, Mano y Botón */}
        <div className="you-main-area">
          {/* Sets (Arriba, Centrados, uno al lado del otro) */}
          <div className="you-sets">
            {player.sets.map((set) => {
              // 1. Comprobamos si este set es el seleccionado
              const isSetSelected = selectedSet?.set_id === set.set_id;

              return (
                <Set
                  key={set.set_id}
                  game_id={set.game_id}
                  player_id={set.player_id}
                  set_id={set.set_id}
                  name={set.name}
                  cards={set.detective}
                  isSelected={isSetSelected}
                  onSetClick={isSetSelectionStep ? onSetClick : undefined}
                />
              );
            })}
          </div>

          {/* Mano (Centro, Centrada) */}
          <div className={`you-hand ${isExpanded ? "expanded" : "compact"}`}>
            {player.cards.map((card) => {
              if (card.card_id === undefined) return null;

              const isSelected =
                selectedCardIds.includes(card.card_id) ||
                selectedCard?.card_id === card.card_id;

              return card.type === "detective" ? (
                <Detective
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size={cardSize}
                  onCardClick={
                    card.card_id !== undefined
                      ? () => handleCardClick(card)
                      : undefined
                  }
                  isSelected={isSelected}
                  name={card.name}
                />
              ) : (
                <Event
                  key={card.card_id}
                  card_id={card.card_id}
                  shown={true}
                  size={cardSize}
                  onCardClick={
                    card.card_id !== undefined
                      ? () => handleCardClick(card)
                      : undefined
                  }
                  isSelected={isSelected}
                  name={card.name}
                />
              );
            })}
          </div>

          {/* Botón de Expansión/Contracción (Centrado Debajo de la Mano) */}
          <div className="hand-toggle-button">
            <Button
              label={isExpanded ? "Volver" : "Ampliar"}
              onClick={toggleExpansion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

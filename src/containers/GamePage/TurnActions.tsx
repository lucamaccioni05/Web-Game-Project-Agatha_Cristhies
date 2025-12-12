import { useEffect } from "react";
import { useGameContext } from "../../context/GameContext";

//componentes de paso
import { StartStep } from "./TurnSteps/StartStep";
import { PlaySetStep } from "./TurnSteps/PlaySetStep";
import { PlayEventStep } from "./TurnSteps/PlayEventStep";
import { DiscardStep } from "./TurnSteps/DiscardStep";
import { DrawStep } from "./TurnSteps/DrawStep";
import { AnotherVictimStep } from "./TurnSteps/AnotherVictimStep";
import { LookIntoAshesStep } from "./TurnSteps/LookIntoAshesStep";
import { CardsOffTableStep } from "./TurnSteps/CardsOffTableStep";
import { AndThenThereWasOneMoreStep } from "./TurnSteps/AndThenThereWasOneMoreStep";
import { DelayEscapeStep } from "./TurnSteps/DelayEscapeStep";
import { RevealSecretStep } from "./TurnSteps/RevealSecretStep";
import { HideSecretStep } from "./TurnSteps/HideSecretStep";
import { SelectPlayerRevealStep } from "./TurnSteps/SelectPlayerRevealStep";
import { WaitRevealStep } from "./TurnSteps/WaitRevealStep";
import { PointYourSuspicionsStep } from "./TurnSteps/PointYourSuspicionsStep";
import { WaitingVotingToEndStep } from "./TurnSteps/WaitingVotingToEndStep";
import { VoteStep } from "./TurnSteps/VoteStep";
import { CardTradeStep } from "./TurnSteps/CardTradeStep";
import { WaitTradeStep } from "./TurnSteps/WaitTradeStep";
import { AddDetectiveStep } from "./TurnSteps/AddDetectiveStep";
import { WaitEventResolutionStep } from "./TurnSteps/WaitEventResolutionStep";
// estilos
import "./TurnActions.css";
import TextType from "../../components/TextType";
import { WaitSetResolutionStep } from "./TurnSteps/WaitSetResolutionStep";
import { DeadCardFollyStep } from "./TurnSteps/DeadCardFollyStep";
import { WaitTradeFollyStep } from "./TurnSteps/WaitTradeFollyStep";

export default function TurnActions() {
  const { state, dispatch, isSocialDisgrace } = useGameContext();
  const { currentStep } = state;

  useEffect(() => {
    // Si el paso actual es 'start' Y estamos en desgracia social...
    if (currentStep === "start" && isSocialDisgrace) {
      // ...despacha la acción para cambiar el estado real en el Context.
      console.log(
        "Desgracia social detectada. Cambiando estado a 'discard_skip'."
      );
      dispatch({ type: "SET_STEP", payload: "discard_skip" });
    }
  }, [currentStep, isSocialDisgrace, dispatch]);

  // El 'div' contenedor se mantiene
  return (
    <div className="turn-actions-box">
      {/* Este switch renderiza el componente de UI correcto
        basado en el 'currentStep' del GameContext.
      */}
      {(() => {
        switch (currentStep) {
          // --- Pasos Principales ---
          case "start":
            if (isSocialDisgrace) {
              return (
                <div className="action-step-container">
                  <TextType text={["Procesando turno..."]} typingSpeed={50} />
                </div>
              );
            }
            return <StartStep />;
          case "p_set":
            return <PlaySetStep />;
          case "p_event":
            return <PlayEventStep />;
          case "add_detective":
            return <AddDetectiveStep />;
          case "discard_skip":
          case "discard_op":
            return <DiscardStep />;
          case "draw":
            return <DrawStep />;

          // --- Pasos de Eventos ---
          case "another_victim":
            return <AnotherVictimStep />;
          case "look_into_the_ashes":
            return <LookIntoAshesStep />;
          case "cards_off_the_table":
            return <CardsOffTableStep />;
          case "and_then_there_was_one_more":
            return <AndThenThereWasOneMoreStep />;
          case "delay_escape_selection":
            return <DelayEscapeStep />;
          case "point_your_suspicions":
            return <PointYourSuspicionsStep />;
          case "vote":
            return <VoteStep />;
          case "wait_voting_to_end":
            return <WaitingVotingToEndStep />;
          case "card_trade":
            return <CardTradeStep />;
          case "wait_trade":
            return <WaitTradeStep />;
          case "dead_card_folly":
            return <DeadCardFollyStep />;
          case "wait_trade_folly":
            return <WaitTradeFollyStep />;
          case "wait_event_resolution":
            return <WaitEventResolutionStep />;
          case "wait_set_resolution":
            return <WaitSetResolutionStep />;

          // --- Pasos de Sets ---
          case "sel_reveal_secret":
            return <RevealSecretStep />;
          case "sel_hide_secret":
            return <HideSecretStep />;
          case "sel_player_reveal":
            return <SelectPlayerRevealStep />;
          case "wait_reveal_secret":
            return <WaitRevealStep />;
          default:
            return <div>Paso desconocido: {currentStep}</div>;
        }
      })()}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGameContext } from "../context/GameContext";

// Importa todas las dependencias que vamos a MOVER de Gameboard
import TurnActions from "../containers/GamePage/TurnActions";
import TextType from "./TextType.tsx";
import secretService from "../services/secretService";
import playerService from "../services/playerService";
import eventService from "../services/eventService";
import logService from "../services/logService.ts";
import { VoteStep } from "../containers/GamePage/TurnSteps/VoteStep.tsx";
import { LogMessage } from "./LogMessage.tsx";

import "./GameLogPanel.css";

export const GameLogPanel = () => {
  const { state, dispatch, isMyTurn, currentPlayer } = useGameContext();

  // agg game para leer log
  const {
    myPlayerId,
    selectedCard,
    selectedSecret,
    currentStep,
    logs,
    game,
    players,
  } = state;

  const pendingAction = currentPlayer?.pending_action;

  const isForcedToTradeFolly = useMemo(() => {
    return (
      pendingAction === "SELECT_FOLLY_CARD" ||
      pendingAction === "WAITING_FOR_FOLLY_TRADE"
    );
  }, [pendingAction]);

  const isForcedToAct = useMemo(() => {
    return pendingAction === "REVEAL_SECRET";
  }, [pendingAction]);

  const isForcedToTrade = useMemo(() => {
    // Es "trade forzado" si tengo cualquiera de estas acciones pendientes
    return (
      pendingAction === "SELECT_TRADE_CARD" ||
      pendingAction === "WAITING_FOR_TRADE_PARTNER"
    );
  }, [pendingAction]);

  const isForcedToVote = useMemo(() => {
    return (
      pendingAction === "VOTE" || pendingAction === "WAITING_VOTING_TO_END"
    );
  }, [pendingAction]);

  // 1. Social Faux Pas: Forzado a revelar un secreto (público)
  const isForcedToSocialFauxPas = useMemo(() => {
    return pendingAction === "REVEAL_SOCIAL_FAUX_PAS_SECRET";
  }, [pendingAction]);

  // 2. Blackmailed: Forzado a elegir un secreto propio para mostrar (privado)
  const isForcedToChooseBlackmailed = useMemo(() => {
    return pendingAction === "CHOOSE_BLACKMAIL_SECRET";
  }, [pendingAction]);

  // 3. Jugador Objetivo de Blackmail (El que recibe el secreto)
  const blackmailedTargetPlayer = useMemo(() => {
    if (!isForcedToChooseBlackmailed) return null;
    // Asumimos que el jugador que espera ver el secreto tiene la acción 'WAITING_FOR_BLACKMAIL'
    return players.find((p) => p.pending_action === "WAITING_FOR_BLACKMAIL");
  }, [players, isForcedToChooseBlackmailed]);

  // 4. Lógica para saber si yo debo ver el modal del secreto ya revelado

  const showNotSoFastPrompt = useMemo(() => {
    const notAvailable =
      currentStep === "discard_op" ||
      currentStep === "discard_skip" ||
      currentStep === "look_into_the_ashes" ||
      currentStep === "delay_escape_selection" ||
      currentStep === "wait_trade_folly" ||
      currentStep === "wait_trade";

    // 2. El prompt SÓLO se muestra si la carta es NSF Y NO estamos descartando
    return (
      selectedCard !== null &&
      selectedCard.name === "Not so fast" &&
      !notAvailable
    );
  }, [selectedCard, currentStep]);

  const getFollyTarget = useCallback(() => {
    if (!players || !players.length || !myPlayerId) return null;
    const ordered = [...players].sort(
      (a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0)
    );
    const index = ordered.findIndex((p) => p.player_id === myPlayerId);
    if (index === -1) return null;

    let targetIndex;
    if (game?.direction_folly === "right") {
      targetIndex = (index + 1) % ordered.length;
    } else {
      targetIndex = (index - 1 + ordered.length) % ordered.length;
    }

    return ordered[targetIndex];
  }, [players, myPlayerId, game?.direction_folly]);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!game?.game_id) return;

    const fetchLogs = () => {
      console.log("Actualizando logs...");
      logService
        .getLogs(game.game_id)
        .then((newLogs) => {
          dispatch({ type: "SET_LOGS", payload: newLogs });
        })
        .catch((err) => console.error("Error al recargar logs:", err));
    };

    fetchLogs();
  }, [game?.current_turn, state.lastCancelableEvent, game?.game_id, dispatch]);

  return (
    <div className="game-log-panel-container">
      <div className="log-window">
        <h3>Registro de la Partida</h3>
        <div className="log-list">
          {logs.length === 0 ? (
            <p className="log-message">Aún no hay acciones en el registro.</p>
          ) : (
            logs.map((log) => <LogMessage key={log.log_id} log={log} />)
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="action-window">
        {/* Usamos un IIFE (una función autoejecutable) 
            para asegurarnos de que solo UNO de estos bloques se renderice. */}
        {(() => {
          // --- Prioridad 1: Not So Fast! ---
          if (showNotSoFastPrompt) {
            return (
              <div className="turn-actions-container">
                <div className="action-step-container">
                  <TextType
                    text={["¿Jugar 'Not So Fast!'?"]}
                    typingSpeed={35}
                  />
                  <div className="action-buttons-group">
                    <button
                      className="action-button" // Puedes darle un estilo especial
                      onClick={async () => {
                        if (!selectedCard) return;
                        try {
                          // 1. Llamamos al nuevo servicio
                          console.log("PLAY NOT SO FAST");
                          await logService.registerCancelableEvent(
                            selectedCard.card_id
                          );
                          // 2. Limpiamos la selección
                          dispatch({
                            type: "SET_SELECTED_CARD",
                            payload: null,
                          });

                          // (El WebSocket se encargará de refrescar el estado)
                        } catch (err) {
                          console.error("Error al jugar Not So Fast:", err);
                          alert("No se puede jugar esta carta ahora.");
                        }
                      }}
                    >
                      Confirmar
                    </button>
                    <button
                      className="action-button secondary" // (Necesitarás un estilo para "secondary")
                      onClick={() => {
                        // Simplemente deselecciona la carta
                        dispatch({ type: "SET_SELECTED_CARD", payload: null });
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // --- Prioridad 2: Revelar Secreto ---
          if (isForcedToAct) {
            return (
              <div className="turn-actions-container">
                <div className="action-step-container">
                  <TextType
                    text={[
                      "Te han seleccionado. Debes revelar uno de tus secretos.",
                    ]}
                    typingSpeed={35}
                  />
                  <div className="ac  // 2. Lógica para el auto-scroll del logtion-buttons-group">
                    <button
                      className="action-button"
                      onClick={async () => {
                        if (!selectedSecret) {
                          alert(
                            "Por favor, selecciona un secreto para revelar."
                          );
                          return;
                        }
                        if (selectedSecret.revelated) {
                          alert(
                            "Ese secreto ya está revelado. Debes elegir uno oculto."
                          );
                          return;
                        }
                        try {
                          await secretService.revealSecret(
                            selectedSecret.secret_id
                          );
                          dispatch({
                            type: "SET_SELECTED_SECRET",
                            payload: null,
                          });
                          await playerService.unselectPlayer(myPlayerId);
                          if (isMyTurn) {
                            dispatch({
                              type: "SET_STEP",
                              payload: "discard_op",
                            });
                          }
                        } catch (err) {
                          console.error(
                            "Error al revelar secreto forzado:",
                            err
                          );
                          alert("Error al revelar secreto.");
                        }
                      }}
                      disabled={!selectedSecret || selectedSecret.revelated}
                    >
                      Revelar Secreto
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (isForcedToSocialFauxPas) {
            return (
              <div className="turn-actions-container">
                <div className="action-step-container">
                  <TextType
                    text={[
                      "¡Social Faux Pas! Debes revelar un secreto de tu elección.",
                    ]}
                    typingSpeed={35}
                  />
                  {/* El botón es idéntico a isForcedToAct */}
                  <div className="action-buttons-group">
                    <button
                      className="action-button"
                      onClick={async () => {
                        if (!selectedSecret) {
                          alert(
                            "Por favor, selecciona un secreto para revelar."
                          );
                          return;
                        }
                        // La llamada al servicio debe ser la misma
                        // que la de isForcedToAct (revelar secreto y limpiar)
                        try {
                          await secretService.revealSecret(
                            selectedSecret.secret_id
                          );
                          await playerService.unselectPlayer(myPlayerId);
                          dispatch({
                            type: "SET_SELECTED_SECRET",
                            payload: null,
                          });
                        } catch (err) {
                          console.error(
                            "Error al revelar secreto forzado:",
                            err
                          );
                          alert("Error.");
                        }
                      }}
                      disabled={!selectedSecret || selectedSecret.revelated}
                    >
                      Revelar Secreto
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (isForcedToTrade) {
            // --- Prioridad 3: Intercambio Normal ---
            return (
              <div className="turn-actions-container">
                <div className="action-step-container">
                  <TextType
                    text={
                      pendingAction === "SELECT_TRADE_CARD"
                        ? ["¡Intercambio! Selecciona una carta de tu mano..."]
                        : ["Carta seleccionada. Esperando al otro jugador..."]
                    }
                    typingSpeed={35}
                  />
                  <div className="action-buttons-group">
                    <button
                      className="action-button"
                      onClick={async () => {
                        if (!selectedCard || !myPlayerId) return;
                        try {
                          await eventService.cardTrade(
                            myPlayerId,
                            selectedCard.card_id
                          );
                          dispatch({
                            type: "SET_SELECTED_CARD",
                            payload: null,
                          });
                        } catch (err) {
                          console.error(
                            "Error al seleccionar carta para trade:",
                            err
                          );
                          alert("Error al seleccionar carta.");
                        }
                      }}
                      disabled={
                        !selectedCard ||
                        pendingAction === "WAITING_FOR_TRADE_PARTNER"
                      }
                    >
                      {pendingAction === "WAITING_FOR_TRADE_PARTNER"
                        ? "Esperando..."
                        : "Confirmar Carta"}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (isForcedToChooseBlackmailed && blackmailedTargetPlayer) {
            return (
              <div className="turn-actions-container">
                <div className="action-step-container">
                  <TextType
                    text={[
                      `¡Te han chantajeado! Debes elegir uno de TUS secretos para mostrarle a ${blackmailedTargetPlayer.name}.`,
                    ]}
                    typingSpeed={35}
                  />
                  <div className="action-buttons-group">
                    <button
                      className="action-button"
                      onClick={async () => {
                        if (!selectedSecret) {
                          alert(
                            "Por favor, selecciona un secreto para mostrar."
                          );
                          return;
                        }
                        if (selectedSecret.revelated) {
                          alert(
                            "Ese secreto ya está revelado. Debes elegir uno oculto."
                          );
                          return;
                        }
                        if (!currentPlayer) return;

                        try {
                          // Asumo que tienes una función en eventService que maneja la revelación privada
                          // Esta función pone el secreto en el estado 'blackmailedSecret' en el backend
                          await eventService.activateBlackmailed(
                            currentPlayer.player_id,
                            blackmailedTargetPlayer.player_id,
                            selectedSecret.secret_id
                          );

                          dispatch({
                            type: "SET_SELECTED_SECRET",
                            payload: null,
                          });
                        } catch (err) {
                          console.error("Error al activar chantaje:", err);
                          alert("Error al activar el chantaje.");
                        }
                      }}
                      disabled={!selectedSecret || selectedSecret.revelated}
                    >
                      Mostrar Secreto
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // --- Prioridad 4: Intercambio Folly ---
          if (isForcedToTradeFolly) {
            return (
              <div className="turn-actions-container">
                <div className="action-step-container">
                  <TextType
                    text={
                      pendingAction === "SELECT_FOLLY_CARD" // <-- (Usa el string correcto)
                        ? ["¡Intercambio! Selecciona una carta de tu mano..."]
                        : ["Carta seleccionada. Esperando jugadores..."]
                    }
                    typingSpeed={35}
                  />
                  <div className="action-buttons-group">
                    <button
                      className="action-button"
                      onClick={async () => {
                        if (!selectedCard || !myPlayerId) return;
                        const targetPlayer = getFollyTarget(); // Llama a la función que añadiste
                        if (!targetPlayer) {
                          alert("No se pudo determinar el jugador destino.");
                          return;
                        }

                        try {
                          // Asegúrate de que 'eventService.follyTrade' exista
                          await eventService.follyTrade(
                            myPlayerId,
                            targetPlayer.player_id,
                            selectedCard.card_id
                          );
                          dispatch({
                            type: "SET_SELECTED_CARD",
                            payload: null,
                          });
                        } catch (err) {
                          console.error(
                            "Error al seleccionar carta para trade:",
                            err
                          );
                          alert("Error al seleccionar carta.");
                        }
                      }}
                      disabled={
                        !selectedCard ||
                        pendingAction === "WAITING_FOR_FOLLY_TRADE"
                      }
                    >
                      {pendingAction === "WAITING_FOR_FOLLY_TRADE"
                        ? "Esperando..."
                        : "Confirmar Carta"}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // --- Prioridad 5: Votación ---
          if (isForcedToVote) {
            return (
              <div className="turn-actions-container">
                <VoteStep />
              </div>
            );
          }

          if (isMyTurn) {
            return (
              <div className="turn-actions-container">
                <TurnActions />
              </div>
            );
          }

          // Si nada aplica, no renderiza nada
          return null;
        })()}
      </div>
    </div>
  );
};

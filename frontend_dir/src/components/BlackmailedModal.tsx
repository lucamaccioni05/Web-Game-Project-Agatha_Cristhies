import React from "react";
import type { PlayerStateResponse } from "../services/playerService";
import type { SecretResponse } from "../services/secretService";
import Secret from "./Cards/Secret"; // Asume que el componente Secret está aquí
import { useGameContext } from "../context/GameContext";
import eventService from "../services/eventService";
import "./BlackmailedModal.css";

interface BlackmailedModalProps {
  // El secreto que se está mostrando
  secret: SecretResponse;
  // La lista completa de jugadores para obtener los nombres
  players: PlayerStateResponse[];
}

export const BlackmailedModal: React.FC<BlackmailedModalProps> = ({
  secret,
  players,
}) => {
  const { state, dispatch } = useGameContext();
  const { myPlayerId } = state;

  // Jugador que mostró el secreto (el chantajeado)
  const playerShowing = players.find((p) => p.player_id === secret.player_id);

  // Jugador que recibió el secreto (el chantajista)
  const playerTargeted = players.find(
    (p) =>
      p.player_id !== secret.player_id && p.pending_action === "BLACKMAILED"
  );

  // Determinamos el título del modal basado en quién es el usuario actual
  let title = "Secreto por Chantaje";
  let message = "";

  if (playerShowing && playerTargeted) {
    if (myPlayerId === playerShowing.player_id) {
      // Yo soy el que mostró el secreto
      title = `Le mostraste tu secreto a ${playerTargeted.name}:`;
      message = "Ahora puedes continuar tu turno.";
    } else if (myPlayerId === playerTargeted.player_id) {
      // Yo soy el que recibió el secreto
      title = `${playerShowing.name} te ha revelado su secreto:`;
      message = "Información obtenida. Presiona 'Entendido'.";
    } else {
      // No deberías ver este modal, pero por seguridad
      return null;
    }
  }

  // --- Lógica del Handler para cerrar el modal ---
  // Llama al backend para limpiar los pending_action y el secreto del estado.
  const handleCloseBlackmailedModal = async () => {
    if (!playerShowing || !playerTargeted) {
      dispatch({ type: "SET_BLACKMAIL_SECRET", payload: null });
      return;
    }

    try {
      // Llama al endpoint para que el backend ponga pending_action = None
      await eventService.deactivateBlackmailed(
        playerShowing.player_id,
        playerTargeted.player_id
      );

      // Limpiamos el estado del secreto en el frontend
      dispatch({ type: "SET_BLACKMAIL_SECRET", payload: null });

      // NOTA: El broadcast del backend se encargará de limpiar el pending_action.
    } catch (err) {
      console.error("Error al desactivar blackmail:", err);
      alert("Error al cerrar el evento de chantaje.");
      // Forzar la limpieza local para evitar el loop si el backend falla
      dispatch({ type: "SET_BLACKMAIL_SECRET", payload: null });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-secret-container">
          <Secret
            secret_id={secret.secret_id}
            mine={secret.player_id === myPlayerId}
            revealed={true} // Siempre se muestra revelado en el modal
            murderer={secret.murderer}
            accomplice={secret.accomplice}
            size="large"
            isSelected={false}
          />
        </div>
        <button className="action-button" onClick={handleCloseBlackmailedModal}>
          Entendido
        </button>
      </div>
    </div>
  );
};

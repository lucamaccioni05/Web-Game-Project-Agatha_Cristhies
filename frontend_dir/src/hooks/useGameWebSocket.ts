import { useEffect } from "react";
import { useGameContext } from "../context/GameContext";
import { httpServerUrl } from "../services/config";

/**
 * Hook personalizado para manejar la conexión WebSocket de la partida.
 * Se conecta, escucha mensajes y actualiza el estado global usando dispatch.
 */
export const useGameWebSocket = (gameId: number | undefined) => {
  const { dispatch } = useGameContext();

  useEffect(() => {
    if (!gameId) return;

    const wsURL = `${httpServerUrl.replace("http", "ws")}/ws/game/${gameId}`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log(
        `%c[WebSocket] Conectado a: ${wsURL}`,
        "color: #0088cc; font-weight: bold;"
      );
      dispatch({ type: "SET_ERROR", payload: null });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        const dataContent =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data;

        // Despacha acciones al reducer
        switch (message.type) {
          case "playersState":
            dispatch({ type: "SET_PLAYERS", payload: dataContent });
            break;
          case "gameUpdated":
            dispatch({ type: "SET_GAME", payload: dataContent });
            if (dataContent.log) {
              dispatch({ type: "SET_LOGS", payload: dataContent.log });
            }
            break;
          case "lastCancelableEvent":
            dispatch({
              type: "SET_LAST_CANCELABLE_EVENT",
              payload: dataContent,
            });
            break;
          case "setResponse":
            dispatch({ type: "SET_LAST_CANCELABLE_SET", payload: dataContent });
            console.log("Set registrado en la pila:", dataContent);
            break;
          case "droppedCards":
            dispatch({ type: "SET_DISCARD_PILE", payload: dataContent });
            break;
          case "draftCards":
            dispatch({ type: "SET_DRAFT_PILE", payload: dataContent });
            break;
          case "blackmailed":
            console.log("Received BLACKMAILED broadcast:", dataContent);
            dispatch({ type: "SET_BLACKMAIL_SECRET", payload: dataContent });
            break;
          case "Chat":
            dispatch({ type: "ADD_CHAT_MESSAGE", payload: dataContent });
            break;

          default:
            console.log("Mensaje WS recibido sin tipo conocido:", message);
        }
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("[Error WebSocket]", event);
      dispatch({
        type: "SET_ERROR",
        payload:
          "Error en la conexión en tiempo real. Intenta recargar la página.",
      });
    };

    ws.onclose = () => {
      console.log(
        "%c[WebSocket] Conexión cerrada.",
        "color: #cc8800; font-weight: bold;"
      );
    };

    return () => {
      ws.close();
    };
  }, [gameId, dispatch]);
};

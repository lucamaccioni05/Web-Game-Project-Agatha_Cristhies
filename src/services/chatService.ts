import { httpServerUrl } from "./config";

// Interface para el body, basado en tu 'Chat_Base'
interface ChatBody {
  message: string;
}

/**
 * Envía un mensaje de chat al backend para que
 * sea retransmitido a los demás jugadores.
 *
 * @param gameId El ID de la partida (de la URL)
 * @param playerId El ID del jugador que envía (de la URL)
 * @param message El contenido del mensaje de chat (del Body)
 */
async function sendMessage(
  gameId: number,
  playerId: number,
  message: string
): Promise<void> {
  // Construimos la URL para que coincida 1:1 con tu endpoint de FastAPI
  const url = `${httpServerUrl}/send/chat/${gameId}, ${playerId}`;

  // El body que espera tu endpoint (messageIn: Chat_Base)
  const body: ChatBody = { message: message };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Manejo de errores (igual que en tu gameService)
  if (!response.ok) {
    let errorDetail = "Error al enviar el mensaje";
    try {
      // Intentamos leer el detalle del error que envía FastAPI
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch (e) {
      // El cuerpo del error no era JSON, nos quedamos con el mensaje default
    }
    throw new Error(errorDetail);
  }

  // Si la respuesta es 204 No Content (como en tu endpoint),
  // no necesitamos leer 'response.json()'. Simplemente terminamos.
}

// Juntamos todas las funciones del servicio en un objeto
const chatService = {
  sendMessage,
};

export default chatService;

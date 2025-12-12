import { useState, useEffect, useRef } from "react";
import { useGameContext } from "../context/GameContext"; // Ajusta la ruta si es necesario
import chatService from "../services/chatService"; // Ajusta la ruta si es necesario
import "./Chat.css"; // Crearemos este archivo para los estilos

export function Chat() {
  const { state } = useGameContext();
  const { chatMessages, game, myPlayerId } = state;
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(true);

  // Ref para el div de auto-scroll
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !game) return;

    try {
      // Oculta el error si había uno
      setError(null);

      // Llama al servicio con los 3 argumentos que espera
      await chatService.sendMessage(game.game_id, myPlayerId, newMessage);

      // Limpia el input
      setNewMessage("");
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      // Muestra el error en la UI del chat
      setError(
        err instanceof Error ? err.message : "Error al enviar el mensaje"
      );
    }
  };

  // Efecto para auto-scroll
  useEffect(() => {
    // --- MODIFICADO ---
    // Solo hacemos auto-scroll si el chat está abierto
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]); // Añadimos isChatOpen a las dependencias

  return (
    // Añadimos la clase '.collapsed' dinámicamente
    <div className={`chat-container ${!isChatOpen ? "collapsed" : ""}`}>
      {/* --- ¡NUEVO! Cabecera del Chat --- */}
      <div className="chat-header" onClick={() => setIsChatOpen(!isChatOpen)}>
        <span>Chat</span>
        <button className="chat-toggle-button">{isChatOpen ? "—" : "□"}</button>
      </div>
      <div className="chat-content">
        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${
                msg.sender_id === myPlayerId ? "my-message" : "other-message"
              }`}
            >
              <span className="chat-sender-name">{msg.sender_name}</span>
              <span className="chat-message-content">{msg.message}</span>
            </div>
          ))}
          {/* Div invisible al que haremos scroll */}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="chat-input"
          />
          <button type="submit" className="chat-send-button">
            Enviar
          </button>
        </form>

        {/* Muestra un error si la API falla */}
        {error && <div className="chat-error">{error}</div>}
      </div>
    </div>
  );
}

export default Chat;

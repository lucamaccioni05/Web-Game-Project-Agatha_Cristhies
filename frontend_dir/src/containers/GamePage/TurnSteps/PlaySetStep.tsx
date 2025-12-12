import TextType from "../../../components/TextType";
import { usePlaySet } from "./usePlaySet"; // Importa su PROPIO hook

export const PlaySetStep = () => {
  // 1. Llama a su hook específico
  const { lock, message, playSet, cancel } = usePlaySet();

  // 2. Renderiza solo su UI
  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Seleccione set"]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={playSet} // Llama a la función del hook
          disabled={lock}
        >
          Jugar Set
        </button>
        <button
          className="action-button"
          onClick={cancel} // Llama a la función del hook
        >
          Volver
        </button>
      </div>
    </div>
  );
};

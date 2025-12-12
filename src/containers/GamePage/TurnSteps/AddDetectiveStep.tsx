import TextType from "../../../components/TextType";
import { useAddDetective } from "./useAddDetective"; // Importa su PROPIO hook

export const AddDetectiveStep = () => {
  const { lock, message, addDetective, cancel } = useAddDetective();

  return (
    <div className="action-step-container">
      {message && <div className="turn-message">{message}</div>}
      <TextType
        className="menu-indications"
        text={["Selecciona una carta de detective y tu set a potenciar."]}
        typingSpeed={35}
      />
      <div className="action-buttons-group">
        <button
          className="action-button"
          onClick={addDetective}
          disabled={lock}
        >
          Añadir a Set
        </button>
        <button className="action-button" onClick={cancel}>
          Volver
        </button>
      </div>
    </div>
  );
};

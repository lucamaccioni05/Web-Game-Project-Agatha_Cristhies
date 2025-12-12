import TextType from "../../../components/TextType";
import { useGameContext } from "../../../context/GameContext";
import { useWaitReveal } from "./useWaitReveal";

export const WaitRevealStep = () => {
  // 1. Llamamos al hook para que se ejecute su 'useEffect'
  useWaitReveal();

  // 2. Leemos el estado del context para mostrar el mensaje
  const { state } = useGameContext();
  const { selectedTargetPlayer } = state;

  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={[
          `Esperando a que ${
            selectedTargetPlayer?.name ?? "el oponente"
          } revele un secreto...`,
        ]}
        typingSpeed={50}
        loop={true}
      />
    </div>
  );
};

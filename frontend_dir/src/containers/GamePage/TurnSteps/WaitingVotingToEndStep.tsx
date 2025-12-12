import TextType from "../../../components/TextType";
import { useWaitingVotingToEnd } from "./useWaitingVotingToEnd"; // <-- 1. Importa el hook

export const WaitingVotingToEndStep = () => {
  useWaitingVotingToEnd();

  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={["Votación en progreso..."]}
        typingSpeed={35}
      />
    </div>
  );
};

import TextType from "../../../components/TextType";
import { useWaitTrade } from "./useWaitTrade";

export const WaitTradeStep = () => {
  useWaitTrade();
  return (
    <div className="action-step-container">
      <TextType
        className="menu-indications"
        text={["Intercambio en progreso..."]}
        typingSpeed={35}
      />
    </div>
  );
};

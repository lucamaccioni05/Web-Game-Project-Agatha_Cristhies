/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import You from "./MyHand"; // 'You' is the default export
import { type PlayerStateResponse } from "../services/playerService";
import { type SetResponse } from "../services/setService";
import { type SecretResponse } from "../services/secretService";
import { type CardResponse } from "../services/cardService";

// Mocks de todos los componentes hijos
vi.mock("./Cards/Detectives", () => ({
  default: ({ name, onCardClick, isSelected, size }: any) => (
    <button
      data-testid="detective-card"
      onClick={onCardClick}
      data-selected={isSelected}
      data-size={size}
    >
      {name}
    </button>
  ),
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name, onCardClick, isSelected, size }: any) => (
    <button
      data-testid="event-card"
      onClick={onCardClick}
      data-selected={isSelected}
      data-size={size}
    >
      {name}
    </button>
  ),
}));
vi.mock("./Cards/Secret", () => ({
  default: ({ onClick, isSelected, secret_id, revealed, murderer }: any) => (
    <button
      data-testid="secret-card"
      onClick={onClick}
      data-selected={isSelected}
      data-secret-id={secret_id}
      data-revealed={revealed}
      data-murderer={murderer}
    ></button>
  ),
}));
vi.mock("./Set", () => ({
  default: ({ name, onSetClick, isSelected, set_id }: any) => (
    <div
      data-testid="set-component"
      onClick={() => onSetClick && onSetClick({ set_id, name })} // Simulamos el clic con el objeto set
      data-selected={isSelected}
      data-set-id={set_id}
    >
      {name}
    </div>
  ),
}));
vi.mock("./Button", () => ({
  default: ({ label, onClick }: any) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

describe("MyHand (You) Component", () => {
  let onCardsSelectedMock: ReturnType<typeof vi.fn>;
  let onSecretClickMock: ReturnType<typeof vi.fn>;
  let onSetClickMock: ReturnType<typeof vi.fn>;
  let onClickMock: ReturnType<typeof vi.fn>;

  // Mock robusto con todas las propiedades necesarias
  const mockPlayer: PlayerStateResponse = {
    player_id: 1,
    name: "Ulises",
    host: true,
    game_id: 1,
    birth_date: "2000-01-01",
    social_disgrace: false,
    // CORREGIDO: de 'false' a 'null'
    pending_action: null,
    votes_received: 0,
    // ---
    cards: [
      {
        card_id: 1,
        type: "detective",
        name: "Poirot",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      } as CardResponse,
      {
        card_id: 2,
        type: "event",
        name: "Ashes",
        game_id: 1,
        player_id: 1,
        picked_up: true,
        dropped: false,
      } as CardResponse,
      { type: "event", name: "Card without ID" } as any, // Para probar el guard
    ],
    secrets: [
      {
        secret_id: 10,
        revelated: true,
        murderer: false,
        accomplice: false,
        game_id: 1,
      } as SecretResponse,
      {
        secret_id: 11,
        revelated: false,
        murderer: true,
        accomplice: false,
        game_id: 1,
      } as SecretResponse,
    ],
    sets: [
      {
        set_id: 20,
        name: "Mi Set",
        detective: [],
        game_id: 1,
        player_id: 1,
      } as SetResponse,
    ],
  };

  // Props base para no repetir
  const baseProps = {
    player: mockPlayer,
    onCardsSelected: vi.fn(),
    selectedCardIds: [],
    isMyTurn: false,
    selectedCard: null,
    onSecretClick: vi.fn(),
    selectedSecret: null,
    isSecretSelectionStep: false,
    onClick: vi.fn(),
    isSelected: false,
    selectable: false,
    isSocialDisgrace: false, // Esta es la prop del componente, no la del player
    onSetClick: vi.fn(),
    selectedSet: null,
    isSetSelectionStep: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onCardsSelectedMock = vi.fn();
    onSecretClickMock = vi.fn();
    onSetClickMock = vi.fn();
    onClickMock = vi.fn();
    // Reiniciamos las props base con los mocks frescos
    baseProps.onCardsSelected = onCardsSelectedMock;
    baseProps.onSecretClick = onSecretClickMock;
    baseProps.onSetClick = onSetClickMock;
    baseProps.onClick = onClickMock;
  });

  it("should render name, cards, secrets, and sets", () => {
    render(<You {...baseProps} />);
    expect(screen.getByText("Ulises")).toBeInTheDocument();
    expect(screen.getByText("Poirot")).toBeInTheDocument();
    expect(screen.getByText("Ashes")).toBeInTheDocument();
    expect(screen.getAllByTestId("secret-card")).toHaveLength(2);
    expect(screen.getByText("Mi Set")).toBeInTheDocument();
  });

  it("should apply 'myturn' class when isMyTurn is true", () => {
    render(<You {...baseProps} isMyTurn={true} />);
    expect(screen.getByText("Ulises")).toHaveClass("myturn");
  });

  it("should render social disgrace banner if isSocialDisgrace is true", () => {
    // Probamos la prop del componente
    render(<You {...baseProps} isSocialDisgrace={true} />);
    expect(screen.getByText("DESGRACIA SOCIAL")).toBeInTheDocument();
  });

  it("should not render card if card_id is undefined", () => {
    render(<You {...baseProps} />);
    expect(screen.queryByText("Card without ID")).not.toBeInTheDocument();
  });

  describe("Expansion Logic", () => {
    it("should toggle button label and card size on click", async () => {
      render(<You {...baseProps} />);
      const poirotCard = screen.getByText("Poirot");
      const toggleButton = screen.getByRole("button", { name: "Ampliar" });

      // Estado inicial (compacto)
      expect(poirotCard).toHaveAttribute("data-size", "medium");

      // Expandir
      await userEvent.click(toggleButton);
      expect(
        screen.getByRole("button", { name: "Volver" })
      ).toBeInTheDocument();
      expect(poirotCard).toHaveAttribute("data-size", "large");

      // Contraer
      await userEvent.click(screen.getByRole("button", { name: "Volver" }));
      expect(
        screen.getByRole("button", { name: "Ampliar" })
      ).toBeInTheDocument();
      expect(poirotCard).toHaveAttribute("data-size", "medium");
    });
  });

  describe("Card Interaction", () => {
    it("should call onCardsSelected with the card object on click", async () => {
      render(<You {...baseProps} />);
      await userEvent.click(screen.getByText("Poirot"));
      expect(onCardsSelectedMock).toHaveBeenCalledTimes(1);
      expect(onCardsSelectedMock).toHaveBeenCalledWith(mockPlayer.cards[0]);
    });

    it("should pass isSelected=true if card is in selectedCardIds", () => {
      render(<You {...baseProps} selectedCardIds={[1, 3]} />);
      expect(screen.getByText("Poirot")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });

    it("should pass isSelected=true if card matches selectedCard", () => {
      render(<You {...baseProps} selectedCard={mockPlayer.cards[1]} />);
      expect(screen.getByText("Ashes")).toHaveAttribute(
        "data-selected",
        "true"
      );
    });
  });

  describe("Secret Interaction", () => {
    it("should call onSecretClick when isSecretSelectionStep is true", async () => {
      render(<You {...baseProps} isSecretSelectionStep={true} />);
      const secret = screen.getAllByTestId("secret-card")[0]; // El primer secreto
      await userEvent.click(secret);
      expect(onSecretClickMock).toHaveBeenCalledTimes(1);
      expect(onSecretClickMock).toHaveBeenCalledWith(mockPlayer.secrets[0]);
    });

    it("should NOT be clickable if isSecretSelectionStep is false", async () => {
      render(<You {...baseProps} isSecretSelectionStep={false} />);
      const secret = screen.getAllByTestId("secret-card")[0];
      await userEvent.click(secret);
      expect(onSecretClickMock).not.toHaveBeenCalled();
    });

    it("should pass isSelected to the correct secret", () => {
      render(<You {...baseProps} selectedSecret={mockPlayer.secrets[1]} />);
      const secret1 = screen.getAllByTestId("secret-card")[0];
      const secret2 = screen.getAllByTestId("secret-card")[1];
      expect(secret1).toHaveAttribute("data-selected", "false");
      expect(secret2).toHaveAttribute("data-selected", "true");
    });
  });

  describe("Set Interaction", () => {
    it("should call onSetClick when isSetSelectionStep is true", async () => {
      render(<You {...baseProps} isSetSelectionStep={true} />);
      const set = screen.getByTestId("set-component");
      await userEvent.click(set);
      expect(onSetClickMock).toHaveBeenCalledTimes(1);
      // El mock simula el clic devolviendo el objeto
      expect(onSetClickMock).toHaveBeenCalledWith({
        set_id: mockPlayer.sets[0].set_id,
        name: mockPlayer.sets[0].name,
      });
    });

    it("should NOT be clickable if isSetSelectionStep is false", async () => {
      render(<You {...baseProps} isSetSelectionStep={false} />);
      const set = screen.getByTestId("set-component");
      await userEvent.click(set);
      expect(onSetClickMock).not.toHaveBeenCalled();
    });

    it("should pass isSelected to the correct set", () => {
      render(<You {...baseProps} selectedSet={mockPlayer.sets[0]} />);
      const set = screen.getByTestId("set-component");
      expect(set).toHaveAttribute("data-selected", "true");
    });
  });

  describe("Player Name Interaction", () => {
    it("should apply selectable and selected classes", () => {
      render(<You {...baseProps} selectable={true} isSelected={true} />);
      const name = screen.getByText("Ulises");
      expect(name).toHaveClass("selectable");
      expect(name).toHaveClass("selected");
    });

    it("should call onClick when selectable and clicked", async () => {
      render(<You {...baseProps} selectable={true} />);
      await userEvent.click(screen.getByText("Ulises"));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it("should NOT call onClick when not selectable", async () => {
      render(<You {...baseProps} selectable={false} />);
      await userEvent.click(screen.getByText("Ulises"));
      expect(onClickMock).not.toHaveBeenCalled();
    });
  });
});

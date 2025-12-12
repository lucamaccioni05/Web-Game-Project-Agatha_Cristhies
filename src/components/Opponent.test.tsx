/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Opponent from "./Opponent";
import { type PlayerStateResponse } from "../services/playerService";
import { type SetResponse } from "../services/setService";
import { type SecretResponse } from "../services/secretService";
import { type CardResponse } from "../services/cardService";

// Mocks de todos los componentes hijos
vi.mock("./Cards/Detectives", () => ({
  default: ({ name, shown, size }: any) => (
    <div data-testid="detective-card" data-shown={shown} data-size={size}>
      {name}
    </div>
  ),
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name, shown, size }: any) => (
    <div data-testid="event-card" data-shown={shown} data-size={size}>
      {name}
    </div>
  ),
}));
vi.mock("./Cards/Secret", () => ({
  default: ({ onClick, isSelected, mine, size, secret_id }: any) => (
    <button
      data-testid="secret-card"
      onClick={onClick}
      data-selected={isSelected}
      data-mine={mine}
      data-size={size}
      data-secret-id={secret_id}
    ></button>
  ),
}));
vi.mock("./Set", () => ({
  default: ({ name, onSetClick, isSelected, set_id }: any) => (
    <div
      data-testid="set-component"
      onClick={() => onSetClick && onSetClick({ set_id, name })}
      data-selected={isSelected}
      data-set-id={set_id}
    >
      {name}
    </div>
  ),
}));

describe("Opponent Component", () => {
  let onSetClickMock: ReturnType<typeof vi.fn>;
  let onSecretClickMock: ReturnType<typeof vi.fn>;
  let onClickMock: ReturnType<typeof vi.fn>;

  // Mock robusto con todas las propiedades necesarias
  const mockPlayer: PlayerStateResponse = {
    player_id: 2,
    name: "Oponente",
    host: false,
    game_id: 1,
    birth_date: "2000-01-01",
    social_disgrace: false,
    // CORREGIDO: de 'false' a 'null'
    pending_action: null,
    votes_received: 0,
    // ---
    cards: [
      {
        card_id: 3,
        type: "detective",
        name: "Poirot Op",
        game_id: 1,
        player_id: 2,
        picked_up: true,
        dropped: false,
      } as CardResponse,
      {
        card_id: 4,
        type: "event",
        name: "Ashes Op",
        game_id: 1,
        player_id: 2,
        picked_up: true,
        dropped: false,
      } as CardResponse,
    ],
    secrets: [
      {
        secret_id: 12,
        revelated: true,
        murderer: true,
        accomplice: false,
        game_id: 1,
      } as SecretResponse, // Secreto revelado
      {
        secret_id: 13,
        revelated: false,
        murderer: false,
        accomplice: false,
        game_id: 1,
      } as SecretResponse, // Secreto oculto
    ],
    sets: [
      {
        set_id: 21,
        name: "Set Oponente",
        detective: [],
        game_id: 1,
        player_id: 2,
      } as SetResponse,
    ],
  };

  const baseProps = {
    player: mockPlayer,
    isMyTurn: false,
    onSetClick: vi.fn(),
    selectedSet: null,
    isSetSelectionStep: false,
    onSecretClick: vi.fn(),
    selectedSecret: null,
    isSecretSelectionStep: false,
    onClick: vi.fn(),
    isSelected: false,
    selectable: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onSetClickMock = vi.fn();
    onSecretClickMock = vi.fn();
    onClickMock = vi.fn();
    baseProps.onSetClick = onSetClickMock;
    baseProps.onSecretClick = onSecretClickMock;
    baseProps.onClick = onClickMock;
  });

  it("should render name, cards, secrets, and sets", () => {
    render(<Opponent {...baseProps} />);
    expect(screen.getByText("Oponente")).toBeInTheDocument();
    expect(screen.getByText("Poirot Op")).toBeInTheDocument();
    expect(screen.getAllByTestId("secret-card")).toHaveLength(2);
    expect(screen.getByTestId("set-component")).toBeInTheDocument();
  });

  it("should apply 'myturn' class if isMyTurn is true", () => {
    render(<Opponent {...baseProps} isMyTurn={true} />);
    expect(screen.getByText("Oponente")).toHaveClass("myturn");
  });

  it("should render all hand cards as face down (shown=false) and mini", () => {
    render(<Opponent {...baseProps} />);
    const cards = [
      ...screen.getAllByTestId("detective-card"),
      ...screen.getAllByTestId("event-card"),
    ];
    expect(cards.length).toBe(2);
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-shown", "false");
      expect(card).toHaveAttribute("data-size", "mini");
    });
  });

  it("should render all secrets as not mine (mine=false) and mini", () => {
    render(<Opponent {...baseProps} />);
    const secrets = screen.getAllByTestId("secret-card");
    expect(secrets.length).toBe(2);
    secrets.forEach((secret) => {
      expect(secret).toHaveAttribute("data-mine", "false");
      expect(secret).toHaveAttribute("data-size", "mini");
    });
  });

  describe("Player Name Interaction", () => {
    it("should call onClick when selectable and clicked", async () => {
      render(<Opponent {...baseProps} selectable={true} />);
      await userEvent.click(screen.getByText("Oponente"));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it("should NOT call onClick when not selectable", async () => {
      render(<Opponent {...baseProps} selectable={false} />);
      await userEvent.click(screen.getByText("Oponente"));
      expect(onClickMock).not.toHaveBeenCalled();
    });
  });

  describe("Set Interaction", () => {
    it("should call onSetClick when isSetSelectionStep is true", async () => {
      render(<Opponent {...baseProps} isSetSelectionStep={true} />);
      await userEvent.click(screen.getByTestId("set-component"));
      expect(onSetClickMock).toHaveBeenCalledTimes(1);
    });

    it("should NOT be clickable if isSetSelectionStep is false", async () => {
      render(<Opponent {...baseProps} isSetSelectionStep={false} />);
      await userEvent.click(screen.getByTestId("set-component"));
      expect(onSetClickMock).not.toHaveBeenCalled();
    });
  });

  describe("Secret Interaction (isSecretClickable logic)", () => {
    it("should NOT be clickable if isSecretSelectionStep is false", async () => {
      render(<Opponent {...baseProps} isSecretSelectionStep={false} />);
      const secrets = screen.getAllByTestId("secret-card");
      await userEvent.click(secrets[0]); // Click revelado
      await userEvent.click(secrets[1]); // Click oculto
      expect(onSecretClickMock).not.toHaveBeenCalled();
    });

    it("SHOULD be clickable if isStep is true (for REVEALED secret)", async () => {
      render(<Opponent {...baseProps} isSecretSelectionStep={true} />);
      const revealedSecret = screen.getAllByTestId("secret-card")[0];
      await userEvent.click(revealedSecret);
      expect(onSecretClickMock).toHaveBeenCalledTimes(1);
      expect(onSecretClickMock).toHaveBeenCalledWith(mockPlayer.secrets[0]);
    });

    it("SHOULD be clickable if isStep is true (for UNREVEALED secret)", async () => {
      render(<Opponent {...baseProps} isSecretSelectionStep={true} />);
      const unrevealedSecret = screen.getAllByTestId("secret-card")[1];
      await userEvent.click(unrevealedSecret);
      expect(onSecretClickMock).toHaveBeenCalledTimes(1);
      expect(onSecretClickMock).toHaveBeenCalledWith(mockPlayer.secrets[1]);
    });

    it("should pass isSelected to the correct secret", () => {
      render(
        <Opponent {...baseProps} selectedSecret={mockPlayer.secrets[1]} />
      );
      const secret1 = screen.getAllByTestId("secret-card")[0];
      const secret2 = screen.getAllByTestId("secret-card")[1];
      expect(secret1).toHaveAttribute("data-selected", "false");
      expect(secret2).toHaveAttribute("data-selected", "true");
    });
  });
});

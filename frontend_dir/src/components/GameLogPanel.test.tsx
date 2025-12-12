/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameLogPanel } from "./GameLogPanel";

// Mock de todas las dependencias
import { useGameContext } from "../context/GameContext";
import secretService from "../services/secretService";
import playerService from "../services/playerService";
import eventService from "../services/eventService";
import logService from "../services/logService.ts";

// --- Mocks de Componentes Hijos ---
vi.mock("../containers/GamePage/TurnActions", () => ({
  default: () => <div data-testid="turn-actions"></div>,
}));
vi.mock("./TextType.tsx", () => ({
  default: ({ text }: { text: string[] }) => (
    <div data-testid="text-type">{text.join(" ")}</div>
  ),
}));
vi.mock("../containers/GamePage/TurnSteps/VoteStep.tsx", () => ({
  VoteStep: () => <div data-testid="vote-step"></div>,
}));
vi.mock("./LogMessage.tsx", () => ({
  LogMessage: ({ log }: any) => <div data-testid="log-message">{log.type}</div>,
}));

// --- Mocks de Servicios ---
vi.mock("../context/GameContext");
vi.mock("../services/secretService");
vi.mock("../services/playerService");
vi.mock("../services/eventService");
vi.mock("../services/logService");

// --- Variables de Mocks ---
let mockDispatch: ReturnType<typeof vi.fn>;
let mockState: any;
let mockCurrentPlayer: any;
let mockIsMyTurn: boolean;
let mockIsSocialDisgrace: boolean; // <-- Variable faltante

// Mocks de funciones de servicios
const mockRegisterCancelableEvent = vi.fn();
const mockRevealSecret = vi.fn();
const mockUnselectPlayer = vi.fn();
const mockCardTrade = vi.fn();
const mockActivateBlackmailed = vi.fn();
const mockFollyTrade = vi.fn();
const mockGetLogs = vi.fn();
const mockAlert = vi.fn();

describe("GameLogPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Estado base
    mockDispatch = vi.fn();
    mockIsMyTurn = false;
    mockIsSocialDisgrace = false; // <-- Inicialización
    mockCurrentPlayer = {
      player_id: 1,
      name: "Test Player",
      pending_action: null,
    };
    mockState = {
      myPlayerId: 1,
      selectedCard: null,
      selectedSecret: null,
      currentStep: "start",
      logs: [{ log_id: 1, type: "TestLog" }],
      game: { game_id: 100, direction_folly: null, current_turn: 1 },
      players: [
        mockCurrentPlayer,
        {
          player_id: 2,
          name: "Opponent",
          pending_action: null,
          turn_order: 2,
        },
      ],
    };

    // Mock de Context
    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
      isMyTurn: mockIsMyTurn,
      currentPlayer: mockCurrentPlayer,
      isSocialDisgrace: mockIsSocialDisgrace, // <-- CORRECCIÓN: Propiedad agregada
    });

    // Mock de Servicios
    vi.mocked(logService.registerCancelableEvent).mockImplementation(
      mockRegisterCancelableEvent
    );
    vi.mocked(logService.getLogs).mockImplementation(mockGetLogs);
    vi.mocked(secretService.revealSecret).mockImplementation(mockRevealSecret);
    vi.mocked(playerService.unselectPlayer).mockImplementation(
      mockUnselectPlayer
    );
    vi.mocked(eventService.cardTrade).mockImplementation(mockCardTrade);
    vi.mocked(eventService.activateBlackmailed).mockImplementation(
      mockActivateBlackmailed
    );
    vi.mocked(eventService.follyTrade).mockImplementation(mockFollyTrade);

    // Mock de Alert
    vi.stubGlobal("alert", mockAlert);
  });

  it("should render logs correctly", () => {
    mockGetLogs.mockResolvedValue([{ log_id: 1, type: "TestLog" }]);
    render(<GameLogPanel />);
    expect(screen.getByTestId("log-message")).toHaveTextContent("TestLog");
  });

  it("should render TurnActions if it is my turn and no pending action", () => {
    mockIsMyTurn = true;
    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
      isMyTurn: mockIsMyTurn,
      currentPlayer: mockCurrentPlayer,
      isSocialDisgrace: mockIsSocialDisgrace, // <-- CORRECCIÓN: Propiedad agregada
    });
    render(<GameLogPanel />);
    expect(screen.getByTestId("turn-actions")).toBeInTheDocument();
  });

  it("should render null if not my turn and no pending action", () => {
    mockIsMyTurn = false;
    const { container } = render(<GameLogPanel />);
    expect(container.querySelector(".action-window")).toBeEmptyDOMElement();
  });

  // --- Test de Prioridades (Pending Actions) ---

  describe("Not So Fast Prompt", () => {
    it("should render 'Not So Fast' prompt if card is selected", () => {
      mockState.selectedCard = { name: "Not so fast" };
      render(<GameLogPanel />);
      expect(screen.getByText("¿Jugar 'Not So Fast!'?")).toBeInTheDocument();
      expect(screen.queryByTestId("turn-actions")).not.toBeInTheDocument(); // Verifica prioridad
    });

    it("should call registerCancelableEvent on 'Confirmar'", async () => {
      mockState.selectedCard = { card_id: 99, name: "Not so fast" };
      mockRegisterCancelableEvent.mockResolvedValue(undefined);
      render(<GameLogPanel />);

      await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
      expect(logService.registerCancelableEvent).toHaveBeenCalledWith(99);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: null,
      });
    });

    it("should dispatch to clear selection on 'Cancelar'", async () => {
      mockState.selectedCard = { card_id: 99, name: "Not so fast" };
      render(<GameLogPanel />);
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(logService.registerCancelableEvent).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: null,
      });
    });
  });

  describe("Forced Actions (Pending Actions)", () => {
    it("should render 'isForcedToAct' (REVEAL_SECRET)", async () => {
      mockCurrentPlayer.pending_action = "REVEAL_SECRET";
      mockState.selectedSecret = { secret_id: 10, revelated: false }; // Secreto válido
      render(<GameLogPanel />);

      expect(
        screen.getByText(
          "Te han seleccionado. Debes revelar uno de tus secretos."
        )
      ).toBeInTheDocument();

      const button = screen.getByRole("button", { name: "Revelar Secreto" });
      expect(button).not.toBeDisabled();

      await userEvent.click(button);
      expect(secretService.revealSecret).toHaveBeenCalledWith(10);
      expect(playerService.unselectPlayer).toHaveBeenCalledWith(
        mockState.myPlayerId
      );
    });

    it("should render 'isForcedToSocialFauxPas'", async () => {
      mockCurrentPlayer.pending_action = "REVEAL_SOCIAL_FAUX_PAS_SECRET";
      mockState.selectedSecret = { secret_id: 10, revelated: false };
      render(<GameLogPanel />);

      expect(
        screen.getByText(
          "¡Social Faux Pas! Debes revelar un secreto de tu elección."
        )
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Revelar Secreto" })
      );
      expect(secretService.revealSecret).toHaveBeenCalledWith(10);
      expect(playerService.unselectPlayer).toHaveBeenCalledWith(
        mockState.myPlayerId
      );
    });

    it("should render 'isForcedToTrade' (SELECT_TRADE_CARD)", async () => {
      mockCurrentPlayer.pending_action = "SELECT_TRADE_CARD";
      mockState.selectedCard = { card_id: 5 };
      render(<GameLogPanel />);

      expect(
        screen.getByText("¡Intercambio! Selecciona una carta de tu mano...")
      ).toBeInTheDocument();
      const button = screen.getByRole("button", { name: "Confirmar Carta" });
      expect(button).not.toBeDisabled();

      await userEvent.click(button);
      expect(eventService.cardTrade).toHaveBeenCalledWith(1, 5);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: null,
      });
    });

    it("should render 'isForcedToTrade' (WAITING_FOR_TRADE_PARTNER)", () => {
      mockCurrentPlayer.pending_action = "WAITING_FOR_TRADE_PARTNER";
      render(<GameLogPanel />);

      expect(
        screen.getByText("Carta seleccionada. Esperando al otro jugador...")
      ).toBeInTheDocument();
      const button = screen.getByRole("button", { name: "Esperando..." });
      expect(button).toBeDisabled();
    });

    it("should render 'isForcedToChooseBlackmailed'", async () => {
      mockCurrentPlayer.pending_action = "CHOOSE_BLACKMAIL_SECRET";
      mockState.players[1].pending_action = "WAITING_FOR_BLACKMAIL"; // El chantajista
      mockState.selectedSecret = { secret_id: 10, revelated: false };
      render(<GameLogPanel />);

      expect(
        screen.getByText(
          "¡Te han chantajeado! Debes elegir uno de TUS secretos para mostrarle a Opponent."
        )
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Mostrar Secreto" })
      );
      expect(eventService.activateBlackmailed).toHaveBeenCalledWith(1, 2, 10);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_SECRET",
        payload: null,
      });
    });

    it("should render 'isForcedToTradeFolly'", async () => {
      mockCurrentPlayer.pending_action = "SELECT_FOLLY_CARD";
      mockState.game.direction_folly = "right";
      mockState.selectedCard = { card_id: 5 };
      render(<GameLogPanel />);

      expect(
        screen.getByText("¡Intercambio! Selecciona una carta de tu mano...")
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Confirmar Carta" })
      );
      expect(eventService.follyTrade).toHaveBeenCalledWith(1, 2, 5); // 1 (yo) -> 2 (oponente)
    });

    it("should render 'isForcedToVote'", () => {
      mockCurrentPlayer.pending_action = "VOTE";
      render(<GameLogPanel />);
      expect(screen.getByTestId("vote-step")).toBeInTheDocument();
    });
  });
});

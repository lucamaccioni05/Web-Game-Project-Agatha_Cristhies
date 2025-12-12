/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Gameboard from "./Gameboard";
// Mocks de Hooks
import { useGameContext } from "../../context/GameContext";
import { useGameWebSocket } from "../../hooks/useGameWebSocket";
import { useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";

// --- Mocks de Hooks ---
vi.mock("../../context/GameContext");
vi.mock("../../hooks/useGameWebSocket");
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));
vi.mock("../../navigation/destinations", () => ({
  default: {
    endGame: "/mock-endgame",
  },
}));

// --- Mocks de Componentes Hijos ---
vi.mock("../../components/Opponent", () => ({
  default: (props: any) => (
    <div data-testid="opponent">
      {/* CORRECCIÓN: Asegurarse de que las props se pasen antes de llamarlas */}
      <button onClick={() => props.onClick && props.onClick()}>
        Simulate Opponent Click
      </button>
      <button
        onClick={() => props.onSetClick && props.onSetClick({ set_id: 1 })}
      >
        Simulate Set Click
      </button>
      <button
        onClick={() =>
          props.onSecretClick && props.onSecretClick({ secret_id: 1 })
        }
      >
        Simulate Secret Click
      </button>
    </div>
  ),
}));
vi.mock("../../components/MyHand", () => ({
  default: (props: any) => (
    <div data-testid="you">
      <button
        onClick={() =>
          props.onCardsSelected &&
          props.onCardsSelected({ card_id: 1, name: "Test Card" })
        }
      >
        Simulate Card Click
      </button>
      <button
        onClick={() =>
          props.onCardsSelected &&
          props.onCardsSelected({ card_id: 99, name: "Not so fast" })
        }
      >
        Simulate NSF Click
      </button>
    </div>
  ),
}));
vi.mock("../../components/DraftPile", () => ({
  default: (props: any) => (
    <div data-testid="draft-pile">
      <button
        onClick={() =>
          props.onCardSelect && props.onCardSelect({ card_id: 100 })
        }
      >
        Simulate Draft Click
      </button>
    </div>
  ),
}));
vi.mock("../../components/BlackmailedModal", () => ({
  BlackmailedModal: () => <div data-testid="blackmailed-modal"></div>,
}));
vi.mock("../../components/Decks", () => ({
  default: () => <div data-testid="decks"></div>,
}));
vi.mock("../../components/GameLogPanel", () => ({
  GameLogPanel: () => <div data-testid="log-panel"></div>,
}));
vi.mock("../../components/Chat", () => ({
  Chat: () => <div data-testid="chat"></div>,
}));

// --- Variables de Mocks ---
let mockDispatch: ReturnType<typeof vi.fn>;
let mockState: any;
let mockCurrentPlayer: any;
let mockIsMyTurn: boolean;
let mockIsSocialDisgrace: boolean;
const mockNavigate = vi.fn();
const mockUseGameWebSocket = vi.fn();

describe("GameBoard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();
    mockIsMyTurn = false;
    mockIsSocialDisgrace = false;
    mockCurrentPlayer = {
      player_id: 1,
      name: "Test Player",
      pending_action: null,
    };
    mockState = {
      myPlayerId: 1,
      game: { game_id: 100, status: "in course" },
      // CORRECCIÓN: Agregamos un oponente para que 'distribution' funcione
      players: [
        mockCurrentPlayer,
        { player_id: 2, name: "Opponent", pending_action: null },
      ],
      discardPile: [],
      draftPile: [],
      currentStep: "start",
      selectedCard: null,
      selectedCardIds: [],
      selectedSecret: null,
      selectedSet: null,
      selectedTargetPlayer: null,
      blackmailedSecret: null,
      error: null,
    };

    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
      currentPlayer: mockCurrentPlayer,
      isMyTurn: mockIsMyTurn,
      isSocialDisgrace: mockIsSocialDisgrace,
    });

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useGameWebSocket).mockImplementation(mockUseGameWebSocket);
  });

  it("should render all main components", () => {
    render(<Gameboard />);
    expect(screen.getByTestId("opponent")).toBeInTheDocument(); // Ahora sí lo encuentra
    expect(screen.getByTestId("draft-pile")).toBeInTheDocument();
    expect(screen.getByTestId("decks")).toBeInTheDocument();
    expect(screen.getByTestId("you")).toBeInTheDocument();
    expect(screen.getByTestId("chat")).toBeInTheDocument();
    expect(screen.getByTestId("log-panel")).toBeInTheDocument();
  });

  it("should call useGameWebSocket with the game_id", () => {
    render(<Gameboard />);
    expect(mockUseGameWebSocket).toHaveBeenCalledWith(100);
  });

  describe("useEffects", () => {
    it("should navigate to endgame when game status is 'finished'", () => {
      mockState.game.status = "finished";
      render(<Gameboard />);
      expect(mockNavigate).toHaveBeenCalledWith(destinations.endGame, {
        replace: true,
        state: expect.anything(),
      });
    });

    it("should dispatch SET_STEP 'start' if not my turn", () => {
      mockIsMyTurn = false;
      render(<Gameboard />);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "start",
      });
    });

    it("should dispatch 'discard_op' if trade/folly step ends", () => {
      mockIsMyTurn = true; // Es mi turno
      mockState.currentStep = "wait_trade";
      mockCurrentPlayer.pending_action = "SELECT_TRADE_CARD";

      // CORRECCIÓN: Seteamos el contexto *con* isMyTurn = true
      vi.mocked(useGameContext).mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        currentPlayer: mockCurrentPlayer,
        isMyTurn: mockIsMyTurn,
        isSocialDisgrace: mockIsSocialDisgrace,
      });

      const { rerender } = render(<Gameboard />);
      mockDispatch.mockClear(); // Limpiamos el 'dispatch' del useEffect(isMyTurn)

      mockCurrentPlayer.pending_action = null; // El WS actualiza
      rerender(<Gameboard />);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("Event Handlers", () => {
    it("handleDraftSelect: should dispatch SET_SELECTED_CARD", async () => {
      render(<Gameboard />);
      await userEvent.click(screen.getByText("Simulate Draft Click"));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: { card_id: 100 },
      });
    });

    it("handleSelectPlayer: should dispatch SET_SELECTED_TARGET_PLAYER if step is valid", async () => {
      mockState.currentStep = "cards_off_the_table";
      render(<Gameboard />);
      // CORRECCIÓN: El botón ahora sí se renderiza
      await userEvent.click(screen.getByText("Simulate Opponent Click"));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_TARGET_PLAYER",
        payload: mockState.players[1], // el oponente
      });
    });

    it("handleSelectPlayer: should NOT dispatch if step is invalid", async () => {
      mockState.currentStep = "start";
      render(<Gameboard />);
      await userEvent.click(screen.getByText("Simulate Opponent Click"));
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_SELECTED_TARGET_PLAYER" })
      );
    });

    it("handleHandCardSelect: should dispatch SET_SELECTED_CARD for 'Not so fast'", async () => {
      render(<Gameboard />);
      await userEvent.click(screen.getByText("Simulate NSF Click"));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: { card_id: 99, name: "Not so fast" },
      });
    });

    it("handleHandCardSelect: should dispatch TOGGLE_HAND_CARD_ID for 'p_set' step", async () => {
      mockIsMyTurn = true; // CORRECCIÓN: Poner isMyTurn en true
      mockState.currentStep = "p_set";
      vi.mocked(useGameContext).mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        currentPlayer: mockCurrentPlayer,
        isMyTurn: mockIsMyTurn,
        isSocialDisgrace: mockIsSocialDisgrace,
      });

      render(<Gameboard />);
      await userEvent.click(screen.getByText("Simulate Card Click"));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "TOGGLE_HAND_CARD_ID",
        payload: 1,
      });
    });

    it("handleHandCardSelect: should dispatch SET_SELECTED_CARD for 'p_event' step", async () => {
      mockIsMyTurn = true; // CORRECCIÓN: Poner isMyTurn en true
      mockState.currentStep = "p_event";
      vi.mocked(useGameContext).mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        currentPlayer: mockCurrentPlayer,
        isMyTurn: mockIsMyTurn,
        isSocialDisgrace: mockIsSocialDisgrace,
      });

      render(<Gameboard />);
      await userEvent.click(screen.getByText("Simulate Card Click"));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: { card_id: 1, name: "Test Card" },
      });
    });
  });

  describe("Conditional Rendering", () => {
    it("should render error banner if state.error is set", () => {
      mockState.error = "Test Error Message";
      render(<Gameboard />);
      expect(screen.getByText("Test Error Message")).toBeInTheDocument();
    });

    it("should render BlackmailedModal if conditions are met", () => {
      mockState.blackmailedSecret = { player_id: 2 };
      mockState.players[0].pending_action = "BLACKMAILED";
      mockCurrentPlayer = mockState.players[0];

      vi.mocked(useGameContext).mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        currentPlayer: mockCurrentPlayer,
        isMyTurn: mockIsMyTurn,
        isSocialDisgrace: mockIsSocialDisgrace,
      });

      render(<Gameboard />);
      expect(screen.getByTestId("blackmailed-modal")).toBeInTheDocument();
    });

    it("should NOT render BlackmailedModal if not involved", () => {
      mockState.blackmailedSecret = { player_id: 2 };
      render(<Gameboard />);
      expect(screen.queryByTestId("blackmailed-modal")).not.toBeInTheDocument();
    });
  });
});

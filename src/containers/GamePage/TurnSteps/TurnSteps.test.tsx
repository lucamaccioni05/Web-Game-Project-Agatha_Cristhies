/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 1. IMPORTAR TODOS LOS COMPONENTES A TESTEAR
import { AddDetectiveStep } from "./AddDetectiveStep";
import { AndThenThereWasOneMoreStep } from "./AndThenThereWasOneMoreStep";
import { AnotherVictimStep } from "./AnotherVictimStep";
import { CardsOffTableStep } from "./CardsOffTableStep";
import { CardTradeStep } from "./CardTradeStep";
import { DeadCardFollyStep } from "./DeadCardFollyStep";
import { DelayEscapeStep } from "./DelayEscapeStep";
import { DiscardStep } from "./DiscardStep";
import { DrawStep } from "./DrawStep";
import { HideSecretStep } from "./HideSecretStep";
import { LookIntoAshesStep } from "./LookIntoAshesStep";
import { PlayEventStep } from "./PlayEventStep";
import { PlaySetStep } from "./PlaySetStep";
import { PointYourSuspicionsStep } from "./PointYourSuspicionsStep";
import { RevealSecretStep } from "./RevealSecretStep";
import { SelectPlayerRevealStep } from "./SelectPlayerRevealStep";
import { StartStep } from "./StartStep";
import { VoteStep } from "./VoteStep";
import { WaitEventResolutionStep } from "./WaitEventResolutionStep";
import { WaitingVotingToEndStep } from "./WaitingVotingToEndStep";
import { WaitRevealStep } from "./WaitRevealStep";
import { WaitSetResolutionStep } from "./WaitSetResolutionStep";
import { WaitTradeFollyStep } from "./WaitTradeFollyStep";
import { WaitTradeStep } from "./WaitTradeStep";

// 2. IMPORTAR CONTEXT Y TODOS LOS HOOKS PARA MOCKEARLOS
import { useGameContext } from "../../../context/GameContext";
import { useAddDetective } from "./useAddDetective";
import { useAndThenThereWasOneMore } from "./useAndThenThereWasOneMore";
import { useAnotherVictim } from "./useAnotherVictim";
import { useCardsOffTable } from "./useCardsOffTable";
import { useCardTrade } from "./useCardTrade";
import { useDeadCardFolly } from "./useDeadCardFolly";
import { useDelayEscape } from "./useDelayEscape";
import { useDiscard } from "./useDiscard";
import { useDraw } from "./useDraw";
import { useHideSecret } from "./useHideSecret";
import { useLookIntoAshes } from "./useLookIntoAshes";
import { usePlayEvent } from "./usePlayEvent";
import { usePlaySet } from "./usePlaySet";
import { usePointYourSuspicions } from "./usePointYourSuspicions";
import { useRevealSecret } from "./useRevealSecret";
import { useSelectPlayerReveal } from "./useSelectPlayerReveal";
import { useVote } from "./useVote";
import { useWaitEventResolution } from "./useWaitEventResolution";
import { useWaitingVotingToEnd } from "./useWaitingVotingToEnd";
import { useWaitReveal } from "./useWaitReveal";
import { useWaitSetResolution } from "./useWaitSetResolution";
import { useWaitTradeFolly } from "./useWaitTradeFolly";
import { useWaitTrade } from "./useWaitTrade";

// ===================================================================
// 3. MOCKS GLOBALES
// ===================================================================

// Mock de Componentes Hijos
// CAMBIO 1: El componente 'TextType' recibe un string, no un array.
vi.mock("../../../components/TextType", () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="text-type">{text}</div>
  ),
}));
vi.mock("../../../components/Cards/Detectives", () => ({
  default: (props: any) => (
    <div data-testid="detective-card" data-card-id={props.card_id} />
  ),
}));
vi.mock("../../../components/Cards/Events", () => ({
  default: (props: any) => (
    <div data-testid="event-card" data-card-id={props.card_id} />
  ),
}));

// Mock del Contexto Global
vi.mock("../../../context/GameContext");
let mockGameState: any; // Estado global reseteable
const mockDispatch = vi.fn();

// Mocks de TODOS los hooks personalizados
vi.mock("./useAddDetective");
vi.mock("./useAndThenThereWasOneMore");
vi.mock("./useAnotherVictim");
vi.mock("./useCardsOffTable");
vi.mock("./useCardTrade");
vi.mock("./useDeadCardFolly");
vi.mock("./useDelayEscape");
vi.mock("./useDiscard");
vi.mock("./useDraw");
vi.mock("./useHideSecret");
vi.mock("./useLookIntoAshes");
vi.mock("./usePlayEvent");
vi.mock("./usePlaySet");
vi.mock("./usePointYourSuspicions");
vi.mock("./useRevealSecret");
vi.mock("./useSelectPlayerReveal");
vi.mock("./useVote");
vi.mock("./useWaitEventResolution");
vi.mock("./useWaitingVotingToEnd");
vi.mock("./useWaitReveal");
vi.mock("./useWaitSetResolution");
vi.mock("./useWaitTradeFolly");
vi.mock("./useWaitTrade");

// ===================================================================
// 4. DECLARACIÓN DE MOCKS DE HOOKS (para espiar llamadas)
// ===================================================================
// Declaramos todas las funciones y estados mockeados aquí
// para que sean accesibles en el `beforeEach` y en los `it`

// useAddDetective
let mockAddDetective: ReturnType<typeof vi.fn>;
let mockCancelAddDetective: ReturnType<typeof vi.fn>;
let mockAddDetectiveState: { lock: boolean; message: string | null };

// useAndThenThereWasOneMore
let mockAndThen: ReturnType<typeof vi.fn>;
let mockCancelAndThen: ReturnType<typeof vi.fn>;
let mockAndThenState: { lock: boolean; message: string | null };

// useAnotherVictim
let mockStealSet: ReturnType<typeof vi.fn>;
let mockCancelStealSet: ReturnType<typeof vi.fn>;
let mockStealSetState: { lock: boolean; message: string | null };

// useCardsOffTable
let mockCardsOff: ReturnType<typeof vi.fn>;
let mockCancelCardsOff: ReturnType<typeof vi.fn>;
let mockSetMessageCardsOff: ReturnType<typeof vi.fn>;
let mockCardsOffState: { lock: boolean; message: string | null };

// useCardTrade
let mockConfirmCardTrade: ReturnType<typeof vi.fn>;
let mockCardTradeState: { lock: boolean; message: string | null };

// useDeadCardFolly
let mockConfirmDeadCardFolly: ReturnType<typeof vi.fn>;
let mockDeadCardFollyState: { lock: boolean; message: string | null };

// useDelayEscape
let mockDelayEscape: ReturnType<typeof vi.fn>;
let mockHandleDiscardSelect: ReturnType<typeof vi.fn>;
let mockCancelDelayEscape: ReturnType<typeof vi.fn>;
let mockDelayEscapeState: {
  lock: boolean;
  message: string | null;
  selectedDiscardIds: number[];
};

// useDiscard
let mockDiscardSelected: ReturnType<typeof vi.fn>;
let mockCancelDiscard: ReturnType<typeof vi.fn>;
let mockSkipDiscard: ReturnType<typeof vi.fn>;
let mockDiscardState: { lock: boolean; message: string | null };

// useDraw
let mockDrawFromDeck: ReturnType<typeof vi.fn>;
let mockDrawDraft: ReturnType<typeof vi.fn>;
let mockEndTurn: ReturnType<typeof vi.fn>;
let mockDrawState: {
  drawing: boolean;
  message: string | null;
  cardCount: number;
};

// useHideSecret
let mockHideSecret: ReturnType<typeof vi.fn>;
let mockHideSecretState: { lock: boolean; message: string | null };

// useLookIntoAshes
let mockPickUpFromDiscard: ReturnType<typeof vi.fn>;
let mockHandleDiscardSelectAshes: ReturnType<typeof vi.fn>;
let mockCancelAshes: ReturnType<typeof vi.fn>;
let mockAshesState: { lock: boolean; message: string | null };

// usePlayEvent
let mockPlayEvent: ReturnType<typeof vi.fn>;
let mockCancelPlayEvent: ReturnType<typeof vi.fn>;
let mockPlayEventState: { lock: boolean; message: string | null };

// usePlaySet
let mockPlaySet: ReturnType<typeof vi.fn>;
let mockCancelPlaySet: ReturnType<typeof vi.fn>;
let mockPlaySetState: { lock: boolean; message: string | null };

// usePointYourSuspicions
let mockPointSuspicions: ReturnType<typeof vi.fn>;
let mockCancelPointSuspicions: ReturnType<typeof vi.fn>;
let mockPointSuspicionsState: { lock: boolean; message: string | null };

// useRevealSecret
let mockRevealSecret: ReturnType<typeof vi.fn>;
let mockRevealSecretState: { lock: boolean; message: string | null };

// useSelectPlayerReveal
let mockConfirmPlayerReveal: ReturnType<typeof vi.fn>;
let mockSelectPlayerRevealState: { lock: boolean; message: string | null };

// useVote
let mockHandleVote: ReturnType<typeof vi.fn>;
let mockVoteState: { lock: boolean; message: string | null; voted: boolean };

// Hooks que solo tienen lógica (sin funciones que llamar)
let mockWaitEventResolution: ReturnType<typeof vi.fn>;
let mockWaitingVotingToEnd: ReturnType<typeof vi.fn>;
let mockWaitReveal: ReturnType<typeof vi.fn>;
let mockWaitSetResolution: ReturnType<typeof vi.fn>;
let mockWaitTradeFolly: ReturnType<typeof vi.fn>;
let mockWaitTrade: ReturnType<typeof vi.fn>;

// ===================================================================
// 5. SETUP GLOBAL
// ===================================================================
beforeEach(() => {
  vi.clearAllMocks();

  // Resetear el estado global mockeado
  mockGameState = {
    selectedCard: null,
    selectedTargetPlayer: null,
    selectedSecret: null,
    selectedSet: null,
    discardPile: [],
    players: [],
    game: {
      direction_folly: null,
    },
    currentStep: "start",
  };
  (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
    state: mockGameState,
    dispatch: mockDispatch,
    isSocialDisgrace: false,
  });

  // Inicializar todos los mocks de hooks
  mockAddDetective = vi.fn();
  mockCancelAddDetective = vi.fn();
  mockAddDetectiveState = { lock: false, message: null };
  (useAddDetective as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockAddDetectiveState,
    addDetective: mockAddDetective,
    cancel: mockCancelAddDetective,
  }));

  mockAndThen = vi.fn();
  mockCancelAndThen = vi.fn();
  mockAndThenState = { lock: false, message: null };
  (useAndThenThereWasOneMore as ReturnType<typeof vi.fn>).mockImplementation(
    () => ({
      ...mockAndThenState,
      andThenThereWasOneMore: mockAndThen,
      cancel: mockCancelAndThen,
    })
  );

  mockStealSet = vi.fn();
  mockCancelStealSet = vi.fn();
  mockStealSetState = { lock: false, message: null };
  (useAnotherVictim as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockStealSetState,
    stealSet: mockStealSet,
    cancel: mockCancelStealSet,
  }));

  mockCardsOff = vi.fn();
  mockCancelCardsOff = vi.fn();
  mockSetMessageCardsOff = vi.fn();
  mockCardsOffState = { lock: false, message: null };
  (useCardsOffTable as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockCardsOffState,
    cardsOffTheTable: mockCardsOff,
    cancel: mockCancelCardsOff,
    setMessage: mockSetMessageCardsOff,
  }));

  mockConfirmCardTrade = vi.fn();
  mockCardTradeState = { lock: false, message: null };
  (useCardTrade as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockCardTradeState,
    confirmCardTrade: mockConfirmCardTrade,
  }));

  mockConfirmDeadCardFolly = vi.fn();
  mockDeadCardFollyState = { lock: false, message: null };
  (useDeadCardFolly as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockDeadCardFollyState,
    confirmDeadCardFolly: mockConfirmDeadCardFolly,
  }));

  mockDelayEscape = vi.fn();
  mockHandleDiscardSelect = vi.fn();
  mockCancelDelayEscape = vi.fn();
  mockDelayEscapeState = { lock: false, message: null, selectedDiscardIds: [] };
  (useDelayEscape as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockDelayEscapeState,
    delayEscape: mockDelayEscape,
    handleDiscardCardSelect: mockHandleDiscardSelect,
    cancel: mockCancelDelayEscape,
  }));

  mockDiscardSelected = vi.fn();
  mockCancelDiscard = vi.fn();
  mockSkipDiscard = vi.fn();
  mockDiscardState = { lock: false, message: null };
  (useDiscard as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockDiscardState,
    discardSelected: mockDiscardSelected,
    cancel: mockCancelDiscard,
    skipDiscard: mockSkipDiscard,
  }));

  mockDrawFromDeck = vi.fn();
  mockDrawDraft = vi.fn();
  mockEndTurn = vi.fn();
  mockDrawState = { drawing: false, message: null, cardCount: 0 };
  (useDraw as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockDrawState,
    drawFromDeck: mockDrawFromDeck,
    drawDraft: mockDrawDraft,
    endTurn: mockEndTurn,
  }));

  mockHideSecret = vi.fn();
  mockHideSecretState = { lock: false, message: null };
  (useHideSecret as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockHideSecretState,
    hideSecret: mockHideSecret,
  }));

  mockPickUpFromDiscard = vi.fn();
  mockHandleDiscardSelectAshes = vi.fn();
  mockCancelAshes = vi.fn();
  mockAshesState = { lock: false, message: null };
  (useLookIntoAshes as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockAshesState,
    pickUpFromDiscard: mockPickUpFromDiscard,
    handleDiscardCardSelect: mockHandleDiscardSelectAshes,
    cancel: mockCancelAshes,
  }));

  mockPlayEvent = vi.fn();
  mockCancelPlayEvent = vi.fn();
  mockPlayEventState = { lock: false, message: null };
  (usePlayEvent as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockPlayEventState,
    playEvent: mockPlayEvent,
    cancel: mockCancelPlayEvent,
  }));

  mockPlaySet = vi.fn();
  mockCancelPlaySet = vi.fn();
  mockPlaySetState = { lock: false, message: null };
  (usePlaySet as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockPlaySetState,
    playSet: mockPlaySet,
    cancel: mockCancelPlaySet,
  }));

  mockPointSuspicions = vi.fn();
  mockCancelPointSuspicions = vi.fn();
  mockPointSuspicionsState = { lock: false, message: null };
  (usePointYourSuspicions as ReturnType<typeof vi.fn>).mockImplementation(
    () => ({
      ...mockPointSuspicionsState,
      PointYourSuspicions: mockPointSuspicions,
      cancel: mockCancelPointSuspicions,
    })
  );

  mockRevealSecret = vi.fn();
  mockRevealSecretState = { lock: false, message: null };
  (useRevealSecret as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockRevealSecretState,
    revealSecret: mockRevealSecret,
  }));

  mockConfirmPlayerReveal = vi.fn();
  mockSelectPlayerRevealState = { lock: false, message: null };
  (useSelectPlayerReveal as ReturnType<typeof vi.fn>).mockImplementation(
    () => ({
      ...mockSelectPlayerRevealState,
      confirmPlayerReveal: mockConfirmPlayerReveal,
    })
  );

  mockHandleVote = vi.fn();
  mockVoteState = { lock: false, message: null, voted: false };
  (useVote as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...mockVoteState,
    handleVote: mockHandleVote,
  }));

  // Mocks para hooks de "espera"
  mockWaitEventResolution = vi.fn();
  mockWaitingVotingToEnd = vi.fn();
  mockWaitReveal = vi.fn();
  mockWaitSetResolution = vi.fn();
  mockWaitTradeFolly = vi.fn();
  mockWaitTrade = vi.fn();
  (useWaitEventResolution as ReturnType<typeof vi.fn>).mockImplementation(
    mockWaitEventResolution
  );
  (useWaitingVotingToEnd as ReturnType<typeof vi.fn>).mockImplementation(
    mockWaitingVotingToEnd
  );
  (useWaitReveal as ReturnType<typeof vi.fn>).mockImplementation(
    mockWaitReveal
  );
  (useWaitSetResolution as ReturnType<typeof vi.fn>).mockImplementation(
    mockWaitSetResolution
  );
  (useWaitTradeFolly as ReturnType<typeof vi.fn>).mockImplementation(
    mockWaitTradeFolly
  );
  (useWaitTrade as ReturnType<typeof vi.fn>).mockImplementation(mockWaitTrade);
});

// ===================================================================
// 6. LOS TESTS (FINALMENTE)
// ===================================================================

describe("TurnSteps Components", () => {
  // --- 1. AddDetectiveStep ---
  describe("AddDetectiveStep", () => {
    it("renders text and buttons, and calls hook functions", async () => {
      render(<AddDetectiveStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Selecciona una carta de detective y tu set a potenciar."
      );

      const addButton = screen.getByRole("button", { name: "Añadir a Set" });
      const backButton = screen.getByRole("button", { name: "Volver" });

      await userEvent.click(addButton);
      expect(mockAddDetective).toHaveBeenCalledTimes(1);

      await userEvent.click(backButton);
      expect(mockCancelAddDetective).toHaveBeenCalledTimes(1);
    });

    it("disables button when lock is true", () => {
      mockAddDetectiveState.lock = true;
      render(<AddDetectiveStep />);
      expect(
        screen.getByRole("button", { name: "Añadir a Set" })
      ).toBeDisabled();
    });

    it("renders message", () => {
      mockAddDetectiveState.message = "Test Message";
      render(<AddDetectiveStep />);
      expect(screen.getByText("Test Message")).toBeInTheDocument();
    });
  });

  // --- 2. AndThenThereWasOneMoreStep ---
  describe("AndThenThereWasOneMoreStep", () => {
    it("renders 'select player' text initially", () => {
      render(<AndThenThereWasOneMoreStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Clickee el nombre de un jugador que recibirá el secreto."
      );
      expect(
        screen.getByRole("button", { name: "Ejecutar Evento" })
      ).toBeDisabled();
    });

    it("renders 'select secret' text when player is selected", () => {
      mockGameState.selectedTargetPlayer = { name: "Test Player" };
      render(<AndThenThereWasOneMoreStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Seleccione un secreto revelado para ocultar."
      );
      expect(
        screen.getByRole("button", { name: "Ejecutar Evento" })
      ).toBeDisabled(); // Aún falta el secreto
    });

    it("enables button when player and revealed secret are selected", async () => {
      mockGameState.selectedTargetPlayer = { name: "Test Player" };
      mockGameState.selectedSecret = { revelated: true };
      render(<AndThenThereWasOneMoreStep />);

      const button = screen.getByRole("button", { name: "Ejecutar Evento" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockAndThen).toHaveBeenCalledTimes(1);
    });

    it("disables button if secret is not revealed", () => {
      mockGameState.selectedTargetPlayer = { name: "Test Player" };
      mockGameState.selectedSecret = { revelated: false }; // No revelado
      render(<AndThenThereWasOneMoreStep />);
      expect(
        screen.getByRole("button", { name: "Ejecutar Evento" })
      ).toBeDisabled();
    });
  });

  // --- 3. AnotherVictimStep ---
  describe("AnotherVictimStep", () => {
    it("renders text and disables button if no set selected", () => {
      render(<AnotherVictimStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Seleccione un set para robar"
      );
      expect(screen.getByRole("button", { name: "Robar" })).toBeDisabled();
    });

    it("enables button and calls hook when set is selected", async () => {
      mockGameState.selectedSet = { set_id: 1 };
      render(<AnotherVictimStep />);
      const button = screen.getByRole("button", { name: "Robar" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockStealSet).toHaveBeenCalledTimes(1);
    });
  });

  // --- 4. CardsOffTableStep ---
  describe("CardsOffTableStep", () => {
    // CAMBIO 2: Este test ahora solo comprueba que el botón esté deshabilitado.
    it("disables button if no player selected", async () => {
      render(<CardsOffTableStep />);
      const button = screen.getByRole("button", { name: "Ejecutar Evento" });
      expect(button).toBeDisabled();
      // Se eliminó el clic y la expectativa de 'mockSetMessageCardsOff'
    });

    it("enables button and calls hook when player is selected", async () => {
      mockGameState.selectedTargetPlayer = { player_id: 2 };
      render(<CardsOffTableStep />);
      const button = screen.getByRole("button", { name: "Ejecutar Evento" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockCardsOff).toHaveBeenCalledTimes(1);
      expect(mockSetMessageCardsOff).not.toHaveBeenCalled();
    });
  });

  // --- 5. CardTradeStep ---
  describe("CardTradeStep", () => {
    it("disables button if no player selected", () => {
      render(<CardTradeStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Selecciona un jugador con quien intercambiar una carta"
      );
      expect(
        screen.getByRole("button", { name: "Confirmar Intercambio" })
      ).toBeDisabled();
    });

    it("enables button and calls hook when player is selected", async () => {
      mockGameState.selectedTargetPlayer = { player_id: 2 };
      render(<CardTradeStep />);
      const button = screen.getByRole("button", {
        name: "Confirmar Intercambio",
      });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockConfirmCardTrade).toHaveBeenCalledTimes(1);
    });
  });

  // --- 6. DeadCardFollyStep ---
  describe("DeadCardFollyStep", () => {
    it("calls hook with 'left' when Izquierda is clicked", async () => {
      render(<DeadCardFollyStep />);
      await userEvent.click(screen.getByRole("button", { name: "Izquierda" }));
      expect(mockConfirmDeadCardFolly).toHaveBeenCalledWith("left");
    });

    it("calls hook with 'right' when Derecha is clicked", async () => {
      render(<DeadCardFollyStep />);
      await userEvent.click(screen.getByRole("button", { name: "Derecha" }));
      expect(mockConfirmDeadCardFolly).toHaveBeenCalledWith("right");
    });
  });

  // --- 7. DelayEscapeStep ---
  describe("DelayEscapeStep", () => {
    beforeEach(() => {
      mockGameState.discardPile = [
        { card_id: 1, type: "detective", name: "Poirot" },
        { card_id: 2, type: "event", name: "Ashes" },
      ];
    });

    it("renders discard pile and disables button", () => {
      render(<DelayEscapeStep />);
      expect(screen.getAllByTestId("detective-card")).toHaveLength(1);
      expect(screen.getAllByTestId("event-card")).toHaveLength(1);
      expect(
        screen.getByRole("button", { name: "Devolver 0 Cartas" })
      ).toBeDisabled();
    });

    it("enables button when cards are selected", async () => {
      mockDelayEscapeState.selectedDiscardIds = [1];
      render(<DelayEscapeStep />);
      const button = screen.getByRole("button", { name: "Devolver 1 Cartas" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockDelayEscape).toHaveBeenCalledTimes(1);
    });

    it("calls card select hook on card click", async () => {
      render(<DelayEscapeStep />);
      const card = screen.getByTestId("detective-card");
      await userEvent.click(card.parentElement!);
      expect(mockHandleDiscardSelect).toHaveBeenCalledWith(1);
    });
  });

  // --- 8. DiscardStep ---
  describe("DiscardStep", () => {
    it("renders standard discard text", () => {
      mockGameState.currentStep = "discard";
      render(<DiscardStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Selecciona una o más cartas para descartar"
      );
      expect(
        screen.getByRole("button", { name: "No Descartar" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Volver" })
      ).not.toBeInTheDocument();
    });

    it("renders skip/social disgrace text", () => {
      mockGameState.currentStep = "discard_skip";
      render(<DiscardStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Debes descartar una o más cartas"
      );
      expect(
        screen.queryByRole("button", { name: "No Descartar" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Volver" })
      ).toBeInTheDocument();
    });

    it("hides 'Volver' button if social disgrace is true", () => {
      mockGameState.currentStep = "discard_skip";
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: mockGameState,
        dispatch: mockDispatch,
        isSocialDisgrace: true,
      });
      render(<DiscardStep />);
      expect(
        screen.queryByRole("button", { name: "Volver" })
      ).not.toBeInTheDocument();
    });

    it("calls correct hook functions", async () => {
      mockGameState.currentStep = "discard";
      render(<DiscardStep />);
      await userEvent.click(
        screen.getByRole("button", { name: "Descartar Selección" })
      );
      expect(mockDiscardSelected).toHaveBeenCalledTimes(1);

      await userEvent.click(
        screen.getByRole("button", { name: "No Descartar" })
      );
      expect(mockSkipDiscard).toHaveBeenCalledTimes(1);
    });
  });

  // --- 9. DrawStep ---
  describe("DrawStep", () => {
    it("renders draw buttons if cardCount < 6", () => {
      mockDrawState.cardCount = 4;
      render(<DrawStep />);
      expect(
        screen.getByRole("button", { name: "Robar Mazo Principal" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Robar Mazo Draft" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Finalizar Turno" })
      ).not.toBeInTheDocument();
    });

    it("renders end turn button if cardCount >= 6", () => {
      mockDrawState.cardCount = 6;
      render(<DrawStep />);
      expect(
        screen.queryByRole("button", { name: "Robar Mazo Principal" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Robar Mazo Draft" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Finalizar Turno" })
      ).toBeInTheDocument();
    });

    it("disables draft button if no card selected", () => {
      mockDrawState.cardCount = 4;
      mockGameState.selectedCard = null;
      render(<DrawStep />);
      expect(
        screen.getByRole("button", { name: "Robar Mazo Draft" })
      ).toBeDisabled();
    });

    it("enables draft button if card selected", async () => {
      mockDrawState.cardCount = 4;
      mockGameState.selectedCard = { card_id: 1 };
      render(<DrawStep />);
      const draftButton = screen.getByRole("button", {
        name: "Robar Mazo Draft",
      });
      expect(draftButton).not.toBeDisabled();
      await userEvent.click(draftButton);
      expect(mockDrawDraft).toHaveBeenCalledTimes(1);
    });
  });

  // --- 10. HideSecretStep ---
  describe("HideSecretStep", () => {
    it("disables button if no secret selected", () => {
      render(<HideSecretStep />);
      expect(screen.getByRole("button", { name: "Ocultar" })).toBeDisabled();
    });

    it("enables button and calls hook when secret is selected", async () => {
      mockGameState.selectedSecret = { secret_id: 1 };
      render(<HideSecretStep />);
      const button = screen.getByRole("button", { name: "Ocultar" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockHideSecret).toHaveBeenCalledTimes(1);
    });
  });

  // --- 11. LookIntoAshesStep ---
  describe("LookIntoAshesStep", () => {
    beforeEach(() => {
      mockGameState.discardPile = [
        { card_id: 1, type: "detective", name: "Poirot" },
      ];
    });

    it("renders discard pile and disables button", () => {
      render(<LookIntoAshesStep />);
      expect(screen.getByTestId("detective-card")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Robar Carta" })
      ).toBeDisabled();
    });

    it("enables button when card is selected", async () => {
      mockGameState.selectedCard = { card_id: 1 };
      render(<LookIntoAshesStep />);
      const button = screen.getByRole("button", { name: "Robar Carta" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockPickUpFromDiscard).toHaveBeenCalledTimes(1);
    });

    it("calls card select hook on card click", async () => {
      render(<LookIntoAshesStep />);
      const card = screen.getByTestId("detective-card");
      await userEvent.click(card.parentElement!);
      expect(mockHandleDiscardSelectAshes).toHaveBeenCalledWith(1);
    });
  });

  // --- 12. PlayEventStep ---
  describe("PlayEventStep", () => {
    it("renders and calls hook functions", async () => {
      render(<PlayEventStep />);
      const playButton = screen.getByRole("button", {
        name: "Jugar Evento Seleccionado",
      });
      const backButton = screen.getByRole("button", { name: "Volver" });

      await userEvent.click(playButton);
      expect(mockPlayEvent).toHaveBeenCalledTimes(1);
      await userEvent.click(backButton);
      expect(mockCancelPlayEvent).toHaveBeenCalledTimes(1);
    });
  });

  // --- 13. PlaySetStep ---
  describe("PlaySetStep", () => {
    it("renders and calls hook functions", async () => {
      render(<PlaySetStep />);
      const playButton = screen.getByRole("button", { name: "Jugar Set" });
      const backButton = screen.getByRole("button", { name: "Volver" });

      await userEvent.click(playButton);
      expect(mockPlaySet).toHaveBeenCalledTimes(1);
      await userEvent.click(backButton);
      expect(mockCancelPlaySet).toHaveBeenCalledTimes(1);
    });
  });

  // --- 14. PointYourSuspicionsStep ---
  describe("PointYourSuspicionsStep", () => {
    it("renders and calls hook functions", async () => {
      render(<PointYourSuspicionsStep />);
      const advanceButton = screen.getByRole("button", { name: "Avanzar" });
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });

      await userEvent.click(advanceButton);
      expect(mockPointSuspicions).toHaveBeenCalledTimes(1);
      await userEvent.click(cancelButton);
      expect(mockCancelPointSuspicions).toHaveBeenCalledTimes(1);
    });
  });

  // --- 15. RevealSecretStep ---
  describe("RevealSecretStep", () => {
    it("disables button if no secret selected", () => {
      render(<RevealSecretStep />);
      expect(screen.getByRole("button", { name: "Revelar" })).toBeDisabled();
    });

    it("enables button and calls hook when secret is selected", async () => {
      mockGameState.selectedSecret = { secret_id: 1 };
      render(<RevealSecretStep />);
      const button = screen.getByRole("button", { name: "Revelar" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockRevealSecret).toHaveBeenCalledTimes(1);
    });
  });

  // --- 16. SelectPlayerRevealStep ---
  describe("SelectPlayerRevealStep", () => {
    it("disables button if no player selected", () => {
      render(<SelectPlayerRevealStep />);
      expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    });

    it("enables button and calls hook when player is selected", async () => {
      mockGameState.selectedTargetPlayer = { player_id: 2 };
      render(<SelectPlayerRevealStep />);
      const button = screen.getByRole("button", { name: "Confirmar" });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(mockConfirmPlayerReveal).toHaveBeenCalledTimes(1);
    });
  });

  // --- 17. StartStep ---
  describe("StartStep", () => {
    it("renders all actions", () => {
      render(<StartStep />);
      expect(
        screen.getByRole("button", { name: "Bajar Set" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Añadir Detective" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Jugar Evento" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Saltear" })
      ).toBeInTheDocument();
    });

    it("dispatches correct actions on click", async () => {
      render(<StartStep />);
      await userEvent.click(screen.getByRole("button", { name: "Bajar Set" }));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "p_set",
      });

      await userEvent.click(
        screen.getByRole("button", { name: "Añadir Detective" })
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "add_detective",
      });

      await userEvent.click(
        screen.getByRole("button", { name: "Jugar Evento" })
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "p_event",
      });

      await userEvent.click(screen.getByRole("button", { name: "Saltear" }));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_skip",
      });
    });
  });

  // --- 18. VoteStep ---
  describe("VoteStep", () => {
    beforeEach(() => {
      mockGameState.players = [
        { player_id: 1, name: "Ulises" },
        { player_id: 2, name: "Oponente" },
      ];
    });

    it("renders vote buttons if not voted", () => {
      mockVoteState.voted = false;
      render(<VoteStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Elige a quién votar"
      );
      expect(
        screen.getByRole("button", { name: "Ulises" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Oponente" })
      ).toBeInTheDocument();
    });

    it("calls handleVote on click", async () => {
      mockVoteState.voted = false;
      render(<VoteStep />);
      await userEvent.click(screen.getByRole("button", { name: "Oponente" }));
      expect(mockHandleVote).toHaveBeenCalledWith(2);
    });

    it("renders waiting text if voted", () => {
      mockVoteState.voted = true;
      render(<VoteStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Has votado. Esperando resultados..."
      );
      expect(
        screen.queryByRole("button", { name: "Ulises" })
      ).not.toBeInTheDocument();
    });
  });

  // --- 19. WaitEventResolutionStep ---
  describe("WaitEventResolutionStep", () => {
    it("renders null and calls hook", () => {
      const { container } = render(<WaitEventResolutionStep />);
      expect(container.firstChild).toBeNull();
      expect(mockWaitEventResolution).toHaveBeenCalledTimes(1);
    });
  });

  // --- 20. WaitingVotingToEndStep ---
  describe("WaitingVotingToEndStep", () => {
    it("renders text and calls hook", () => {
      render(<WaitingVotingToEndStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Votación en progreso..."
      );
      expect(mockWaitingVotingToEnd).toHaveBeenCalledTimes(1);
    });
  });

  // --- 21. WaitRevealStep ---
  describe("WaitRevealStep", () => {
    it("renders text with target player name and calls hook", () => {
      mockGameState.selectedTargetPlayer = { name: "Jugador Enemigo" };
      render(<WaitRevealStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Esperando a que Jugador Enemigo revele un secreto..."
      );
      expect(mockWaitReveal).toHaveBeenCalledTimes(1);
    });

    it("renders fallback text if no target player", () => {
      mockGameState.selectedTargetPlayer = null;
      render(<WaitRevealStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Esperando a que el oponente revele un secreto..."
      );
    });
  });

  // --- 22. WaitSetResolutionStep ---
  describe("WaitSetResolutionStep", () => {
    it("renders null and calls hook", () => {
      const { container } = render(<WaitSetResolutionStep />);
      expect(container.firstChild).toBeNull();
      expect(mockWaitSetResolution).toHaveBeenCalledTimes(1);
    });
  });

  // --- 23. WaitTradeFollyStep ---
  describe("WaitTradeFollyStep", () => {
    it("renders fallback text if no direction", () => {
      render(<WaitTradeFollyStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Esperando intercambio..."
      );
      expect(mockWaitTradeFolly).toHaveBeenCalledTimes(1);
    });

    it("renders direction and player order (left)", () => {
      mockGameState.game.direction_folly = "left";
      mockGameState.players = [
        { name: "P1", turn_order: 1 },
        { name: "P2", turn_order: 2 },
      ];
      render(<WaitTradeFollyStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Todos los jugadores pasan una carta a la izquierda."
      );
      // Order: P2 -> P1, P1 -> P2
      expect(
        screen.getByText("Orden de intercambio: P2 → P1, P1 → P2")
      ).toBeInTheDocument();
    });

    it("renders direction and player order (right)", () => {
      mockGameState.game.direction_folly = "right";
      mockGameState.players = [
        { name: "P1", turn_order: 1 },
        { name: "P2", turn_order: 2 },
      ];
      render(<WaitTradeFollyStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Todos los jugadores pasan una carta a la derecha."
      );
      // Order: P1 -> P2, P2 -> P1
      expect(
        screen.getByText("Orden de intercambio: P1 → P2, P2 → P1")
      ).toBeInTheDocument();
    });
  });

  // --- 24. WaitTradeStep ---
  describe("WaitTradeStep", () => {
    it("renders text and calls hook", () => {
      render(<WaitTradeStep />);
      expect(screen.getByTestId("text-type")).toHaveTextContent(
        "Intercambio en progreso..."
      );
      expect(mockWaitTrade).toHaveBeenCalledTimes(1);
    });
  });
});

/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

// 1. Importar TODOS los hooks a testear
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
import { useWaitTrade } from "./useWaitTrade";
import { useWaitTradeFolly } from "./useWaitTradeFolly";

// 2. Importar y mockear TODAS las dependencias
import { useGameContext } from "../../../context/GameContext";
import setService from "../../../services/setService";
import cardService from "../../../services/cardService";
import eventService from "../../../services/eventService";
import logService from "../../../services/logService";
import playerService from "../../../services/playerService";
import secretService from "../../../services/secretService";
import gameService from "../../../services/gameService"; // <-- EL QUE FALTABA
import { usePrevious } from "../../../hooks/usePrevious";

// ===================================================================
// 3. MOCKS GLOBALES
// ===================================================================

vi.mock("../../../context/GameContext");
vi.mock("../../../services/setService");
vi.mock("../../../services/cardService");
vi.mock("../../../services/eventService");
vi.mock("../../../services/logService");
vi.mock("../../../services/playerService"); // <-- CORRECCIÓN: Faltaba este
vi.mock("../../../services/secretService");
vi.mock("../../../services/gameService"); // <-- CORRECCIÓN: Faltaba este
vi.mock("../../../hooks/usePrevious");

// Variables para el mock de Context
let mockDispatch: ReturnType<typeof vi.fn>;
let mockState: any; // El estado global que manipularemos en cada test
let mockCurrentPlayer: any;
let mockIsSocialDisgrace: boolean;
let mockAlert: ReturnType<typeof vi.fn>;

// ===================================================================
// 4. SETUP Y TEARDOWN
// ===================================================================

beforeEach(() => {
  // Resetear el estado y el dispatch antes de CADA test
  mockDispatch = vi.fn();
  mockCurrentPlayer = {
    player_id: 1,
    name: "Test Player",
    cards: [],
    pending_action: null,
  };
  mockIsSocialDisgrace = false;
  mockState = {
    myPlayerId: 1,
    game: { game_id: 100, direction_folly: null, current_turn: 1 },
    players: [mockCurrentPlayer],
    selectedCard: null,
    selectedSet: null,
    selectedCardIds: [],
    selectedTargetPlayer: null,
    selectedSecret: null,
    activeEventCard: null,
    activeSet: null,
    discardPile: [],
    lastCancelableEvent: null,
    lastCancelableSet: null,
    blackmailedSecret: null,
    logs: [],
    chatMessages: [],
    error: null,
    isLoading: false,
  };

  // Implementación del mock de Context
  (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
    state: mockState,
    dispatch: mockDispatch,
    currentPlayer: mockCurrentPlayer,
    isSocialDisgrace: mockIsSocialDisgrace,
  });

  // Mockear el hook usePrevious
  (usePrevious as ReturnType<typeof vi.fn>).mockImplementation((value: any) => {
    const ref = { current: undefined };
    const current = ref.current;
    ref.current = value;
    return current;
  });

  // Mockear Alert
  mockAlert = vi.fn();
  vi.stubGlobal("alert", mockAlert);

  // Resetear todos los mocks de servicios
  // (Esta es la parte clave que fallaba)
  vi.mocked(setService.addDetective).mockResolvedValue({
    name: "Test Set",
  } as any);
  vi.mocked(setService.stealSet).mockResolvedValue({
    name: "Stolen Set",
  } as any);
  vi.mocked(setService.playSet2).mockResolvedValue({
    set_id: 2,
    name: "Set2",
  } as any);
  vi.mocked(setService.playSet3).mockResolvedValue({
    set_id: 3,
    name: "Set3",
  } as any);

  vi.mocked(cardService.discardSelectedList).mockResolvedValue([] as any);
  vi.mocked(cardService.drawCard).mockResolvedValue({ card_id: 1 } as any);
  vi.mocked(cardService.pickUpDraftCard).mockResolvedValue({
    card_id: 2,
  } as any);
  vi.mocked(cardService.pickUpFromDiscard).mockResolvedValue({
    card_id: 3,
  } as any);

  vi.mocked(eventService.andThenThereWasOneMore).mockResolvedValue(undefined);
  vi.mocked(eventService.cardsOffTheTable).mockResolvedValue(undefined);
  vi.mocked(eventService.initiateCardTrade).mockResolvedValue(undefined);
  vi.mocked(eventService.cardTrade).mockResolvedValue(undefined);
  vi.mocked(eventService.initiateFolly).mockResolvedValue(undefined);
  vi.mocked(eventService.follyTrade).mockResolvedValue(undefined);
  vi.mocked(eventService.delayEscape).mockResolvedValue(undefined);
  vi.mocked(eventService.earlyTrainPaddington).mockResolvedValue(undefined);
  vi.mocked(eventService.countNSF).mockResolvedValue({ card_id: 1 } as any);
  vi.mocked(eventService.pointYourSuspicions).mockResolvedValue(undefined);
  vi.mocked(eventService.activateBlackmailed).mockResolvedValue({
    secret_id: 1,
  } as any);
  vi.mocked(eventService.deactivateBlackmailed).mockResolvedValue(undefined);

  vi.mocked(logService.registerCancelableEvent).mockResolvedValue(undefined);
  vi.mocked(logService.registerCancelableSet).mockResolvedValue(undefined);
  vi.mocked(logService.getLogs).mockResolvedValue([]);

  // CORRECCIÓN: Estos mocks faltaban y rompían todo
  vi.mocked(playerService.selectPlayer).mockResolvedValue(undefined);
  vi.mocked(playerService.unselectPlayer).mockResolvedValue(undefined);
  vi.mocked(playerService.votePlayer).mockResolvedValue(undefined);
  vi.mocked(gameService.updateTurn).mockResolvedValue({ game_id: 100 } as any);

  vi.mocked(secretService.revealSecret).mockResolvedValue({
    secret_id: 1,
  } as any);
  vi.mocked(secretService.hideSecret).mockResolvedValue({
    secret_id: 2,
  } as any);
  vi.mocked(secretService.stealSecret).mockResolvedValue({
    secret_id: 3,
  } as any);

  // Usar timers falsos para `setTimeout`
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  cleanup(); // Limpia los hooks renderizados
});

// ===================================================================
// 5. LOS TESTS
// ===================================================================

describe("useTurnSteps Hooks", () => {
  describe("useAddDetective", () => {
    it("should set message if no card or set selected", async () => {
      const { result } = renderHook(() => useAddDetective());
      await act(async () => {
        await result.current.addDetective();
      });
      expect(result.current.message).toContain("Seleccione un detective");
      expect(setService.addDetective).not.toHaveBeenCalled();
    });

    it("should call service and dispatch step for 'Parker Pyne'", async () => {
      mockState.selectedCard = { card_id: 1, name: "Parker Pyne" };
      mockState.selectedSet = { set_id: 10, name: "Parker Pyne" };
      vi.mocked(setService.addDetective).mockResolvedValue({
        name: "Parker Pyne",
      } as any);

      const { result } = renderHook(() => useAddDetective());
      await act(async () => {
        await result.current.addDetective();
      });

      expect(setService.addDetective).toHaveBeenCalledWith(1, 10);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "sel_hide_secret",
      });
    });

    it("should call service and dispatch step for 'Beresford brothers'", async () => {
      mockState.selectedCard = { card_id: 2, name: "Tommy" };
      mockState.selectedSet = { set_id: 11, name: "Beresford brothers" };
      vi.mocked(setService.addDetective).mockResolvedValue({
        name: "Beresford brothers",
      } as any);

      const { result } = renderHook(() => useAddDetective());
      await act(async () => {
        await result.current.addDetective();
      });

      expect(setService.addDetective).toHaveBeenCalledWith(2, 11);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "sel_player_reveal",
      });
    });

    it("should dispatch 'discard_op' on unknown set", async () => {
      mockState.selectedCard = { card_id: 3, name: "Unknown" };
      mockState.selectedSet = { set_id: 12, name: "Unknown Set" };
      vi.mocked(setService.addDetective).mockResolvedValue({
        name: "Unknown Set",
      } as any);

      const { result } = renderHook(() => useAddDetective());
      await act(async () => {
        await result.current.addDetective();
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });

    it("should handle service failure", async () => {
      mockState.selectedCard = { card_id: 1 };
      mockState.selectedSet = { set_id: 10 };
      vi.mocked(setService.addDetective).mockRejectedValue(
        new Error("Test Error")
      );

      const { result } = renderHook(() => useAddDetective());
      await act(async () => {
        await result.current.addDetective();
      });

      expect(result.current.message).toContain("Detective inválido");
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_STEP" })
      );
    });

    it("should call CLEAR_SELECTIONS on cancel", () => {
      const { result } = renderHook(() => useAddDetective());
      act(() => {
        result.current.cancel();
      });
      expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTIONS" });
    });
  });

  describe("useAndThenThereWasOneMore", () => {
    it("should call services and dispatch on success", async () => {
      mockState.selectedTargetPlayer = { player_id: 2 };
      mockState.selectedSecret = { secret_id: 20, revelated: true };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useAndThenThereWasOneMore());
      await act(async () => {
        await result.current.andThenThereWasOneMore();
      });

      expect(eventService.andThenThereWasOneMore).toHaveBeenCalledWith(2, 20);
      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [99]);
      expect(result.current.message).toContain("exitosamente");

      // Test el timeout
      await act(async () => {
        vi.runAllTimers();
      });
      expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTIONS" });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });

    it("should show error if secret is not revealed", async () => {
      mockState.selectedTargetPlayer = { player_id: 2 };
      mockState.selectedSecret = { secret_id: 20, revelated: false }; // No revelado

      const { result } = renderHook(() => useAndThenThereWasOneMore());
      await act(async () => {
        await result.current.andThenThereWasOneMore();
      });

      expect(result.current.message).toContain("secretos revelados");
      expect(eventService.andThenThereWasOneMore).not.toHaveBeenCalled();
    });
  });

  describe("useAnotherVictim", () => {
    it("should call services and dispatch 'sel_hide_secret' for Parker Pyne", async () => {
      mockState.selectedSet = { set_id: 30, name: "Parker Pyne" };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;
      vi.mocked(setService.stealSet).mockResolvedValue({
        name: "Parker Pyne",
      } as any);

      const { result } = renderHook(() => useAnotherVictim());
      await act(async () => {
        await result.current.stealSet();
      });

      expect(setService.stealSet).toHaveBeenCalledWith(1, 30);
      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [99]);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "sel_hide_secret",
      });
    });

    it("should show error if no set selected", async () => {
      mockState.selectedSet = null; // No hay set
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useAnotherVictim());
      await act(async () => {
        await result.current.stealSet();
      });

      expect(result.current.message).toContain("Debe seleccionar un set");
      expect(setService.stealSet).not.toHaveBeenCalled();
    });
  });

  describe("useCardsOffTable", () => {
    it("should call services and dispatch on success", async () => {
      mockState.selectedTargetPlayer = { player_id: 2 };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useCardsOffTable());
      await act(async () => {
        await result.current.cardsOffTheTable();
      });

      expect(eventService.cardsOffTheTable).toHaveBeenCalledWith(2);
      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [99]);
      expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTIONS" });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useCardTrade", () => {
    it("should call service and dispatch 'wait_trade'", async () => {
      mockState.selectedTargetPlayer = { player_id: 2 };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useCardTrade());
      await act(async () => {
        await result.current.confirmCardTrade();
      });

      expect(eventService.initiateCardTrade).toHaveBeenCalledWith(1, 2, 99);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "wait_trade",
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_ACTIVE_EVENT",
        payload: null,
      });
    });
  });

  describe("useDeadCardFolly", () => {
    it("should call service with 'left' and dispatch 'draw'", async () => {
      mockState.game = { game_id: 100 };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useDeadCardFolly());
      await act(async () => {
        await result.current.confirmDeadCardFolly("left");
      });

      expect(eventService.initiateFolly).toHaveBeenCalledWith(
        1,
        100,
        99,
        "left"
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "draw",
      });
    });
  });

  describe("useDelayEscape", () => {
    it("should update local state on card select", () => {
      mockState.discardPile = [{ card_id: 1 }, { card_id: 2 }, { card_id: 3 }];
      const { result } = renderHook(() => useDelayEscape());

      act(() => result.current.handleDiscardCardSelect(1));
      expect(result.current.selectedDiscardIds).toEqual([1]);

      act(() => result.current.handleDiscardCardSelect(2));
      expect(result.current.selectedDiscardIds).toEqual([1, 2]);

      act(() => result.current.handleDiscardCardSelect(1)); // Deseleccionar
      expect(result.current.selectedDiscardIds).toEqual([2]);
    });

    it("should not select more than 5 cards", () => {
      mockState.discardPile = [
        { card_id: 1 },
        { card_id: 2 },
        { card_id: 3 },
        { card_id: 4 },
        { card_id: 5 },
        { card_id: 6 },
      ];
      const { result } = renderHook(() => useDelayEscape());
      act(() => result.current.handleDiscardCardSelect(1));
      act(() => result.current.handleDiscardCardSelect(2));
      act(() => result.current.handleDiscardCardSelect(3));
      act(() => result.current.handleDiscardCardSelect(4));
      act(() => result.current.handleDiscardCardSelect(5));
      act(() => result.current.handleDiscardCardSelect(6)); // No debe añadirse

      expect(result.current.selectedDiscardIds).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("useDiscard", () => {
    it("should call discard service and dispatch 'draw'", async () => {
      mockState.selectedCardIds = [1, 2];
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useDiscard());
      await act(async () => {
        await result.current.discardSelected();
      });

      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [1, 2]);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "draw",
      });
    });

    it("should dispatch 'draw' on skipDiscard", () => {
      const { result } = renderHook(() => useDiscard());
      act(() => {
        result.current.skipDiscard();
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "draw",
      });
    });

    it("should call 'CLEAR_SELECTIONS' on cancel (if not social disgrace)", () => {
      mockIsSocialDisgrace = false;
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        isSocialDisgrace: mockIsSocialDisgrace,
        currentPlayer: mockCurrentPlayer, // Añadido
      });

      const { result } = renderHook(() => useDiscard());
      act(() => {
        result.current.cancel();
      });
      expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTIONS" });
    });

    it("should NOT call 'CLEAR_SELECTIONS' on cancel if social disgrace", () => {
      mockIsSocialDisgrace = true;
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        isSocialDisgrace: mockIsSocialDisgrace,
        currentPlayer: mockCurrentPlayer, // Añadido
      });

      const { result } = renderHook(() => useDiscard());
      act(() => {
        result.current.cancel();
      });
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("useDraw", () => {
    it("should return correct cardCount", () => {
      mockCurrentPlayer.cards = [1, 2, 3];
      const { result } = renderHook(() => useDraw());
      expect(result.current.cardCount).toBe(3);
    });

    it("should call drawCard", async () => {
      mockState.myPlayerId = 1;
      mockState.game = { game_id: 100 };
      const { result } = renderHook(() => useDraw());
      await act(async () => {
        await result.current.drawFromDeck();
      });
      expect(cardService.drawCard).toHaveBeenCalledWith(1, 100);
    });

    it("should call pickUpDraftCard", async () => {
      mockState.selectedCard = { card_id: 50 };
      mockState.myPlayerId = 1;
      mockState.game = { game_id: 100 };
      const { result } = renderHook(() => useDraw());
      await act(async () => {
        await result.current.drawDraft();
      });
      expect(cardService.pickUpDraftCard).toHaveBeenCalledWith(100, 50, 1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_CARD",
        payload: null,
      });
    });

    it("should call updateTurn", async () => {
      mockState.game = { game_id: 100 };
      const { result } = renderHook(() => useDraw());
      await act(async () => {
        await result.current.endTurn();
      });
      expect(gameService.updateTurn).toHaveBeenCalledWith(100);
    });
  });

  describe("useHideSecret", () => {
    it("should call service and dispatch 'discard_op'", async () => {
      mockState.selectedSecret = { secret_id: 5 };
      const { result } = renderHook(() => useHideSecret());
      await act(async () => {
        await result.current.hideSecret();
      });
      expect(secretService.hideSecret).toHaveBeenCalledWith(5);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_SECRET",
        payload: null,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useLookIntoAshes", () => {
    it("should call services and dispatch 'discard_op'", async () => {
      mockState.selectedCard = { card_id: 10 };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => useLookIntoAshes());
      await act(async () => {
        await result.current.pickUpFromDiscard();
      });
      expect(cardService.pickUpFromDiscard).toHaveBeenCalledWith(1, 10);
      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [99]);
      expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTIONS" });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("usePlayEvent", () => {
    it("should register event and dispatch 'wait_event_resolution'", async () => {
      const eventCard = { card_id: 77, type: "event", name: "Test Event" };
      mockState.selectedCard = eventCard;

      const { result } = renderHook(() => usePlayEvent());
      await act(async () => {
        await result.current.playEvent();
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_ACTIVE_EVENT",
        payload: eventCard,
      });
      expect(logService.registerCancelableEvent).toHaveBeenCalledWith(77);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "wait_event_resolution",
      });
    });
  });

  describe("usePlaySet", () => {
    it("should call playSet2 and dispatch 'wait_set_resolution'", async () => {
      mockState.selectedCardIds = [1, 2];
      const playedSet = { set_id: 10, name: "Test Set" };
      vi.mocked(setService.playSet2).mockResolvedValue(playedSet as any);

      const { result } = renderHook(() => usePlaySet());
      await act(async () => {
        await result.current.playSet();
      });

      expect(setService.playSet2).toHaveBeenCalledWith(1, 2);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_ACTIVE_SET",
        payload: playedSet,
      });
      expect(logService.registerCancelableSet).toHaveBeenCalledWith(10);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "wait_set_resolution",
      });
    });

    it("should call playSet3 and dispatch 'wait_set_resolution'", async () => {
      mockState.selectedCardIds = [1, 2, 3];
      const playedSet = { set_id: 11, name: "Test Set 3" };
      vi.mocked(setService.playSet3).mockResolvedValue(playedSet as any);

      const { result } = renderHook(() => usePlaySet());
      await act(async () => {
        await result.current.playSet();
      });

      expect(setService.playSet3).toHaveBeenCalledWith(1, 2, 3);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_ACTIVE_SET",
        payload: playedSet,
      });
    });
  });

  describe("usePointYourSuspicions", () => {
    it("should call services and dispatch 'wait_voting_to_end'", async () => {
      mockState.game = { game_id: 100 };
      mockState.activeEventCard = { card_id: 99 };
      mockState.myPlayerId = 1;

      const { result } = renderHook(() => usePointYourSuspicions());
      await act(async () => {
        await result.current.PointYourSuspicions();
      });

      expect(eventService.pointYourSuspicions).toHaveBeenCalledWith(100);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "wait_voting_to_end",
      });
      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [99]);
    });
  });

  describe("useRevealSecret", () => {
    it("should call service and dispatch 'discard_op'", async () => {
      mockState.selectedSecret = { secret_id: 6 };
      const { result } = renderHook(() => useRevealSecret());
      await act(async () => {
        await result.current.revealSecret();
      });
      expect(secretService.revealSecret).toHaveBeenCalledWith(6);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SELECTED_SECRET",
        payload: null,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useSelectPlayerReveal", () => {
    it("should call service and dispatch 'wait_reveal_secret'", async () => {
      mockState.selectedTargetPlayer = { player_id: 2 };
      const { result } = renderHook(() => useSelectPlayerReveal());
      await act(async () => {
        await result.current.confirmPlayerReveal();
      });
      expect(playerService.selectPlayer).toHaveBeenCalledWith(2);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "wait_reveal_secret",
      });
    });
  });

  describe("useVote", () => {
    it("should call votePlayer and set voted", async () => {
      mockState.myPlayerId = 1;
      const { result } = renderHook(() => useVote());

      expect(result.current.voted).toBe(false);

      await act(async () => {
        await result.current.handleVote(2);
      });

      expect(playerService.votePlayer).toHaveBeenCalledWith(2, 1);
      expect(result.current.voted).toBe(true);
      expect(result.current.message).toContain("Voto registrado");
    });
  });

  // --- Hooks Listener (más complejos) ---

  describe("useWaitEventResolution", () => {
    it("should resolve event (e.g., Card trade) after timeout", async () => {
      mockState.activeEventCard = { card_id: 1, name: "Card trade" };
      vi.mocked(eventService.countNSF).mockResolvedValue({ card_id: 1 } as any);

      renderHook(() => useWaitEventResolution());

      await act(async () => {
        vi.runAllTimers(); // Avanza el setTimeout de 5000ms
      });

      await act(async () => {}); // Espera que las promesas internas se resuelvan

      expect(eventService.countNSF).toHaveBeenCalledWith(
        mockState.game.game_id
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "card_trade",
      });
    });

    it("should cancel event if countNSF returns different card", async () => {
      mockState.activeEventCard = { card_id: 1, name: "Card trade" };
      mockState.myPlayerId = 1;
      vi.mocked(eventService.countNSF).mockResolvedValue({ card_id: 2 } as any);

      renderHook(() => useWaitEventResolution());

      await act(async () => {
        vi.runAllTimers();
      });
      await act(async () => {});

      expect(eventService.countNSF).toHaveBeenCalled();
      expect(cardService.discardSelectedList).toHaveBeenCalledWith(1, [1]);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useWaitSetResolution", () => {
    it("should resolve set (e.g., Parker Pyne) after timeout", async () => {
      mockState.activeSet = { set_id: 10, name: "Parker Pyne" };
      vi.mocked(eventService.countNSF).mockResolvedValue({ set_id: 10 } as any);

      renderHook(() => useWaitSetResolution());

      await act(async () => {
        vi.runAllTimers();
      });
      await act(async () => {});

      expect(eventService.countNSF).toHaveBeenCalledWith(
        mockState.game.game_id
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "sel_hide_secret",
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_ACTIVE_SET",
        payload: null,
      });
    });

    it("should cancel set if countNSF returns different item (NSF)", async () => {
      mockState.activeSet = { set_id: 10, name: "Parker Pyne" };
      vi.mocked(eventService.countNSF).mockResolvedValue({
        card_id: 99,
      } as any);

      renderHook(() => useWaitSetResolution());

      await act(async () => {
        vi.runAllTimers();
      });
      await act(async () => {});

      expect(eventService.countNSF).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_ACTIVE_SET",
        payload: null,
      });
    });
  });

  describe("useWaitingVotingToEnd (Listener Hook)", () => {
    it("should dispatch 'discard_op' when pending_action changes", () => {
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: { ...mockState, currentStep: "wait_voting_to_end" },
        dispatch: mockDispatch,
        currentPlayer: { pending_action: "WAITING_VOTING_TO_END" },
        isMyTurn: true,
      });
      vi.mocked(usePrevious).mockReturnValue("WAITING_VOTING_TO_END");

      const { rerender } = renderHook(() => useWaitingVotingToEnd());

      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: { ...mockState, currentStep: "wait_voting_to_end" },
        dispatch: mockDispatch,
        currentPlayer: { pending_action: null }, // ¡El cambio!
        isMyTurn: true,
      });

      rerender();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useWaitReveal (Listener Hook)", () => {
    it("should dispatch 'discard_op' when opponent's action clears", () => {
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: {
          ...mockState,
          currentStep: "wait_reveal_secret",
          myPlayerId: 1,
          players: [
            { player_id: 1, pending_action: null },
            { player_id: 2, pending_action: "REVEAL_SECRET" },
          ],
        },
        dispatch: mockDispatch,
        currentPlayer: mockCurrentPlayer, // Añadido
        isMyTurn: false, // Añadido
        isSocialDisgrace: false, // Añadido
      });
      vi.mocked(usePrevious).mockReturnValue(true); // prevIsWaitingForReveal

      const { rerender } = renderHook(() => useWaitReveal());

      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: {
          ...mockState,
          currentStep: "wait_reveal_secret",
          myPlayerId: 1,
          players: [
            { player_id: 1, pending_action: null },
            { player_id: 2, pending_action: null }, // ¡El cambio!
          ],
        },
        dispatch: mockDispatch,
        currentPlayer: mockCurrentPlayer, // Añadido
        isMyTurn: false, // Añadido
        isSocialDisgrace: false, // Añadido
      });

      rerender();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useWaitTrade (Listener Hook)", () => {
    it("should dispatch 'discard_op' when pending_action changes", () => {
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: { ...mockState, currentStep: "wait_trade" },
        dispatch: mockDispatch,
        currentPlayer: { pending_action: "SELECT_TRADE_CARD" },
        isMyTurn: true,
      });
      vi.mocked(usePrevious).mockReturnValue("SELECT_TRADE_CARD");

      const { rerender } = renderHook(() => useWaitTrade());

      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: { ...mockState, currentStep: "wait_trade" },
        dispatch: mockDispatch,
        currentPlayer: { pending_action: null }, // ¡El cambio!
        isMyTurn: true,
      });

      rerender();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "discard_op",
      });
    });
  });

  describe("useWaitTradeFolly (Listener Hook)", () => {
    it("should dispatch 'draw' when all players finish folly", () => {
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: {
          ...mockState,
          currentStep: "wait_trade_folly",
          players: [{ pending_action: "SELECT_FOLLY_CARD" }],
        },
        dispatch: mockDispatch,
        isMyTurn: true,
      });
      vi.mocked(usePrevious).mockReturnValue(true); // prevIsWaitingOnFolly

      const { rerender } = renderHook(() => useWaitTradeFolly());

      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: {
          ...mockState,
          currentStep: "wait_trade_folly",
          players: [{ pending_action: null }], // ¡El cambio!
        },
        dispatch: mockDispatch,
        isMyTurn: true,
      });

      rerender();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_STEP",
        payload: "draw",
      });
    });

    it("should NOT dispatch if not my turn", () => {
      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: {
          ...mockState,
          currentStep: "wait_trade_folly",
          players: [{ pending_action: "SELECT_FOLLY_CARD" }],
        },
        dispatch: mockDispatch,
        isMyTurn: false, // NO ES MI TURNO
      });
      vi.mocked(usePrevious).mockReturnValue(true);

      const { rerender } = renderHook(() => useWaitTradeFolly());

      (useGameContext as ReturnType<typeof vi.fn>).mockReturnValue({
        state: {
          ...mockState,
          currentStep: "wait_trade_folly",
          players: [{ pending_action: null }],
        },
        dispatch: mockDispatch,
        isMyTurn: false,
      });

      rerender();

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});

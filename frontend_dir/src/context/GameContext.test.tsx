/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { gameReducer, type IGameState } from "./GameContext";
import type { Steps } from "../containers/GamePage/TurnActionsTypes";

// Estado inicial base para todos los tests
const getInitialState = (): IGameState => ({
  game: { game_id: 1 } as any,
  players: [],
  discardPile: [],
  draftPile: [],
  myPlayerId: 1,
  currentStep: "start" as Steps,
  selectedCardIds: [],
  selectedCard: null,
  selectedSet: null,
  selectedSecret: null,
  selectedTargetPlayer: null,
  activeEventCard: null,
  activeSet: null,
  lastCancelableEvent: null,
  lastCancelableSet: null,
  blackmailedSecret: null,
  logs: [],
  chatMessages: [],
  error: null,
  isLoading: false,
});

describe("gameReducer", () => {
  let initialState: IGameState;

  beforeEach(() => {
    initialState = getInitialState();
  });

  it("should handle SET_PLAYERS", () => {
    const players = [{ player_id: 1, name: "Test" }] as any;
    const action = { type: "SET_PLAYERS", payload: players } as const;
    const state = gameReducer(initialState, action);
    expect(state.players).toEqual(players);
  });

  it("should handle SET_GAME", () => {
    const game = { game_id: 2 } as any;
    const action = { type: "SET_GAME", payload: game } as const;
    const state = gameReducer(initialState, action);
    expect(state.game).toEqual(game);
  });

  it("should handle ADD_CHAT_MESSAGE", () => {
    const message = { sender_name: "Test", message: "Hola" } as any;
    const action = { type: "ADD_CHAT_MESSAGE", payload: message } as const;
    const state = gameReducer(initialState, action);
    expect(state.chatMessages).toHaveLength(1);
    expect(state.chatMessages[0]).toEqual(message);
  });

  it("should handle SET_STEP", () => {
    const action = { type: "SET_STEP", payload: "draw" } as const;
    const state = gameReducer(initialState, action);
    expect(state.currentStep).toBe("draw");
  });

  describe("TOGGLE_HAND_CARD_ID", () => {
    it("should add a card ID if not present", () => {
      const action = { type: "TOGGLE_HAND_CARD_ID", payload: 10 } as const;
      const state = gameReducer(initialState, action);
      expect(state.selectedCardIds).toEqual([10]);
    });

    it("should remove a card ID if present", () => {
      const stateWithCard = { ...initialState, selectedCardIds: [10, 20] };
      const action = { type: "TOGGLE_HAND_CARD_ID", payload: 10 } as const;
      const state = gameReducer(stateWithCard, action);
      expect(state.selectedCardIds).toEqual([20]);
    });

    it("should clear selectedCard when toggling", () => {
      const stateWithCard = {
        ...initialState,
        selectedCard: { card_id: 5 } as any,
      };
      const action = { type: "TOGGLE_HAND_CARD_ID", payload: 10 } as const;
      const state = gameReducer(stateWithCard, action);
      expect(state.selectedCard).toBeNull();
      expect(state.selectedCardIds).toEqual([10]);
    });
  });

  it("should handle SET_SELECTED_CARD", () => {
    const card = { card_id: 5 } as any;
    const stateWithIds = { ...initialState, selectedCardIds: [1, 2] };
    const action = { type: "SET_SELECTED_CARD", payload: card } as const;
    const state = gameReducer(stateWithIds, action);
    expect(state.selectedCard).toEqual(card);
    expect(state.selectedCardIds).toEqual([]); // Debe limpiar los IDs
  });

  it("should handle CLEAR_SELECTIONS", () => {
    const dirtyState: IGameState = {
      ...initialState,
      currentStep: "draw",
      selectedCardIds: [1, 2],
      selectedCard: { card_id: 3 } as any,
      selectedSet: { set_id: 4 } as any,
      selectedSecret: { secret_id: 5 } as any,
      selectedTargetPlayer: { player_id: 6 } as any,
      activeEventCard: { card_id: 7 } as any,
      activeSet: { set_id: 8 } as any,
      lastCancelableEvent: { log_id: 9 } as any,
      lastCancelableSet: { log_id: 10 } as any,
    };
    const action = { type: "CLEAR_SELECTIONS" } as const;
    const state = gameReducer(dirtyState, action);

    // Verifica que todo lo seleccionable volvió a 'null' o '[]'
    expect(state.currentStep).toBe("start"); // Vuelve a 'start'
    expect(state.selectedCardIds).toEqual([]);
    expect(state.selectedCard).toBeNull();
    expect(state.selectedSet).toBeNull();
    expect(state.selectedSecret).toBeNull();
    expect(state.selectedTargetPlayer).toBeNull();
    expect(state.activeEventCard).toBeNull();
    expect(state.activeSet).toBeNull();
    expect(state.lastCancelableEvent).toBeNull();
    expect(state.lastCancelableSet).toBeNull();
    // Verifica que el estado base NO se tocó
    expect(state.game).toEqual(dirtyState.game);
  });

  it("should handle SET_ERROR", () => {
    const action = { type: "SET_ERROR", payload: "Test Error" } as const;
    const state = gameReducer(initialState, action);
    expect(state.error).toBe("Test Error");
    expect(state.isLoading).toBe(false); // Debe poner loading en false
  });
});

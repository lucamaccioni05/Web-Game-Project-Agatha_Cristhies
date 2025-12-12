/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useGameWebSocket } from "./useGameWebSocket";
import { useGameContext } from "../context/GameContext";

// Mock de la config
vi.mock("../services/config", () => ({
  httpServerUrl: "http://mock-server.com",
}));

// Mock del Context
vi.mock("../context/GameContext");

// --- Mock del WebSocket Global ---
let mockWebSocketInstance: {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (event: any) => void;
  onclose: () => void;
  close: ReturnType<typeof vi.fn>;
};

// CORRECCIÓN: Se usa vi.fn() para envolver la clase y poder espiarla
const MockWebSocket = vi.fn((_url: string) => {
  const instance = {
    close: vi.fn(),
    onopen: () => {},
    onmessage: () => {},
    onerror: () => {},
    onclose: () => {},
  };
  mockWebSocketInstance = instance as any;
  return instance;
});

vi.stubGlobal("WebSocket", MockWebSocket);
// ---

let mockDispatch: ReturnType<typeof vi.fn>;

describe("useGameWebSocket Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();

    vi.mocked(useGameContext).mockReturnValue({
      dispatch: mockDispatch,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("should not connect if gameId is undefined", () => {
    renderHook(() => useGameWebSocket(undefined));
    expect(MockWebSocket).not.toHaveBeenCalled(); // Verificamos que el constructor no se llamó
  });

  it("should connect to the correct WebSocket URL", () => {
    renderHook(() => useGameWebSocket(123));
    // CORRECCIÓN: Así es como se testea un constructor mockeado
    expect(MockWebSocket).toHaveBeenCalledWith(
      "ws://mock-server.com/ws/game/123"
    );
  });

  // ... (el resto de los tests de este archivo estaban bien, los pego por las dudas)
  it("should dispatch SET_ERROR null on open", () => {
    renderHook(() => useGameWebSocket(123));
    act(() => {
      mockWebSocketInstance.onopen();
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_ERROR",
      payload: null,
    });
  });

  it("should dispatch SET_ERROR on error", () => {
    renderHook(() => useGameWebSocket(123));
    act(() => {
      mockWebSocketInstance.onerror(new Event("error"));
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_ERROR",
      payload: expect.stringContaining("Error en la conexión"),
    });
  });

  it("should call ws.close on unmount", () => {
    const { unmount } = renderHook(() => useGameWebSocket(123));
    unmount();
    expect(mockWebSocketInstance.close).toHaveBeenCalledTimes(1);
  });

  describe("onmessage handling (switch statement)", () => {
    const simulateMessage = (type: string, data: any) => {
      const dataString = JSON.stringify(data);
      const message = { type: type, data: dataString };
      act(() => {
        mockWebSocketInstance.onmessage({ data: JSON.stringify(message) });
      });
    };

    it("should dispatch SET_PLAYERS for 'playersState'", () => {
      const players = [{ player_id: 1 }];
      renderHook(() => useGameWebSocket(123));
      simulateMessage("playersState", players);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_PLAYERS",
        payload: players,
      });
    });

    it("should dispatch SET_GAME and SET_LOGS for 'gameUpdated'", () => {
      const gameData = { game_id: 123, status: "in course", log: [{ id: 1 }] };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("gameUpdated", gameData);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_GAME",
        payload: gameData,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_LOGS",
        payload: gameData.log,
      });
    });

    it("should dispatch SET_LAST_CANCELABLE_EVENT", () => {
      const log = { log_id: 10 };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("lastCancelableEvent", log);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_LAST_CANCELABLE_EVENT",
        payload: log,
      });
    });

    it("should dispatch SET_LAST_CANCELABLE_SET", () => {
      const log = { log_id: 11 };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("setResponse", log);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_LAST_CANCELABLE_SET",
        payload: log,
      });
    });

    it("should dispatch SET_DISCARD_PILE", () => {
      const cards = [{ card_id: 1 }];
      renderHook(() => useGameWebSocket(123));
      simulateMessage("droppedCards", cards);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_DISCARD_PILE",
        payload: cards,
      });
    });

    it("should dispatch SET_DRAFT_PILE", () => {
      const cards = [{ card_id: 2 }];
      renderHook(() => useGameWebSocket(123));
      simulateMessage("draftCards", cards);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_DRAFT_PILE",
        payload: cards,
      });
    });

    it("should dispatch SET_BLACKMAIL_SECRET", () => {
      const secret = { secret_id: 3 };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("blackmailed", secret);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_BLACKMAIL_SECRET",
        payload: secret,
      });
    });

    it("should dispatch ADD_CHAT_MESSAGE", () => {
      const chatMsg = { sender_name: "Test", message: "Hola" };
      renderHook(() => useGameWebSocket(123));
      simulateMessage("Chat", chatMsg);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "ADD_CHAT_MESSAGE",
        payload: chatMsg,
      });
    });

    it("should handle data not being a string (dataContent = message.data)", () => {
      renderHook(() => useGameWebSocket(123));
      const chatMsg = { sender_name: "Test", message: "Hola" };
      const message = { type: "Chat", data: chatMsg };
      act(() => {
        mockWebSocketInstance.onmessage({ data: JSON.stringify(message) });
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "ADD_CHAT_MESSAGE",
        payload: chatMsg,
      });
    });

    it("should ignore unknown message types", () => {
      renderHook(() => useGameWebSocket(123));
      simulateMessage("TIPO_DESCONOCIDO", { data: "test" });
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("should catch errors if JSON.parse fails", () => {
      renderHook(() => useGameWebSocket(123));
      act(() => {
        mockWebSocketInstance.onopen();
        mockDispatch.mockClear();
        mockWebSocketInstance.onmessage({ data: "esto no es json" });
      });
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});

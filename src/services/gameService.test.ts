/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import gameService from "./gameService";

// Mock de la config
vi.mock("./config", () => ({
  httpServerUrl: "http://mock-server.com",
}));

// Mock del fetch global
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// --- Helpers para mocks de fetch ---
const mockFetchSuccess = (data: any) => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  });
};
// ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("gameService", () => {
  it("createGame: should POST the game object", async () => {
    const game = {
      name: "Test Game",
      min_players: 2,
      max_players: 6,
      status: "waiting",
    };
    const mockResponse = { ...game, game_id: 1 };
    mockFetchSuccess(mockResponse);

    const result = await gameService.createGame(game as any);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/games",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(game),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("getGames: should GET games", async () => {
    mockFetchSuccess([{ game_id: 1 }, { game_id: 2 }]);
    const result = await gameService.getGames();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/games",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toHaveLength(2);
  });

  it("startGame: should POST to the correct endpoint", async () => {
    mockFetchSuccess({ game_id: 1, status: "in course" });
    await gameService.startGame(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/game/beginning/1",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("getGameById: should GET a single game", async () => {
    const mockGame = { game_id: 123, name: "Mi Partida" };
    mockFetchSuccess(mockGame);
    const result = await gameService.getGameById(123);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/games/123",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockGame);
  });

  it("updateTurn: should PUT and return updated game", async () => {
    const mockGame = { game_id: 1, current_turn: 2 };
    mockFetchSuccess(mockGame);
    const result = await gameService.updateTurn(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/game/update_turn/1",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual(mockGame);
  });
});

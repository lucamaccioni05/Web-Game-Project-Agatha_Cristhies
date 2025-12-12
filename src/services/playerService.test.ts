/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import playerService, { type Player } from "./playerService";

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

const mockFetchSuccessVoid = () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(undefined),
  });
};

const mockFetchFailure = (detail: string | object) => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({ detail: detail }),
  });
};
// ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("playerService", () => {
  it("createPlayer: should POST the player object", async () => {
    const player: Player = {
      name: "Test Player",
      host: true,
      game_id: 1,
      birth_date: "2000-01-01",
      avatar: "avatar.png",
    };
    const mockResponse = { ...player, player_id: 1, cards: [] }; // PlayerStateResponse
    mockFetchSuccess(mockResponse);

    const result = await playerService.createPlayer(player);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/players",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(player),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("createPlayer: should throw parsed backend error on failure", async () => {
    const errorDetail = { msg: "Player name already exists" };
    mockFetchFailure(errorDetail);

    await expect(playerService.createPlayer({} as Player)).rejects.toThrow(
      JSON.stringify(errorDetail)
    );
  });

  it("getPlayersByGame: should GET players for a game", async () => {
    const mockData = [{ player_id: 1 }, { player_id: 2 }];
    mockFetchSuccess(mockData);

    const result = await playerService.getPlayersByGame(100);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/lobby/players/100",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("selectPlayer: should call PUT and return void", async () => {
    mockFetchSuccessVoid();
    await expect(playerService.selectPlayer(1)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/select/player/1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("unselectPlayer: should call PUT and return void", async () => {
    mockFetchSuccessVoid();
    await expect(playerService.unselectPlayer(1)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/unselect/player/1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("votePlayer: should call PUT and handle status 201", async () => {
    // Caso especial: tu servicio espera 201, no 200
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({}),
    });

    await expect(playerService.votePlayer(2, 1)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/vote/player/2/1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("votePlayer: should throw parsed error on failure", async () => {
    mockFetchFailure("Player already voted");
    await expect(playerService.votePlayer(2, 1)).rejects.toThrow(
      "Error al votar jugador: Player already voted"
    );
  });
});

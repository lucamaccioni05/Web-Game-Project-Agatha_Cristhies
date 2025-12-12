/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import secretService from "./secretService";

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

describe("secretService", () => {
  it("getSecretsByPlayer: should GET secrets", async () => {
    const mockData = [{ secret_id: 1 }];
    mockFetchSuccess(mockData);
    const result = await secretService.getSecretsByPlayer(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/lobby/secrets/1",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("revealSecret: should PUT and return secret", async () => {
    const mockSecret = { secret_id: 5, revelated: true };
    mockFetchSuccess(mockSecret);
    const result = await secretService.revealSecret(5);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/secrets/reveal/5",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual(mockSecret);
  });

  it("hideSecret: should PUT and return secret", async () => {
    const mockSecret = { secret_id: 5, revelated: false };
    mockFetchSuccess(mockSecret);
    const result = await secretService.hideSecret(5);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/secrets/hide/5",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual(mockSecret);
  });

  it("stealSecret: should PUT and return secret", async () => {
    const mockSecret = { secret_id: 5, player_id: 2 };
    mockFetchSuccess(mockSecret);
    const result = await secretService.stealSecret(5, 2);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/secrets/steal/5,2",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual(mockSecret);
  });
});

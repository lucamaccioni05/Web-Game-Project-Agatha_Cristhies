/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import setService from "./setService";

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

const mockFetchFailure = (detail: string) => {
  mockFetch.mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({ detail: detail }),
  });
};
// ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setService", () => {
  it("getSets: should throw error on failure", async () => {
    mockFetchFailure("Set error");
    await expect(setService.getSets(1)).rejects.toThrow("Set error");
  });

  it("playSet2: should call POST with correct endpoint", async () => {
    mockFetchSuccess({ set_id: 2 });
    await setService.playSet2(1, 2);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/sets_of2/1,2",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("playSet3: should call POST with correct endpoint", async () => {
    mockFetchSuccess({ set_id: 3 });
    await setService.playSet3(1, 2, 3);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/sets_of3/1,2,3",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("stealSet: should call PUT and return set", async () => {
    const mockSet = { set_id: 4, player_id: 1 };
    mockFetchSuccess(mockSet);
    const result = await setService.stealSet(1, 4);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/sets/steal/1/4",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual(mockSet);
  });

  it("addDetective: should call PUT with correct endpoint", async () => {
    mockFetchSuccess({ set_id: 4 });
    await setService.addDetective(10, 20);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/add/detective/10/20",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

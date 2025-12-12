/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import eventService from "./eventService";

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

describe("eventService", () => {
  it("cardsOffTheTable: should throw a generic error on failure", async () => {
    // Este endpoint no parsea 'detail' en el .ts
    mockFetch.mockResolvedValue({ ok: false });
    await expect(eventService.cardsOffTheTable(1)).rejects.toThrow(
      "Error al ejecutar Cards Off The Table"
    );
  });

  it("andThenThereWasOneMore: should call the correct endpoint", async () => {
    mockFetchSuccess({ success: true });
    await eventService.andThenThereWasOneMore(2, 20);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/one_more/2,20",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("delayEscape: should send card IDs in the body", async () => {
    mockFetchSuccess({ success: true });
    await eventService.delayEscape(100, 1, [1, 2, 3]);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/delay_escape/100,1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ card_ids: [1, 2, 3] }),
      })
    );
  });

  it("initiateCardTrade: should call POST", async () => {
    mockFetchSuccess({ success: true });
    await eventService.initiateCardTrade(1, 2, 99);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/card_trade/initiate/1,2,99",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("countNSF: should throw error on failure", async () => {
    mockFetchFailure("Cannot count");
    await expect(eventService.countNSF(100)).rejects.toThrow("Cannot count");
  });

  it("initiateFolly: should return void on success", async () => {
    mockFetchSuccessVoid(); // El original no tiene .json() en success
    await expect(
      eventService.initiateFolly(1, 100, 99, "left")
    ).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/dead_card_folly/initiate/1/100/99/left",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("activateBlackmailed: should POST and return a secret", async () => {
    const mockSecret = { secret_id: 1 };
    mockFetchSuccess(mockSecret);
    const result = await eventService.activateBlackmailed(1, 2, 10);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/blackmailed/1,2,10",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual(mockSecret);
  });
});

/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import cardService from "./cardService";

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

describe("cardService", () => {
  it("getCardsByPlayer: should fetch cards for a player", async () => {
    const mockData = [{ card_id: 1 }];
    mockFetchSuccess(mockData);

    const result = await cardService.getCardsByPlayer(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/lobby/list/cards/1",
      expect.anything()
    );
    expect(result).toEqual(mockData);
  });

  it("discardAuto: should throw an error on failure", async () => {
    mockFetchFailure("Auto discard failed");

    await expect(cardService.discardAuto(1)).rejects.toThrow(
      "Auto discard failed"
    );
  });

  it("discardSelectedList: should send card IDs in the body", async () => {
    mockFetchSuccess([{ card_id: 10 }]);

    await cardService.discardSelectedList(1, [10, 20]);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/cards/game/drop_list/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ card_ids: [10, 20] }),
      })
    );
  });

  it("drawCard: should call PUT on the correct endpoint", async () => {
    const mockCard = { card_id: 5 };
    mockFetchSuccess(mockCard);

    const result = await cardService.drawCard(1, 100);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/cards/pick_up/1,100",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual(mockCard);
  });

  it("getDraftPile: should return empty array on failure (ok: false)", async () => {
    mockFetch.mockResolvedValue({ ok: false }); // Caso especial de este servicio
    const result = await cardService.getDraftPile(100);
    expect(result).toEqual([]);
  });

  it("pickUpFromDiscard: should resolve void on success", async () => {
    mockFetchSuccessVoid();
    await expect(cardService.pickUpFromDiscard(1, 10)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/look_into_ashes/1,10",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

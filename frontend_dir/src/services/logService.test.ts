/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import logService from "./logService";

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

describe("logService", () => {
  it("registerCancelableEvent: should POST and return void", async () => {
    mockFetchSuccessVoid();
    await expect(
      logService.registerCancelableEvent(99)
    ).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-server.com/event/Not_so_fast/99",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("registerCancelableSet: should throw error on failure", async () => {
    mockFetchFailure("Cannot register set");
    await expect(logService.registerCancelableSet(10)).rejects.toThrow(
      "Cannot register set"
    );
  });

  it("getLogs: should GET logs", async () => {
    const mockLogs = [{ log_id: 1, message: "Test" }];
    mockFetchSuccess(mockLogs);
    const result = await logService.getLogs(100);
    // CORRECCIÓN: Un fetch tipo GET solo recibe un argumento.
    expect(mockFetch).toHaveBeenCalledWith("http://mock-server.com/logs/100");
    expect(result).toEqual(mockLogs);
  });
});

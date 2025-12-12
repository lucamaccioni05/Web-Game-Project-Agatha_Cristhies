/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import chatService from "./chatService";

// Mock de la config
vi.mock("./config", () => ({
  httpServerUrl: "http://mock-server.com",
}));

// Mock del fetch global
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// --- Helpers para mocks de fetch ---
const mockFetchSuccessVoid = () => {
  // Simula una respuesta 'ok: true' (como un 204 No Content)
  // No necesitamos .json() porque sendMessage no lo llama en caso de éxito
  mockFetch.mockResolvedValue({
    ok: true,
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

describe("chatService", () => {
  it("sendMessage: should call fetch with the correct URL, method, and body", async () => {
    mockFetchSuccessVoid();

    await chatService.sendMessage(100, 1, "Hola mundo");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      // Verifica la URL exacta, incluyendo el espacio
      "http://mock-server.com/send/chat/100, 1",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Hola mundo" }),
      })
    );
  });

  it("sendMessage: should resolve as void on success", async () => {
    mockFetchSuccessVoid();
    // Verifica que la promesa se resuelve sin valor (void)
    await expect(
      chatService.sendMessage(100, 1, "Test")
    ).resolves.toBeUndefined();
  });

  it("sendMessage: should throw an error with the detail message on failure", async () => {
    mockFetchFailure("Mensaje inválido");

    // Verifica que la promesa es rechazada con el mensaje de 'detail'
    await expect(chatService.sendMessage(100, 1, "Test")).rejects.toThrow(
      "Mensaje inválido"
    );
  });

  it("sendMessage: should throw a generic error if detail is not provided", async () => {
    // Simulamos un error sin 'detail'
    mockFetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Otro formato" }),
    });

    await expect(chatService.sendMessage(100, 1, "Test")).rejects.toThrow(
      "Error al enviar el mensaje" // El fallback de tu 'catch'
    );
  });
});

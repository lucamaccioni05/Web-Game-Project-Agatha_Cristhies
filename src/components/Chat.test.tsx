/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Chat from "./Chat";
import { useGameContext } from "../context/GameContext";
import chatService from "../services/chatService";

// Mock del Context
vi.mock("../context/GameContext");

// Mock del Servicio
vi.mock("../services/chatService");

// --- Mocks de datos y funciones ---
let mockDispatch: ReturnType<typeof vi.fn>;
let mockState: any;
const mockSendMessage = vi.fn();

const mockMessages = [
  {
    sender_id: 1,
    sender_name: "Yo",
    message: "Hola, este es mi mensaje",
  },
  {
    sender_id: 2,
    sender_name: "Oponente",
    message: "Hola, este es el tuyo",
  },
];

describe("Chat Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();
    mockState = {
      chatMessages: mockMessages,
      game: { game_id: 100 },
      myPlayerId: 1,
    };

    // CORRECCIÓN: Mockear scrollIntoView
    // JSDOM no tiene implementación de layout, así que esta función no existe.
    window.HTMLDivElement.prototype.scrollIntoView = vi.fn();

    // Mock de Context
    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
    } as any);

    // Mock de Servicio
    vi.mocked(chatService.sendMessage).mockImplementation(mockSendMessage);
  });

  it("should render all messages with correct classes", () => {
    render(<Chat />);

    // Mi mensaje
    const myMessage = screen.getByText("Hola, este es mi mensaje");
    expect(myMessage).toBeInTheDocument();
    expect(myMessage.parentElement).toHaveClass("my-message");
    expect(screen.getByText("Yo")).toBeInTheDocument();

    // Mensaje del oponente
    const otherMessage = screen.getByText("Hola, este es el tuyo");
    expect(otherMessage).toBeInTheDocument();
    expect(otherMessage.parentElement).toHaveClass("other-message");
    expect(screen.getByText("Oponente")).toBeInTheDocument();
  });

  it("should call sendMessage and clear input on submit", async () => {
    mockSendMessage.mockResolvedValue(undefined); // Simula éxito
    render(<Chat />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    const sendButton = screen.getByRole("button", { name: "Enviar" });

    await userEvent.type(input, "Mensaje de prueba");
    expect(input).toHaveValue("Mensaje de prueba");

    await userEvent.click(sendButton);

    expect(chatService.sendMessage).toHaveBeenCalledTimes(1);
    expect(chatService.sendMessage).toHaveBeenCalledWith(
      100, // game_id
      1, // myPlayerId
      "Mensaje de prueba"
    );

    expect(input).toHaveValue("");
    expect(screen.queryByText(/Error al enviar/i)).not.toBeInTheDocument();
  });

  it("should show an error message if sendMessage fails", async () => {
    const error = new Error("API Falló");
    mockSendMessage.mockRejectedValue(error); // Simula fallo
    render(<Chat />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    const sendButton = screen.getByRole("button", { name: "Enviar" });

    await userEvent.type(input, "Mensaje fallido");
    await userEvent.click(sendButton);

    expect(chatService.sendMessage).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("Mensaje fallido");
    expect(screen.getByText("API Falló")).toBeInTheDocument();
    expect(screen.getByText("API Falló")).toHaveClass("chat-error");
  });

  it("should toggle collapse when header is clicked", async () => {
    const { container } = render(<Chat />);
    const header = screen.getByText("Chat").parentElement; // El .chat-header
    const chatContainer = container.querySelector(".chat-container");

    expect(chatContainer).not.toHaveClass("collapsed");
    expect(screen.getByRole("button", { name: "—" })).toBeInTheDocument();

    await userEvent.click(header!);
    expect(chatContainer).toHaveClass("collapsed");
    expect(screen.getByRole("button", { name: "□" })).toBeInTheDocument();

    await userEvent.click(header!);
    expect(chatContainer).not.toHaveClass("collapsed");
    expect(screen.getByRole("button", { name: "—" })).toBeInTheDocument();
  });
});

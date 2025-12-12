/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListGames from "./ListGames";
import { useLocation, useNavigate } from "react-router-dom";
import playerService from "../../services/playerService";
import type { GameResponse } from "../../services/gameService";
import destinations from "../../navigation/destinations"; // Import faltante
// Mock del WebSocket Global
let mockWebSocketInstance: {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (event: any) => void;
  onclose: () => void;
  close: Mock;
};

class MockWebSocket {
  close = vi.fn();
  // CORRECCIÓN: 'url' se marca como '_url' para evitar el warning
  constructor(_url: string) {
    mockWebSocketInstance = this as any;
  }
}
vi.stubGlobal("WebSocket", MockWebSocket);

// Mock de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// Mock de Servicios
vi.mock("../../services/playerService");

// CORRECCIÓN: Mock de destinations
vi.mock("../../navigation/destinations", () => ({
  default: {
    lobby: "/mock-lobby",
  },
}));

// Mock de Componentes
vi.mock("../../components/Button", () => ({
  default: ({ label, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

const mockNavigate = vi.fn();
// CORRECCIÓN: Eliminada la variable 'mockCreatePlayer' no leída

// Datos de juego mockeados
const mockGames: GameResponse[] = [
  {
    game_id: 1,
    name: "Partida en Curso",
    min_players: 2,
    max_players: 6,
    players_amount: 4,
    status: "in course",
  } as GameResponse,
  {
    game_id: 2,
    name: "Partida Abierta",
    min_players: 2,
    max_players: 6,
    players_amount: 1,
    status: "waiting players",
  } as GameResponse,
  {
    game_id: 3,
    name: "Partida Llena",
    min_players: 2,
    max_players: 2,
    players_amount: 2,
    status: "full",
  } as GameResponse,
];

describe("ListGames Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        playerName: "Test Player",
        playerDate: "2000-01-01",
        playerAvatar: "avatar.png",
      },
    });
    vi.mocked(playerService.createPlayer).mockResolvedValue({
      player_id: 1,
      name: "Test Player",
    } as any);
  });

  it("should connect to WebSocket and render games on message", () => {
    render(<ListGames />);

    // 1. Simula la conexión abierta
    act(() => {
      mockWebSocketInstance.onopen();
    });

    // 2. Simula la llegada de datos
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(mockGames) });
    });

    // 3. Verifica que los juegos se renderizaron
    expect(screen.getByText("Partida Abierta")).toBeInTheDocument();
    expect(screen.getByText("Partida en Curso")).toBeInTheDocument();
    expect(screen.getByText("Partida Llena")).toBeInTheDocument();
  });

  it("should sort games by status", () => {
    render(<ListGames />);
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(mockGames) });
    });

    const listItems = screen.getAllByRole("listitem");
    // "waiting players" (Abierta) debe ir primero
    expect(listItems[0]).toHaveTextContent("Partida Abierta");
    // "full" (Llena) debe ir segundo
    expect(listItems[1]).toHaveTextContent("Partida Llena");
    // "in course" (En Curso) debe ir tercero
    expect(listItems[2]).toHaveTextContent("Partida en Curso");
  });

  it("should disable 'Unirme' button for non-joinable games", () => {
    render(<ListGames />);
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(mockGames) });
    });

    // Partida "waiting players" (Joinable)
    const joinableButton = screen
      .getByText("Partida Abierta")
      .closest("li")
      ?.querySelector("button");
    expect(joinableButton).not.toBeDisabled();

    // Partida "in course" (Not Joinable)
    const inCourseButton = screen
      .getByText("Partida en Curso")
      .closest("li")
      ?.querySelector("button");
    expect(inCourseButton).toBeDisabled();

    // Partida "full" (Not Joinable)
    const fullButton = screen
      .getByText("Partida Llena")
      .closest("li")
      ?.querySelector("button");
    expect(fullButton).toBeDisabled();
  });

  it("should call createPlayer and navigate on handleJoin", async () => {
    const mockJoinableGame = mockGames[1]; // "Partida Abierta"
    render(<ListGames />);
    act(() => {
      mockWebSocketInstance.onmessage({
        data: JSON.stringify([mockJoinableGame]),
      });
    });

    const joinButton = screen.getByRole("button", { name: "Unirme" });
    await userEvent.click(joinButton);

    // Verifica que se llamó al servicio con los datos de useLocation
    expect(playerService.createPlayer).toHaveBeenCalledWith({
      name: "Test Player",
      birth_date: "2000-01-01",
      host: false,
      game_id: mockJoinableGame.game_id,
      avatar: "avatar.png",
    });

    // Verifica la navegación
    expect(mockNavigate).toHaveBeenCalledWith(destinations.lobby, {
      state: {
        game: mockJoinableGame,
        player: expect.objectContaining({ player_id: 1 }),
        playerAvatar: "avatar.png",
      },
    });
  });

  it("should show an error message if WebSocket fails", () => {
    render(<ListGames />);
    act(() => {
      mockWebSocketInstance.onerror(new Event("error"));
    });
    expect(
      screen.getByText(
        "Error en la conexión en tiempo real. Intenta recargar la página."
      )
    ).toBeInTheDocument();
  });
});

/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Lobby from "./Lobby";
import { useLocation, useNavigate } from "react-router-dom";
import gameService from "../../services/gameService";
import type { PlayerResponse } from "../../services/playerService";

// Mock del WebSocket Global
let mockWebSocketInstance: {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (event: any) => void;
  onclose: () => void;
  close: ReturnType<typeof vi.fn>;
};

// CORRECCIÓN: Envolvemos la clase en vi.fn() para espiarla
const MockWebSocket = vi.fn((_url: string) => {
  const instance = {
    close: vi.fn(),
    onopen: () => {},
    onmessage: () => {},
    onerror: () => {},
    onclose: () => {},
  };
  mockWebSocketInstance = instance as any;
  return instance;
});
vi.stubGlobal("WebSocket", MockWebSocket);

// Mock de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// Mock de Servicios y Config
vi.mock("../../services/gameService");
vi.mock("../../services/config", () => ({
  httpServerUrl: "http://localhost:8000",
}));

const mockNavigate = vi.fn();

// --- Datos base para useLocation ---
const mockGame = {
  game_id: 123,
  name: "Lobby Test",
  min_players: 2,
};
// CORRECCIÓN: Agregado game_id
const mockPlayer: PlayerResponse = {
  player_id: 1,
  name: "Host Player",
  host: true,
  birth_date: "2000-01-01",
  avatar: "avatar.png",
  game_id: 123,
};
const mockGuestPlayer: PlayerResponse = {
  player_id: 2,
  name: "Guest Player",
  host: false,
  birth_date: "2000-02-02",
  avatar: "avatar2.png",
  game_id: 123,
};

describe("Lobby Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
    vi.mocked(gameService.startGame).mockResolvedValue({} as any);

    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        game: mockGame,
        player: mockPlayer,
      },
    });
  });

  it("should connect to WebSocket and show loading", () => {
    render(<Lobby />);
    // CORRECCIÓN: Testeamos el mock de vi.fn()
    expect(MockWebSocket).toHaveBeenCalledWith(
      "ws://localhost:8000/ws/lobby/123"
    );
    expect(screen.getByText("Cargando jugadores...")).toBeInTheDocument();
  });

  it("should render players and 'Iniciar' button for Host", () => {
    render(<Lobby />);
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer, mockGuestPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    expect(screen.getByText("Host Player")).toBeInTheDocument();
    expect(screen.getByText("(HOST)")).toBeInTheDocument();
    expect(screen.getByText("Guest Player")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
  });

  it("should render players and 'Waiting' text for Guest", () => {
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        game: mockGame,
        player: mockGuestPlayer,
      },
    });
    render(<Lobby />);
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer, mockGuestPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    expect(
      screen.queryByRole("button", { name: "Iniciar" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Esperando a que el anfitrión inicie la partida ...")
    ).toBeInTheDocument();
  });

  it("should show validation error if host clicks 'Iniciar' too early", async () => {
    render(<Lobby />);
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    const startButton = screen.getByRole("button", { name: "Iniciar" });
    await userEvent.click(startButton);

    expect(
      screen.getByText("La partida necesita al menos 2 jugadores para iniciar.")
    ).toBeInTheDocument();
    expect(gameService.startGame).not.toHaveBeenCalled();
  });

  it("should call startGame if host clicks 'Iniciar' with enough players", async () => {
    render(<Lobby />);
    const wsMessage = {
      type: "players",
      data: JSON.stringify([mockPlayer, mockGuestPlayer]),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    const startButton = screen.getByRole("button", { name: "Iniciar" });
    await userEvent.click(startButton);

    expect(gameService.startGame).toHaveBeenCalledWith(mockGame.game_id);
  });

  it("should navigate to /game when 'in course' message is received", () => {
    render(<Lobby />);
    const gameData = { ...mockGame, status: "in course" };
    const wsMessage = {
      type: "game",
      data: JSON.stringify(gameData),
    };
    act(() => {
      mockWebSocketInstance.onmessage({ data: JSON.stringify(wsMessage) });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/game", {
      state: {
        game: gameData,
        player: mockPlayer,
      },
    });
  });
});

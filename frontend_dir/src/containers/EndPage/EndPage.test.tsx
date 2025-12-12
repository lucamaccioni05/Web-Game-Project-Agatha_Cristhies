/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EndPage from "./EndPage";
import { useLocation, useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";
import type { PlayerStateResponse } from "../../services/playerService";
import type { GameResponse } from "../../services/gameService";

// Mocks de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// Mock de destinations
vi.mock("../../navigation/destinations", () => ({
  default: {
    home: "/",
  },
}));

const mockNavigate = vi.fn();

// Mocks de datos (¡completos!)
const mockPlayer1: PlayerStateResponse = {
  player_id: 1,
  name: "Ulises (Ciudadano)",
  host: true,
  game_id: 1,
  birth_date: "2000-01-01",
  social_disgrace: false,
  pending_action: null,
  votes_received: 0,
  cards: [],
  sets: [],
  secrets: [
    {
      secret_id: 1,
      revelated: true,
      murderer: false,
      accomplice: false,
      game_id: 1,
    } as any,
  ],
};
const mockPlayer2: PlayerStateResponse = {
  player_id: 2,
  name: "Carlos (Asesino)",
  host: false,
  game_id: 1,
  birth_date: "2000-01-01",
  social_disgrace: false,
  pending_action: null,
  votes_received: 0,
  cards: [],
  sets: [],
  secrets: [
    {
      secret_id: 2,
      revelated: true,
      murderer: true,
      accomplice: false,
      game_id: 1,
    } as any,
  ],
};
const mockPlayer3: PlayerStateResponse = {
  player_id: 3,
  name: "Ana (Cómplice)",
  host: false,
  game_id: 1,
  birth_date: "2000-01-01",
  social_disgrace: false,
  pending_action: null,
  votes_received: 0,
  cards: [],
  sets: [],
  secrets: [
    {
      secret_id: 3,
      revelated: true,
      murderer: false,
      accomplice: true,
      game_id: 1,
    } as any,
  ],
};

const mockPlayers = [mockPlayer1, mockPlayer2, mockPlayer3];

const mockGame: GameResponse = {
  game_id: 1,
  name: "Partida Finalizada",
  status: "finished",
  min_players: 2,
  max_players: 6,
  cards_left: 10, // Por defecto, no se acabó el mazo
  // AGREGADAS PARA CORREGIR EL ERROR DE LA IMAGEN
  players_amount: 3,
  current_turn: 10,
  log: [],
  direction_folly: null, // CORREGIDO: de 'true' a 'null'
};

describe("EndPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
    // Un estado base por defecto
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        players: mockPlayers,
        game: mockGame,
        myPlayerId: 1, // Soy el Ciudadano
      },
    });
  });

  it("should show 'Ganaste' if citizen and bad guys are discovered (deck NOT empty)", () => {
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        players: mockPlayers,
        game: { ...mockGame, cards_left: 10 }, // No se acabó
        myPlayerId: 1, // Soy Ciudadano
      },
    });
    render(<EndPage />);
    expect(screen.getByText("¡Ganaste!")).toBeInTheDocument();
    expect(
      screen.getByText("¡El asesino ha sido descubierto!")
    ).toBeInTheDocument();
    expect(screen.getByText("¡Ganaste!")).toHaveClass("win");
  });

  it("should show 'Perdiste' if murderer and bad guys are discovered (deck NOT empty)", () => {
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        players: mockPlayers,
        game: { ...mockGame, cards_left: 10 }, // No se acabó
        myPlayerId: 2, // Soy Asesino
      },
    });
    render(<EndPage />);
    expect(screen.getByText("¡Perdiste!")).toBeInTheDocument();
    expect(screen.getByText("¡Te descubrieron!")).toBeInTheDocument();
    expect(screen.getByText("¡Perdiste!")).toHaveClass("lose");
  });

  it("should show 'Ganaste' if murderer and deck runs out (cards_left = 0)", () => {
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        players: mockPlayers,
        game: { ...mockGame, cards_left: 0 }, // Se acabó el mazo
        myPlayerId: 2, // Soy Asesino
      },
    });
    render(<EndPage />);
    expect(screen.getByText("¡Ganaste!")).toBeInTheDocument();
    expect(screen.getByText("¡Has logrado escapar!")).toBeInTheDocument();
    expect(screen.getByText("¡Ganaste!")).toHaveClass("win");
  });

  it("should show 'Perdiste' if citizen and deck runs out (cards_left = 0)", () => {
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        players: mockPlayers,
        game: { ...mockGame, cards_left: 0 }, // Se acabó el mazo
        myPlayerId: 1, // Soy Ciudadano
      },
    });
    render(<EndPage />);
    expect(screen.getByText("¡Perdiste!")).toBeInTheDocument();
    expect(screen.getByText("El asesino ha escapado.")).toBeInTheDocument();
    expect(screen.getByText("¡Perdiste!")).toHaveClass("lose");
  });

  it("should correctly display all player roles", () => {
    render(<EndPage />);
    expect(
      screen.getByText("Ulises (Ciudadano)").nextElementSibling
    ).toHaveTextContent("Ciudadano");
    expect(
      screen.getByText("Carlos (Asesino)").nextElementSibling
    ).toHaveTextContent("Asesino");
    expect(
      screen.getByText("Ana (Cómplice)").nextElementSibling
    ).toHaveTextContent("Cómplice");
  });

  it("should show fallback error message if no state is provided", () => {
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({ state: null });
    render(<EndPage />);
    expect(screen.getByText("Error al cargar resultados")).toBeInTheDocument();
  });

  it("should navigate to home when 'Volver' button is clicked", async () => {
    render(<EndPage />);
    const button = screen.getByRole("button", { name: "Volver al inicio" });
    await userEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(destinations.home);
  });
});

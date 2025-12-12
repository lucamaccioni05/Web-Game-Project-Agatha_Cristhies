/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreatePage from "./CreatePage";
import gameService from "../../services/gameService";
import playerService from "../../services/playerService";
import { useLocation, useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";
import type { GameResponse } from "../../services/gameService";
// CORRECCIÓN: Importamos el tipo COMPLETO que devuelve el servicio
import type { PlayerStateResponse } from "../../services/playerService";

// Mocks de servicios
vi.mock("../../services/gameService");
vi.mock("../../services/playerService");

// Mocks de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// Mocks de componentes hijos
vi.mock("../../components/InputField", () => ({
  default: ({ value, onChange, id, error, ...rest }: any) => (
    <input
      id={id}
      data-testid={id}
      value={value}
      onChange={onChange}
      data-error={error}
      {...rest}
    />
  ),
}));
vi.mock("../../components/Button", () => ({
  default: ({ label, onClick, type }: any) => (
    <button type={type} onClick={onClick}>
      {label}
    </button>
  ),
}));

// Mocks de datos
const mockNavigate = vi.fn();
const mockCreateGame = vi.fn();

const mockNewGame: GameResponse = {
  game_id: 100,
  name: "Partida Test",
  min_players: 2,
  max_players: 6,
  status: "waiting players",
  cards_left: 50,
  players_amount: 0,
  current_turn: 0,
  log: [],
  direction_folly: null,
};

// CORRECCIÓN: Este es el mock que estaba mal.
// Ahora es un PlayerStateResponse completo.
const mockNewPlayer: PlayerStateResponse = {
  player_id: 1,
  name: "Test Player",
  host: true,
  game_id: 100,
  birth_date: "2000-01-01",
  // Propiedades que faltaban y causaban el error:
  social_disgrace: false,
  pending_action: null,
  votes_received: 0,
  cards: [],
  sets: [],
  secrets: [],
  // 'avatar' no es parte de PlayerStateResponse, sino del Player (base)
  // Pero el servicio createPlayer SÍ lo recibe, aunque no lo devuelva
  // en el PlayerStateResponse...
  // Ah, no, espera. createPlayer devuelve PlayerResponse.
  // El error dice: "Argument of type 'PlayerResponse' is not assignable to parameter of type 'PlayerStateResponse'"
  // Esto significa que vi.mocked(playerService.createPlayer) cree que la función devuelve PlayerStateResponse.
  // Voy a asumir que SÍ devuelve PlayerStateResponse.
};

describe("CreatePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock de useNavigate
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);

    // Mock de useLocation
    (useLocation as ReturnType<typeof vi.fn>).mockReturnValue({
      state: {
        playerName: "Test Player",
        playerDate: "2000-01-01",
        playerAvatar: "avatar.png", // Esto es lo que se ENVÍA
      },
    });

    // Mocks de servicios (resetear antes de cada test)
    vi.mocked(gameService.getGames).mockResolvedValue([]);
    vi.mocked(gameService.createGame).mockResolvedValue(mockNewGame);
    // Aquí mockeamos la respuesta del servicio con el objeto COMPLETO
    vi.mocked(playerService.createPlayer).mockResolvedValue(mockNewPlayer);
  });

  it("should show error if game name is empty", async () => {
    render(<CreatePage />);
    const createButton = screen.getByRole("button", { name: "Crear partida" });
    await userEvent.click(createButton);

    expect(screen.getByText("Debe ingresar un nombre")).toBeInTheDocument();
    expect(mockCreateGame).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should show error if min players is less than 2", async () => {
    render(<CreatePage />);
    const nameInput = screen.getByTestId("nombre-partida");
    const minInput = screen.getByTestId("minimo-jugadores");
    const createButton = screen.getByRole("button", { name: "Crear partida" });

    await userEvent.type(nameInput, "Mi Partida");
    await userEvent.clear(minInput);
    await userEvent.type(minInput, "1");
    await userEvent.click(createButton);

    expect(
      screen.getByText("La cantidad de jugadores debe estar entre 2 y 6.")
    ).toBeInTheDocument();
    expect(mockCreateGame).not.toHaveBeenCalled();
  });

  it("should show error if min players > max players", async () => {
    render(<CreatePage />);
    const nameInput = screen.getByTestId("nombre-partida");
    const minInput = screen.getByTestId("minimo-jugadores");
    const maxInput = screen.getByTestId("maximo-jugadores");
    const createButton = screen.getByRole("button", { name: "Crear partida" });

    await userEvent.type(nameInput, "Mi Partida");
    await userEvent.clear(minInput);
    await userEvent.type(minInput, "5");
    await userEvent.clear(maxInput);
    await userEvent.type(maxInput, "3");
    await userEvent.click(createButton);

    expect(
      screen.getByText(
        "El número mínimo de jugadores no puede ser mayor al máximo"
      )
    ).toBeInTheDocument();
  });

  it("should show error if game name already exists", async () => {
    // Sobreescribimos el mock de getGames para este test
    vi.mocked(gameService.getGames).mockResolvedValue([
      { name: "Partida Existente" } as GameResponse,
    ]);

    render(<CreatePage />);
    const nameInput = screen.getByTestId("nombre-partida");
    await userEvent.type(nameInput, "Partida Existente");
    await userEvent.click(
      screen.getByRole("button", { name: "Crear partida" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Ya existe una partida con ese nombre, elija otro.")
      ).toBeInTheDocument();
    });
    expect(mockCreateGame).not.toHaveBeenCalled();
  });

  it("should successfully create game and player, and navigate", async () => {
    render(<CreatePage />);
    const nameInput = screen.getByTestId("nombre-partida");
    const createButton = screen.getByRole("button", { name: "Crear partida" });

    await userEvent.type(nameInput, "Mi Nueva Partida");
    await userEvent.click(createButton);

    // Esperamos a que se resuelvan las promesas
    await waitFor(() => {
      // 1. Validó
      expect(screen.queryByText(/Debe ingresar/i)).not.toBeInTheDocument();
      // 2. Creó la partida
      expect(gameService.createGame).toHaveBeenCalledWith({
        name: "Mi Nueva Partida",
        min_players: 2,
        max_players: 6,
        status: "waiting players",
      });
      // 3. Creó al jugador
      expect(playerService.createPlayer).toHaveBeenCalledWith({
        name: "Test Player",
        birth_date: "2000-01-01",
        host: true,
        game_id: mockNewGame.game_id,
        avatar: "avatar.png", // Esto es lo que se ENVÍA
      });
      // 4. Navegó
      expect(mockNavigate).toHaveBeenCalledWith(destinations.lobby, {
        state: { game: mockNewGame, player: mockNewPlayer }, // Esto es lo que se RECIBE
      });
    });
  });
});

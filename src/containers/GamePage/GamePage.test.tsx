/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import GamePage from "./GamePage";

// Mockeamos el Provider y el Gameboard. No nos importa lo que
// hacen, solo que GamePage los renderice.
vi.mock("../../context/GameContext", () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="game-provider">{children}</div>
  ),
}));
vi.mock("./Gameboard", () => ({
  default: () => <div data-testid="gameboard"></div>,
}));

// Mock de React Router
vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(),
}));

describe("GamePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render error message if location state is missing", () => {
    // Simula que no hay estado
    vi.mocked(useLocation).mockReturnValue({ state: null } as any);

    render(<GamePage />);

    expect(
      screen.getByText(/Falta el contexto de la partida/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("gameboard")).not.toBeInTheDocument();
  });

  it("should render error message if game is missing", () => {
    vi.mocked(useLocation).mockReturnValue({
      state: { player: { player_id: 1 } },
    } as any);
    render(<GamePage />);
    expect(
      screen.getByText(/Falta el contexto de la partida/i)
    ).toBeInTheDocument();
  });

  it("should render GameProvider and Gameboard if state is valid", () => {
    // Simula estado válido
    vi.mocked(useLocation).mockReturnValue({
      state: {
        game: { game_id: 1 },
        player: { player_id: 1 },
      },
    } as any);

    render(<GamePage />);

    // Verifica que el error NO está
    expect(
      screen.queryByText(/Falta el contexto de la partida/i)
    ).not.toBeInTheDocument();

    // Verifica que los hijos SÍ están
    expect(screen.getByTestId("game-provider")).toBeInTheDocument();
    expect(screen.getByTestId("gameboard")).toBeInTheDocument();
  });
});

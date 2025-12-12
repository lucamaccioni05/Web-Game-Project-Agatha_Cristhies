/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlackmailedModal } from "./BlackmailedModal";

// Mocks de dependencias
import { useGameContext } from "../context/GameContext";
import eventService from "../services/eventService";
import type { PlayerStateResponse } from "../services/playerService";
import type { SecretResponse } from "../services/secretService";

// Mock del componente hijo <Secret>
vi.mock("./Cards/Secret", () => ({
  default: (props: any) => (
    <div
      data-testid="secret-card"
      data-secret-id={props.secret_id}
      data-murderer={props.murderer}
      data-accomplice={props.accomplice}
      data-revealed={props.revealed}
    />
  ),
}));

// Mock del GameContext
vi.mock("../context/GameContext");

// Mock de eventService
vi.mock("../services/eventService");

// --- Mock de datos ---
const mockSecret: SecretResponse = {
  secret_id: 101,
  player_id: 1, // El dueño del secreto
  game_id: 1,
  revelated: false, // No importa, el modal lo fuerza a 'true'
  murderer: true,
  accomplice: false,
};

const mockPlayerShowing: PlayerStateResponse = {
  player_id: 1,
  name: "Jugador Chantajeado",
  pending_action: null,
} as any;

const mockPlayerTargeted: PlayerStateResponse = {
  player_id: 2,
  name: "Chantajista",
  pending_action: "BLACKMAILED", // El que recibe
} as any;

const mockObserver: PlayerStateResponse = {
  player_id: 3,
  name: "Observador",
  pending_action: null,
} as any;

const mockPlayers = [mockPlayerShowing, mockPlayerTargeted, mockObserver];

// --- Mocks de funciones ---
let mockDispatch: ReturnType<typeof vi.fn>;
let mockDeactivateBlackmailed: ReturnType<typeof vi.fn>;
let mockAlert: ReturnType<typeof vi.fn>;

describe("BlackmailedModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDispatch = vi.fn();
    mockDeactivateBlackmailed = vi.fn().mockResolvedValue(undefined);
    vi.mocked(eventService.deactivateBlackmailed).mockImplementation(
      mockDeactivateBlackmailed
    );

    // Mockear window.alert para que no falle en el test
    mockAlert = vi.fn();
    vi.stubGlobal("alert", mockAlert);
  });

  it("should render the view for the blackmailed player (playerShowing)", () => {
    // Soy el jugador 1 (Chantajeado)
    vi.mocked(useGameContext).mockReturnValue({
      state: { myPlayerId: 1 },
      dispatch: mockDispatch,
    } as any);

    render(<BlackmailedModal secret={mockSecret} players={mockPlayers} />);

    // Verifica el título y mensaje correctos
    expect(
      screen.getByText("Le mostraste tu secreto a Chantajista:")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ahora puedes continuar tu turno.")
    ).toBeInTheDocument();

    // Verifica que el secreto se renderiza
    const secretCard = screen.getByTestId("secret-card");
    expect(secretCard).toBeInTheDocument();
    expect(secretCard).toHaveAttribute("data-murderer", "true");
    expect(secretCard).toHaveAttribute("data-revealed", "true"); // Forzado a true
  });

  it("should render the view for the blackmailer (playerTargeted)", () => {
    // Soy el jugador 2 (Chantajista)
    vi.mocked(useGameContext).mockReturnValue({
      state: { myPlayerId: 2 },
      dispatch: mockDispatch,
    } as any);

    render(<BlackmailedModal secret={mockSecret} players={mockPlayers} />);

    // Verifica el título y mensaje correctos
    expect(
      screen.getByText("Jugador Chantajeado te ha revelado su secreto:")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Información obtenida. Presiona 'Entendido'.")
    ).toBeInTheDocument();

    // Verifica que el secreto se renderiza
    expect(screen.getByTestId("secret-card")).toBeInTheDocument();
  });

  it("should render null if the user is an observer", () => {
    // Soy el jugador 3 (Observador)
    vi.mocked(useGameContext).mockReturnValue({
      state: { myPlayerId: 3 },
      dispatch: mockDispatch,
    } as any);

    const { container } = render(
      <BlackmailedModal secret={mockSecret} players={mockPlayers} />
    );

    // No debe renderizar nada
    expect(container.firstChild).toBeNull();
  });

  it("should call deactivateBlackmailed and dispatch on 'Entendido' click", async () => {
    // Soy el jugador 1
    vi.mocked(useGameContext).mockReturnValue({
      state: { myPlayerId: 1 },
      dispatch: mockDispatch,
    } as any);

    render(<BlackmailedModal secret={mockSecret} players={mockPlayers} />);

    const button = screen.getByRole("button", { name: "Entendido" });
    await userEvent.click(button);

    // Verifica que se llamó al servicio con los IDs correctos
    expect(mockDeactivateBlackmailed).toHaveBeenCalledTimes(1);
    expect(mockDeactivateBlackmailed).toHaveBeenCalledWith(
      mockPlayerShowing.player_id,
      mockPlayerTargeted.player_id
    );

    // Verifica que se limpió el estado
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_BLACKMAIL_SECRET",
      payload: null,
    });
  });

  it("should still dispatch if deactivateBlackmailed fails", async () => {
    // Simulamos que el servicio falla
    const error = new Error("API Failed");
    mockDeactivateBlackmailed.mockRejectedValue(error);

    // Soy el jugador 1
    vi.mocked(useGameContext).mockReturnValue({
      state: { myPlayerId: 1 },
      dispatch: mockDispatch,
    } as any);

    render(<BlackmailedModal secret={mockSecret} players={mockPlayers} />);

    const button = screen.getByRole("button", { name: "Entendido" });
    await userEvent.click(button);

    // El servicio fue llamado
    expect(mockDeactivateBlackmailed).toHaveBeenCalledTimes(1);
    // Se llamó a la alerta
    expect(mockAlert).toHaveBeenCalledWith(
      "Error al cerrar el evento de chantaje."
    );

    // El dispatch se llama IGUAL (en el catch) para cerrar el modal
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_BLACKMAIL_SECRET",
      payload: null,
    });
  });
});

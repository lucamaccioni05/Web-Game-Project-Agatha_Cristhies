/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LogMessage } from "./LogMessage";
import { useGameContext } from "../context/GameContext";
import type { PlayerStateResponse } from "../services/playerService";
import type { LogEntry } from "../context/GameContext";

// Mock del GameContext
vi.mock("../context/GameContext");

const mockPlayers: PlayerStateResponse[] = [
  { player_id: 1, name: "Ulises" } as any,
  { player_id: 2, name: "Oponente" } as any,
];

// Una fecha falsa para 'created_at'
const MOCK_DATE = new Date().toISOString();

describe("LogMessage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Proveemos un estado mockeado del contexto
    vi.mocked(useGameContext).mockReturnValue({
      state: { players: mockPlayers },
    } as any);
  });

  it("should format 'event' (Not so fast) message correctly", () => {
    const log: LogEntry = {
      log_id: 1,
      player_id: 1,
      type: "event",
      card_name: "Not so fast",
      set_name: null,
      created_at: MOCK_DATE,
    };
    render(<LogMessage log={log} />);
    expect(
      screen.getByText(`🚫 Ulises responde con "Not So Fast!".`)
    ).toBeInTheDocument();
  });

  it("should format 'event' (generic) message correctly", () => {
    const log: LogEntry = {
      log_id: 2,
      player_id: 2,
      type: "event",
      card_name: "Another Victim",
      set_name: null,
      created_at: MOCK_DATE,
    };
    render(<LogMessage log={log} />);
    expect(
      screen.getByText(`⚠️ Oponente intenta jugar "Another Victim".`)
    ).toBeInTheDocument();
  });

  it("should format 'Set' message correctly", () => {
    const log: LogEntry = {
      log_id: 3,
      player_id: 1,
      type: "Set",
      set_name: "Parker Pyne",
      card_name: null,
      created_at: MOCK_DATE,
    };
    render(<LogMessage log={log} />);
    expect(
      screen.getByText(`🧩 Ulises intenta jugar el set "Parker Pyne".`)
    ).toBeInTheDocument();
  });

  it("should format 'TurnChange' message correctly", () => {
    const log: LogEntry = {
      log_id: 4,
      player_id: 2,
      type: "TurnChange",
      card_name: null,
      set_name: null,
      created_at: MOCK_DATE,
    };
    render(<LogMessage log={log} />);
    expect(screen.getByText(`➡️ Es el turno de Oponente.`)).toBeInTheDocument();
  });

  it("should use fallback player name if not found", () => {
    const log: LogEntry = {
      log_id: 5,
      player_id: 99, // ID no existe en el mock
      type: "TurnChange",
      card_name: null,
      set_name: null,
      created_at: MOCK_DATE,
    };
    render(<LogMessage log={log} />);
    expect(
      screen.getByText(`➡️ Es el turno de Jugador 99.`)
    ).toBeInTheDocument();
  });
});

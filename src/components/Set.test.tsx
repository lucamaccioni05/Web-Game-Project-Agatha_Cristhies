/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Set from "./Set";
import type { CardResponse } from "../services/cardService";
import type { SetResponse } from "../services/setService";

// Mock del componente hijo <Detective>
vi.mock("./Cards/Detectives", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="detective-card">{name}</div>
  ),
}));

describe("Set Component", () => {
  let onSetClickMock: ReturnType<typeof vi.fn>;

  const mockCards: CardResponse[] = [
    { card_id: 1, name: "Poirot" } as CardResponse,
    { card_id: 2, name: "Marple" } as CardResponse,
  ];

  const mockSetProps = {
    game_id: 1,
    player_id: 10,
    set_id: 101,
    name: "Set de Prueba",
    cards: mockCards,
    isSelected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onSetClickMock = vi.fn();
  });

  it("should render all cards passed as props", () => {
    render(<Set {...mockSetProps} />);
    const renderedCards = screen.getAllByTestId("detective-card");
    expect(renderedCards).toHaveLength(2);
    expect(screen.getByText("Poirot")).toBeInTheDocument();
    expect(screen.getByText("Marple")).toBeInTheDocument();
  });

  it("should apply 'selected' class when isSelected is true", () => {
    render(<Set {...mockSetProps} isSelected={true} />);
    const setElement = screen.getByRole("button", { name: /Set de Prueba/i });
    expect(setElement).toHaveClass("selected");
    expect(setElement).not.toHaveClass("table");
  });

  it("should apply 'table' class when isSelected is false", () => {
    render(<Set {...mockSetProps} isSelected={false} />);
    const setElement = screen.getByRole("button", { name: /Set de Prueba/i });
    expect(setElement).toHaveClass("table");
    expect(setElement).not.toHaveClass("selected");
  });

  it("should call onSetClick with the full SetResponse object when clicked", async () => {
    render(<Set {...mockSetProps} onSetClick={onSetClickMock} />);
    await userEvent.click(screen.getByRole("button"));

    // Construimos el objeto exacto que esperamos
    const expectedResponse: SetResponse = {
      game_id: mockSetProps.game_id,
      player_id: mockSetProps.player_id,
      set_id: mockSetProps.set_id,
      name: mockSetProps.name,
      detective: mockSetProps.cards,
    };

    expect(onSetClickMock).toHaveBeenCalledTimes(1);
    expect(onSetClickMock).toHaveBeenCalledWith(expectedResponse);
  });

  it("should not crash if clicked when onSetClick is not provided", async () => {
    render(<Set {...mockSetProps} onSetClick={undefined} />);
    const setElement = screen.getByRole("button");
    // La prueba pasa si esto no genera un error
    await expect(userEvent.click(setElement)).resolves.not.toThrow();
  });
});

/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Decks from "./Decks";
import type { CardResponse } from "../services/cardService";

// Mock de los componentes hijos
vi.mock("./Cards/CardBase", () => ({
  default: () => <div data-testid="card-base"></div>,
}));
vi.mock("./Cards/Detectives", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="detective-card">{name}</div>
  ),
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="event-card">{name}</div>
  ),
}));

describe("Decks Component", () => {
  const mockDiscardedCards: CardResponse[] = [
    {
      card_id: 1,
      type: "detective",
      name: "Last Discarded Detective",
      game_id: 1,
      player_id: 1,
      picked_up: false,
      dropped: true,
    },
    {
      card_id: 2,
      type: "event",
      name: "Previous Card",
      game_id: 1,
      player_id: 1,
      picked_up: false,
      dropped: true,
    },
  ];

  beforeEach(() => {
    cleanup();
  });

  it("renders the draw deck with the correct card count", () => {
    render(<Decks discardedCards={[]} cardsLeftCount={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByTestId("card-base")).toBeInTheDocument();
  });

  it("does NOT render the card count if cardsLeftCount is null", () => {
    render(<Decks discardedCards={[]} cardsLeftCount={null} />);
    // La forma más segura de verificar que no está, es por la clase
    const { container } = render(
      <Decks discardedCards={[]} cardsLeftCount={null} />
    );
    expect(container.querySelector(".card-counter")).toBeNull();
  });

  it("renders an empty discard pile when no cards are discarded", () => {
    render(<Decks discardedCards={[]} cardsLeftCount={10} />);
    // Verificamos que no se renderice ninguna carta específica
    expect(screen.queryByTestId("detective-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("event-card")).not.toBeInTheDocument();
    // El componente renderiza un <p></p> vacío
    expect(screen.getByTitle("Descarte (tope visible)").innerHTML).toBe(
      "<p></p>"
    );
  });

  it("renders the top card of the discard pile if it's a detective", () => {
    render(<Decks discardedCards={mockDiscardedCards} cardsLeftCount={10} />);
    const topCard = screen.getByTestId("detective-card");
    expect(topCard).toBeInTheDocument();
    expect(topCard).toHaveTextContent("Last Discarded Detective");
    // Verificamos que la segunda carta del array (Previous Card) NO se renderice
    expect(screen.queryByText("Previous Card")).not.toBeInTheDocument();
  });

  it("renders the top card of the discard pile if it's an event", () => {
    const eventFirstDiscard: CardResponse[] = [
      {
        card_id: 3,
        type: "event",
        name: "Top Event Card",
        game_id: 1,
        player_id: 1,
        picked_up: false,
        dropped: true,
      },
      ...mockDiscardedCards,
    ];
    render(<Decks discardedCards={eventFirstDiscard} cardsLeftCount={10} />);
    const topCard = screen.getByTestId("event-card");
    expect(topCard).toBeInTheDocument();
    expect(topCard).toHaveTextContent("Top Event Card");
  });
});

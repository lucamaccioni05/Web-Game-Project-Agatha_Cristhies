/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DraftPile from "./DraftPile";
import type { CardResponse } from "../services/cardService";

// Mocks de componentes hijos
vi.mock("./Cards/Detectives", () => ({
  default: ({ name, size }: { name: string; size: string }) => (
    <div data-testid="detective-card" data-size={size}>
      {name}
    </div>
  ),
}));
vi.mock("./Cards/Events", () => ({
  default: ({ name, size }: { name: string; size: string }) => (
    <div data-testid="event-card" data-size={size}>
      {name}
    </div>
  ),
}));
vi.mock("./Button", () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

describe("DraftPile Component", () => {
  const mockCards: CardResponse[] = [
    {
      card_id: 1,
      type: "detective",
      name: "Sherlock Holmes",
      game_id: 1,
      player_id: 1,
      picked_up: false,
      dropped: true,
    },
    {
      card_id: 2,
      type: "event",
      name: "Mistery Unveiled",
      game_id: 1,
      player_id: 1,
      picked_up: false,
      dropped: true,
    },
  ];
  let onCardSelectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onCardSelectMock = vi.fn();
  });

  it("renders placeholders when no cards are provided", () => {
    const { container } = render(
      <DraftPile
        cards={[]}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={false}
      />
    );
    // Buscamos por la clase que se usa para los placeholders
    const placeholders = container.querySelectorAll(".draft-placeholder");
    expect(placeholders.length).toBe(3);
    expect(screen.queryByText("Sherlock Holmes")).not.toBeInTheDocument();
  });

  it("renders cards correctly when provided", () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );
    expect(screen.getByText("Sherlock Holmes")).toBeInTheDocument();
    expect(screen.getByText("Mistery Unveiled")).toBeInTheDocument();
  });

  it("expands and collapses when the toggle button is clicked", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    const viewButton = screen.getByRole("button", { name: /Ver Draft/i });
    await userEvent.click(viewButton);

    // Assert: El botón de ver desaparece y el de volver aparece
    expect(
      screen.queryByRole("button", { name: /Ver Draft/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Volver/i })).toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: /Volver/i });
    await userEvent.click(backButton);

    expect(
      screen.getByRole("button", { name: /Ver Draft/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Volver/i })
    ).not.toBeInTheDocument();
  });

  it("calls onCardSelect when a card is clicked and it's the player's turn", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    // Hacemos clic en el contenedor de la carta (el div con el handler)
    const cardElement = screen.getByText("Sherlock Holmes").parentElement;
    await userEvent.click(cardElement!);

    expect(onCardSelectMock).toHaveBeenCalledTimes(1);
    expect(onCardSelectMock).toHaveBeenCalledWith(mockCards[0]);
  });

  it("does NOT call onCardSelect when a card is clicked and it's NOT the player's turn", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={false}
      />
    );

    const cardElement = screen.getByText("Sherlock Holmes").parentElement;
    await userEvent.click(cardElement!);

    expect(onCardSelectMock).not.toHaveBeenCalled();
  });

  it("applies 'selected' class to the selected card's container", () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={mockCards[0]} // Sherlock está seleccionado
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    const selectedCardContainer =
      screen.getByText("Sherlock Holmes").parentElement;
    expect(selectedCardContainer).toHaveClass("selected");

    const notSelectedCardContainer =
      screen.getByText("Mistery Unveiled").parentElement;
    expect(notSelectedCardContainer).not.toHaveClass("selected");
  });

  it("changes card size prop when expanded", async () => {
    render(
      <DraftPile
        cards={mockCards}
        selectedCard={null}
        onCardSelect={onCardSelectMock}
        isMyTurn={true}
      />
    );

    // Estado inicial (colapsado)
    expect(screen.getByText("Sherlock Holmes")).toHaveAttribute(
      "data-size",
      "medium"
    );

    // Expandir
    await userEvent.click(screen.getByRole("button", { name: /Ver Draft/i }));

    // Estado expandido
    expect(screen.getByText("Sherlock Holmes")).toHaveAttribute(
      "data-size",
      "large"
    );
  });
});

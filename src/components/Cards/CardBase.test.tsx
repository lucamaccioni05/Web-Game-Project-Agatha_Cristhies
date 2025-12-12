/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardBase from "./CardBase";

// Mock del import de la imagen
vi.mock("/src/assets/01-card_back.png", () => ({
  default: "/mock/card_back.png",
}));

describe("CardBase Component", () => {
  const mockCardBack = "/mock/card_back.png";
  const mockCardFront = "/mock/card_front_test.png";
  let onCardClickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onCardClickMock = vi.fn();
  });

  it("should render face down (card back) when shown is false", () => {
    render(<CardBase shown={false} image={mockCardFront} card_id={1} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardBack);
    expect(img.alt).toBe("card-1");
  });

  it("should render face up (correct image) when shown is true", () => {
    render(<CardBase shown={true} image={mockCardFront} card_id={1} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardFront);
  });

  it("should render card back if shown is true but no image is provided", () => {
    // Prueba el edge case: (shown ? image ?? cardBack : cardBack)
    render(<CardBase shown={true} image={undefined} card_id={1} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardBack);
  });

  it("should call onCardClick with card_id when clicked", async () => {
    render(
      <CardBase shown={true} card_id={99} onCardClick={onCardClickMock} />
    );

    await userEvent.click(screen.getByRole("img").parentElement!);
    expect(onCardClickMock).toHaveBeenCalledTimes(1);
    expect(onCardClickMock).toHaveBeenCalledWith(99);
  });

  it("should call onCardClick with undefined if no card_id is provided", async () => {
    render(<CardBase shown={true} onCardClick={onCardClickMock} />);

    await userEvent.click(screen.getByRole("img").parentElement!);
    expect(onCardClickMock).toHaveBeenCalledTimes(1);
    expect(onCardClickMock).toHaveBeenCalledWith(undefined);
  });

  it("should handle click gracefully when onCardClick is not provided", async () => {
    render(<CardBase shown={true} card_id={1} />);
    const cardElement = screen.getByRole("img").parentElement!;

    // La prueba pasa si esto no genera un error
    await expect(userEvent.click(cardElement)).resolves.not.toThrow();
  });

  it("should apply 'selected' class when isSelected is true", () => {
    render(<CardBase shown={true} isSelected={true} />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("selected");
  });

  it("should not apply 'selected' class when isSelected is false or undefined", () => {
    render(<CardBase shown={true} isSelected={false} />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).not.toHaveClass("selected");
  });

  it("should apply default 'card-medium' size class", () => {
    render(<CardBase shown={true} />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("card-medium");
  });

  it("should apply correct size class from prop", () => {
    render(<CardBase shown={true} size="large" />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("card-large");
    expect(cardElement).not.toHaveClass("card-medium");
  });
});

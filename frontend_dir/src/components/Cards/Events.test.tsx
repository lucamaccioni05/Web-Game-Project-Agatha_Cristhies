/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Event from "./Events";

// Mock de TODAS las imágenes importadas
vi.mock("/src/assets/01-card_back.png", () => ({
  default: "/mock/card_back.png",
}));
vi.mock("/src/assets/17-event_cardsonthetable.png", () => ({
  default: "/mock/e-cardsoff.png",
}));
vi.mock("/src/assets/18-event_anothervictim.png", () => ({
  default: "/mock/e-victim.png",
}));
vi.mock("/src/assets/19-event_deadcardfolly.png", () => ({
  default: "/mock/e-folly.png",
}));
vi.mock("/src/assets/20-event_lookashes.png", () => ({
  default: "/mock/e-ashes.png",
}));
vi.mock("/src/assets/21-event_cardtrade.png", () => ({
  default: "/mock/e-trade.png",
}));
vi.mock("/src/assets/22-event_onemore.png", () => ({
  default: "/mock/e-onemore.png",
}));
vi.mock("/src/assets/23-event_delayescape.png", () => ({
  default: "/mock/e-delay.png",
}));
vi.mock("/src/assets/24-event_earlytrain.png", () => ({
  default: "/mock/e-train.png",
}));
vi.mock("/src/assets/25-event_pointsuspicions.png", () => ({
  default: "/mock/e-suspicions.png",
}));
vi.mock("/src/assets/16-Instant_notsofast.png", () => ({
  default: "/mock/e-notsofast.png",
}));
vi.mock("/src/assets/27-devious_fauxpas.png", () => ({
  default: "/mock/e-fauxpas.png",
}));
vi.mock("/src/assets/26-devious_blackmailed.png", () => ({
  default: "/mock/e-blackmailed.png",
}));

describe("Event Component", () => {
  const mockCardBack = "/mock/card_back.png";
  const mockAshesImg = "/mock/e-ashes.png";
  const mockNotSoFastImg = "/mock/e-notsofast.png";
  let onCardClickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onCardClickMock = vi.fn();
  });

  it("should render the correct event image when shown is true and name matches", () => {
    render(<Event shown={true} name="Look into the ashes" card_id={1} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockAshesImg);
    expect(img.alt).toBe("card-1");
  });

  it("should render another correct event image (e.g., instant)", () => {
    render(<Event shown={true} name="Not so fast" card_id={2} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockNotSoFastImg);
  });

  it("should render card back when shown is true but name is unknown", () => {
    // Prueba el 'default' del switch
    render(<Event shown={true} name="Evento Falso" card_id={99} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardBack);
  });

  it("should render card back when shown is false, even with a valid name", () => {
    // Prueba que `shown={false}` tiene prioridad sobre el switch
    render(<Event shown={false} name="Look into the ashes" card_id={1} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardBack);
    expect(img.src).not.toContain(mockAshesImg);
  });

  it("should call onCardClick with card_id when clicked", async () => {
    render(
      <Event
        shown={true}
        name="Card trade"
        card_id={55}
        onCardClick={onCardClickMock}
      />
    );

    await userEvent.click(screen.getByRole("img").parentElement!);
    expect(onCardClickMock).toHaveBeenCalledTimes(1);
    expect(onCardClickMock).toHaveBeenCalledWith(55);
  });

  it("should apply 'selected' class when isSelected is true", () => {
    render(<Event shown={true} name="Card trade" isSelected={true} />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("selected");
  });

  it("should apply correct size class from prop", () => {
    render(<Event shown={true} name="Card trade" size="large" />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("card-large");
    expect(cardElement).not.toHaveClass("card-medium"); // Verifica que sobreescribe el default
  });
});

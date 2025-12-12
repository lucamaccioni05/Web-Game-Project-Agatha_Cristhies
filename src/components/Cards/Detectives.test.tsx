/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Detective from "./Detectives";

// Mock de TODAS las imágenes importadas por el componente
vi.mock("/src/assets/01-card_back.png", () => ({
  default: "/mock/card_back.png",
}));
vi.mock("/src/assets/07-detective_poirot.png", () => ({
  default: "/mock/d1-poirot.png",
}));
vi.mock("/src/assets/08-detective_marple.png", () => ({
  default: "/mock/d2-marple.png",
}));
vi.mock("/src/assets/09-detective_satterthwaite.png", () => ({
  default: "/mock/d3.png",
}));
vi.mock("/src/assets/10-detective_pyne.png", () => ({
  default: "/mock/d4.png",
}));
vi.mock("/src/assets/11-detective_brent.png", () => ({
  default: "/mock/d5.png",
}));
vi.mock("/src/assets/12-detective_tommyberesford.png", () => ({
  default: "/mock/d6.png",
}));
vi.mock("/src/assets/13-detective_tuppenceberesford.png", () => ({
  default: "/mock/d7.png",
}));
vi.mock("/src/assets/14-detective_quin.png", () => ({
  default: "/mock/d8-quin.png",
}));
vi.mock("/src/assets/15-detective_oliver.png", () => ({
  default: "/mock/d9.png",
}));

describe("Detective Component", () => {
  const mockCardBack = "/mock/card_back.png";
  const mockPoirotImg = "/mock/d1-poirot.png";
  const mockMarpleImg = "/mock/d2-marple.png";
  const mockQuinImg = "/mock/d8-quin.png";
  let onCardClickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onCardClickMock = vi.fn();
  });

  it("should render the correct detective image when shown is true and name matches", () => {
    render(<Detective shown={true} name="Hercule Poirot" card_id={1} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockPoirotImg);
    expect(img.alt).toBe("card-1");
  });

  it("should render another correct detective image", () => {
    render(<Detective shown={true} name="Harley Quin Wildcard" card_id={8} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockQuinImg);
  });

  it("should render card back when shown is true but name is unknown", () => {
    // Prueba el 'default' del switch
    render(<Detective shown={true} name="Sherlock Holmes" card_id={99} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardBack);
  });

  it("should render card back when shown is false, even with a valid name", () => {
    // Prueba que `shown={false}` tiene prioridad sobre el switch
    render(<Detective shown={false} name="Miss Marple" card_id={2} />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(mockCardBack);
    expect(img.src).not.toContain(mockMarpleImg);
  });

  it("should call onCardClick with card_id when clicked", async () => {
    render(
      <Detective
        shown={true}
        name="Miss Marple"
        card_id={42}
        onCardClick={onCardClickMock}
      />
    );

    await userEvent.click(screen.getByRole("img").parentElement!);
    expect(onCardClickMock).toHaveBeenCalledTimes(1);
    expect(onCardClickMock).toHaveBeenCalledWith(42);
  });

  it("should apply 'selected' class when isSelected is true", () => {
    render(<Detective shown={true} name="Hercule Poirot" isSelected={true} />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("selected");
  });

  it("should apply correct size class from prop", () => {
    render(<Detective shown={true} name="Hercule Poirot" size="mini" />);
    const cardElement = screen.getByRole("img").parentElement!;
    expect(cardElement).toHaveClass("card-mini");
  });
});

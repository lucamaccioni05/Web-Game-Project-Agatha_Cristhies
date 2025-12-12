/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Secret, { type SecretBaseProps } from "./Secret";

// Mocks de imágenes
vi.mock("/src/assets/03-secret_murderer.png", () => ({
  default: "/mock/s-murderer.png",
}));
vi.mock("/src/assets/04-secret_accomplice.png", () => ({
  default: "/mock/s-accomplice.png",
}));
vi.mock("/src/assets/05-secret_back.png", () => ({
  default: "/mock/s-back.png",
}));
vi.mock("/src/assets/06-secret_front.png", () => ({
  default: "/mock/s-base.png",
}));

describe("Secret Component", () => {
  const mockMurderer = "/mock/s-murderer.png";
  const mockAccomplice = "/mock/s-accomplice.png";
  const mockBase = "/mock/s-base.png";
  const mockBack = "/mock/s-back.png";
  let onClickMock: ReturnType<typeof vi.fn>;

  // Props base para reducir repetición
  const baseProps: SecretBaseProps = {
    secret_id: 1,
    mine: false,
    revealed: false,
    murderer: false,
    accomplice: false,
    isSelected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    onClickMock = vi.fn();
  });

  describe("Image Display Logic", () => {
    it("should show back if it is NOT mine and NOT revealed", () => {
      render(
        <Secret {...baseProps} mine={false} revealed={false} murderer={true} />
      );
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockBack);
    });

    it("should show murderer face if it is NOT mine but IS revealed and murderer", () => {
      render(
        <Secret {...baseProps} mine={false} revealed={true} murderer={true} />
      );
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockMurderer);
    });

    it("should show accomplice face if it is NOT mine but IS revealed and accomplice", () => {
      render(
        <Secret {...baseProps} mine={false} revealed={true} accomplice={true} />
      );
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockAccomplice);
    });

    it("should show base face if it is NOT mine, IS revealed, but not murderer/accomplice", () => {
      render(<Secret {...baseProps} mine={false} revealed={true} />);
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockBase);
    });

    it("should ALWAYS show murderer face if it IS mine and murderer (regardless of revealed)", () => {
      render(
        <Secret {...baseProps} mine={true} revealed={false} murderer={true} />
      );
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockMurderer);
    });

    it("should ALWAYS show accomplice face if it IS mine and accomplice", () => {
      render(
        <Secret {...baseProps} mine={true} revealed={true} accomplice={true} />
      );
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockAccomplice);
    });

    it("should ALWAYS show base face if it IS mine and not murderer/accomplice", () => {
      render(<Secret {...baseProps} mine={true} revealed={false} />);
      const img = screen.getByRole("img") as HTMLImageElement;
      expect(img.src).toContain(mockBase);
    });
  });

  describe("CSS Class Logic", () => {
    it("should apply 'mine' class if mine is true", () => {
      render(<Secret {...baseProps} mine={true} />);
      expect(screen.getByRole("img").parentElement).toHaveClass("mine");
    });

    it("should NOT apply 'mine' class if mine is false", () => {
      render(<Secret {...baseProps} mine={false} />);
      expect(screen.getByRole("img").parentElement).not.toHaveClass("mine");
    });

    it("should apply 'unrevealed' class if mine AND !revealed", () => {
      render(<Secret {...baseProps} mine={true} revealed={false} />);
      expect(screen.getByRole("img").parentElement).toHaveClass("unrevealed");
    });

    it("should NOT apply 'unrevealed' class if !mine", () => {
      render(<Secret {...baseProps} mine={false} revealed={false} />);
      expect(screen.getByRole("img").parentElement).not.toHaveClass(
        "unrevealed"
      );
    });

    it("should NOT apply 'unrevealed' class if mine AND revealed", () => {
      render(<Secret {...baseProps} mine={true} revealed={true} />);
      expect(screen.getByRole("img").parentElement).not.toHaveClass(
        "unrevealed"
      );
    });

    it("should apply 'selected' class if isSelected is true", () => {
      render(<Secret {...baseProps} isSelected={true} />);
      expect(screen.getByRole("img").parentElement).toHaveClass("selected");
    });

    it("should apply 'clickable' class if onClick prop is provided", () => {
      render(<Secret {...baseProps} onClick={onClickMock} />);
      expect(screen.getByRole("img").parentElement).toHaveClass("clickable");
    });

    it("should NOT apply 'clickable' class if onClick is missing", () => {
      render(<Secret {...baseProps} onClick={undefined} />);
      expect(screen.getByRole("img").parentElement).not.toHaveClass(
        "clickable"
      );
    });

    it("should apply default 'secret-medium' size class", () => {
      render(<Secret {...baseProps} />);
      expect(screen.getByRole("img").parentElement).toHaveClass(
        "secret-medium"
      );
    });

    it("should apply correct size class from prop", () => {
      render(<Secret {...baseProps} size="large" />);
      expect(screen.getByRole("img").parentElement).toHaveClass("secret-large");
    });
  });

  describe("Interaction", () => {
    it("should call onClick when clicked", async () => {
      render(<Secret {...baseProps} onClick={onClickMock} />);
      await userEvent.click(screen.getByRole("img").parentElement!);
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it("should not fail if clicked without onClick prop", async () => {
      render(<Secret {...baseProps} onClick={undefined} />);
      const el = screen.getByRole("img").parentElement!;
      // Pasa si no lanza un error
      await expect(userEvent.click(el)).resolves.not.toThrow();
    });
  });
});

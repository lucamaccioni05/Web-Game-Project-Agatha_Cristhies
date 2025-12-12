/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputField from "./InputField";

describe("InputField Component", () => {
  let onChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onChangeMock = vi.fn();
  });

  it("should render with default props", () => {
    render(
      <InputField
        placeholder="Test Placeholder"
        value=""
        onChange={onChangeMock}
      />
    );
    const input = screen.getByPlaceholderText(
      "Test Placeholder"
    ) as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.type).toBe("text"); // Verifica el tipo por defecto
    expect(input).not.toHaveClass("input-error");
  });

  it("should call onChange when typed into", async () => {
    render(<InputField placeholder="Test" value="" onChange={onChangeMock} />);
    const input = screen.getByPlaceholderText("Test");
    await userEvent.type(input, "hola");
    expect(onChangeMock).toHaveBeenCalledTimes(4); // h, o, l, a
  });

  it("should display the correct value", () => {
    render(
      <InputField
        placeholder="Test"
        value="Valor Fijo"
        onChange={onChangeMock}
      />
    );
    const input = screen.getByPlaceholderText("Test") as HTMLInputElement;
    expect(input.value).toBe("Valor Fijo");
  });

  it("should apply the 'input-error' class when error is true", () => {
    render(
      <InputField
        placeholder="Test"
        value=""
        onChange={onChangeMock}
        error={true}
      />
    );
    const input = screen.getByPlaceholderText("Test");
    expect(input).toHaveClass("input-error");
  });

  it("should respect the 'type' prop", () => {
    render(
      <InputField
        placeholder="Test"
        value=""
        onChange={onChangeMock}
        type="number"
      />
    );
    const input = screen.getByPlaceholderText("Test") as HTMLInputElement;
    expect(input.type).toBe("number");
  });
});

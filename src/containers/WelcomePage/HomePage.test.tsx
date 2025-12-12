/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
// CORRECCIÓN: Importamos 'waitFor' para manejar el estado asíncrono
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";
import { useNavigate } from "react-router-dom";
import destinations from "../../navigation/destinations";

// Mocks de Assets (avatares)
vi.mock("../../assets/bart.png", () => ({ default: "/mock/bart.png" }));
vi.mock("../../assets/nelson.png", () => ({ default: "/mock/nelson.png" }));
vi.mock("../../assets/lisa.png", () => ({ default: "/mock/lisa.png" }));
vi.mock("../../assets/homero.png", () => ({ default: "/mock/homero.png" }));
vi.mock("../../assets/milhouse.jpeg", () => ({
  default: "/mock/milhouse.jpeg",
}));
vi.mock("../../assets/burns.png", () => ({ default: "/mock/burns.png" }));

// Mock de React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

// Mock de destinations (necesario para las navegaciones)
vi.mock("../../navigation/destinations", () => ({
  default: {
    crearPartida: "/crear-partida",
    listarPartidas: "/listar-partidas",
  },
}));

// Mocks de Componentes Hijos
vi.mock("../../components/InputField", () => ({
  default: ({ value, onChange, id, error, ...rest }: any) => (
    <input
      id={id}
      data-testid={id}
      value={value}
      onChange={onChange}
      data-error={error}
      {...rest}
    />
  ),
}));
vi.mock("../../components/Button", () => ({
  default: ({ label, onClick, type }: any) => (
    <button type={type} onClick={onClick}>
      {label}
    </button>
  ),
}));

const mockNavigate = vi.fn();

describe("HomePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
  });

  // --- Helpers para llenar el formulario ---
  const fillForm = async (
    name: string | null = "Jugador 1",
    date: string | null = "2000-01-01",
    avatarAlt: string | null = "Avatar 1"
  ) => {
    const nameInput = screen.getByTestId("nombre");
    const dateInput = screen.getByTestId("fecha-nacimiento");

    if (name) await userEvent.type(nameInput, name);
    if (date) await userEvent.type(dateInput, date);

    if (avatarAlt) {
      const avatarButton = screen.getByRole("button", { name: "Avatar" });
      await userEvent.click(avatarButton);
      const avatarOption = screen.getByRole("button", { name: avatarAlt });
      await userEvent.click(avatarOption);
    }
  };

  it("should render all form fields", () => {
    render(<HomePage />);
    expect(screen.getByTestId("nombre")).toBeInTheDocument();
    expect(screen.getByTestId("fecha-nacimiento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avatar" })).toBeInTheDocument();
  });

  it("should open and select from avatar menu", async () => {
    render(<HomePage />);
    const avatarButton = screen.getByRole("button", { name: "Avatar" });
    expect(screen.getByText("Elija")).toBeInTheDocument();
    await userEvent.click(avatarButton);
    const option = screen.getByRole("button", { name: "Avatar 2" });
    await userEvent.click(option);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const img = screen.getByRole("img", { name: "Avatar seleccionado" });
    expect(img).toHaveAttribute("src", "/mock/nelson.png");
  });

  describe("Validation", () => {
    it("should show error if form is completely empty", async () => {
      render(<HomePage />);
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        await screen.findByText(
          "Debe ingresar un nombre, fecha de nacimiento y avatar"
        )
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should show error if no name", async () => {
      render(<HomePage />);
      await fillForm(null, "2000-01-01", "Avatar 1");
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        await screen.findByText("Debe ingresar un nombre")
      ).toBeInTheDocument();
    });

    it("should show error if no date", async () => {
      render(<HomePage />);
      await fillForm("Jugador 1", null, "Avatar 1");
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        await screen.findByText("Debe ingresar su fecha de nacimiento")
      ).toBeInTheDocument();
    });

    it("should show error if no avatar", async () => {
      render(<HomePage />);
      await userEvent.type(screen.getByTestId("nombre"), "Jugador 1");
      await userEvent.type(
        screen.getByTestId("fecha-nacimiento"),
        "2000-01-01"
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );
      expect(
        await screen.findByText("Debe elegir un avatar")
      ).toBeInTheDocument();
    });

    it("should pass validation if player is 15", async () => {
      render(<HomePage />);
      // Usamos la fecha límite (hoy es 10/11/2025)
      await fillForm("Jugador Justo", "2010-11-10", "Avatar 1");
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );

      // Esperamos a que se resuelvan las promesas de estado
      await act(() => Promise.resolve());

      // Verificamos que el mensaje de error NO esté
      expect(
        screen.queryByText("El juego es solo para mayores de 15 años.")
      ).not.toBeInTheDocument();
      // Y que la navegación SÍ se haya llamado
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("should navigate to CreatePage on handleCreate", async () => {
      render(<HomePage />);
      await fillForm("Jugador Creador", "1990-05-10", "Avatar 3");
      await userEvent.click(
        screen.getByRole("button", { name: "Nueva Partida" })
      );

      expect(mockNavigate).toHaveBeenCalledWith(destinations.crearPartida, {
        state: {
          playerName: "Jugador Creador",
          playerDate: "1990-05-10",
          playerAvatar: "/mock/lisa.png",
        },
      });
    });

    it("should navigate to ListGames on handleList", async () => {
      render(<HomePage />);
      await fillForm("Jugador Buscador", "1995-02-15", "Avatar 4");
      await userEvent.click(
        screen.getByRole("button", { name: "Listar Partidas" })
      );

      expect(mockNavigate).toHaveBeenCalledWith(destinations.listarPartidas, {
        state: {
          playerName: "Jugador Buscador",
          playerDate: "1995-02-15",
          playerAvatar: "/mock/homero.png",
        },
      });
    });
  });
});

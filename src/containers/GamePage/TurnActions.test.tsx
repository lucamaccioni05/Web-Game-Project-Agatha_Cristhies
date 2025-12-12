/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TurnActions from "./TurnActions";
import { useGameContext } from "../../context/GameContext";

// Mock del Contexto
vi.mock("../../context/GameContext");

// Mocks de TODOS los componentes de pasos
vi.mock("./TurnSteps/StartStep", () => ({
  StartStep: () => <div data-testid="start-step" />,
}));
vi.mock("./TurnSteps/PlaySetStep", () => ({
  PlaySetStep: () => <div data-testid="play-set-step" />,
}));
vi.mock("./TurnSteps/PlayEventStep", () => ({
  PlayEventStep: () => <div data-testid="play-event-step" />,
}));
vi.mock("./TurnSteps/DiscardStep", () => ({
  DiscardStep: () => <div data-testid="discard-step" />,
}));
vi.mock("./TurnSteps/DrawStep", () => ({
  DrawStep: () => <div data-testid="draw-step" />,
}));
vi.mock("./TurnSteps/AnotherVictimStep", () => ({
  AnotherVictimStep: () => <div data-testid="another-victim-step" />,
}));
vi.mock("./TurnSteps/LookIntoAshesStep", () => ({
  LookIntoAshesStep: () => <div data-testid="look-into-ashes-step" />,
}));
vi.mock("./TurnSteps/CardsOffTableStep", () => ({
  CardsOffTableStep: () => <div data-testid="cards-off-table-step" />,
}));
vi.mock("./TurnSteps/AndThenThereWasOneMoreStep", () => ({
  AndThenThereWasOneMoreStep: () => (
    <div data-testid="and-then-one-more-step" />
  ),
}));
vi.mock("./TurnSteps/DelayEscapeStep", () => ({
  DelayEscapeStep: () => <div data-testid="delay-escape-step" />,
}));
vi.mock("./TurnSteps/RevealSecretStep", () => ({
  RevealSecretStep: () => <div data-testid="reveal-secret-step" />,
}));
vi.mock("./TurnSteps/HideSecretStep", () => ({
  HideSecretStep: () => <div data-testid="hide-secret-step" />,
}));
vi.mock("./TurnSteps/SelectPlayerRevealStep", () => ({
  SelectPlayerRevealStep: () => <div data-testid="select-player-reveal-step" />,
}));
vi.mock("./TurnSteps/WaitRevealStep", () => ({
  WaitRevealStep: () => <div data-testid="wait-reveal-step" />,
}));
vi.mock("./TurnSteps/PointYourSuspicionsStep", () => ({
  PointYourSuspicionsStep: () => <div data-testid="point-suspicions-step" />,
}));
vi.mock("./TurnSteps/WaitingVotingToEndStep", () => ({
  WaitingVotingToEndStep: () => <div data-testid="wait-voting-step" />,
}));
vi.mock("./TurnSteps/VoteStep", () => ({
  VoteStep: () => <div data-testid="vote-step" />,
}));
vi.mock("./TurnSteps/CardTradeStep", () => ({
  CardTradeStep: () => <div data-testid="card-trade-step" />,
}));
vi.mock("./TurnSteps/WaitTradeStep", () => ({
  WaitTradeStep: () => <div data-testid="wait-trade-step" />,
}));
vi.mock("./TurnSteps/AddDetectiveStep", () => ({
  AddDetectiveStep: () => <div data-testid="add-detective-step" />,
}));
vi.mock("./TurnSteps/WaitEventResolutionStep", () => ({
  WaitEventResolutionStep: () => <div data-testid="wait-event-step" />,
}));
vi.mock("./TurnSteps/WaitSetResolutionStep", () => ({
  WaitSetResolutionStep: () => <div data-testid="wait-set-step" />,
}));
vi.mock("./TurnSteps/DeadCardFollyStep", () => ({
  DeadCardFollyStep: () => <div data-testid="dead-card-folly-step" />,
}));
vi.mock("./TurnSteps/WaitTradeFollyStep", () => ({
  WaitTradeFollyStep: () => <div data-testid="wait-trade-folly-step" />,
}));
vi.mock("../../components/TextType", () => ({
  default: ({ text }: { text: string[] }) => (
    <div data-testid="text-type">{text[0]}</div>
  ),
}));

// --- Mocks de Contexto ---
let mockDispatch: ReturnType<typeof vi.fn>;
let mockState: any;
let mockIsSocialDisgrace: boolean;

describe("TurnActions Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();
    mockIsSocialDisgrace = false;
    mockState = { currentStep: "start" };

    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
      isSocialDisgrace: mockIsSocialDisgrace,
    } as any);
  });

  it("should dispatch 'discard_skip' if 'start' and 'isSocialDisgrace' is true", () => {
    mockState.currentStep = "start";
    mockIsSocialDisgrace = true;

    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
      isSocialDisgrace: mockIsSocialDisgrace,
    } as any);

    render(<TurnActions />);

    // Verifica que el useEffect llame al dispatch
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_STEP",
      payload: "discard_skip",
    });
  });

  it("should render 'Procesando' text if 'start' and 'isSocialDisgrace' is true", () => {
    mockState.currentStep = "start";
    mockIsSocialDisgrace = true;

    vi.mocked(useGameContext).mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
      isSocialDisgrace: mockIsSocialDisgrace,
    } as any);

    render(<TurnActions />);
    // Verifica lo que se renderiza ANTES de que el useEffect termine
    expect(screen.getByTestId("text-type")).toHaveTextContent(
      "Procesando turno..."
    );
    expect(screen.queryByTestId("start-step")).not.toBeInTheDocument();
  });

  // Testear el switch
  describe("Step Rendering (Switch Statement)", () => {
    // Usamos .each para no repetir el test 20 veces
    it.each([
      ["start", "start-step"],
      ["p_set", "play-set-step"],
      ["draw", "draw-step"],
      ["discard_op", "discard-step"],
      ["another_victim", "another-victim-step"],
      ["sel_reveal_secret", "reveal-secret-step"],
      ["wait_trade", "wait-trade-step"],
    ])("should render <%s /> when currentStep is '%s'", (step, testId) => {
      mockState.currentStep = step;
      const { rerender } = render(<TurnActions />);
      rerender(<TurnActions />); // Re-render para asegurar que el estado se aplica

      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    it("should render unknown step message for default case", () => {
      mockState.currentStep = "STEP_INVENTADO";
      render(<TurnActions />);
      expect(
        screen.getByText("Paso desconocido: STEP_INVENTADO")
      ).toBeInTheDocument();
    });
  });
});

import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGuardedAcademicContextChange } from "../useGuardedAcademicContextChange";

type GuardHandlers = {
  onAcademicYearChange: (yearId: string) => Promise<void>;
  onTermChange: (termId: string) => void | Promise<void>;
};

const contextMocks = vi.hoisted(() => ({
  changeAcademicYear: vi.fn(async () => undefined),
  changeTerm: vi.fn(),
  registeredHandlers: null as GuardHandlers | null,
  setGuardHandlers: vi.fn((handlers: GuardHandlers | null) => {
    contextMocks.registeredHandlers = handlers;
  }),
}));

vi.mock("../AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => contextMocks,
}));

function GuardHarness({
  confirmDiscard,
  onDiscard,
}: {
  confirmDiscard: () => Promise<boolean>;
  onDiscard: () => void;
}) {
  useGuardedAcademicContextChange({
    hasUnsavedChanges: true,
    confirmDiscard,
    onDiscard,
  });
  return null;
}

describe("useGuardedAcademicContextChange", () => {
  beforeEach(() => {
    contextMocks.changeAcademicYear.mockClear();
    contextMocks.changeTerm.mockClear();
    contextMocks.setGuardHandlers.mockClear();
    contextMocks.registeredHandlers = null;
  });

  it("blocks an academic-year change when discard is cancelled", async () => {
    const confirmDiscard = vi.fn().mockResolvedValue(false);
    const onDiscard = vi.fn();
    render(
      <GuardHarness
        confirmDiscard={confirmDiscard}
        onDiscard={onDiscard}
      />,
    );
    await waitFor(() => expect(contextMocks.registeredHandlers).not.toBeNull());

    await act(() =>
      contextMocks.registeredHandlers!.onAcademicYearChange("year-2"),
    );

    expect(confirmDiscard).toHaveBeenCalledOnce();
    expect(onDiscard).not.toHaveBeenCalled();
    expect(contextMocks.changeAcademicYear).not.toHaveBeenCalled();
  });

  it("discards and continues a term change after confirmation", async () => {
    const confirmDiscard = vi.fn().mockResolvedValue(true);
    const onDiscard = vi.fn();
    render(
      <GuardHarness
        confirmDiscard={confirmDiscard}
        onDiscard={onDiscard}
      />,
    );
    await waitFor(() => expect(contextMocks.registeredHandlers).not.toBeNull());

    await act(async () => {
      await contextMocks.registeredHandlers!.onTermChange("term-2");
    });

    expect(onDiscard).toHaveBeenCalledOnce();
    expect(contextMocks.changeTerm).toHaveBeenCalledWith("term-2");
  });
});

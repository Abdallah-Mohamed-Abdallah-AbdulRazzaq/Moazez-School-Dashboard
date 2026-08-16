import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSetupStatus } from "../hooks/useSetupStatus";
import {
  SetupStatusProvider,
  useSetupStatusContext,
} from "../context/SetupStatusContext";

vi.mock("../hooks/useSetupStatus", () => ({
  useSetupStatus: vi.fn(),
}));

const mockedUseSetupStatus = vi.mocked(useSetupStatus);

function SetupStatusConsumer({ label }: { label: string }) {
  const setupStatus = useSetupStatusContext();
  return <div>{`${label}:${setupStatus.schoolId}`}</div>;
}

describe("SetupStatusProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSetupStatus.mockReturnValue({
      schoolId: "school-1",
      snapshot: {},
      evaluation: { isComplete: false },
      selectedYear: null,
      selectedTerm: null,
      refreshStep: vi.fn(),
      retryStep: vi.fn(),
    } as never);
  });

  it("shares one setup status load across nested consumers", () => {
    render(
      <SetupStatusProvider>
        <SetupStatusConsumer label="guard" />
        <SetupStatusConsumer label="card" />
      </SetupStatusProvider>,
    );

    expect(screen.getByText("guard:school-1")).toBeInTheDocument();
    expect(screen.getByText("card:school-1")).toBeInTheDocument();
    expect(mockedUseSetupStatus).toHaveBeenCalledTimes(1);
  });
});

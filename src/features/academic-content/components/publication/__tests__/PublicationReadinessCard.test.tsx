import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PUBLICATION_BLOCKING_REASON_KEYS } from "../../../model/academicContentPublicationPolicy";
import PublicationReadinessCard from "../PublicationReadinessCard";

function renderReadiness(canPublish: boolean, canSchedule: boolean) {
  render(
    <PublicationReadinessCard
      readiness={{ canPublish, canSchedule, blockingReasons: [] }}
      error={null}
      canMutate
      isMutating={false}
      onPublishNow={vi.fn()}
      onSchedule={vi.fn()}
      onRetry={vi.fn()}
    />,
  );
}

describe("PublicationReadinessCard", () => {
  it.each([
    [true, true, false, false],
    [true, false, false, true],
    [false, true, true, false],
    [false, false, true, true],
  ] as const)(
    "maps canPublish=%s and canSchedule=%s independently",
    (canPublish, canSchedule, publishDisabled, scheduleDisabled) => {
      renderReadiness(canPublish, canSchedule);

      expect(screen.getByRole("button", { name: "Publish now" })).toHaveProperty(
        "disabled",
        publishDisabled,
      );
      expect(screen.getByRole("button", { name: "Schedule" })).toHaveProperty(
        "disabled",
        scheduleDisabled,
      );
    },
  );

  it.each(Object.keys(PUBLICATION_BLOCKING_REASON_KEYS))(
    "localizes %s without exposing its raw backend code",
    (reason) => {
      render(
        <PublicationReadinessCard
          readiness={{
            canPublish: false,
            canSchedule: false,
            blockingReasons: [reason],
          }}
          error={null}
          canMutate
          isMutating={false}
          onPublishNow={vi.fn()}
          onSchedule={vi.fn()}
          onRetry={vi.fn()}
        />,
      );

      expect(screen.queryByText(reason)).not.toBeInTheDocument();
      expect(screen.getByRole("list")).not.toBeEmptyDOMElement();
    },
  );

  it("keeps read data visible without mutation permission", () => {
    render(
      <PublicationReadinessCard
        readiness={{ canPublish: true, canSchedule: true, blockingReasons: [] }}
        error={null}
        canMutate={false}
        isMutating={false}
        onPublishNow={vi.fn()}
        onSchedule={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Ready to publish now")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish now" })).toBeNull();
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it("retries an independent readiness error", () => {
    const onRetry = vi.fn();
    render(
      <PublicationReadinessCard
        readiness={null}
        error={{ code: "UNAVAILABLE", message: "Readiness unavailable" }}
        canMutate
        isMutating={false}
        onPublishNow={vi.fn()}
        onSchedule={vi.fn()}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

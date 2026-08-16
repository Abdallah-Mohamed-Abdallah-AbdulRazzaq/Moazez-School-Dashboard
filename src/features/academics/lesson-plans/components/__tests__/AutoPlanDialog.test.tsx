import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import AutoPlanDialog from "../AutoPlanDialog";

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
};

const ready = {
  canPreview: true,
  canApply: true,
  previewBlockingReasons: [],
  applyBlockingReasons: [],
  warnings: [],
} as const;

const previewResponse = {
  termId: "term-1",
  academicYearId: "year-1",
  teacherSubjectAllocationId: "allocation-1",
  dryRun: true,
  summary: {
    candidateLessons: 1,
    availableSlots: 1,
    proposedItems: 1,
    createdItems: 0,
    skippedExistingItems: 0,
    skippedHolidaySlots: 0,
  },
  items: [],
};

describe("AutoPlanDialog missing-data actions", () => {
  it.each([
    [
      "academics.lesson_plan.auto_plan_no_slots",
      "ctas.timetable",
      "/en/academics/timetable?year=year-1&term=term-1&grade=grade-1&section=section-1&classroom=classroom-1",
    ],
    [
      "academics.lesson_plan.auto_plan_no_curriculum",
      "ctas.curriculum",
      "/en/academics/curriculum?year=year-1&term=term-1&filterGrade=grade-1&filterSubject=subject-1",
    ],
  ] as const)(
    "offers a scoped resolution for %s",
    async (code, label, expectedHref) => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      render(
        <AutoPlanDialog
          isOpen
          termStartDate="2026-09-01"
          termEndDate="2026-12-31"
          onClose={vi.fn()}
          onPreview={vi
            .fn()
            .mockRejectedValue(new ApiError("blocked", 422, code))}
          onApply={vi.fn()}
          showError={vi.fn()}
          readiness={ready}
          previewBlockedMessage="preview blocked"
          applyBlockedMessage="apply blocked"
          hasVisibleLessons
          locale="en"
          scope={scope}
          onNavigate={onNavigate}
        />,
      );

      await user.click(screen.getByRole("button", { name: "actions.preview" }));
      const resolutionButton = await screen.findByRole("button", {
        name: label,
      });
      await user.click(resolutionButton);

      expect(onNavigate).toHaveBeenCalledWith(expectedHref);
    },
  );

  it("allows Preview but keeps Apply blocked for a closed term", async () => {
    const onPreview = vi.fn().mockResolvedValue(previewResponse);
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={onPreview}
        onApply={onApply}
        showError={vi.fn()}
        readiness={{
          ...ready,
          canApply: false,
          applyBlockingReasons: ["closed_term"],
        }}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="closed term apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));

    expect(onPreview).toHaveBeenCalledWith({
      from: "2026-09-01",
      to: "2026-12-31",
      overwrite: false,
    });
    expect(
      screen.getByRole("button", { name: "actions.apply" }),
    ).toBeDisabled();
    expect(screen.getByText("closed term apply blocked")).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("previews and applies independently when both actions are ready", async () => {
    const onPreview = vi.fn().mockResolvedValue(previewResponse);
    const onApply = vi.fn().mockResolvedValue({
      ...previewResponse,
      dryRun: false,
    });
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={onPreview}
        onApply={onApply}
        showError={vi.fn()}
        readiness={ready}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));
    await user.click(
      await screen.findByRole("button", { name: "actions.apply" }),
    );

    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      from: "2026-09-01",
      to: "2026-12-31",
      overwrite: false,
    });
  });

  it("discards a preview response when the form changes before it resolves", async () => {
    const previewRequest = deferred<typeof previewResponse>();
    const user = userEvent.setup();
    render(
      <AutoPlanDialog
        isOpen
        termStartDate="2026-09-01"
        termEndDate="2026-12-31"
        onClose={vi.fn()}
        onPreview={vi.fn().mockReturnValue(previewRequest.promise)}
        onApply={vi.fn()}
        showError={vi.fn()}
        readiness={ready}
        previewBlockedMessage="preview blocked"
        applyBlockedMessage="apply blocked"
        hasVisibleLessons
        locale="en"
        scope={scope}
        onNavigate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "actions.preview" }));
    await user.click(screen.getByRole("checkbox"));
    await act(async () => {
      previewRequest.resolve(previewResponse);
      await previewRequest.promise;
    });

    expect(
      screen.getByRole("button", { name: "actions.apply" }),
    ).toBeDisabled();
  });

  it("discards a preview response from a previous dialog session", async () => {
    const previewRequest = deferred<typeof previewResponse>();
    const props = {
      termStartDate: "2026-09-01",
      termEndDate: "2026-12-31",
      onClose: vi.fn(),
      onPreview: vi.fn().mockReturnValue(previewRequest.promise),
      onApply: vi.fn(),
      showError: vi.fn(),
      readiness: ready,
      previewBlockedMessage: "preview blocked",
      applyBlockedMessage: "apply blocked",
      hasVisibleLessons: true,
      locale: "en",
      scope,
      onNavigate: vi.fn(),
    };
    const user = userEvent.setup();
    const { rerender } = render(<AutoPlanDialog isOpen {...props} />);

    await user.click(screen.getByRole("button", { name: "actions.preview" }));
    rerender(<AutoPlanDialog isOpen={false} {...props} />);
    rerender(<AutoPlanDialog isOpen {...props} />);
    await act(async () => {
      previewRequest.resolve(previewResponse);
      await previewRequest.promise;
    });

    expect(
      screen.getByRole("button", { name: "actions.apply" }),
    ).toBeDisabled();
  });
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

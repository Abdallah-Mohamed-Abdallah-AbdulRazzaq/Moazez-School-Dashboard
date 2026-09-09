import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GenerateDialog from "@/features/academics/timetable/components/GenerateDialog";
import type { TimetableGenerationViewModel } from "@/features/academics/timetable/services/timetableGenerationPresentation";

const completeResult: TimetableGenerationViewModel = {
  status: "complete",
  createdCount: 8,
  existingCount: 2,
  remainingDemandCount: 0,
  complete: true,
  groups: [],
};

describe("GenerateDialog", () => {
  it("confirms the persisted config scope before generation", () => {
    render(
      <GenerateDialog
        open
        onClose={vi.fn()}
        onGenerate={vi.fn()}
        configName="Grade 7 timetable"
        scopeName="Grade 7"
        classroomCount={3}
        isGenerating={false}
        result={null}
        error={null}
        onOpenValidation={vi.fn()}
      />,
    );

    expect(screen.getByText("Grade 7 timetable")).toBeInTheDocument();
    expect(screen.getByText("Grade 7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("persistenceWarning")).toBeInTheDocument();
  });

  it("locks confirmation while generation is in progress", () => {
    render(
      <GenerateDialog
        open
        onClose={vi.fn()}
        onGenerate={vi.fn()}
        configName="Grade 7 timetable"
        scopeName="Grade 7"
        classroomCount={3}
        isGenerating
        result={null}
        error={null}
        onOpenValidation={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "generate" })).toBeDisabled();
    expect(screen.getByText("generating")).toBeInTheDocument();
  });

  it("shows a complete persisted generation result", () => {
    render(
      <GenerateDialog
        open
        onClose={vi.fn()}
        onGenerate={vi.fn()}
        configName="Grade 7 timetable"
        scopeName="Grade 7"
        classroomCount={3}
        isGenerating={false}
        result={completeResult}
        error={null}
        onOpenValidation={vi.fn()}
      />,
    );

    expect(screen.getByText("result.complete")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "openValidation" })).toBeInTheDocument();
  });

  it("shows grouped unresolved results and opens validation", async () => {
    const user = userEvent.setup();
    const onOpenValidation = vi.fn();
    render(
      <GenerateDialog
        open
        onClose={vi.fn()}
        onGenerate={vi.fn()}
        configName="Grade 7 timetable"
        scopeName="Grade 7"
        classroomCount={3}
        isGenerating={false}
        result={{
          ...completeResult,
          status: "partial",
          complete: false,
          remainingDemandCount: 2,
          groups: [
            {
              classroomId: "classroom-1",
              classroomName: "Class 1",
              items: [
                {
                  code: "missing_teacher_allocation",
                  messageKey: "missing_teacher_allocation",
                  subjectId: "subject-1",
                  subjectName: "Mathematics",
                  requiredWeeklySlots: 4,
                  scheduledWeeklySlots: 2,
                  remainingWeeklySlots: 2,
                },
              ],
            },
          ],
        }}
        error={null}
        onOpenValidation={onOpenValidation}
      />,
    );

    expect(screen.getByText("Class 1")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("unresolved.missing_teacher_allocation")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "openValidation" }));
    expect(onOpenValidation).toHaveBeenCalledOnce();
  });
});

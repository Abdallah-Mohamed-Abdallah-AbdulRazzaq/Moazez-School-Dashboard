import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bulkUpsertSubjectAllocations } from "@/features/academics/subjects/services/subjectsService";
import { SubjectsSetupStep } from "../components/steps/SubjectsSetupStep";

const dialogMocks = vi.hoisted(() => ({
  subjectDialog: vi.fn(),
}));

vi.mock("@/features/academics/subjects/components/SubjectDialog", () => ({
  default: (props: unknown) => {
    dialogMocks.subjectDialog(props);
    return (props as { isOpen: boolean }).isOpen ? <div>Subject dialog open</div> : null;
  },
}));

vi.mock("@/features/academics/subjects/services/subjectsService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/academics/subjects/services/subjectsService")>()),
  bulkUpsertSubjectAllocations: vi.fn(),
}));

const stage = { id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", order: 1 };
const grade = {
  id: "grade-1",
  name: "Grade 1",
  nameAr: "الأول",
  nameEn: "Grade 1",
  stageId: stage.id,
  capacity: 30,
  order: 1,
};
const subject = {
  id: "subject-1",
  name: "Math",
  nameAr: "رياضيات",
  nameEn: "Math",
  isActive: true,
};

const copy = {
  summary: "Create subjects and allocate weekly hours.",
  createSubject: "Create subject",
  grade: "Grade",
  subject: "Subject",
  weeklyHours: "Weekly hours",
  saveAllocation: "Save allocation",
  saving: "Saving",
  saveFailed: "Could not save allocation",
};

describe("SubjectsSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens SubjectDialog when no subject exists", async () => {
    const user = userEvent.setup();

    render(
      <SubjectsSetupStep
        copy={copy}
        grades={[grade]}
        refreshStep={vi.fn()}
        subjectsData={{ subjects: [], allocations: [] }}
        termId="term-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create subject" }));

    expect(screen.getByText("Subject dialog open")).toBeVisible();
    expect(dialogMocks.subjectDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isOpen: true,
        existingSubjects: [],
        subject: null,
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("saves a grade subject weekly-hours allocation", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();
    vi.mocked(bulkUpsertSubjectAllocations).mockResolvedValue();

    render(
      <SubjectsSetupStep
        copy={copy}
        grades={[grade]}
        refreshStep={refreshStep}
        subjectsData={{ subjects: [subject], allocations: [] }}
        termId="term-1"
      />,
    );

    await user.clear(screen.getByRole("spinbutton", { name: "Weekly hours" }));
    await user.type(screen.getByRole("spinbutton", { name: "Weekly hours" }), "4");
    await user.click(screen.getByRole("button", { name: "Save allocation" }));

    expect(bulkUpsertSubjectAllocations).toHaveBeenCalledWith("term-1", [
      { gradeId: grade.id, subjectId: subject.id, weeklyHours: 4 },
    ]);
    await waitFor(() => expect(refreshStep).toHaveBeenCalledWith("subjects"));
  });
});

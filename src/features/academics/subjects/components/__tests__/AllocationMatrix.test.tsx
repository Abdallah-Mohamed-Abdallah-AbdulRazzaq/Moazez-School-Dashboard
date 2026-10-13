import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AllocationMatrix from "@/features/academics/subjects/components/AllocationMatrix";
import { bulkUpsertSubjectAllocations } from "@/features/academics/subjects/services/subjectsService";
import type {
  Grade,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const navigation = vi.hoisted(() => ({ query: "", push: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

vi.mock("@/features/academics/shared/components/export/AcademicsGlobalExportModal", () => ({
  default: () => null,
}));

vi.mock("@/features/academics/subjects/services/subjectsService", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/academics/subjects/services/subjectsService")
  >("@/features/academics/subjects/services/subjectsService");
  return {
    ...actual,
    bulkUpsertSubjectAllocations: vi.fn(),
  };
});

const grade: Grade = {
  id: "grade-1",
  stageId: "stage-1",
  name: "Grade 1",
  nameAr: "Grade 1 AR",
  nameEn: "Grade 1",
  order: 1,
};

const stage: Stage = {
  id: "stage-1",
  name: "Primary Stage",
  nameAr: "المرحلة الابتدائية",
  nameEn: "Primary Stage",
  order: 1,
};

const subject: Subject = {
  id: "subject-1",
  name: "Math",
  nameAr: "Math AR",
  nameEn: "Math",
  code: "MATH",
  color: "#2563eb",
  isActive: true,
};

const subjectAllocation: SubjectAllocation = {
  id: "subject-allocation-1",
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  subjectId: "subject-1",
  weeklyHours: 5,
};

const mockedBulkUpsertSubjectAllocations = vi.mocked(
  bulkUpsertSubjectAllocations,
);

function renderAllocationMatrix(options?: {
  stages?: Stage[];
  grades?: Grade[];
  subjects?: Subject[];
  allocations?: SubjectAllocation[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaveError?: (error: unknown) => void;
}) {
  const onRefresh = options?.onRefresh ?? vi.fn().mockResolvedValue(undefined);
  const onDirtyChange = options?.onDirtyChange ?? vi.fn();
  const onSaveError = options?.onSaveError ?? vi.fn();

  render(
    <AllocationMatrix
      stages={options?.stages ?? [stage]}
      grades={options?.grades ?? [grade]}
      subjects={options?.subjects ?? [subject]}
      allocations={options?.allocations ?? [subjectAllocation]}
      termId="term-1"
      isLoading={options?.isLoading}
      isReadOnly={false}
      onAllocationsChange={vi.fn()}
      onDirtyChange={onDirtyChange}
      onSaveError={onSaveError}
      onRefresh={onRefresh}
    />,
  );

  return { onDirtyChange, onRefresh, onSaveError };
}

describe("AllocationMatrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.query = "";
  });

  it.each(["gradeId=grade-1", "stage=stage-1"])(
    "shows only assigned subjects for %s",
    (query) => {
      navigation.query = query;
      renderAllocationMatrix({
        stages: [stage, { ...stage, id: "stage-2", nameEn: "Secondary" }],
        grades: [grade, { ...grade, id: "grade-2", stageId: "stage-2" }],
        subjects: [subject, { ...subject, id: "science", nameEn: "Science" }, { ...subject, id: "zero-hours", nameEn: "Art" }],
        allocations: [subjectAllocation, { ...subjectAllocation, gradeId: "grade-2", subjectId: "science" }, { ...subjectAllocation, subjectId: "zero-hours", weeklyHours: 0 }],
      });

      expect(screen.getByText("Math")).toBeInTheDocument();
      expect(screen.queryByText("Science")).not.toBeInTheDocument();
      expect(screen.queryByText("Art")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "filters.subject" }));
      expect(screen.getByRole("button", { name: "Math" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Science" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Art" })).not.toBeInTheDocument();
    },
  );

  it("enables the full catalog without retaining a subject filter", () => {
    navigation.query = "gradeId=grade-1&subjectId=subject-1";
    renderAllocationMatrix();
    fireEvent.click(screen.getByRole("checkbox", { name: "filters.show_all_subjects" }));
    expect(navigation.push).toHaveBeenCalledWith("?gradeId=grade-1&allSubjects=1", { scroll: false });
  });

  it("can assign a new subject from the full catalog and saves only the edited pair", async () => {
    navigation.query = "gradeId=grade-1&allSubjects=1";
    mockedBulkUpsertSubjectAllocations.mockResolvedValueOnce(undefined);
    renderAllocationMatrix({ subjects: [subject, { ...subject, id: "science", nameEn: "Science" }] });

    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[1], { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

    await waitFor(() => expect(mockedBulkUpsertSubjectAllocations).toHaveBeenCalledWith(
      "term-1", [{ gradeId: "grade-1", subjectId: "science", weeklyHours: 3 }],
    ));
  });

  it("allows weekly hour values up to the backend maximum of 80", () => {
    renderAllocationMatrix();

    const weeklyHoursInput = screen.getByRole("spinbutton");
    fireEvent.change(weeklyHoursInput, { target: { value: "99" } });

    expect(weeklyHoursInput).toHaveValue(80);
  });

  it("shows localized stage names instead of stage IDs in the filter", () => {
    renderAllocationMatrix();

    fireEvent.click(screen.getByRole("button", { name: "filters.stage" }));

    expect(
      screen.getByRole("button", { name: "Primary Stage" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "stage-1" }),
    ).not.toBeInTheDocument();
  });

  it("shows a matrix skeleton while filtered allocations are loading", () => {
    renderAllocationMatrix({ isLoading: true });

    expect(screen.getByRole("status", { name: "loading" })).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("saves edited allocations through the API service", async () => {
    mockedBulkUpsertSubjectAllocations.mockResolvedValueOnce(undefined);
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    renderAllocationMatrix({ onRefresh });

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "80" },
    });
    fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

    await waitFor(() => {
      expect(mockedBulkUpsertSubjectAllocations).toHaveBeenCalledWith(
        "term-1",
        [
          expect.objectContaining({
            gradeId: "grade-1",
            subjectId: "subject-1",
            weeklyHours: 80,
          }),
        ],
      );
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it("keeps edited values dirty when save fails", async () => {
    const saveError = new Error("Save failed");
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const onDirtyChange = vi.fn();
    const onSaveError = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedBulkUpsertSubjectAllocations.mockRejectedValueOnce(saveError);

    try {
      renderAllocationMatrix({ onDirtyChange, onRefresh, onSaveError });

      const weeklyHoursInput = screen.getByRole("spinbutton");
      fireEvent.change(weeklyHoursInput, { target: { value: "7" } });
      fireEvent.click(screen.getByRole("button", { name: /actions\.save/i }));

      await waitFor(() => {
        expect(onSaveError).toHaveBeenCalledWith(saveError);
      });
      expect(weeklyHoursInput).toHaveValue(7);
      expect(onRefresh).not.toHaveBeenCalled();
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

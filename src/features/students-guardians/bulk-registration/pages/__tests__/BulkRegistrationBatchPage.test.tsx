import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { ApiError } from "@/lib/api-error";
import type {
  BulkRegistrationBatchDetail,
  BulkRegistrationBatchStatus,
} from "../../api/bulkRegistrationDtos";
import { cappedBulkRegistrationRowsLimit } from "../../components/BulkRegistrationRowsTable";
import BulkRegistrationBatchPage from "../BulkRegistrationBatchPage";

const routerMocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const academicServiceMocks = vi.hoisted(() => ({
  fetchAcademicYears: vi.fn(),
  fetchTermsByYear: vi.fn(),
  fetchStructureTree: vi.fn(),
}));
const bulkRegistrationApiMocks = vi.hoisted(() => ({
  getBulkRegistrationBatch: vi.fn(),
  listBulkRegistrationRows: vi.fn(),
  confirmBulkRegistration: vi.fn(),
  createBulkRegistration: vi.fn(),
  downloadBulkRegistrationTemplate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  usePathname: () => "/en/students-guardians/bulk-registration/batch-1",
  useRouter: () => routerMocks,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => academicServiceMocks,
);

vi.mock(
  "@/features/students-guardians/bulk-registration/api/bulkRegistrationApi",
  () => bulkRegistrationApiMocks,
);

function batchFactory(
  status: BulkRegistrationBatchStatus = "READY",
  overrides: Partial<BulkRegistrationBatchDetail> = {},
): BulkRegistrationBatchDetail {
  return {
    id: "batch-1",
    sourceImportJobId: "import-1",
    status,
    templateVersion: 1,
    placement: {
      academicYearId: "year-1",
      termId: "term-1",
      classroomId: "classroom-1",
      enrollmentDate: "2026-09-15",
    },
    counters: {
      totalRows: 120,
      validRows: 90,
      invalidRows: 30,
      createdRows: 10,
      failedRows: 2,
    },
    createdAt: "2026-08-31T08:00:00.000Z",
    updatedAt: "2026-08-31T08:01:00.000Z",
    validatedAt: "2026-08-31T08:01:00.000Z",
    startedAt: null,
    completedAt: null,
    validationErrors: [],
    ...overrides,
  };
}

function rowsPage(page = 1, limit = 50) {
  return {
    items: [
      {
        id: `row-${page}`,
        rowNumber: (page - 1) * limit + 1,
        status: "VALID" as const,
        normalizedData: {
          firstNameEn: "Amina",
          fatherNameEn: "Omar",
          grandfatherNameEn: null,
          familyNameEn: "Saleh",
          firstNameAr: "أمينة",
          fatherNameAr: "عمر",
          grandfatherNameAr: null,
          familyNameAr: "صالح",
          dateOfBirth: "2018-03-12",
          gender: "female",
          nationality: "SA",
          username: "amina.saleh",
          contactEmail: null,
          studentPhone: null,
        },
        errors: [],
        studentId: null,
        userId: null,
        enrollmentId: null,
      },
    ],
    total: 120,
    page,
    limit,
  };
}

function renderPage() {
  return render(
    <ToastProvider>
      <BulkRegistrationBatchPage batchId="batch-1" />
    </ToastProvider>,
  );
}

async function waitForInitialRows() {
  await waitFor(() => {
    expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenCalled();
  });
}

function uploadInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("Corrected CSV input was not rendered");
  return input;
}

describe("BulkRegistrationBatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory(),
    );
    bulkRegistrationApiMocks.listBulkRegistrationRows.mockImplementation(
      (_batchId: string, query: { page: number; limit: number }) =>
        Promise.resolve(rowsPage(query.page, query.limit)),
    );
    bulkRegistrationApiMocks.confirmBulkRegistration.mockResolvedValue(
      batchFactory("EXECUTING", {
        updatedAt: "2026-08-31T08:02:00.000Z",
        startedAt: "2026-08-31T08:02:00.000Z",
      }),
    );
    bulkRegistrationApiMocks.createBulkRegistration.mockResolvedValue(
      batchFactory("UPLOADED", { id: "batch-2" }),
    );
    bulkRegistrationApiMocks.downloadBulkRegistrationTemplate.mockResolvedValue(
      undefined,
    );
    academicServiceMocks.fetchAcademicYears.mockResolvedValue([
      {
        id: "year-1",
        name: "2026/2027",
        nameAr: "2026/2027",
        nameEn: "2026/2027",
        startDate: "2026-09-01",
        endDate: "2027-06-30",
        isActive: true,
      },
    ]);
    academicServiceMocks.fetchTermsByYear.mockResolvedValue([
      {
        id: "term-1",
        name: "Term 1",
        nameAr: "الفصل الأول",
        nameEn: "Term 1",
        yearId: "year-1",
        status: "open",
        startDate: "2026-09-01",
        endDate: "2027-01-15",
      },
    ]);
    academicServiceMocks.fetchStructureTree.mockResolvedValue({
      stages: [
        {
          id: "stage-1",
          name: "Primary",
          nameAr: "ابتدائي",
          nameEn: "Primary",
          order: 1,
        },
      ],
      grades: [
        {
          id: "grade-1",
          name: "Grade 1",
          nameAr: "الصف الأول",
          nameEn: "Grade 1",
          stageId: "stage-1",
          capacity: 100,
          order: 1,
        },
      ],
      sections: [
        {
          id: "section-1",
          name: "Section A",
          nameAr: "شعبة أ",
          nameEn: "Section A",
          gradeId: "grade-1",
          capacity: 50,
          order: 1,
        },
      ],
      classrooms: [
        {
          id: "classroom-1",
          name: "Classroom 1",
          nameAr: "فصل 1",
          nameEn: "Classroom 1",
          sectionId: "section-1",
          capacity: 30,
          order: 1,
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(["UPLOADED", "VALIDATING", "EXECUTING"] as const)(
    "polls authoritative detail while the batch is %s without polling rows",
    async (status) => {
      vi.useFakeTimers();
      bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
        batchFactory(status),
      );
      renderPage();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(bulkRegistrationApiMocks.getBulkRegistrationBatch).toHaveBeenCalledTimes(1);
      expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3_000);
      });
      expect(bulkRegistrationApiMocks.getBulkRegistrationBatch).toHaveBeenCalledTimes(2);
      expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "READY",
    "VALIDATION_FAILED",
    "EXECUTION_PARTIAL_FAILED",
    "FAILED",
    "COMPLETED",
  ] as const)("stops polling detail when the batch is %s", async (status) => {
    vi.useFakeTimers();
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory(status),
    );
    renderPage();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });

    expect(bulkRegistrationApiMocks.getBulkRegistrationBatch).toHaveBeenCalledTimes(1);
  });

  it("shows counters, resolved placement, validation errors, and only available timestamps", async () => {
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory("VALIDATION_FAILED", {
        validationErrors: ["students.bulk_registration.header_invalid"],
        startedAt: null,
        completedAt: "2026-08-31T08:03:00.000Z",
      }),
    );
    renderPage();

    expect(await screen.findByText("2026/2027 · Term 1 · Primary · Grade 1 · Section A · Classroom 1")).toBeInTheDocument();
    expect(screen.getByText("Total rows").parentElement).toHaveTextContent("120");
    expect(screen.getByText("Valid rows").parentElement).toHaveTextContent("90");
    expect(screen.getByText("Invalid rows").parentElement).toHaveTextContent("30");
    expect(screen.getByText("Created rows").parentElement).toHaveTextContent("10");
    expect(screen.getByText("Failed rows").parentElement).toHaveTextContent("2");
    expect(screen.getByText("The CSV headers do not match the required template.")).toBeInTheDocument();
    expect(screen.getByText("Validated at")).toBeInTheDocument();
    expect(screen.getByText("Completed at")).toBeInTheDocument();
    expect(screen.queryByText("Started at")).not.toBeInTheDocument();
  });

  it("loads page 1 with 50 rows, requests selected pages and sizes, and applies optional status filters", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForInitialRows();

    expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenLastCalledWith(
      "batch-1",
      { page: 1, limit: 50 },
      expect.any(AbortSignal),
    );

    await user.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => {
      expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenLastCalledWith(
        "batch-1",
        { page: 2, limit: 50 },
        expect.any(AbortSignal),
      );
    });

    await user.selectOptions(screen.getByRole("combobox"), "100");
    await waitFor(() => {
      expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenLastCalledWith(
        "batch-1",
        { page: 1, limit: 100 },
        expect.any(AbortSignal),
      );
    });

    await user.click(screen.getByRole("button", { name: "Show row filters" }));
    await user.click(screen.getByLabelText("Row status"));
    await user.click(screen.getByRole("button", { name: "Valid" }));
    await waitFor(() => {
      expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenLastCalledWith(
        "batch-1",
        { page: 1, limit: 100, status: "VALID" },
        expect.any(AbortSignal),
      );
    });
  });

  it.each([
    [-10, 1],
    [50.9, 50],
    [200, 200],
    [500, 200],
  ])("caps a requested row page size of %s at %s", (requested, expected) => {
    expect(cappedBulkRegistrationRowsLimit(requested)).toBe(expected);
  });

  it.each([
    ["VALIDATION_FAILED", "INVALID"],
    ["EXECUTION_PARTIAL_FAILED", "FAILED"],
  ] as const)("defaults %s rows to %s", async (status, rowStatus) => {
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory(status),
    );
    renderPage();

    await waitFor(() => {
      expect(bulkRegistrationApiMocks.listBulkRegistrationRows).toHaveBeenCalledWith(
        "batch-1",
        { page: 1, limit: 50, status: rowStatus },
        expect.any(AbortSignal),
      );
    });
  });

  it("confirms one fresh READY snapshot with authoritative placement and resumes from EXECUTING", async () => {
    bulkRegistrationApiMocks.getBulkRegistrationBatch
      .mockResolvedValueOnce(batchFactory("READY"))
      .mockResolvedValue(batchFactory("EXECUTING", {
        updatedAt: "2026-08-31T08:02:00.000Z",
        startedAt: "2026-08-31T08:02:00.000Z",
      }));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("2026/2027 · Term 1 · Primary · Grade 1 · Section A · Classroom 1");
    await user.click(screen.getByRole("button", { name: "Confirm registration" }));
    expect(screen.getByText(/90 valid rows/)).toHaveTextContent("Classroom 1");
    const confirmButton = screen.getByRole("button", { name: "Create 90 students" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(bulkRegistrationApiMocks.confirmBulkRegistration).toHaveBeenCalledTimes(1);
      expect(bulkRegistrationApiMocks.getBulkRegistrationBatch).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Executing")).toBeInTheDocument();
    });
  });

  it("refreshes a stale 409 with the same timestamp before rendering the READY action again", async () => {
    let resolveRefresh!: (batch: BulkRegistrationBatchDetail) => void;
    const refreshRequest = new Promise<BulkRegistrationBatchDetail>((resolve) => {
      resolveRefresh = resolve;
    });
    bulkRegistrationApiMocks.getBulkRegistrationBatch
      .mockResolvedValueOnce(batchFactory("READY"))
      .mockReturnValueOnce(refreshRequest);
    bulkRegistrationApiMocks.confirmBulkRegistration.mockRejectedValue(
      new ApiError("Stale batch", 409, "students.bulk_registration.confirm_conflict"),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Confirm registration" }));
    await user.click(screen.getByRole("button", { name: "Create 90 students" }));
    await waitFor(() => {
      expect(bulkRegistrationApiMocks.getBulkRegistrationBatch).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("button", { name: "Confirm registration" })).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveRefresh(batchFactory("READY"));
      await refreshRequest;
    });
    expect(await screen.findByRole("button", { name: "Confirm registration" })).toBeEnabled();
  });

  it("does not resolve placement names from a different term", async () => {
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory("READY", {
        placement: {
          academicYearId: "year-1",
          termId: "missing-term",
          classroomId: "classroom-1",
          enrollmentDate: "2026-09-15",
        },
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(academicServiceMocks.fetchTermsByYear).toHaveBeenCalledWith("year-1");
    });
    expect(academicServiceMocks.fetchStructureTree).not.toHaveBeenCalled();
    expect(screen.queryByText(/Primary · Grade 1 · Section A/)).not.toBeInTheDocument();
  });

  it("uploads a corrected CSV as a new batch and replaces only the batch URL", async () => {
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory("VALIDATION_FAILED"),
    );
    const user = userEvent.setup();
    const { container } = renderPage();
    expect(await screen.findByText("Upload corrected CSV")).toBeInTheDocument();
    const correctedCsv = new File(["first_name_en\nAmina"], "corrected.csv", {
      type: "text/csv",
    });

    fireEvent.change(uploadInput(container), {
      target: { files: [correctedCsv] },
    });
    await user.click(
      screen.getByRole("button", { name: "Upload and start validation" }),
    );

    await waitFor(() => {
      expect(bulkRegistrationApiMocks.createBulkRegistration).toHaveBeenCalledWith(
        {
          academicYearId: "year-1",
          termId: "term-1",
          classroomId: "classroom-1",
          enrollmentDate: "2026-09-15",
        },
        correctedCsv,
      );
      expect(routerMocks.replace).toHaveBeenCalledWith(
        "/en/students-guardians/bulk-registration/batch-2",
      );
    });
    expect(bulkRegistrationApiMocks.confirmBulkRegistration).not.toHaveBeenCalled();
  });

  it("hands a completed batch to credentials using only its source batch ID", async () => {
    bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
      batchFactory("COMPLETED", {
        completedAt: "2026-08-31T08:03:00.000Z",
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Continue to credentials" }),
    );

    expect(routerMocks.push).toHaveBeenCalledWith(
      "/en/students-guardians/credentials?sourceRegistrationBatchId=batch-1",
    );
  });

  it.each(["VALIDATION_FAILED", "EXECUTION_PARTIAL_FAILED", "FAILED"] as const)(
    "shows no mutation retry for terminal failure %s",
    async (status) => {
      bulkRegistrationApiMocks.getBulkRegistrationBatch.mockResolvedValue(
        batchFactory(status),
      );
      renderPage();

      await screen.findByText("Upload corrected CSV");
      expect(screen.queryByRole("button", { name: "Confirm registration" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /retry registration/i })).not.toBeInTheDocument();
    },
  );
});

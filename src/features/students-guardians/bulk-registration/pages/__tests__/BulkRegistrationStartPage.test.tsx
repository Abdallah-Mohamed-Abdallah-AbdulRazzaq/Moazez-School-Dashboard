import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import BulkRegistrationStartPage from "../BulkRegistrationStartPage";

const routerMocks = vi.hoisted(() => ({ replace: vi.fn() }));
const academicServiceMocks = vi.hoisted(() => ({
  fetchAcademicYears: vi.fn(),
  fetchTermsByYear: vi.fn(),
  fetchStructureTree: vi.fn(),
}));
const bulkRegistrationApiMocks = vi.hoisted(() => ({
  preflightBulkRegistration: vi.fn(),
  downloadBulkRegistrationTemplate: vi.fn(),
  createBulkRegistration: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
  useRouter: () => ({ replace: routerMocks.replace }),
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => academicServiceMocks,
);

vi.mock(
  "@/features/students-guardians/bulk-registration/api/bulkRegistrationApi",
  () => bulkRegistrationApiMocks,
);

const validPreflight = {
  valid: true,
  errors: [],
  templateVersion: 1,
  placement: {
    academicYear: { id: "year-1", nameAr: "2026/2027", nameEn: "2026/2027" },
    term: { id: "term-1", nameAr: "الفصل الأول", nameEn: "Term 1" },
    stage: { id: "stage-1", nameAr: "ابتدائي", nameEn: "Primary" },
    grade: { id: "grade-1", nameAr: "الصف الأول", nameEn: "Grade 1" },
    section: { id: "section-1", nameAr: "شعبة أ", nameEn: "Section A" },
    classroom: {
      id: "classroom-1",
      nameAr: "فصل 1",
      nameEn: "Classroom 1",
      capacity: 30,
    },
    enrollmentDate: "2026-09-15",
  },
  studentSeat: { limit: null, used: 18, remaining: null },
};

function renderPage() {
  return render(
    <ToastProvider>
      <BulkRegistrationStartPage />
    </ToastProvider>,
  );
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(
    await screen.findByLabelText((accessibleName) =>
      accessibleName.startsWith(label),
    ),
  );
  await user.click(await screen.findByRole("button", { name: option }));
}

async function completePlacement(user: ReturnType<typeof userEvent.setup>) {
  await selectOption(user, "Academic year", "2026/2027");
  await selectOption(user, "Term (optional)", "Term 1");
  await selectOption(user, "Stage", "Primary");
  await selectOption(user, "Grade", "Grade 1");
  await selectOption(user, "Section", "Section A");
  await selectOption(user, "Classroom", "Classroom 1");

  await user.click(screen.getByRole("spinbutton", { name: "Month" }));
  await user.keyboard("09152026");
}

async function runSuccessfulPreflight(
  user: ReturnType<typeof userEvent.setup>,
) {
  await completePlacement(user);
  await user.click(screen.getByRole("button", { name: "Check placement" }));
  await screen.findByText("Placement is ready");
}

function uploadInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("Bulk registration file input was not rendered");
  return input;
}

describe("BulkRegistrationStartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        {
          id: "classroom-2",
          name: "Classroom 2",
          nameAr: "فصل 2",
          nameEn: "Classroom 2",
          sectionId: "section-1",
          capacity: 30,
          order: 2,
        },
      ],
    });
    bulkRegistrationApiMocks.preflightBulkRegistration.mockResolvedValue(
      validPreflight,
    );
    bulkRegistrationApiMocks.downloadBulkRegistrationTemplate.mockResolvedValue(
      undefined,
    );
    bulkRegistrationApiMocks.createBulkRegistration.mockResolvedValue({
      id: "batch-42",
      status: "UPLOADED",
    });
  });

  it("sends only backend placement fields after the full cascade is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    await completePlacement(user);
    await user.click(screen.getByRole("button", { name: "Check placement" }));

    await waitFor(() => {
      expect(
        bulkRegistrationApiMocks.preflightBulkRegistration,
      ).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-15",
      });
    });
  });

  it("keeps template and upload controls disabled for rejected preflight errors", async () => {
    bulkRegistrationApiMocks.preflightBulkRegistration.mockResolvedValue({
      valid: false,
      errors: [
        "students.bulk_registration.execution_placement_invalid",
        "students.bulk_registration.future_backend_code",
      ],
      templateVersion: 1,
      placement: null,
      studentSeat: null,
    });
    const user = userEvent.setup();
    renderPage();

    await completePlacement(user);
    await user.click(screen.getByRole("button", { name: "Check placement" }));

    expect(
      await screen.findByText("The selected academic placement is not available."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We could not verify this placement. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download CSV template" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select CSV file" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows nullable seat limits as not capped", async () => {
    const user = userEvent.setup();
    renderPage();

    await runSuccessfulPreflight(user);

    expect(screen.getByText("Seat limit").parentElement).toHaveTextContent(
      "Not capped",
    );
    expect(screen.getByText("Seats remaining").parentElement).toHaveTextContent(
      "Not capped",
    );
    expect(screen.getByText("Seats used").parentElement).toHaveTextContent("18");
  });

  it("downloads the backend template only after a successful preflight", async () => {
    const user = userEvent.setup();
    renderPage();
    const downloadButton = screen.getByRole("button", {
      name: "Download CSV template",
    });

    expect(downloadButton).toBeDisabled();
    expect(
      bulkRegistrationApiMocks.downloadBulkRegistrationTemplate,
    ).not.toHaveBeenCalled();

    await runSuccessfulPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "Download CSV template" }),
    );

    await waitFor(() => {
      expect(
        bulkRegistrationApiMocks.downloadBulkRegistrationTemplate,
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("accepts one CSV file after a valid preflight", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await runSuccessfulPreflight(user);
    const csv = new File(["first_name_en\nAmina"], "students.csv", {
      type: "text/csv",
    });

    fireEvent.change(uploadInput(container), { target: { files: [csv] } });

    expect(await screen.findByText("students.csv")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload and start validation" }),
    ).toBeEnabled();
  });

  it.each([
    [
      "students.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      100,
      "Unsupported file type",
    ],
    ["students.xls", "application/vnd.ms-excel", 100, "Only CSV files are allowed."],
    ["students.csv", "text/csv", 10 * 1024 * 1024 + 1, "File is too large"],
  ])(
    "rejects unsupported or oversized selection %s",
    async (filename, mimeType, size, expectedMessage) => {
      const user = userEvent.setup();
      const { container } = renderPage();
      await runSuccessfulPreflight(user);
      const file = new File([new Uint8Array(size)], filename, { type: mimeType });

      fireEvent.change(uploadInput(container), { target: { files: [file] } });

      expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Upload and start validation" }),
      ).toBeDisabled();
    },
  );

  it("clears a selected file and valid preflight when placement changes", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await runSuccessfulPreflight(user);
    fireEvent.change(uploadInput(container), {
      target: {
        files: [new File(["row"], "students.csv", { type: "text/csv" })],
      },
    });
    expect(await screen.findByText("students.csv")).toBeInTheDocument();

    await selectOption(user, "Classroom", "Classroom 2");

    expect(screen.queryByText("students.csv")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download CSV template" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Upload and start validation" }),
    ).toBeDisabled();
  });

  it("ignores a stale preflight response after placement changes", async () => {
    let resolvePreflight: (preflight: typeof validPreflight) => void = () =>
      undefined;
    bulkRegistrationApiMocks.preflightBulkRegistration.mockReturnValue(
      new Promise((resolve) => {
        resolvePreflight = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await completePlacement(user);
    await user.click(screen.getByRole("button", { name: "Check placement" }));

    await selectOption(user, "Classroom", "Classroom 2");
    resolvePreflight(validPreflight);

    await waitFor(() => {
      expect(screen.queryByText("Placement is ready")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Download CSV template" }),
    ).toBeDisabled();
  });

  it("replaces the route with the durable batch ID without CSV contents", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await runSuccessfulPreflight(user);
    const csvContents = "SECRET_ROW_CONTENT";
    const csv = new File([csvContents], "students.csv", { type: "text/csv" });
    fireEvent.change(uploadInput(container), { target: { files: [csv] } });

    await user.click(
      screen.getByRole("button", { name: "Upload and start validation" }),
    );

    await waitFor(() => {
      expect(routerMocks.replace).toHaveBeenCalledWith(
        "/en/students-guardians/bulk-registration/batch-42",
      );
    });
    expect(routerMocks.replace.mock.calls.flat().join(" ")).not.toContain(
      csvContents,
    );
  });
});

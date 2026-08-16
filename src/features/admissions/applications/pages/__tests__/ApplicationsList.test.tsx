import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationsList from "@/features/admissions/applications/pages/ApplicationsList";
import type { Application } from "@/features/admissions/types/admissions";

const applicationServiceMocks = vi.hoisted(() => ({
  createApplication: vi.fn(),
  fetchApplications: vi.fn(),
  submitApplication: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === "today_week_stats") {
      return `${values?.today ?? 0} today, ${values?.week ?? 0} this week`;
    }
    return key;
  },
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/features/admissions/shared/hooks/useAdmissionsUrlQueryState", () => ({
  useAdmissionsUrlQueryState: () => ({
    values: { search: "", status: "all" },
    setValue: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("@/features/admissions/applications/hooks/useAdmissionsGradeLabels", () => ({
  useAdmissionsGradeLabels: () => new Map([["grade-1", "Grade 1"]]),
}));

vi.mock("@/components/ui", () => ({
  Button: (props: {
    children: React.ReactNode;
    onClick?: () => void;
    leftIcon?: React.ReactNode;
    variant?: string;
    size?: string;
    className?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const buttonProps = { ...props };
    delete buttonProps.leftIcon;
    delete buttonProps.variant;
    delete buttonProps.size;
    delete buttonProps.className;
    const { children, onClick, ...nativeButtonProps } = buttonProps;
    return (
      <button onClick={onClick} {...nativeButtonProps}>
        {children}
      </button>
    );
  },
  DataTable: ({ data }: { data: Application[] }) => (
    <table>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            <td>{row.studentName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  EmptyState: ({ message }: { message: string }) => <div>{message}</div>,
  FilterPanel: ({ searchSlot, filtersSlot }: { searchSlot: React.ReactNode; filtersSlot: React.ReactNode }) => (
    <div>
      {searchSlot}
      {filtersSlot}
    </div>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }) => {
    const inputProps = { ...props };
    delete inputProps.leftIcon;
    return <input {...inputProps} />;
  },
  Select: ({ options }: { options: Array<{ value: string; label: string }> }) => (
    <select>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@/components/ui/kpi-card", () => ({
  KPICardV2: (props: { title: string; chartData?: unknown[]; showChart?: boolean }) => {
    const rendersChart = props.showChart !== false && Boolean(props.chartData?.length);
    return (
      <section>
        {props.title}
        {rendersChart && <span>chart for {props.title}</span>}
      </section>
    );
  },
}));

vi.mock("@/features/admissions/shared/StatusBadge", () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("@/features/admissions/shared/StatusTagsBar", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/applications/components/ApplicationCreateStepper", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/shared/components/export/AdmissionsGlobalExportModal", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/applications/services/applicationsApiService", () => applicationServiceMocks);
vi.mock("@/features/admissions/applications/services/applicationDocumentsApiService", () => ({
  createApplicationDocument: vi.fn(),
  uploadAdmissionsFile: vi.fn(),
}));
const application = {
  id: "app-1",
  studentName: "Omar Ahmed",
  full_name_en: "Omar Ahmed",
  full_name_ar: "",
  source: "in_app",
  status: "submitted",
  submittedDate: "2026-07-06T08:00:00.000Z",
  submittedAt: "2026-07-06T08:00:00.000Z",
  createdAt: "2026-07-06T08:00:00.000Z",
  updatedAt: "2026-07-06T08:00:00.000Z",
  documents: [],
  tests: [],
  interviews: [],
  guardians: [],
  requestedGradeId: "grade-1",
  documentsSummary: {
    totalCount: 0,
    completeCount: 0,
    missingCount: 0,
    pendingReviewCount: 0,
    reviewableCount: 0,
    applicantPortalCount: 0,
    staffUploadCount: 0,
    needsReplacementCount: 0,
    hasPendingReview: false,
    hasReviewableDocuments: false,
    hasMissingDocuments: false,
  },
  registrationState: { registered: false },
} as Application;

describe("ApplicationsList KPI cards", () => {
  beforeEach(() => {
    applicationServiceMocks.fetchApplications.mockReset().mockResolvedValue([application]);
  });

  it("does not render fabricated chart history when the backend only returns current counts", async () => {
    render(<ApplicationsList />);

    await screen.findByText("Omar Ahmed");
    await waitFor(() => expect(screen.getByText("total_applications")).toBeInTheDocument());

    expect(screen.queryByText(/chart for/)).not.toBeInTheDocument();
  });
});

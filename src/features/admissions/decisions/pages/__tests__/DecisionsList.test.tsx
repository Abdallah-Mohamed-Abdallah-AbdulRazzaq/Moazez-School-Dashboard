import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DecisionsList from "../DecisionsList";
import { fetchDecisions } from "../../services/decisionsApiService";

const showToast = vi.fn();
const dataTableProps: Array<{
  columns: unknown;
  data: Array<{ id: string }>;
  onRowClick?: (row: { id: string }) => void;
}> = [];
const drawerProps: Array<{
  decisionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}> = [];

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showToast }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/features/admissions/shared/hooks/useAdmissionsUrlQueryState", () => ({
  useAdmissionsUrlQueryState: () => ({
    values: { search: "", decision: "all", dateFrom: "", dateTo: "" },
    setValue: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("@/features/admissions/shared/components/AdmissionsAccessGuard", () => ({
  AdmissionsAccessDenied: () => <div>access-denied</div>,
}));

vi.mock("@/features/admissions/shared/components/export/AdmissionsGlobalExportModal", () => ({
  default: () => null,
}));

vi.mock("@/features/admissions/shared/utils/admissionsExport", () => ({
  downloadAdmissionsExport: vi.fn(),
}));

vi.mock("@/features/admissions/applications/utils/admissionsExportUtils", () => ({
  formatVisibleDecisionsForExport: vi.fn((data) => data),
}));

vi.mock("@/components/ui", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    loading?: boolean;
  }) => {
    const { children, leftIcon, rightIcon, loading, ...buttonProps } = props;
    void loading;
    return (
      <button {...buttonProps}>
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  },
  EmptyState: ({ message, action }: { message: string; action?: React.ReactNode }) => (
    <div>
      <p>{message}</p>
      {action}
    </div>
  ),
  FilterPanel: ({ searchSlot, filtersSlot }: { searchSlot: React.ReactNode; filtersSlot: React.ReactNode }) => (
    <div>
      {searchSlot}
      {filtersSlot}
    </div>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: React.ReactNode;
    fullWidth?: boolean;
  }) => {
    const { leftIcon, fullWidth, ...inputProps } = props;
    void fullWidth;
    return (
      <label>
        {leftIcon}
        <input {...inputProps} />
      </label>
    );
  },
  Select: ({
    label,
    value,
    onChange,
    options = [],
  }: {
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    options?: Array<{ value: string; label: string }>;
  }) => (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange?.(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
  DataTable: (props: {
    columns: unknown;
    data: Array<{ id: string }>;
    onRowClick?: (row: { id: string }) => void;
  }) => {
    dataTableProps.push(props);
    return (
      <button type="button" onClick={() => props.onRowClick?.(props.data[0])}>
        open-row
      </button>
    );
  },
}));

vi.mock("@/components/ui/kpi-card", () => ({
  KPICardV2: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("../../services/decisionsApiService", () => ({
  fetchDecisions: vi.fn(),
}));

vi.mock("../../components/DecisionDetailsDrawer", () => ({
  default: (props: {
    decisionId: string | null;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    drawerProps.push(props);
    return props.isOpen ? <div>drawer-open</div> : null;
  },
}));

const decision = {
  id: "decision-1",
  applicationId: "application-1",
  studentName: "Mariam Ahmed",
  decision: "accept" as const,
  reason: "Completed all admission steps",
  decisionDate: "2026-06-30T09:40:00.000Z",
  decidedBy: "Admissions Officer",
};

describe("DecisionsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataTableProps.length = 0;
    drawerProps.length = 0;
    vi.mocked(fetchDecisions).mockResolvedValue({
      items: [decision],
      pagination: { page: 1, limit: 20, total: 1 },
    });
  });

  it("keeps table columns and drawer close handler stable when opening the drawer", async () => {
    const user = userEvent.setup();

    render(<DecisionsList />);

    await screen.findByRole("button", { name: "open-row" });
    const initialColumns = dataTableProps.at(-1)?.columns;
    const initialOnClose = drawerProps.at(-1)?.onClose;

    await user.click(screen.getByRole("button", { name: "open-row" }));
    await waitFor(() => expect(screen.getByText("drawer-open")).toBeInTheDocument());

    expect(dataTableProps.at(-1)?.columns).toBe(initialColumns);
    expect(drawerProps.at(-1)?.onClose).toBe(initialOnClose);
  });
});

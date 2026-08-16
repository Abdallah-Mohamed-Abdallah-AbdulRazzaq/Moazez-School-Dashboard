import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BehaviorRecordsPage from "../BehaviorRecordsPage";
import {
  listBehaviorRecords,
} from "@/features/behavior/services/behaviorApiService";
import type { BehaviorRecordListResponse } from "@/features/behavior/types";
import type { DatePickerProps } from "@/components/ui/input/DatePicker";
import type { SelectProps } from "@/components/ui/input/Select";

// Mock next-intl
const tCache = new Map<string, (key: string) => string>();
const getT = (namespace?: string) => {
  const ns = namespace || "";
  if (!tCache.has(ns)) {
    tCache.set(ns, (key: string) => ns ? `${ns}.${key}` : key);
  }
  return tCache.get(ns)!;
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace?: string) => getT(namespace),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/behavior/records",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock DatePicker
vi.mock("@/components/ui/input/DatePicker", () => ({
  __esModule: true,
  default: ({ label, value, onChange }: DatePickerProps) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        type="date"
        value={value ? new Date(value).toISOString().split('T')[0] : ""}
        onChange={(e) =>
          onChange?.(e.target.value ? new Date(e.target.value) : null)
        }
      />
    </div>
  ),
}));

// Mock Select
vi.mock("@/components/ui/input/Select", () => ({
  __esModule: true,
  default: ({ label, value, onChange, options = [] }: SelectProps) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <select
        id={label}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  ),
}));

// Mock behavior year context
const mockContext = {
  isReadOnly: false,
  academicYears: [],
  terms: [
    { id: "term-1", startDate: "2026-06-01T00:00:00.000Z", endDate: "2026-06-30T00:00:00.000Z" }
  ],
  yearId: "year-1",
  termId: "term-1",
  termStatus: "open" as const,
  isLoading: false,
  error: null,
  setYearId: vi.fn(),
  setTermId: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("@/features/behavior/shared/hooks/useBehaviorYearTermContext", () => ({
  useBehaviorYearTermContext: () => mockContext,
}));

const grantedPermissions = new Set<string>();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      activeMembership: { permissions: Array.from(grantedPermissions) },
    },
    isLoading: false,
  }),
}));

// Mock toast
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

// Mock api service
vi.mock("@/features/behavior/services/behaviorApiService", () => ({
  listBehaviorRecords: vi.fn(),
  listBehaviorCategories: vi.fn(() => Promise.resolve({ items: [] })),
  createBehaviorRecord: vi.fn(),
  updateBehaviorRecord: vi.fn(),
}));

describe("BehaviorRecordsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBehaviorRecords).mockResolvedValue({
      items: [
        {
          id: "rec-1",
          studentId: "student-1",
          categoryId: "cat-1",
          status: "draft",
          points: 5,
          occurredAt: "2026-06-15T00:00:00.000Z",
          type: "positive",
          titleEn: "Draft Record",
        },
        {
          id: "rec-2",
          studentId: "student-2",
          categoryId: "cat-2",
          status: "approved",
          points: -10,
          occurredAt: "2026-06-16T00:00:00.000Z",
          type: "negative",
          titleEn: "Approved Record",
        },
      ],
      total: 2,
    } as BehaviorRecordListResponse);
    mockContext.isReadOnly = false;
    grantedPermissions.clear();
    grantedPermissions.add("behavior.records.create");
    grantedPermissions.add("behavior.records.manage");
    grantedPermissions.add("behavior.records.review");
  });

  it("renders records table with correct data", async () => {
    render(<BehaviorRecordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Draft Record")).toBeInTheDocument();
      expect(screen.getByText("Approved Record")).toBeInTheDocument();
    });
  });

  it("keeps the table visible when there are no records", async () => {
    vi.mocked(listBehaviorRecords).mockResolvedValue({ items: [], total: 0 });

    render(<BehaviorRecordsPage />);

    await waitFor(() => {
      expect(screen.getByText("common.no_data_available")).toBeInTheDocument();
    });

    expect(screen.getByText("behavior.table.occurredAt")).toBeInTheDocument();
  });

  it("hides record creation when the user lacks the backend create permission", async () => {
    grantedPermissions.delete("behavior.records.create");

    render(<BehaviorRecordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Draft Record")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "behavior.actions.newRecord" })).not.toBeInTheDocument();
  });

  it("filters bar date selection triggers loading with occurredFrom and occurredTo", async () => {
    render(<BehaviorRecordsPage />);

    await waitFor(() => {
      expect(listBehaviorRecords).toHaveBeenCalled();
    });

    const dateFromInput = screen.getByLabelText("behavior.filters.dateFrom");
    const dateToInput = screen.getByLabelText("behavior.filters.dateTo");

    expect(dateFromInput).toBeInTheDocument();
    expect(dateToInput).toBeInTheDocument();

    fireEvent.change(dateFromInput, { target: { value: "2026-06-10" } });
    fireEvent.change(dateToInput, { target: { value: "2026-06-20" } });

    await waitFor(() => {
      expect(listBehaviorRecords).toHaveBeenLastCalledWith(expect.objectContaining({
        occurredFrom: "2026-06-10T00:00:00.000Z",
        occurredTo: "2026-06-20T00:00:00.000Z",
      }));
    });
  });
});

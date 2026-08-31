import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionKey } from "@/hooks/usePermissions";

const navigation = vi.hoisted(() => ({ push: vi.fn(), lang: "en" }));
const permissionState = vi.hoisted(() => ({ granted: new Set<string>() }));
const translate = vi.hoisted(() => (key: string) => key);

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: navigation.lang }),
  useRouter: () => ({ push: navigation.push }),
}));
vi.mock("next-intl", () => ({
  useLocale: () => navigation.lang,
  useTranslations: () => translate,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: PermissionKey) =>
      permissionState.granted.has(permission),
    hasAllPermissions: (required: PermissionKey[]) =>
      required.every((permission) => permissionState.granted.has(permission)),
  }),
}));
vi.mock("use-debounce", () => ({ useDebounce: (value: unknown) => [value] }));
vi.mock(
  "@/features/students-guardians/students/services/studentsService",
  () => ({ fetchAllStudents: vi.fn().mockResolvedValue([]) }),
);
vi.mock(
  "@/features/students-guardians/shared/hooks/useUrlQueryState",
  () => ({
    useUrlQueryState: () => ({
      values: {
        search: "",
        status: "all",
        dateRange: "all",
        startDate: "",
        endDate: "",
      },
      setValue: vi.fn(),
      reset: vi.fn(),
    }),
  }),
);
vi.mock("@/components/ui/kpi-card/KPICardV2", () => ({
  default: () => <div data-testid="kpi" />,
}));
vi.mock(
  "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal",
  () => ({ default: () => null }),
);
vi.mock(
  "@/features/students-guardians/students/components/StudentAccountLinkModal",
  () => ({ default: () => null }),
);
vi.mock(
  "@/features/students-guardians/students/components/modals/AddNoteModal",
  () => ({ default: () => null }),
);

import StudentsList from "../StudentsList";

describe("StudentsList bulk workflow actions", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.lang = "en";
    permissionState.granted = new Set();
  });

  it("shows bulk registration only with both registration permissions", async () => {
    permissionState.granted = new Set(["students.records.manage"]);
    const { rerender } = render(<StudentsList />);
    await screen.findByText("no_students");
    expect(screen.queryByRole("button", { name: "Bulk registration" })).not.toBeInTheDocument();

    permissionState.granted = new Set([
      "students.records.manage",
      "students.enrollments.manage",
    ]);
    rerender(<StudentsList />);
    expect(screen.getByRole("button", { name: "Bulk registration" })).toBeInTheDocument();
  });

  it("shows credentials only with both credential-view permissions", async () => {
    permissionState.granted = new Set(["students.records.view"]);
    const { rerender } = render(<StudentsList />);
    await screen.findByText("no_students");
    expect(screen.queryByRole("button", { name: "Credentials" })).not.toBeInTheDocument();

    permissionState.granted = new Set([
      "students.records.view",
      "settings.users.view",
    ]);
    rerender(<StudentsList />);
    expect(screen.getByRole("button", { name: "Credentials" })).toBeInTheDocument();
  });

  it("navigates both actions with the active locale and no placeholder modal", async () => {
    navigation.lang = "ar";
    permissionState.granted = new Set([
      "students.records.manage",
      "students.enrollments.manage",
      "students.records.view",
      "settings.users.view",
    ]);
    const user = userEvent.setup();
    render(<StudentsList />);

    await user.click(screen.getByRole("button", { name: "التسجيل الجماعي" }));
    await user.click(screen.getByRole("button", { name: "بيانات الدخول" }));

    expect(navigation.push).toHaveBeenNthCalledWith(
      1,
      "/ar/students-guardians/bulk-registration",
    );
    expect(navigation.push).toHaveBeenNthCalledWith(
      2,
      "/ar/students-guardians/credentials",
    );
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

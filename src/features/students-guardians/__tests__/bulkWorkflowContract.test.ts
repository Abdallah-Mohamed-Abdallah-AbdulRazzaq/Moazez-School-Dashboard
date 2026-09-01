import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBoundary = vi.hoisted(() => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const reusedComponentProps = vi.hoisted(() => ({
  academicCascade: null as Record<string, unknown> | null,
  dragDropUpload: null as Record<string, unknown> | null,
  dataTable: null as Record<string, unknown> | null,
  confirmDialog: null as Record<string, unknown> | null,
  accessDenied: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/api", () => apiBoundary);
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isPermissionsReady: true,
    hasAllPermissions: () => false,
  }),
}));
vi.mock("@/components/ui", async () => {
  const React = await import("react");
  return {
    AccessDenied: (props: Record<string, unknown>) => {
      reusedComponentProps.accessDenied = props;
      return React.createElement("div", { "data-testid": "access-denied" });
    },
  };
});
vi.mock("@/components/ui/academic/AcademicStudentCascade", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      reusedComponentProps.academicCascade = props;
      return React.createElement("div", { "data-testid": "academic-cascade" });
    },
  };
});
vi.mock("@/components/ui/drag-drop-upload/DragDropUploadArea", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      reusedComponentProps.dragDropUpload = props;
      const selectFiles = props.onFilesSelected as (files: File[]) => void;
      return React.createElement(
        "div",
        { "data-testid": "drag-drop-upload" },
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () =>
              selectFiles([
                new File(["workbook"], "students.xlsx", {
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }),
              ]),
          },
          "Select XLSX",
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () =>
              selectFiles([
                new File(["workbook"], "students.xls", {
                  type: "application/vnd.ms-excel",
                }),
              ]),
          },
          "Select XLS",
        ),
      );
    },
  };
});
vi.mock("@/components/ui/data-table/DataTable", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      reusedComponentProps.dataTable = props;
      return React.createElement("div", { "data-testid": "data-table" });
    },
  };
});
vi.mock("@/components/ui/confirm-dialog/ConfirmDialog", async () => {
  const React = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      reusedComponentProps.confirmDialog = props;
      return props.isOpen
        ? React.createElement("div", { "data-testid": "confirm-dialog" })
        : null;
    },
  };
});

import {
  confirmBulkRegistration,
  createBulkRegistration,
  downloadBulkRegistrationTemplate,
  getBulkRegistrationBatch,
  listBulkRegistrationRows,
  preflightBulkRegistration,
} from "../bulk-registration/api/bulkRegistrationApi";
import {
  BULK_REGISTRATION_BATCH_STATUSES,
  BULK_REGISTRATION_ROW_STATUSES,
} from "../bulk-registration/model/bulkRegistrationModel";
import BulkRegistrationConfirmation from "../bulk-registration/components/BulkRegistrationConfirmation";
import BulkRegistrationPlacementForm from "../bulk-registration/components/BulkRegistrationPlacementForm";
import BulkRegistrationRowsTable from "../bulk-registration/components/BulkRegistrationRowsTable";
import BulkRegistrationUploadPanel, {
  BULK_REGISTRATION_FILE_ACCEPT,
  BULK_REGISTRATION_MAX_FILE_SIZE,
} from "../bulk-registration/components/BulkRegistrationUploadPanel";
import {
  createCredentialBatch,
  downloadCredentialBatch,
  getCredentialBatch,
  previewCredentialAudience,
} from "../credentials/api/credentialBatchApi";
import {
  CREDENTIAL_AUDIENCE_MODES,
  CREDENTIAL_MODES,
} from "../credentials/api/credentialBatchDtos";
import { CREDENTIAL_BATCH_STATUSES } from "../credentials/model/credentialBatchModel";
import StudentsGuardiansPermissionGuard from "../shared/components/StudentsGuardiansPermissionGuard";
import { studentsGuardiansCapabilityPermissions } from "../shared/permissions/studentsGuardiansCapabilities";

const placement = {
  academicYearId: "year-1",
  termId: "term-1",
  classroomId: "classroom-1",
  enrollmentDate: "2026-09-01",
};

function observedApiRequests(): Array<[string, string]> {
  return [
    ...apiBoundary.apiGet.mock.calls.map(([path]) => ["GET", path] as [string, string]),
    ...apiBoundary.apiPost.mock.calls.map(([path]) => ["POST", path] as [string, string]),
    ...apiBoundary.apiClient.get.mock.calls.map(
      ([path]) => ["GET", path] as [string, string],
    ),
    ...apiBoundary.apiClient.post.mock.calls.map(
      ([path]) => ["POST", path] as [string, string],
    ),
  ].sort(([leftMethod, leftPath], [rightMethod, rightPath]) =>
    `${leftMethod} ${leftPath}`.localeCompare(`${rightMethod} ${rightPath}`),
  );
}

describe("student bulk workflow contract", () => {
  const createObjectUrl = vi.fn(() => "blob:bulk-workflow");
  const revokeObjectUrl = vi.fn();

  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiBoundary.apiGet.mockResolvedValue({ id: "batch-1" });
    apiBoundary.apiPost.mockResolvedValue({ id: "batch-1" });
    apiBoundary.apiClient.post.mockResolvedValue({ data: { id: "batch-1" } });
    reusedComponentProps.academicCascade = null;
    reusedComponentProps.dragDropUpload = null;
    reusedComponentProps.dataTable = null;
    reusedComponentProps.confirmDialog = null;
    reusedComponentProps.accessDenied = null;
  });

  afterEach(cleanup);

  afterAll(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
    vi.restoreAllMocks();
  });

  it("keeps the ten backend methods and paths exact without collection or per-student calls", async () => {
    const templateBlob = new Blob(["template bytes"], { type: "text/csv" });
    const exportBlob = new Blob(["credential bytes"], { type: "text/csv" });
    apiBoundary.apiClient.get
      .mockResolvedValueOnce({ data: templateBlob, headers: {} })
      .mockResolvedValueOnce({ data: exportBlob, headers: {} });
    const administratorPassword = "  F2Admin!Pass123  ";

    await preflightBulkRegistration(placement);
    await downloadBulkRegistrationTemplate();
    await createBulkRegistration(
      placement,
      new File(["student rows"], "students.csv", { type: "text/csv" }),
    );
    await getBulkRegistrationBatch("registration-1");
    await listBulkRegistrationRows("registration-1", {
      page: 1,
      limit: 50,
      status: "INVALID",
    });
    await confirmBulkRegistration("registration-1");
    await previewCredentialAudience({ audienceMode: "missing_password" });
    await createCredentialBatch({
      audience: { audienceMode: "missing_password" },
      credentialMode: "shared_admin_provided",
      sharedPassword: administratorPassword,
    });
    await getCredentialBatch("credentials-1");
    await downloadCredentialBatch("credentials-1");

    expect(observedApiRequests()).toEqual(
      [
        ["GET", "/students-guardians/bulk-registrations/registration-1"],
        [
          "GET",
          "/students-guardians/bulk-registrations/registration-1/rows?page=1&limit=50&status=INVALID",
        ],
        ["GET", "/students-guardians/bulk-registrations/template"],
        ["GET", "/students-guardians/credential-batches/credentials-1"],
        ["GET", "/students-guardians/credential-batches/credentials-1/export"],
        ["POST", "/students-guardians/bulk-registrations"],
        ["POST", "/students-guardians/bulk-registrations/preflight"],
        ["POST", "/students-guardians/bulk-registrations/registration-1/confirm"],
        ["POST", "/students-guardians/credential-batches"],
        ["POST", "/students-guardians/credential-batches/preview"],
      ].sort(([leftMethod, leftPath], [rightMethod, rightPath]) =>
        `${leftMethod} ${leftPath}`.localeCompare(`${rightMethod} ${rightPath}`),
      ),
    );
    expect(createObjectUrl.mock.calls.map(([blob]) => blob)).toEqual([
      templateBlob,
      exportBlob,
    ]);
    expect(JSON.stringify(observedApiRequests())).not.toContain(
      administratorPassword,
    );
  });

  it("pins audience, credential, and status casing", () => {
    expect(CREDENTIAL_AUDIENCE_MODES).toEqual([
      "import_batch",
      "selected_students",
      "academic_year",
      "stage",
      "grade",
      "section",
      "classroom",
      "missing_password",
    ]);
    expect(CREDENTIAL_MODES).toEqual([
      "unique_generated",
      "shared_temporary",
      "shared_admin_provided",
    ]);
    expect(BULK_REGISTRATION_BATCH_STATUSES).toEqual([
      "UPLOADED",
      "VALIDATING",
      "VALIDATION_FAILED",
      "READY",
      "EXECUTING",
      "EXECUTION_PARTIAL_FAILED",
      "FAILED",
      "COMPLETED",
    ]);
    expect(BULK_REGISTRATION_ROW_STATUSES).toEqual([
      "PENDING",
      "VALID",
      "INVALID",
      "PROCESSING",
      "CREATED",
      "FAILED",
    ]);
    expect(CREDENTIAL_BATCH_STATUSES).toEqual([
      "pending",
      "processing",
      "completed",
      "partial_failed",
      "failed",
    ]);
  });

  it("pins the workflow permission tuples", () => {
    expect(studentsGuardiansCapabilityPermissions.canBulkRegisterStudents).toEqual([
      "students.records.manage",
      "students.enrollments.manage",
    ]);
    expect(
      studentsGuardiansCapabilityPermissions.canViewStudentCredentialBatches,
    ).toEqual(["students.records.view", "settings.users.view"]);
    expect(
      studentsGuardiansCapabilityPermissions.canManageStudentCredentialBatches,
    ).toEqual(["students.records.view", "settings.users.manage"]);
  });

  it.each(["Select XLSX", "Select XLS"])(
    "keeps upload CSV-only when a user chooses %s",
    (selectionAction) => {
      const onFileChange = vi.fn();
      render(
        createElement(BulkRegistrationUploadPanel, {
          enabled: true,
          selectedFile: null,
          downloadingTemplate: false,
          uploading: false,
          onDownloadTemplate: vi.fn(),
          onFileChange,
          onUpload: vi.fn(),
        }),
      );

      expect(reusedComponentProps.dragDropUpload).toMatchObject({
        accept: BULK_REGISTRATION_FILE_ACCEPT,
        maxSizeBytes: BULK_REGISTRATION_MAX_FILE_SIZE,
        multiple: false,
      });
      expect(BULK_REGISTRATION_FILE_ACCEPT).toBe(
        ".csv,text/csv,application/vnd.ms-excel",
      );
      expect(BULK_REGISTRATION_MAX_FILE_SIZE).toBe(10 * 1024 * 1024);

      fireEvent.click(screen.getByRole("button", { name: selectionAction }));
      expect(onFileChange).toHaveBeenCalledWith(null);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Only CSV files are allowed.",
      );
    },
  );

  it("reuses the academic cascade without its student selector", () => {
    render(
      createElement(BulkRegistrationPlacementForm, {
        placement: {
          academicYearId: "",
          termId: "",
          academic: {},
          enrollmentDate: null,
        },
        academicYears: [],
        terms: [],
        academicOptions: {},
        loadingOptions: false,
        checkingPlacement: false,
        onChange: vi.fn(),
        onCheckPlacement: vi.fn(),
      }),
    );

    expect(screen.getByTestId("academic-cascade")).toBeInTheDocument();
    expect(reusedComponentProps.academicCascade).toMatchObject({
      showStudent: false,
    });
  });

  it("reuses DataTable server pagination for registration rows", () => {
    render(
      createElement(BulkRegistrationRowsTable, {
        rows: [],
        page: 2,
        limit: 50,
        total: 120,
        status: undefined,
        loading: false,
        loadFailed: false,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
        onStatusChange: vi.fn(),
        onRetry: vi.fn(),
        onOpenStudent: vi.fn(),
      }),
    );

    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(reusedComponentProps.dataTable).toMatchObject({
      serverPagination: {
        enabled: true,
        currentPage: 2,
        pageSize: 50,
        totalItems: 120,
      },
    });
  });

  it("reuses ConfirmDialog for the authoritative READY action", () => {
    render(
      createElement(BulkRegistrationConfirmation, {
        batch: {
          id: "batch-1",
          sourceImportJobId: "import-1",
          status: "READY",
          templateVersion: 1,
          placement: {
            academicYearId: "year-1",
            termId: null,
            classroomId: "classroom-1",
            enrollmentDate: "2026-09-01",
          },
          counters: {
            totalRows: 10,
            validRows: 8,
            invalidRows: 2,
            createdRows: 0,
            failedRows: 0,
          },
          createdAt: "2026-08-31T08:00:00.000Z",
          updatedAt: "2026-08-31T08:01:00.000Z",
          validatedAt: "2026-08-31T08:01:00.000Z",
          startedAt: null,
          completedAt: null,
          validationErrors: [],
        },
        placementLabel: "Classroom 1",
        fresh: true,
        loading: false,
        onConfirm: vi.fn(),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm registration" }));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(reusedComponentProps.confirmDialog).toMatchObject({
      isOpen: true,
      severity: "warning",
      title: "Create student records?",
    });
  });

  it("reuses AccessDenied with the exact route permissions", () => {
    const permissions = [
      "students.records.view",
      "settings.users.view",
    ] as const;
    render(
      createElement(
        StudentsGuardiansPermissionGuard,
        { permissions: [...permissions] },
        createElement("div", null, "protected workflow"),
      ),
    );

    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
    expect(reusedComponentProps.accessDenied).toMatchObject({
      requiredPermissions: permissions,
    });
  });
});

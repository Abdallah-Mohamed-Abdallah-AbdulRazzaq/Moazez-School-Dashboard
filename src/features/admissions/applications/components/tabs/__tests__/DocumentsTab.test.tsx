import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DocumentsTab from "@/features/admissions/applications/components/tabs/DocumentsTab";
import type { Application, Document } from "@/features/admissions/types/admissions";
import { ApiError } from "@/lib/api-error";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    ({
      "documents.empty":
        "No documents have been submitted for this application yet.",
      "documents.actions.view": "View document",
      "documents.actions.download": "Download document",
      "documents.actions.remove": "Remove document",
      "documents.review.accept": "Accept",
      "documents.review.reject": "Reject",
      "documents.review.request_replacement": "Request replacement",
      "documents.review.accept_title": "Accept document",
      "documents.review.reject_title": "Reject document",
      "documents.review.request_replacement_title": "Request replacement",
      "documents.review.title": "Review document",
      "documents.review.submit": "Submit review",
      "documents.review.cancel": "Cancel",
      "documents.review.note": "Note",
      "documents.review.optional": "optional",
      "documents.review.required_note": "Please enter a note before submitting.",
      "documents.review.optional_note": "Add a note",
      "documents.review.approval_note": "Add an optional note for this approval.",
      "documents.review.rejection_note":
        "Enter the reason this document is being rejected.",
      "documents.review.replacement_note":
        "Enter what the applicant needs to replace or fix.",
      "documents.review.replacement_notice":
        "The applicant may need to upload a new document after this action.",
      "documents.status_pending_review":
        "This document was submitted by the applicant and is waiting for school review.",
      "documents.status_complete":
        "This document has been accepted by the school.",
      "documents.status_missing":
        "This document is missing or requires applicant action.",
      "documents.errors.review_success": "Document review updated.",
      "documents.errors.review_permission":
        "You do not have permission to review this document.",
      "documents.errors.not_found":
        "This application or document could not be found.",
      "documents.errors.already_reviewed":
        "This document has already been reviewed or is no longer pending review.",
      "documents.errors.invalid_review_note":
        "Please check the review note and try again.",
    })[key] ?? key,
}));

const serviceMocks = vi.hoisted(() => ({
  acceptApplicationDocument: vi.fn(),
  createApplicationDocument: vi.fn(),
  fetchApplicationDocuments: vi.fn(),
  rejectApplicationDocument: vi.fn(),
  requestApplicationDocumentReplacement: vi.fn(),
  uploadAdmissionsFile: vi.fn(),
}));

const settingsMocks = vi.hoisted(() => ({
  fetchAdmissionRequiredDocumentsForSchool: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

const fileServiceMocks = vi.hoisted(() => ({
  downloadFileBlob: vi.fn(),
}));

vi.mock("@/services/filesService", () => fileServiceMocks);

const permissionMocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
}));

vi.mock(
  "@/features/admissions/applications/services/applicationDocumentsApiService",
  () => serviceMocks,
);

vi.mock("@/features/settings/services/settingsService", () => settingsMocks);

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { activeMembership: { schoolId: "school-1" } },
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showToast: toastMocks.showToast,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionMocks.permissions.has(permission),
  }),
}));

const applicationDocuments: Document[] = [
  {
    id: "doc-pending",
    type: "passport",
    name: "passport.pdf",
    labelEn: "Pending document",
    status: "pending_review",
    canReview: true,
    fileId: "file-pending",
    fileType: "pdf",
  },
  {
    id: "doc-complete",
    type: "birth_certificate",
    name: "birth.pdf",
    labelEn: "Complete document",
    status: "complete",
    fileId: "file-complete",
    fileType: "pdf",
  },
  {
    id: "doc-missing",
    type: "medical_report",
    name: "medical.pdf",
    labelEn: "Missing document",
    status: "missing",
    fileId: "file-missing",
    fileType: "pdf",
  },
];

const application = {
  id: "app-1",
  status: "documents_pending",
  documents: applicationDocuments,
  full_name_ar: "Student",
  full_name_en: "Student",
  studentName: "Student",
  gender: "N/A",
  date_of_birth: "2018-01-01",
  nationality: "N/A",
  grade_requested: "Grade 1",
  gradeRequested: "Grade 1",
  guardians: [],
  guardianName: "Guardian",
  guardianPhone: "123",
  guardianEmail: "guardian@example.com",
  submittedDate: "2026-01-01T00:00:00.000Z",
  tests: [],
  interviews: [],
} as Application;

function renderDocumentsTab() {
  serviceMocks.fetchApplicationDocuments.mockResolvedValue(applicationDocuments);
  return render(<DocumentsTab application={application} />);
}

function renderDocumentsTabWithDocuments(documents: Document[]) {
  serviceMocks.fetchApplicationDocuments.mockResolvedValue(documents);
  return render(
    <DocumentsTab
      application={{
        ...application,
        documents,
      }}
    />,
  );
}

describe("DocumentsTab review actions", () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mock) => mock.mockReset());
    settingsMocks.fetchAdmissionRequiredDocumentsForSchool
      .mockReset()
      .mockResolvedValue([]);
    toastMocks.showToast.mockReset();
    permissionMocks.permissions = new Set([
      "admissions.documents.view",
      "admissions.documents.manage",
      "files.uploads.manage",
    ]);
    fileServiceMocks.downloadFileBlob.mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:authenticated-document"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("opens a protected document through an authenticated blob", async () => {
    const user = userEvent.setup();
    fileServiceMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["pdf"], { type: "application/pdf" }),
    );
    renderDocumentsTab();

    await user.click((await screen.findAllByTitle("View document"))[0]);

    expect(await screen.findByTitle("passport.pdf")).toHaveAttribute(
      "src",
      "blob:authenticated-document",
    );
    expect(fileServiceMocks.downloadFileBlob).toHaveBeenCalledWith(
      "file-pending",
    );
  });

  it("downloads a protected document without navigating to its API URL", async () => {
    const user = userEvent.setup();
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    fileServiceMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["pdf"], { type: "application/pdf" }),
    );
    renderDocumentsTab();

    await user.click((await screen.findAllByTitle("Download document"))[0]);

    await waitFor(() => expect(anchorClick).toHaveBeenCalledOnce());
    expect(fileServiceMocks.downloadFileBlob).toHaveBeenCalledWith(
      "file-pending",
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:authenticated-document",
    );
    anchorClick.mockRestore();
  });

  it("shows review actions only for pending review documents", async () => {
    renderDocumentsTab();

    expect(await screen.findByText("Pending document")).toBeInTheDocument();
    expect(await screen.findByText("Complete document")).toBeInTheDocument();
    expect(await screen.findByText("Missing document")).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "Accept" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Reject" })).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Request replacement" }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "View document" })).toHaveLength(3);
    expect(
      screen.getByText(
        "This document was submitted by the applicant and is waiting for school review.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This document has been accepted by the school."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This document is missing or requires applicant action.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a bridged document with an unfamiliar document type", async () => {
    renderDocumentsTabWithDocuments([
      {
        id: "doc-portal-custom",
        type: "Applicant Portfolio Evidence",
        name: "portfolio.pdf",
        labelEn: "Applicant Portfolio Evidence",
        status: "pending_review",
        fileId: "file-portal-custom",
        fileType: "pdf",
      },
    ]);

    expect(
      await screen.findByText("Applicant Portfolio Evidence"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This document was submitted by the applicant and is waiting for school review.",
      ),
    ).toBeInTheDocument();
  });

  it("requires notes for reject and replacement actions", async () => {
    const user = userEvent.setup();
    renderDocumentsTab();

    await user.click(await screen.findByRole("button", { name: "Reject" }));
    expect(
      screen.getByText(
        "The applicant may need to upload a new document after this action.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Please enter a note before submitting.",
      "error",
    );
    expect(serviceMocks.rejectApplicationDocument).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Request replacement" }));
    expect(
      screen.getByText(
        "The applicant may need to upload a new document after this action.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Please enter a note before submitting.",
      "error",
    );
    expect(
      serviceMocks.requestApplicationDocumentReplacement,
    ).not.toHaveBeenCalled();
  });

  it("accepts a pending document without a note and refreshes documents", async () => {
    const user = userEvent.setup();
    serviceMocks.acceptApplicationDocument.mockResolvedValue({});
    renderDocumentsTab();

    await user.click(await screen.findByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    await waitFor(() => {
      expect(serviceMocks.acceptApplicationDocument).toHaveBeenCalledWith(
        "app-1",
        "doc-pending",
        undefined,
      );
    });
    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Document review updated.",
      "success",
    );
    expect(serviceMocks.fetchApplicationDocuments).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "Reject",
      "Needs updated scan",
      serviceMocks.rejectApplicationDocument,
    ],
    [
      "Request replacement",
      "Please upload a clearer file",
      serviceMocks.requestApplicationDocumentReplacement,
    ],
  ])("submits %s with a required note and refreshes documents", async (
    actionLabel,
    note,
    actionMock,
  ) => {
    const user = userEvent.setup();
    actionMock.mockResolvedValue({});
    renderDocumentsTab();

    await user.click(await screen.findByRole("button", { name: actionLabel }));
    await user.type(screen.getByLabelText(/^Note/), note);
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    await waitFor(() => {
      expect(actionMock).toHaveBeenCalledWith("app-1", "doc-pending", note);
    });
    expect(toastMocks.showToast).toHaveBeenCalledWith(
      "Document review updated.",
      "success",
    );
    expect(serviceMocks.fetchApplicationDocuments).toHaveBeenCalledTimes(2);
  });

  it("keeps the submit button disabled while a review action is saving", async () => {
    const user = userEvent.setup();
    let finishAcceptReview!: () => void;
    serviceMocks.acceptApplicationDocument.mockReturnValue(
      new Promise<void>((resolve) => {
        finishAcceptReview = resolve;
      }),
    );
    renderDocumentsTab();

    await user.click(await screen.findByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    expect(screen.getByRole("button", { name: "Submit review" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Submit review" }));
    expect(serviceMocks.acceptApplicationDocument).toHaveBeenCalledTimes(1);

    finishAcceptReview();
    await waitFor(() => {
      expect(toastMocks.showToast).toHaveBeenCalledWith(
        "Document review updated.",
        "success",
      );
    });
  });

  it("hides document management actions when the user can only view documents", async () => {
    permissionMocks.permissions = new Set(["admissions.documents.view"]);
    renderDocumentsTab();

    expect(await screen.findByText("Pending document")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request replacement" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTitle("Remove document")).not.toBeInTheDocument();
  });

  it("hides documents when the user lacks document view permission", () => {
    permissionMocks.permissions = new Set([]);
    renderDocumentsTab();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(serviceMocks.fetchApplicationDocuments).not.toHaveBeenCalled();
    expect(screen.queryByText("Pending document")).not.toBeInTheDocument();
  });

  it("shows a clear empty state when no documents have been submitted", async () => {
    renderDocumentsTabWithDocuments([]);

    expect(
      await screen.findByText(
        "No documents have been submitted for this application yet.",
      ),
    ).toBeInTheDocument();
  });

  it("uses configured admissions document requirements as upload type choices", async () => {
    const user = userEvent.setup();
    settingsMocks.fetchAdmissionRequiredDocumentsForSchool.mockResolvedValue([
      {
        id: "birth-certificate",
        title: "Configured Birth Certificate",
        description: "",
        isMandatory: true,
        acceptedFileTypes: ["application/pdf"],
        maxFiles: 1,
        nameEn: "Configured Birth Certificate",
        nameAr: "شهادة ميلاد",
        required: true,
        active: true,
        sortOrder: 1,
      },
      {
        id: "inactive-passport",
        title: "Inactive Passport",
        description: "",
        isMandatory: false,
        acceptedFileTypes: [],
        maxFiles: 1,
        nameEn: "Inactive Passport",
        nameAr: "جواز سفر",
        required: false,
        active: false,
        sortOrder: 2,
      },
    ]);
    renderDocumentsTab();

    await user.click(await screen.findByRole("button", { name: "documents.add" }));

    expect(screen.getByText("Configured Birth Certificate")).toBeInTheDocument();
    expect(screen.getByText("Inactive Passport")).toBeInTheDocument();
    expect(screen.queryByText("Passport Copy")).not.toBeInTheDocument();
    expect(
      settingsMocks.fetchAdmissionRequiredDocumentsForSchool,
    ).toHaveBeenCalledWith("school-1");
  });

  it("revalidates empty initial documents from the Admissions API on entry", async () => {
    serviceMocks.fetchApplicationDocuments.mockResolvedValue(applicationDocuments);
    render(
      <DocumentsTab
        application={{ ...application, documents: [] }}
        initialDocuments={[]}
      />,
    );

    expect(await screen.findByText("Pending document")).toBeInTheDocument();
    expect(serviceMocks.fetchApplicationDocuments).toHaveBeenCalledWith("app-1");
  });

  it.each([
    [403, "You do not have permission to review this document."],
    [404, "This application or document could not be found."],
    [409, "This document has already been reviewed or is no longer pending review."],
    [422, "Please check the review note and try again."],
  ])("shows a friendly review error for HTTP %s", async (status, message) => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    serviceMocks.acceptApplicationDocument.mockRejectedValue(
      new ApiError("Review failed", status, "REVIEW_FAILED"),
    );
    try {
      renderDocumentsTab();

      await user.click(await screen.findByRole("button", { name: "Accept" }));
      await user.click(screen.getByRole("button", { name: "Submit review" }));

      await waitFor(() => {
        expect(toastMocks.showToast).toHaveBeenCalledWith(
          message,
          "error",
        );
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

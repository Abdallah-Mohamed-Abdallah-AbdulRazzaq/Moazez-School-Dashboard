import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import DocumentsTab from "@/features/students-guardians/students/components/tabs/DocumentsTab";
import { renderWithPermissions } from "@/__tests__/test-utils/renderWithPermissions";

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  apiDelete: apiMocks.apiDelete,
  apiGet: apiMocks.apiGet,
  apiPost: apiMocks.apiPost,
}));

const studentDocument = {
  id: "document-1",
  studentId: "student-1",
  type: "Passport",
  name: "passport.pdf",
  status: "complete",
  fileId: "file-1",
  uploadedDate: "2026-07-01T00:00:00.000Z",
};

const applicationDocument = {
  id: "application-document-1",
  applicationId: "application-1",
  fileId: "application-file-1",
  documentType: "Birth Certificate",
  status: "complete",
  source: "staff_upload",
  canReview: false,
  reviewEligibility: {
    canAccept: false,
    canReject: false,
    canRequestReplacement: false,
    reason: "document_not_pending_review",
  },
  linkedApplicantDocument: null,
  notes: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  file: {
    id: "application-file-1",
    originalName: "birth-certificate.pdf",
    mimeType: "application/pdf",
    sizeBytes: "1000",
    visibility: "private",
  },
};

const renderDocumentsTab = () =>
  renderWithPermissions(
    <ToastProvider>
      <DocumentsTab
        student={
          {
            id: "student-1",
            applicationId: "application-1",
          } as never
        }
      />
    </ToastProvider>,
    ["students.documents.manage", "admissions.documents.view"],
  );

describe("DocumentsTab", () => {
  beforeEach(() => {
    apiMocks.apiDelete.mockReset().mockResolvedValue({ ok: true });
    apiMocks.apiPost.mockReset().mockResolvedValue({
      studentId: "student-1",
      applicationId: "application-1",
      imported: [],
      skipped: [],
      warnings: [],
    });
    apiMocks.apiGet.mockReset().mockImplementation((path: string) => {
      if (path === "/admissions/applications/application-1/documents") {
        return Promise.resolve([applicationDocument]);
      }
      if (path.endsWith("/documents/missing")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([studentDocument]);
    });
  });

  it("imports selected documents from the student's admissions application", async () => {
    const user = userEvent.setup();
    renderDocumentsTab();

    await user.click(
      await screen.findByRole("button", { name: "import_from_admissions" }),
    );
    await user.click(
      await screen.findByRole("checkbox", { name: /Birth Certificate/ }),
    );
    await user.click(screen.getByRole("button", { name: "import_selected" }));

    await waitFor(() =>
      expect(apiMocks.apiPost).toHaveBeenCalledWith(
        "/students-guardians/students/student-1/documents/import-from-application",
        {
          applicationId: "application-1",
          applicationDocumentIds: ["application-document-1"],
        },
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "import_success",
    );
  });

  it("confirms before deleting a student document", async () => {
    const user = userEvent.setup();
    renderDocumentsTab();

    await user.click(await screen.findByTitle("delete"));
    await user.click(screen.getByRole("button", { name: "confirm_delete" }));

    await waitFor(() =>
      expect(apiMocks.apiDelete).toHaveBeenCalledWith(
        "/students-guardians/documents/document-1",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "delete_success",
    );
  });
});

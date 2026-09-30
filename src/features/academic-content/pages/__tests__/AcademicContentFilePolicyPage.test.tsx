import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademicContentFilePolicyPage from "../AcademicContentFilePolicyPage";

const mocks = vi.hoisted(() => ({
  canManage: true,
  getAcademicContentFilePolicy: vi.fn(),
  updateAcademicContentFilePolicy: vi.fn(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permission === "academics.academic_content.view" || mocks.canManage,
    isPermissionsReady: true,
  }),
}));

vi.mock("../../services/academicContentApi", () => ({
  getAcademicContentFilePolicy: mocks.getAcademicContentFilePolicy,
  updateAcademicContentFilePolicy: mocks.updateAcademicContentFilePolicy,
}));

const policy = {
  attachmentsEnabled: true,
  maximumFileSizeBytes: "536870912",
  documentsEnabled: true,
  imagesEnabled: true,
  videosEnabled: true,
  audioEnabled: true,
  archivesEnabled: false,
  otherFilesEnabled: false,
  allowStudentDownload: true,
  allowGuardianDownload: true,
  allowInlinePreview: true,
};

describe("AcademicContentFilePolicyPage", () => {
  beforeEach(() => {
    mocks.canManage = true;
    mocks.getAcademicContentFilePolicy.mockReset().mockResolvedValue(policy);
    mocks.updateAcademicContentFilePolicy.mockReset().mockResolvedValue(policy);
  });

  it("sends only changed decimal-string and boolean fields", async () => {
    render(<AcademicContentFilePolicyPage />);
    await screen.findByDisplayValue("536870912");

    fireEvent.change(screen.getByLabelText("Maximum file size in bytes"), {
      target: { value: "10737418240" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Save file policy" }));

    await waitFor(() =>
      expect(mocks.updateAcademicContentFilePolicy).toHaveBeenCalledWith({
        maximumFileSizeBytes: "10737418240",
        documentsEnabled: false,
      }),
    );
  });

  it("keeps policy visible but read-only without settings permission", async () => {
    mocks.canManage = false;
    render(<AcademicContentFilePolicyPage />);

    expect(await screen.findByRole("checkbox", { name: "Attachments" })).toBeDisabled();
    expect(screen.getByLabelText("Maximum file size in bytes")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save file policy" })).not.toBeInTheDocument();
  });

  it("renders every backend policy switch", async () => {
    render(<AcademicContentFilePolicyPage />);
    await screen.findByDisplayValue("536870912");

    for (const label of [
      "Attachments",
      "Documents",
      "Images",
      "Videos",
      "Audio",
      "Archives",
      "Other files",
      "Student downloads",
      "Guardian downloads",
      "Inline preview",
    ]) {
      expect(screen.getByRole("checkbox", { name: label })).toBeInTheDocument();
    }
  });

  it("rejects values above the 10 GiB hard maximum", async () => {
    render(<AcademicContentFilePolicyPage />);
    await screen.findByDisplayValue("536870912");

    fireEvent.change(screen.getByLabelText("Maximum file size in bytes"), {
      target: { value: "10737418241" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save file policy" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("10 GiB");
    expect(mocks.updateAcademicContentFilePolicy).not.toHaveBeenCalled();
  });
});

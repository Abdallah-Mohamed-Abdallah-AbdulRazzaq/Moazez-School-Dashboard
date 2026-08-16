import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApplicationIntake } from "../applicationIntakeService";
import { createApplication } from "../applicationsApiService";
import {
  createApplicationDocument,
  uploadAdmissionsFile,
} from "../applicationDocumentsApiService";

vi.mock("../applicationsApiService", () => ({
  createApplication: vi.fn(),
}));

vi.mock("../applicationDocumentsApiService", () => ({
  createApplicationDocument: vi.fn(),
  uploadAdmissionsFile: vi.fn(),
}));

const payload = {
  source: "other",
  requestedAcademicYearId: "year-1",
  student: {
    first_name_ar: "",
    father_name_ar: "",
    grandfather_name_ar: "",
    family_name_ar: "",
    first_name_en: "Omar",
    father_name_en: "",
    grandfather_name_en: "",
    family_name_en: "",
    full_name_ar: "",
    full_name_en: "Omar",
    gender: "",
    date_of_birth: "",
    nationality: "",
    stage: "",
    grade_requested: "grade-1",
    section: "",
    address_line: "",
    city: "",
    district: "",
    status: "pending",
    join_date: "2026-07-25",
    notes: "",
    previous_school: "",
    medical_conditions: "",
  },
  guardians: [],
  documents: [
    {
      configId: "passport",
      labelEn: "Passport",
      labelAr: "Passport",
      required: true,
      uploaded: true,
      file: new File(["passport"], "passport.pdf", {
        type: "application/pdf",
      }),
    },
    {
      configId: "photo",
      labelEn: "Photo",
      labelAr: "Photo",
      required: false,
      uploaded: true,
      file: new File(["photo"], "photo.png", { type: "image/png" }),
    },
  ],
};

describe("createApplicationIntake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createApplication).mockResolvedValue({
      id: "app-1",
      studentName: "Omar",
      status: "documents_pending",
    } as never);
    vi.mocked(uploadAdmissionsFile)
      .mockResolvedValueOnce("file-1")
      .mockResolvedValueOnce("file-2");
    vi.mocked(createApplicationDocument).mockResolvedValue({} as never);
  });

  it("creates the application once and links every selected document", async () => {
    const result = await createApplicationIntake(payload);

    expect(createApplication).toHaveBeenCalledTimes(1);
    expect(createApplicationDocument).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      application: { id: "app-1" },
      failedDocumentLabels: [],
    });
  });

  it("keeps the created application and reports every failed document", async () => {
    vi.mocked(uploadAdmissionsFile)
      .mockReset()
      .mockRejectedValueOnce(new Error("upload failed"))
      .mockResolvedValueOnce("file-2");
    vi.mocked(createApplicationDocument).mockRejectedValueOnce(
      new Error("link failed"),
    );

    const result = await createApplicationIntake(payload);

    expect(createApplication).toHaveBeenCalledTimes(1);
    expect(result.application.id).toBe("app-1");
    expect(result.failedDocumentLabels).toEqual(["Passport", "Photo"]);
  });
});

import type { Application } from "@/features/admissions/types/admissions";
import type { ApplicationCreationPayload } from "./applicationCreationService";
import { createApplication } from "./applicationsApiService";
import {
  createApplicationDocument,
  uploadAdmissionsFile,
} from "./applicationDocumentsApiService";

export interface ApplicationIntakeResult {
  application: Application;
  failedDocumentLabels: string[];
}

export async function createApplicationIntake(
  payload: ApplicationCreationPayload,
): Promise<ApplicationIntakeResult> {
  const application = await createApplication(payload);
  const failedDocumentLabels: string[] = [];
  const selectedDocuments = payload.documents.filter(
    (document) => document.uploaded && document.file,
  );

  for (const document of selectedDocuments) {
    try {
      const fileId = await uploadAdmissionsFile(document.file as File);
      await createApplicationDocument(application.id, {
        fileId,
        documentType: document.labelEn,
        status: "complete",
      });
    } catch {
      failedDocumentLabels.push(document.labelEn);
    }
  }

  return { application, failedDocumentLabels };
}

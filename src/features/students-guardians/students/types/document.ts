// FILE: src/types/students/document.ts
// Student document model

import type { DocumentStatus } from "./enums";

/**
 * Student Document
 * Represents a document associated with a student
 */
export interface StudentDocument {
  id: string; // Document ID: "SDOC-" + original doc.id
  studentId: string; // Student this document belongs to
  type: string; // Document type (Birth Certificate, Passport, etc.)
  name: string; // File name
  status: DocumentStatus; // Document status (complete, missing)
  fileId?: string; // Backing file id used for secure view/download
  uploadedDate?: string; // When the document was uploaded (ISO date string)
}

// Backward compatibility alias

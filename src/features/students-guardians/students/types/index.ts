// FILE: src/types/students/index.ts
// Main exports for students module

// ============================================================================
// ENUMS & STATUS TYPES
// ============================================================================
export type {
  StudentStatus,
  RiskFlag,
  DocumentStatus,
  TimelineEventType,
} from "./enums";

// ============================================================================
// MODELS
// ============================================================================

// Student
export type {
  Student,
  StudentContact,
  UpdateStudentPayload,
} from "./student";

// Guardian
export type {
  StudentGuardian,
  StudentGuardianLink,
} from "./guardian";

// Document
export type { StudentDocument } from "./document";

// Medical
export type { StudentMedicalProfile } from "./medical";

// Note
export type {
  StudentNote,
  CreateStudentNotePayload,
  NoteCategory,
  NoteVisibility,
  StudentXpEvent,
  StudentXpSummary,
} from "./note";

// Timeline
export type { StudentTimelineEvent } from "./timeline";

// Enrollment (ERP)
export type {
  StudentEnrollment,
  EnrollmentTerm,
  EnrollmentMovement,
  EnrollmentMovementAction,
  ClassTeacherAssignment,
  SubjectTeacherAssignment,
} from "./enrollment";

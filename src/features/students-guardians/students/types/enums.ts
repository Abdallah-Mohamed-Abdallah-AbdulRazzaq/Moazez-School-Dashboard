// FILE: src/types/students/enums.ts
// Student module enums and status types

/**
 * Student Status
 * Represents the current enrollment status of a student
 */
export type StudentStatus =
  | "Active" // Currently enrolled and attending
  | "Suspended" // Temporarily suspended
  | "Withdrawn"; // No longer enrolled

/**
 * Risk Flag
 * Indicators that a student may need additional support or intervention
 */
export type RiskFlag =
  | "attendance" // Poor attendance record
  | "grades" // Below-average academic performance
  | "behavior"; // Behavioral issues

/**
 * Document Status
 * Status of a student document
 */
export type DocumentStatus =
  | "complete" // Document uploaded and verified
  | "missing"; // Document not yet provided

/**
 * Timeline Event Type
 * Types of events that can occur in a student's timeline
 */
export type TimelineEventType =
  | "application_submitted" // Application was submitted
  | "document_uploaded" // A document was uploaded
  | "test_scheduled" // Placement test scheduled
  | "test_completed" // Placement test completed
  | "interview_scheduled" // Interview scheduled
  | "interview_completed" // Interview completed
  | "decision_made"; // Admission decision made

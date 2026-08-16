// FILE: src/types/admissions/enums.ts
// Admissions enums and status types

// Lead Types
export type LeadChannel = "In-app" | "Referral" | "Walk-in" | "Other";

export type LeadStatus = "New" | "Contacted" | "Converted" | "Closed";

// Application Types
export type ApplicationStatus =
  | "submitted"
  | "documents_pending"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "rejected";

export type TestStatus =
  | "scheduled"
  | "completed"
  | "failed"
  | "cancelled"
  | "rescheduled";

export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type DecisionType = "accept" | "waitlist" | "reject";

export type DocumentStatus = "pending_review" | "complete" | "missing";

export type ApplicationSource = "in_app" | "referral" | "walk_in" | "other";

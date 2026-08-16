// FILE: src/types/leads.ts
// Backward compatibility - re-exports from admissions module
// @deprecated - Import from "@/types/admissions" instead

// Re-export all lead types from the admissions module
export type {
  Lead,
  LeadChannel,
  LeadStatus,
  ApplicationDraft,
} from "./admissions";

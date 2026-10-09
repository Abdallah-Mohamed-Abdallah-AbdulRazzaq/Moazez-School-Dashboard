import type {
  AcademicContentGuardianNoteDetail,
  ReplaceAcademicContentGuardianNoteDetailRequest,
} from "../types/contracts";

export const GUARDIAN_NOTE_PANELS = [
  "details",
  "targets",
  "resources",
  "readiness",
  "publication",
  "revisions",
] as const;

export type GuardianNotePanel = (typeof GUARDIAN_NOTE_PANELS)[number];

export function emptyGuardianNoteDetail(): AcademicContentGuardianNoteDetail {
  return {
    body: "",
    priority: "NORMAL",
    requiresAcknowledgement: false,
  };
}

export function normalizeGuardianNoteDetail(
  detail: AcademicContentGuardianNoteDetail,
): ReplaceAcademicContentGuardianNoteDetailRequest {
  return { ...detail, body: detail.body.trim() };
}

export function isGuardianNoteBodyValid(body: string): boolean {
  return body.trim().length > 0;
}

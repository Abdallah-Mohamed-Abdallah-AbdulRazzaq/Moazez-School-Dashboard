// FILE: src/types/admissions/decision.ts
// Decision model

import type { DecisionType } from "@/features/admissions/types/enums";

export interface Decision {
  id: string;
  applicationId: string;
  studentName?: string;
  decision: DecisionType;
  reason: string;
  decisionDate: string;
  decidedBy: string;
  applicationStatus?: string;
}

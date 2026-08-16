import type { ExamScopeType } from "../shared/types";

export type GradeRuleScale = "PERCENTAGE";
export type GradeRoundingMode = "NONE" | "DECIMAL_0" | "DECIMAL_1" | "DECIMAL_2";

export interface GradeRuleRecord {
  id: string;
  academicYearId: string;
  termId: string;
  scopeType: ExamScopeType;
  scopeId: string;
  gradeId: string | null;
  gradingScale: GradeRuleScale;
  passMark: number;
  rounding: GradeRoundingMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface EffectiveGradeRule extends Omit<GradeRuleRecord, "academicYearId" | "termId"> {
  ruleId: string | null;
  source: "DEFAULT" | "SCHOOL" | "GRADE" | "STAGE";
}

export interface SaveGradeRulePayload {
  academicYearId: string;
  termId: string;
  scopeType: ExamScopeType;
  scopeId?: string;
  gradeId?: string;
  passMark: number;
  gradingScale: GradeRuleScale;
  rounding: GradeRoundingMode;
}

export type UpdateGradeRulePayload = Pick<SaveGradeRulePayload, "passMark" | "gradingScale" | "rounding">;

export interface EffectiveGradeRuleRequest {
  academicYearId: string;
  termId: string;
  scopeType: ExamScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { BackendGradeRuleResponse, BackendGradeRulesListResponse } from "../../gradebook/types/api.types";
import type { ExamScopeType } from "../../shared/types";
import type { EffectiveGradeRule, EffectiveGradeRuleRequest, GradeRoundingMode, GradeRuleRecord, SaveGradeRulePayload, UpdateGradeRulePayload } from "../types";

function rounding(value?: string): GradeRoundingMode {
  const normalized = value?.toUpperCase();
  return normalized === "NONE" || normalized === "DECIMAL_0" || normalized === "DECIMAL_1" || normalized === "DECIMAL_2" ? normalized : "DECIMAL_2";
}

function mapRule(value: BackendGradeRuleResponse): GradeRuleRecord {
  return {
    id: value.id ?? value.ruleId ?? "",
    academicYearId: value.academicYearId ?? value.yearId ?? "",
    termId: value.termId ?? "",
    scopeType: (value.scopeType ?? "school") as ExamScopeType,
    scopeId: value.scopeKey ?? value.scopeId ?? "",
    gradeId: value.gradeId ?? null,
    gradingScale: "PERCENTAGE",
    passMark: value.passMark ?? 50,
    rounding: rounding(value.rounding),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export async function fetchGradeRules(academicYearId: string, termId: string, filters: { scopeType?: ExamScopeType; scopeId?: string; gradeId?: string } = {}): Promise<GradeRuleRecord[]> {
  const response = await apiGet<BackendGradeRulesListResponse>("/grades/rules", { params: { academicYearId, termId, ...filters } });
  return response.items.map(mapRule);
}

export async function fetchEffectiveGradeRule(payload: EffectiveGradeRuleRequest): Promise<EffectiveGradeRule> {
  const response = await apiGet<BackendGradeRuleResponse>("/grades/rules/effective", { params: { ...payload, scopeId: payload.scopeId || undefined, gradeId: payload.gradeId || undefined } });
  return { ...mapRule(response), ruleId: response.ruleId ?? response.id ?? null, source: response.source ?? "DEFAULT" };
}

export async function saveGradeRule(payload: SaveGradeRulePayload): Promise<GradeRuleRecord> {
  return mapRule(await apiPost<BackendGradeRuleResponse>("/grades/rules", payload));
}

export async function updateGradeRule(ruleId: string, payload: UpdateGradeRulePayload): Promise<GradeRuleRecord> {
  return mapRule(await apiPatch<BackendGradeRuleResponse>(`/grades/rules/${ruleId}`, payload));
}

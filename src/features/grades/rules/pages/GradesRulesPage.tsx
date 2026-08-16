"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchGradesFiltersData } from "../../gradebook/services/gradesGradebookService";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { useGradesYearTermLayoutContext } from "../../hooks/GradesYearTermLayoutContext";
import type { ScopeEntityOption } from "../../shared/types";
import {
  fetchGradeRules,
  saveGradeRule,
  updateGradeRule,
} from "../services/gradesRulesService";
import type { GradeRoundingMode, GradeRuleRecord } from "../types";
import { findRuleForEditor } from "../utils/rulesRoute";

export default function GradesRulesPage({
  ruleId,
}: {
  mode?: "create" | "edit";
  ruleId?: string;
}) {
  const t = useTranslations("academics.grades.rules");
  const tGrades = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const { hasPermission } = usePermissions();
  const canManageRules = hasPermission("grades.rules.manage");
  const { academicYearId, termId, termStatus, isInitializing } =
    useGradesYearTermLayoutContext();
  const [scopeType, setScopeType] = useState<"school" | "grade">("school");
  const [gradeId, setGradeId] = useState("");
  const [grades, setGrades] = useState<ScopeEntityOption[]>([]);
  const [passMark, setPassMark] = useState("50");
  const [rounding, setRounding] = useState<GradeRoundingMode>("DECIMAL_2");
  const [editing, setEditing] = useState<GradeRuleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const back = () =>
    router.push(
      `/${locale}/grades/rules?year=${academicYearId}&term=${termId}`,
    );

  useEffect(() => {
    if (!academicYearId || !termId) return;
    let active = true;
    void Promise.resolve().then(() => setLoading(true));
    void Promise.all([
      fetchGradesFiltersData(academicYearId, termId),
      ruleId ? fetchGradeRules(academicYearId, termId) : Promise.resolve([]),
    ])
      .then(([filters, rules]) => {
        if (!active) return;
        setGrades(filters.scopeEntities.grade);
        if (ruleId) {
          const rule = findRuleForEditor(rules, ruleId);
          if (!rule) throw new Error("Rule not found");
          setEditing(rule);
          setScopeType(rule.scopeType === "grade" ? "grade" : "school");
          setGradeId(rule.gradeId ?? "");
          setPassMark(String(rule.passMark));
          setRounding(rule.rounding);
        }
      })
      .catch((error) =>
        showError(tGrades(`errors.${mapGradesApiError(error)}`)),
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [academicYearId, ruleId, showError, tGrades, termId]);

  const submit = async () => {
    if (!canManageRules) return;
    const mark = Number(passMark);
    if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
      showError(t("validation.passMark"));
      return;
    }
    if (scopeType === "grade" && !gradeId) {
      showError(tGrades("filters.selectScope"));
      return;
    }
    setSaving(true);
    try {
      const values = {
        passMark: mark,
        gradingScale: "PERCENTAGE" as const,
        rounding,
      };
      if (editing) await updateGradeRule(editing.id, values);
      else
        await saveGradeRule({
          academicYearId,
          termId,
          scopeType,
          gradeId: scopeType === "grade" ? gradeId : undefined,
          scopeId: scopeType === "grade" ? gradeId : undefined,
          ...values,
        });
      showSuccess(t("messages.saved"));
      back();
    } catch (error) {
      showError(tGrades(`errors.${mapGradesApiError(error)}`));
    } finally {
      setSaving(false);
    }
  };
  if (isInitializing || loading)
    return (
      <div className="flex min-h-80 items-center justify-center">
        <MainLoader />
      </div>
    );
  const disabled = termStatus === "closed" || saving || !canManageRules;
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {editing ? t("form.editTitle") : t("form.createTitle")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t("form.description")}</p>
        </div>
        <Button variant="secondary" onClick={back}>
          {tCommon("cancel")}
        </Button>
      </header>
      <section className="max-w-3xl rounded-xl border border-gray-200 bg-white p-5 mx-auto">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label={tGrades("filters.scopeType")}
            value={scopeType}
            disabled={Boolean(editing)}
            options={[
              { value: "school", label: tGrades("filters.scopeTypes.school") },
              { value: "grade", label: tGrades("filters.scopeTypes.grade") },
            ]}
            onChange={(value) => setScopeType(value as "school" | "grade")}
          />
          {scopeType === "grade" && (
            <Select
              label={tGrades("filters.scope")}
              value={gradeId}
              disabled={Boolean(editing)}
              placeholder={tGrades("filters.selectScope")}
              options={grades.map((grade) => ({
                value: grade.id,
                label: locale === "ar" ? grade.nameAr : grade.nameEn,
              }))}
              onChange={setGradeId}
            />
          )}
          <label className="text-sm font-medium text-gray-700">
            {t("form.passMark")}
            <input
              aria-label={t("form.passMark")}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={passMark}
              disabled={disabled}
              onChange={(event) => setPassMark(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <Select
            label={t("form.rounding")}
            value={rounding}
            disabled={disabled}
            options={(
              [
                "NONE",
                "DECIMAL_0",
                "DECIMAL_1",
                "DECIMAL_2",
              ] as GradeRoundingMode[]
            ).map((value) => ({ value, label: t(`rounding.${value}`) }))}
            onChange={(value) => setRounding(value as GradeRoundingMode)}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            disabled={disabled}
            loading={saving}
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => void submit()}
          >
            {t("actions.save")}
          </Button>
        </div>
      </section>
    </main>
  );
}

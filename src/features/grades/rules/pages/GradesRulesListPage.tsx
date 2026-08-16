"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, DataTable, type Column } from "@/components/ui";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchGradesFiltersData } from "../../gradebook/services/gradesGradebookService";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { useGradesYearTermLayoutContext } from "../../hooks/GradesYearTermLayoutContext";
import type { ScopeEntityOption } from "../../shared/types";
import { fetchGradeRules } from "../services/gradesRulesService";
import type { GradeRuleRecord } from "../types";

type RuleRow = GradeRuleRecord & Record<string, unknown>;

export default function GradesRulesListPage() {
  const t = useTranslations("academics.grades.rules");
  const tGrades = useTranslations("academics.grades");
  const locale = useLocale();
  const router = useRouter();
  const { showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManageRules = hasPermission("grades.rules.manage");
  const { academicYearId, termId, isInitializing } = useGradesYearTermLayoutContext();
  const [rules, setRules] = useState<GradeRuleRecord[]>([]);
  const [grades, setGrades] = useState<ScopeEntityOption[]>([]);
  const [scopeType, setScopeType] = useState<"" | "school" | "grade">("");
  const [scopeId, setScopeId] = useState("");
  const [loadingRules, setLoadingRules] = useState(true);

  const filters = useMemo(() => {
    if (scopeType === "school") return { scopeType };
    if (scopeType === "grade" && scopeId) {
      return { scopeType, scopeId, gradeId: scopeId };
    }
    return {};
  }, [scopeId, scopeType]);

  const navigate = useCallback((suffix: string) => {
    const query = new URLSearchParams({ year: academicYearId, term: termId });
    router.push(`/${locale}/grades/rules${suffix}?${query}`);
  }, [academicYearId, locale, router, termId]);

  useEffect(() => {
    if (!academicYearId || !termId) return;
    let active = true;
    void fetchGradesFiltersData(academicYearId, termId)
      .then((data) => { if (active) setGrades(data.scopeEntities.grade); })
      .catch((error) => { if (active) showError(tGrades(`errors.${mapGradesApiError(error)}`)); });
    return () => { active = false; };
  }, [academicYearId, showError, tGrades, termId]);

  useEffect(() => {
    if (!academicYearId || !termId) return;
    let active = true;
    void fetchGradeRules(academicYearId, termId, filters)
      .then((items) => { if (active) setRules(items); })
      .catch((error) => { if (active) showError(tGrades(`errors.${mapGradesApiError(error)}`)); })
      .finally(() => { if (active) setLoadingRules(false); });
    return () => { active = false; };
  }, [academicYearId, filters, showError, tGrades, termId]);

  const columns = useMemo<Column<RuleRow>[]>(() => [
    { key: "scopeType", label: tGrades("filters.scopeType"), render: (_value, rule) => tGrades(`filters.scopeTypes.${rule.scopeType}`) },
    { key: "passMark", label: t("form.passMark"), render: (_value, rule) => `${rule.passMark}%` },
    { key: "rounding", label: t("form.rounding"), render: (_value, rule) => t(`rounding.${rule.rounding}`) },
    { key: "updatedAt", label: t("title"), render: (_value, rule) => rule.updatedAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(rule.updatedAt)) : "—" },
  ], [locale, t, tGrades]);

  if (isInitializing) return <div className="flex min-h-80 items-center justify-center"><MainLoader /></div>;

  return <main className="space-y-6 p-4 sm:p-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1><p className="mt-1 text-sm text-gray-600">{t("subtitle")}</p></div>
      {canManageRules ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/new")}>{t("form.createTitle")}</Button> : null}
    </header>

    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={tGrades("filters.scopeType")} value={scopeType} options={[{ value: "", label: tGrades("filters.selectScopeType") }, { value: "school", label: tGrades("filters.scopeTypes.school") }, { value: "grade", label: tGrades("filters.scopeTypes.grade") }]} onChange={(value) => { setScopeType(value as "" | "school" | "grade"); setScopeId(""); }} />
        {scopeType === "grade" ? <Select label={tGrades("filters.scope")} value={scopeId} placeholder={tGrades("filters.selectScope")} options={grades.map((grade) => ({ value: grade.id, label: locale === "ar" ? grade.nameAr : grade.nameEn }))} onChange={setScopeId} /> : null}
      </div>
    </section>

    <DataTable columns={columns} data={rules as RuleRow[]} isLoading={loadingRules} onRowClick={(rule) => navigate(`/${rule.id}`)} emptyTitle={t("title")} emptyDescription={t("empty")} showPagination />
  </main>;
}

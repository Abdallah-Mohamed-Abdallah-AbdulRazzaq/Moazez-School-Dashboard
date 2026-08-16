"use client";

import { useLocale, useTranslations } from "next-intl";
import { ClipboardCheck, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type { AssessmentDeliveryMode, ExamScopeType } from "../types";

interface ScopeEntity {
  id: string;
  nameAr: string;
  nameEn: string;
  parentId?: string;
}

interface GradesFiltersPanelProps {
  scopeTypes: ExamScopeType[];
  scopeEntities: ScopeEntity[];
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>;
  selectedScopeType: ExamScopeType;
  selectedScopeId: string;
  selectedSubjectId: string;
  selectedDeliveryMode?: AssessmentDeliveryMode | "";
  onScopeTypeChange: (value: ExamScopeType) => void;
  onScopeIdChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onDeliveryModeChange?: (value: AssessmentDeliveryMode | "") => void;
  selectedContextText?: string | null;
  isReadOnly: boolean;
  onCreateAssessment?: () => void;
  onExport: () => void;
  isExportDisabled?: boolean;
  showSubjectFilter?: boolean;
  scopeEntitiesByType?: Record<ExamScopeType, ScopeEntity[]>;
  selectedScopeIds?: Partial<Record<ExamScopeType, string>>;
  onHierarchyChange?: (scopeType: ExamScopeType, scopeId: string) => void;
}

export default function GradesFiltersPanel({
  scopeTypes,
  scopeEntities,
  subjects,
  selectedScopeType,
  selectedScopeId,
  selectedSubjectId,
  selectedDeliveryMode = "",
  onScopeTypeChange,
  onScopeIdChange,
  onSubjectChange,
  onDeliveryModeChange,
  selectedContextText,
  isReadOnly,
  onCreateAssessment,
  onExport,
  isExportDisabled = false,
  showSubjectFilter = true,
  scopeEntitiesByType,
  selectedScopeIds = {},
  onHierarchyChange,
}: GradesFiltersPanelProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-color)",
      }}
    >
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${showSubjectFilter || onDeliveryModeChange ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        {scopeEntitiesByType && onHierarchyChange ? (['stage', 'grade', 'section', 'classroom'] as ExamScopeType[]).map((type) => {
          const parentType = type === 'grade' ? 'stage' : type === 'section' ? 'grade' : type === 'classroom' ? 'section' : undefined;
          const parentId = parentType ? selectedScopeIds[parentType] : undefined;
          const options = parentType && !parentId
            ? []
            : (scopeEntitiesByType[type] || []).filter((item) => !parentId || item.parentId === parentId);
          return <Select
            key={type}
            label={t(`filters.scopeTypes.${type}`)}
            value={selectedScopeIds[type] || ''}
            onChange={(value) => onHierarchyChange(type, value)}
            options={options.map((item) => ({ value: item.id, label: locale === 'ar' ? item.nameAr : item.nameEn }))}
            placeholder={parentType && !parentId ? t('filters.selectScope') : t('filters.selectScope')}
            disabled={Boolean(parentType && !parentId)}
          />;
        }) : null}
        <Select
          label={t("filters.scopeType")}
          value={selectedScopeType}
          onChange={(value) => onScopeTypeChange(value as ExamScopeType)}
          options={scopeTypes.map((scopeType) => ({
            value: scopeType,
            label: t(`filters.scopeTypes.${scopeType}`),
          }))}
          placeholder={t("filters.selectScopeType")}
        />
        <Select
          label={t("filters.scope")}
          value={selectedScopeId}
          onChange={onScopeIdChange}
          options={scopeEntities.map((entity) => ({
            value: entity.id,
            label: locale === "ar" ? entity.nameAr : entity.nameEn,
          }))}
          placeholder={t("filters.selectScope")}
        />
        {showSubjectFilter ? (
          <Select
            label={t("filters.subject")}
            value={selectedSubjectId}
            onChange={onSubjectChange}
            options={subjects.map((subject) => ({
              value: subject.id,
              label: locale === "ar" ? subject.nameAr : subject.nameEn,
            }))}
            placeholder={t("filters.selectSubject")}
          />
        ) : null}
        {onDeliveryModeChange ? (
          <Select
            label={t("filters.deliveryMode")}
            value={selectedDeliveryMode}
            onChange={(value) => onDeliveryModeChange(value as AssessmentDeliveryMode | "")}
            options={[
              { value: "", label: t("filters.deliveryModes.all") },
              { value: "SCORE_ONLY", label: t("filters.deliveryModes.scoreOnly") },
              { value: "QUESTION_BASED", label: t("filters.deliveryModes.questionBased") },
            ]}
            placeholder={t("filters.deliveryMode")}
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {selectedContextText || t("emptyState.selectFilters")}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {onCreateAssessment ? <Button
            variant="secondary"
            onClick={onExport}
            disabled={isExportDisabled}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {t("actions.export")}
          </Button> : null}
          <Button
            variant="primary"
            onClick={onCreateAssessment}
            disabled={
              (selectedScopeType !== "school" && !selectedScopeId) ||
              (showSubjectFilter && !selectedSubjectId) ||
              isReadOnly
            }
            leftIcon={<ClipboardCheck className="h-4 w-4" />}
          >
            {t("actions.createAssessment")}
          </Button>
        </div>
      </div>
    </div>
  );
}

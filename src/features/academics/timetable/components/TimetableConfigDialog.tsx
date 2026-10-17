"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import TimetableConfigEditor from "@/features/academics/timetable/components/TimetableConfigEditor";
import TimetablePeriodsEditor from "@/features/academics/timetable/components/TimetablePeriodsEditor";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

interface TimetableConfigDialogProps {
  mode: "config" | "periods";
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  academicYearId: string;
  termId: string;
  config: BackendTimetableConfigDto | null;
  periods: BackendTimetablePeriodDto[];
  entries: TimetableEntry[];
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  readOnly: boolean;
  locale: string;
  allowScopeSelection?: boolean;
  fixedScope?: TimetableScopeSelection;
  fixedName?: string;
  scopeLabel?: string;
  onContinue?: () => void;
  isLoading?: boolean;
}

export default function TimetableConfigDialog({
  mode,
  open,
  onClose,
  onSaved,
  academicYearId,
  termId,
  config,
  periods,
  entries,
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  readOnly,
  locale,
  allowScopeSelection = true,
  fixedScope,
  fixedName,
  scopeLabel,
  onContinue,
  isLoading = false,
}: TimetableConfigDialogProps) {
  const t = useTranslations("academics.timetable");
  const isConfigMode = mode === "config";
  const finishConfigSave = async () => {
    await onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t(isConfigMode ? "config.title" : "config.periodsTitle")}
      description={t(
        isConfigMode ? "config.configDescription" : "config.periodsDescription",
      )}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            {t("config.close")}
          </Button>
          {!isConfigMode && !readOnly && onContinue && (
            <Button
              onClick={onContinue}
              disabled={
                isLoading || !periods.some((period) => period.isInstructional)
              }
            >
              {t("workflow.continueScheduling")}
            </Button>
          )}
        </div>
      }
    >
      {scopeLabel && (
        <p className="mb-4 rounded-lg bg-primary-50 p-3 text-sm font-medium text-primary">
          {t("overview.editingScope")}: {scopeLabel}
        </p>
      )}
      {isLoading && (
        <p
          role="status"
          aria-busy="true"
          className="py-6 text-center text-sm text-gray-600"
        >
          {t("loadingLabel")}
        </p>
      )}
      <div className={isLoading ? "hidden" : undefined}>
        {isConfigMode ? (
          <TimetableConfigEditor
            academicYearId={academicYearId}
            termId={termId}
            config={config}
            entries={entries}
            scopeIds={{
              stageId: selectedStageId,
              gradeId: selectedGradeId,
              sectionId: selectedSectionId,
              classroomId: selectedClassroomId,
            }}
            allowScopeSelection={allowScopeSelection}
            fixedScope={fixedScope}
            fixedName={fixedName}
            readOnly={readOnly || isLoading}
            locale={locale}
            submitLabel={t("config.saveConfig")}
            onSaved={finishConfigSave}
          />
        ) : config ? (
          <TimetablePeriodsEditor
            config={config}
            periods={periods}
            entries={entries}
            readOnly={readOnly || isLoading}
            onSaved={onSaved}
          />
        ) : (
          <p className="text-sm text-amber-700">
            {t("config.saveBeforePeriods")}
          </p>
        )}
      </div>
    </Modal>
  );
}

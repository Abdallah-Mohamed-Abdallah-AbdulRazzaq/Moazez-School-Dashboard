"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { validateTargetDraft } from "../../model/academicContentPolicy";
import { broaderTargetIndices } from "../../model/academicContentTargetOverlap";
import { academicContentUiError } from "../../services/academicContentErrors";
import {
  hasDuplicateTargets,
  loadAcademicTargetOptions,
  targetLineage,
  teacherAllocationsForTarget,
  toTargetInput,
  type AcademicTargetOptions,
  type LoadAcademicTargetOptionsInput,
} from "../../services/academicContentSelectors";
import type {
  AcademicContentDetail,
  AcademicContentTargetDraft,
} from "../../types/contracts";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import AcademicTargetCard, {
  type EditableAcademicTarget,
} from "./AcademicTargetCard";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

interface AcademicTargetsSectionProps {
  content: AcademicContentDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (targets: AcademicContentTargetDraft[]) => Promise<boolean>;
  loadOptions?: (
    input: LoadAcademicTargetOptionsInput,
  ) => Promise<AcademicTargetOptions>;
}

let targetKeySequence = 0;

function nextTargetKey(): string {
  targetKeySequence += 1;
  return `academic-target-${targetKeySequence}`;
}

function editableTarget(
  target: AcademicContentTargetDraft,
  options?: AcademicTargetOptions,
): EditableAcademicTarget {
  const lineage = options
    ? targetLineage(options, target)
    : { stageId: "", gradeId: "", sectionId: "" };
  return {
    ...target,
    key: nextTargetKey(),
    stageContextId: lineage.stageId,
    gradeContextId: lineage.gradeId,
    sectionContextId: lineage.sectionId,
  };
}

function targetDraft(row: EditableAcademicTarget): AcademicContentTargetDraft {
  return toTargetInput(row);
}

export default function AcademicTargetsSection({
  content,
  disabled,
  sectionState,
  onDirtyChange,
  onSave,
  loadOptions = loadAcademicTargetOptions,
}: AcademicTargetsSectionProps) {
  const [options, setOptions] = useState<AcademicTargetOptions | null>(null);
  const [rows, setRows] = useState<EditableAcademicTarget[]>(() =>
    content.targets.map((target) => editableTarget(target)),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const t = useAcademicContentTranslations("targets");
  const contentVersion = `${content.id}:${content.updatedAt}`;
  const [syncedContentVersion, setSyncedContentVersion] =
    useState(contentVersion);

  if (
    options &&
    !sectionState.dirty &&
    syncedContentVersion !== contentVersion
  ) {
    setSyncedContentVersion(contentVersion);
    setRows(content.targets.map((target) => editableTarget(target, options)));
    setValidationError(null);
  }

  useEffect(() => {
    let active = true;
    void loadOptions({
      academicYearId: content.academicYearId,
      termId: content.termId,
    })
      .then((loadedOptions) => {
        if (!active) return;
        setOptions(loadedOptions);
        setRows((currentRows) =>
          currentRows.map((row) => {
            const lineage = targetLineage(loadedOptions, row);
            return {
              ...row,
              stageContextId: lineage.stageId,
              gradeContextId: lineage.gradeId,
              sectionContextId: lineage.sectionId,
            };
          }),
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(academicContentUiError(error).message);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [content.academicYearId, content.termId, loadOptions, t]);

  const updateRow = (key: string, update: Partial<EditableAcademicTarget>) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === key ? { ...row, ...update } : row)),
    );
    setValidationError(null);
    onDirtyChange(true);
  };

  const save = async () => {
    const targets = rows.map(targetDraft);
    const invalidTargetIndex = targets.findIndex(
      (target) => validateTargetDraft(target, content.type).length > 0,
    );
    if (invalidTargetIndex >= 0) {
      const invalidFields = validateTargetDraft(
        targets[invalidTargetIndex],
        content.type,
      );
      setValidationError(
        invalidFields.includes("subjectId")
          ? t("subject_required", { index: invalidTargetIndex + 1 })
          : t("hierarchy_required", { index: invalidTargetIndex + 1 }),
      );
      return;
    }
    if (hasDuplicateTargets(targets)) {
      setValidationError(t("duplicate"));
      return;
    }
    const unavailableAllocationIndex = options
      ? targets.findIndex(
          (target) =>
            Boolean(target.teacherSubjectAllocationId) &&
            !teacherAllocationsForTarget(options, target).some(
              (allocation) =>
                allocation.id === target.teacherSubjectAllocationId,
            ),
        )
      : -1;
    if (unavailableAllocationIndex >= 0) {
      setValidationError(
        t("teacher_unavailable", { index: unavailableAllocationIndex + 1 }),
      );
      return;
    }

    setValidationError(null);
    await onSave(targets);
  };

  const addTarget = () => {
    setRows((currentRows) => [
      ...currentRows,
      editableTarget({ scopeType: "SCHOOL", subjectId: null }),
    ]);
    onDirtyChange(true);
  };

  const removeTarget = (key: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.key !== key));
    onDirtyChange(true);
  };

  return (
    <section
      id="targets"
      aria-labelledby="targets-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="targets-heading"
            className="text-lg font-semibold text-gray-900"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{t("description")}</p>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus aria-hidden="true" className="size-4" />}
            onClick={addTarget}
          >
            {t("add")}
          </Button>
        )}
      </div>

      {(loadError || validationError || sectionState.error) && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError ?? validationError ?? sectionState.error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
          {t("loading")}
        </div>
      ) : options ? (
        <div className="mt-5 space-y-4">
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
              {t("empty")}
            </p>
          ) : null}
          {rows.map((row, index) => {
            const broaderIndices = broaderTargetIndices(row, rows, options);
            return (
              <AcademicTargetCard
                key={row.key}
                row={row}
                index={index}
                options={options}
                contentType={content.type}
                disabled={disabled}
                overlapHint={
                  broaderIndices.length > 0
                    ? t("overlap_hint", {
                        scopes: broaderIndices
                          .map((broaderIndex) =>
                            t("target", { index: broaderIndex + 1 }),
                          )
                          .join(" · "),
                      })
                    : undefined
                }
                onUpdate={(update) => updateRow(row.key, update)}
                onRemove={() => removeTarget(row.key)}
              />
            );
          })}
        </div>
      ) : null}

      {!disabled && !isLoading && (
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            loading={sectionState.saving}
            disabled={!sectionState.dirty || Boolean(loadError)}
            onClick={() => void save()}
          >
            {t("save")}
          </Button>
        </div>
      )}
    </section>
  );
}

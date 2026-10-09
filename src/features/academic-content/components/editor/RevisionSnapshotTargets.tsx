"use client";

import { useLocale } from "next-intl";
import type { AcademicTargetOptions } from "../../services/academicContentSelectors";
import type { AcademicContentTarget } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

export interface RevisionDisplayContext {
  academicYearName?: string;
  termName?: string;
  targetOptions: AcademicTargetOptions | null;
  targetOptionsUnavailable: boolean;
}

interface LocalizedName {
  name: string;
  nameAr?: string;
  nameEn?: string;
}

function localizedName(entity: LocalizedName | undefined, locale: string) {
  return (locale === "ar" ? entity?.nameAr : entity?.nameEn) || entity?.name;
}

function targetScopeEntity(
  target: AcademicContentTarget,
  options: AcademicTargetOptions,
): LocalizedName | undefined {
  if (target.scopeType === "STAGE") {
    return options.structure.stages.find(
      (stage) => stage.id === target.stageId,
    );
  }
  if (target.scopeType === "GRADE") {
    return options.structure.grades.find(
      (grade) => grade.id === target.gradeId,
    );
  }
  if (target.scopeType === "SECTION") {
    return options.structure.sections.find(
      (section) => section.id === target.sectionId,
    );
  }
  if (target.scopeType === "CLASSROOM") {
    return options.structure.classrooms.find(
      (classroom) => classroom.id === target.classroomId,
    );
  }
  return undefined;
}

export default function RevisionSnapshotTargets({
  targets,
  displayContext,
}: {
  targets: AcademicContentTarget[];
  displayContext?: RevisionDisplayContext;
}) {
  const locale = useLocale();
  const t = useAcademicContentTranslations();
  const targetOptions = displayContext?.targetOptions;
  const targetContextUnavailable =
    !displayContext || displayContext.targetOptionsUnavailable;

  if (displayContext && !targetOptions && !targetContextUnavailable) {
    return (
      <p role="status" className="text-sm text-gray-500">
        {t("revisions.target_context_loading")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {targetContextUnavailable && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("revisions.target_context_unavailable")}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {targets.map((target, index) => {
          const scopeEntity = targetOptions
            ? targetScopeEntity(target, targetOptions)
            : undefined;
          const scopeName =
            target.scopeType === "SCHOOL"
              ? t("targets.whole_school")
              : (localizedName(scopeEntity, locale) ??
                t("revisions.context_unavailable"));
          const subject = targetOptions?.subjects.find(
            (subjectOption) => subjectOption.id === target.subjectId,
          );
          const scopeLabel = t(
            `targets.${
              target.scopeType === "SCHOOL"
                ? "scope"
                : target.scopeType.toLowerCase()
            }`,
          );

          return (
            <article
              key={target.id}
              className="rounded-xl border border-gray-200 bg-gray-50/70 p-4"
            >
              <p className="text-xs font-semibold text-primary">
                {t("targets.target", { index: index + 1 })}
              </p>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">{scopeLabel}</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {scopeName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">
                    {t("targets.subject")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {target.subjectId
                      ? (localizedName(subject, locale) ??
                        t("revisions.context_unavailable"))
                      : t("targets.not_required")}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}

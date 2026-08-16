"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Save, Eye, EyeOff, RotateCcw, Trash2, Loader2, CheckCircle2, ArrowRight, MoreVertical } from "lucide-react";
import { useMediaQuery, useTheme } from "@mui/material";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import { Assignment } from "@/features/academics/curriculum/services/curriculumService";

interface BuilderHeaderProps {
  assignment: Assignment;
  isReadOnly: boolean;
  isDirty: boolean;
  isAssignmentDirty: boolean;
  isQuestionDirty: boolean;
  isAssignmentSaving: boolean;
  isQuestionSaving: boolean;
  onBack: () => void;
  onSaveAssignment: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
  onReset: () => void;
}

export default function BuilderHeader({
  assignment,
  isReadOnly,
  isDirty,
  isAssignmentDirty,
  isQuestionDirty,
  isAssignmentSaving,
  isQuestionSaving,
  onBack,
  onSaveAssignment,
  onPublishToggle,
  onDelete,
  onReset,
}: BuilderHeaderProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={t("backToLesson")}
          >
            {locale === "ar" ? <ArrowLeft className="w-5 h-5 rotate-180" /> : <ArrowRight className="w-5 h-5" />}
            <span className="hidden sm:inline font-medium">{t("backToLesson")}</span>
          </button>

          {/* Center: Title + Status */}
          <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate max-w-xs md:max-w-md">
              {assignment.titleAr || assignment.titleEn || t("draft")}
            </h1>

            {/* Status Chips */}
            <div className="flex items-center gap-2">
              {assignment.isPublished ? (
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                  {t("published")}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                  {t("draft")}
                </span>
              )}

              {isReadOnly && (
                <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
                  {t("readOnly")}
                </span>
              )}

              {/* Save status indicator */}
              {!isReadOnly && (
                <>
                  {(isAssignmentSaving || isQuestionSaving) && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {tCommon("saving")}
                    </span>
                  )}
                  
                  {!isAssignmentSaving && !isQuestionSaving && (isAssignmentDirty || isQuestionDirty) && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
                      {tCommon("unsaved")}
                    </span>
                  )}
                  
                  {!isAssignmentSaving && !isQuestionSaving && !isAssignmentDirty && !isQuestionDirty && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {tCommon("saved")}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                {/* Desktop: Show all buttons */}
                {!isMobile && (
                  <>
                    <Button
                      onClick={onSaveAssignment}
                      variant="secondary"
                      size="sm"
                      disabled={isAssignmentSaving || !isAssignmentDirty}
                      leftIcon={<Save className="w-4 h-4" />}
                      aria-label={tCommon("saveAssignment")}
                    >
                      {isAssignmentSaving ? tCommon("saving") : tCommon("saveAssignment")}
                    </Button>

                    <Button
                      onClick={onPublishToggle}
                      variant={assignment.isPublished ? "secondary" : "primary"}
                      size="sm"
                      leftIcon={
                        assignment.isPublished ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )
                      }
                      aria-label={assignment.isPublished ? t("unpublish") : t("publish")}
                    >
                      {assignment.isPublished ? t("unpublish") : t("publish")}
                    </Button>

                    <Button
                      onClick={onReset}
                      variant="secondary"
                      size="sm"
                      disabled={!isDirty}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                      aria-label={tCommon("reset")}
                    >
                      {tCommon("reset")}
                    </Button>

                    <Button
                      onClick={onDelete}
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      aria-label={tCommon("delete")}
                    >
                      {tCommon("delete")}
                    </Button>
                  </>
                )}

                {/* Mobile: Show Save + More dropdown */}
                {isMobile && (
                  <>
                    <Button
                      onClick={onSaveAssignment}
                      variant="primary"
                      size="sm"
                      disabled={isAssignmentSaving || !isAssignmentDirty}
                      leftIcon={<Save className="w-4 h-4" />}
                      aria-label={tCommon("saveAssignment")}
                    >
                      {isAssignmentSaving ? tCommon("saving") : tCommon("save")}
                    </Button>

                    <DropdownMenu
                      trigger={
                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <MoreVertical className="w-3 h-3 text-gray-600" />
                        </button>
                      }
                      items={[
                        {
                          label: assignment.isPublished ? t("unpublish") : t("publish"),
                          value: "publish",
                          icon: assignment.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          ),
                          onClick: onPublishToggle,
                        },
                        {
                          label: tCommon("reset"),
                          value: "reset",
                          icon: <RotateCcw className="w-4 h-4" />,
                          onClick: onReset,
                          disabled: !isDirty,
                        },
                        {
                          label: tCommon("delete"),
                          value: "delete",
                          icon: <Trash2 className="w-4 h-4 text-red-600" />,
                          onClick: onDelete,
                        },
                      ]}
                      width="w-48"
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

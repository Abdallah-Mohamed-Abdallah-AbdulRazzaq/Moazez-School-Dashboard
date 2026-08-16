// Presenter component for Subjects Allocation Page
// Pure presentation - receives data via props, no business logic

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertCircle, GraduationCap } from "lucide-react";
import { AccessDenied } from "@/components/ui";
import Button from "@/components/ui/button/Button";
import AcademicModuleEmptyState from "@/features/academics/components/shared/AcademicModuleEmptyState";
import type {
  Stage,
  AcademicYear,
  Term,
  Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import SubjectsList from "../components/SubjectsList";
import AllocationMatrix from "../components/AllocationMatrix";
import SubjectDialog from "../components/SubjectDialog";

interface SubjectsAllocationViewProps {
  academicYearId: string;
  termId: string;
  academicYears: AcademicYear[];
  terms: Term[];
  canView: boolean;
  stages: Stage[];
  grades: Grade[];
  subjects: Subject[];
  allocations: SubjectAllocation[];
  isLoading: boolean;
  isMatrixLoading: boolean;
  apiError: string | null;
  apiErrorTraceId?: string;
  activeTab: "subjects" | "matrix";
  showSubjectDialog: boolean;
  editingSubject: Subject | null;
  isReadOnly: boolean;
  isTermClosed: boolean;
  onTabChange: (tab: "subjects" | "matrix") => void;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onSubjectSuccess: () => void;
  onAllocationsChange: (allocations: SubjectAllocation[]) => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaveError: (error: unknown) => void;
  onRefresh: () => Promise<void>;
  onRetry: () => Promise<void>;
  onCloseSubjectDialog: () => void;
}

export default function SubjectsAllocationView({
  academicYearId,
  termId,
  academicYears,
  terms,
  canView,
  stages,
  grades,
  subjects,
  allocations,
  isLoading,
  isMatrixLoading,
  apiError,
  apiErrorTraceId,
  activeTab,
  showSubjectDialog,
  editingSubject,
  isReadOnly,
  isTermClosed,
  onTabChange,
  onAddSubject,
  onEditSubject,
  onSubjectSuccess,
  onAllocationsChange,
  onDirtyChange,
  onSaveError,
  onRefresh,
  onRetry,
  onCloseSubjectDialog,
}: SubjectsAllocationViewProps) {
  const t = useTranslations("academics.subjects");
  const tEmpty = useTranslations("academics.module_empty_states");
  const router = useRouter();
  const locale = useLocale();

  const yearName = academicYears.find((y) => y.id === academicYearId)?.name;
  const termName = terms.find((t) => t.id === termId)?.name;

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 px-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Read-Only Banner */}
      {isTermClosed && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("readonly_banner.message")}
          </span>
        </div>
      )}

      {apiError && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm text-red-800">
                <div>{apiError}</div>
                {apiErrorTraceId && (
                  <div className="mt-1 text-xs text-red-700">
                    {t("errors.trace_id", { traceId: apiErrorTraceId })}
                  </div>
                )}
              </div>
            </div>
            <Button variant="secondary" onClick={() => void onRetry()}>
              {t("errors.retry")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && (!academicYearId || !termId) && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_context.title")}
            </h3>
            <p className="text-gray-600">
              {t("empty_state.no_context.message")}
            </p>
          </div>
        </div>
      )}

      {/* Empty State - No Grades */}
      {!isLoading && academicYearId && termId && grades.length === 0 && (
        <AcademicModuleEmptyState
          icon={GraduationCap}
          title={tEmpty("no_grades.title")}
          description={tEmpty("no_grades.description")}
          ctaLabel={tEmpty("no_grades.cta")}
          onCtaClick={() => router.push(`/${locale}/academics/structure`)}
        />
      )}

      {/* Main Content */}
      {!isLoading && academicYearId && termId && grades.length > 0 && (
        <>
          {/* Mobile Tabs */}
          <div className="lg:hidden border-b border-border bg-white">
            <div className="flex">
              <button
                onClick={() => onTabChange("subjects")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "subjects"
                    ? "border-border text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.subjects")}
              </button>
              <button
                onClick={() => onTabChange("matrix")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "matrix"
                    ? "border-border text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.matrix")}
              </button>
            </div>
          </div>

          {/* Desktop: Two-Panel Layout */}
          <div className="hidden lg:flex flex-1 overflow-hidden ">
            {/* Left Panel: Subjects */}
            <div className="w-96 border-r border-l h-screen border-border bg-white flex flex-col">
              <SubjectsList
                subjects={subjects}
                allocations={allocations}
                isReadOnly={isReadOnly}
                onAdd={onAddSubject}
                onEdit={onEditSubject}
                onRefresh={onRefresh}
              />
            </div>

            {/* Right Panel: Matrix */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <AllocationMatrix
                stages={stages}
                grades={grades}
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                yearName={yearName}
                termName={termName}
                isLoading={isMatrixLoading}
                isReadOnly={isReadOnly}
                onAllocationsChange={onAllocationsChange}
                onDirtyChange={onDirtyChange}
                onSaveError={onSaveError}
                onRefresh={onRefresh}
              />
            </div>
          </div>

          {/* Mobile: Single Panel */}
          <div className="lg:hidden flex-1 overflow-hidden">
            {activeTab === "subjects" ? (
              <SubjectsList
                subjects={subjects}
                allocations={allocations}
                isReadOnly={isReadOnly}
                onAdd={onAddSubject}
                onEdit={onEditSubject}
                onRefresh={onRefresh}
              />
            ) : (
              <AllocationMatrix
                stages={stages}
                grades={grades}
                subjects={subjects}
                allocations={allocations}
                termId={termId}
                yearName={yearName}
                termName={termName}
                isLoading={isMatrixLoading}
                isReadOnly={isReadOnly}
                onAllocationsChange={onAllocationsChange}
                onDirtyChange={onDirtyChange}
                onSaveError={onSaveError}
                onRefresh={onRefresh}
              />
            )}
          </div>
        </>
      )}

      {/* Subject Dialog */}
      <SubjectDialog
        isOpen={showSubjectDialog}
        onClose={onCloseSubjectDialog}
        onSuccess={onSubjectSuccess}
        subject={editingSubject}
        existingSubjects={subjects}
      />

    </div>
  );
}

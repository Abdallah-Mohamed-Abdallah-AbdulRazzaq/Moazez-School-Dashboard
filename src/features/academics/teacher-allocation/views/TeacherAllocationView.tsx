// Presenter component for Teacher Allocation Page
// Pure presentation - receives data via props, no business logic

"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Clock,
  GraduationCap,
  Grid3x3,
  Users,
} from "lucide-react";
import { Tabs, Tab } from "@mui/material";
import type {
  AcademicYear,
  Classroom,
  Term,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import AllocationMatrixView from "../components/AllocationMatrixView";
import TeacherLoadView from "../components/TeacherLoadView";
import ValidationPanel from "../components/ValidationPanel";
import { AccessDenied, Button } from "@/components/ui";
import TeacherAllocationTechnicalDetails from "../components/TeacherAllocationTechnicalDetails";
import AcademicModuleEmptyState from "@/features/academics/components/shared/AcademicModuleEmptyState";

interface TeacherAllocationViewProps {
  academicYearId: string;
  termId: string;
  academicYears: AcademicYear[];
  terms: Term[];
  canView: boolean;
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  teacherRoleId: string;
  teacherAllocations: TeacherAllocation[];
  isLoading: boolean;
  apiError: string | null;
  apiErrorTraceId?: string;
  isSaving: boolean;
  activeTab: "matrix" | "load";
  validationPanelOpen: boolean;
  isReadOnly: boolean;
  isTermClosed: boolean;
  onValidate: () => void;
  onAllocationsChange: (allocations: TeacherAllocation[]) => void;
  onRefresh: () => Promise<void>;
  onRetry: () => Promise<void>;
  onTabChange: (tab: "matrix" | "load") => void;
  onCloseValidationPanel: () => void;
}

export default function TeacherAllocationView({
  academicYearId,
  termId,
  academicYears,
  terms,
  canView,
  grades,
  sections,
  classrooms,
  subjects,
  subjectAllocations,
  teachers,
  teacherRoleId,
  teacherAllocations,
  isLoading,
  apiError,
  apiErrorTraceId,
  isSaving,
  activeTab,
  validationPanelOpen,
  isReadOnly,
  isTermClosed,
  onValidate,
  onAllocationsChange,
  onRefresh,
  onRetry,
  onTabChange,
  onCloseValidationPanel,
}: TeacherAllocationViewProps) {
  const t = useTranslations("academics.teacherAllocation");
  const tEmpty = useTranslations("academics.module_empty_states");
  const router = useRouter();
  const searchParams = useSearchParams();

  const yearName = academicYears.find((y) => y.id === academicYearId)?.name;
  const termName = terms.find((t) => t.id === termId)?.name;
  const validationGradeId = searchParams.get("grade") || undefined;
  const validationSubjectId = searchParams.get("subject") || undefined;
  const hasClassrooms = classrooms.length > 0;
  const hasSubjectWeeklyHours = subjectAllocations.some(
    (subjectAllocation) => subjectAllocation.weeklyHours > 0,
  );

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 px-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Read-Only Banner */}
      {isTermClosed && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readOnlyBanner")}</span>
        </div>
      )}

      {apiError && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm text-red-800">
                <div>{apiError}</div>
                <TeacherAllocationTechnicalDetails traceId={apiErrorTraceId} />
              </div>
            </div>
            <Button variant="secondary" onClick={() => void onRetry()} disabled={isSaving}>
              {t("actions.retry")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && (!academicYearId || !termId) && (
        <EmptyState
          title={t("emptyState.noTerm.title")}
          message={t("emptyState.noTerm.message")}
        />
      )}

      {!isLoading && academicYearId && termId && (grades.length === 0 || !hasClassrooms) && (
        <AcademicModuleEmptyState
          icon={GraduationCap}
          title={tEmpty("no_grades_or_classrooms.title")}
          description={tEmpty("no_grades_or_classrooms.description")}
          ctaLabel={tEmpty("no_grades.cta")}
          onCtaClick={() => router.push("/academics/structure")}
        />
      )}

      {!isLoading && academicYearId && termId && grades.length > 0 && hasClassrooms && subjects.length === 0 && (
        <AcademicModuleEmptyState
          icon={BookOpen}
          title={tEmpty("no_subjects.title")}
          description={tEmpty("no_subjects.description")}
          ctaLabel={tEmpty("no_subjects.cta")}
          onCtaClick={() => router.push("/academics/subjects")}
        />
      )}

      {!isLoading &&
        academicYearId &&
        termId &&
        grades.length > 0 &&
        hasClassrooms &&
        subjects.length > 0 &&
        !hasSubjectWeeklyHours && (
          <AcademicModuleEmptyState
            icon={Clock}
            title={tEmpty("no_subject_weekly_hours.title")}
            description={tEmpty("no_subject_weekly_hours.description")}
            ctaLabel={tEmpty("no_subject_weekly_hours.cta")}
            onCtaClick={() => router.push("/academics/subjects")}
          />
        )}

      {!isLoading &&
        academicYearId &&
        termId &&
        grades.length > 0 &&
        hasClassrooms &&
        subjects.length > 0 &&
        hasSubjectWeeklyHours &&
        teachers.length === 0 && (
          <AcademicModuleEmptyState
            icon={Users}
            title={tEmpty("no_teachers.title")}
            description={tEmpty("no_teachers.description")}
          />
        )}

      {/* Main Content */}
      {!isLoading &&
        academicYearId &&
        termId &&
        grades.length > 0 &&
        hasClassrooms &&
        subjects.length > 0 &&
        hasSubjectWeeklyHours &&
        teachers.length > 0 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-[1400px] mx-auto px-2">
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => onTabChange(newValue)}
                  sx={{
                    minHeight: 48,
                    "& .MuiTab-root": {
                      minHeight: 48,
                      textTransform: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--color-text-secondary, #6b7280)",
                      "&.Mui-selected": {
                        color: "var(--color-primary, #006D82)",
                      },
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "var(--color-primary, #006D82)",
                    },
                  }}
                >
                  <Tab
                    label={
                      <div className="flex items-center gap-2 p-2">
                        <Grid3x3 className="w-5 h-5" />
                        <span className="text-[16px] font-semibold">
                          {t("tabs.matrix")}
                        </span>
                      </div>
                    }
                    value="matrix"
                  />
                  <Tab
                    label={
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[16px] font-semibold">
                          {t("tabs.load")}
                        </span>
                      </div>
                    }
                    value="load"
                  />
                </Tabs>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "matrix" && (
                <AllocationMatrixView
                  termId={termId}
                  yearName={yearName}
                  termName={termName}
                  grades={grades}
                  sections={sections}
                  classrooms={classrooms}
                  subjects={subjects}
                  subjectAllocations={subjectAllocations}
                  teachers={teachers}
                  teacherRoleId={teacherRoleId}
                  teacherAllocations={teacherAllocations}
                  isReadOnly={isReadOnly}
                  onRefresh={onRefresh}
                  onValidate={onValidate}
                  onAllocationsChange={onAllocationsChange}
                />
              )}
              {activeTab === "load" && (
                <TeacherLoadView
                  termId={termId}
                  teachers={teachers}
                />
              )}
            </div>
          </div>
        )}

      {/* Validation Panel */}
      <ValidationPanel
        open={validationPanelOpen}
        onClose={onCloseValidationPanel}
        termId={termId}
        gradeId={validationGradeId}
        subjectId={validationSubjectId}
      />

    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-md px-6 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

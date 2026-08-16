"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import StudentProgressCard from "../components/StudentProgressCard";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getStudentReinforcementProgress } from "../services/reinforcementOverviewService";
import type { StudentReinforcementProgress } from "../types";

interface StudentReinforcementProgressPageProps {
  studentId: string;
}

function AccessNotice() {
  const t = useTranslations("reinforcement.common");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentReinforcementProgressPage({
  studentId,
}: StudentReinforcementProgressPageProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  const {
    values,
    setValue,
  } = useReinforcementUrlFilters({
    paramKeys: ["academicYearId", "termId", "stageId", "gradeId", "sectionId", "classroomId", "studentId", "enrollmentId"],
    defaults: { studentId },
  });

  // ─── Academic context derived from URL params ────────────────────────────
  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId: values.academicYearId || undefined,
      termId: values.termId || undefined,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
      studentId: values.studentId || studentId || undefined,
      enrollmentId: values.enrollmentId || undefined,
    }),
    [values.academicYearId, values.termId, values.stageId, values.gradeId, values.sectionId, values.classroomId, values.studentId, values.enrollmentId, studentId],
  );

  const [progress, setProgress] = useState<StudentReinforcementProgress | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canView = hasPermission("reinforcement.overview.view");

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      termId: context.termId,
    }),
    [context.academicYearId, context.termId],
  );

  const refreshProgress = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const nextProgress = await getStudentReinforcementProgress(
        context.studentId || studentId,
        params,
      );
      setProgress(nextProgress);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : t("common.error"),
      );
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [canView, context.studentId, params, studentId, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshProgress);
  }, [refreshProgress]);

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={t("overview.studentProgress")}
        description={t("overview.studentProgressDescription")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={loading}
            onClick={refreshProgress}
          >
            {t("actions.refresh")}
          </Button>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <ReinforcementAcademicContextFilter
          value={context}
          showSubject={false}
          showStudent
          onChange={(selection: ReinforcementAcademicContextSelection) => {
            setValue("academicYearId", selection.academicYearId || "");
            setValue("termId", selection.termId || "");
            setValue("stageId", selection.stageId || "");
            setValue("gradeId", selection.gradeId || "");
            setValue("sectionId", selection.sectionId || "");
            setValue("classroomId", selection.classroomId || "");
            setValue("studentId", selection.studentId || studentId || "");
            setValue("enrollmentId", selection.enrollmentId || "");
          }}
        />
      </section>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {loading && !progress ? (
        <MainLoader />
      ) : progress ? (
        <StudentProgressCard progress={progress} />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          {t("emptyStates.studentProgress")}
        </div>
      )}
    </div>
  );
}

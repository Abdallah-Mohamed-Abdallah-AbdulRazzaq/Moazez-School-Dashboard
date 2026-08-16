"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import StudentEnrollmentMissingState from "@/features/students-guardians/students/components/StudentEnrollmentMissingState";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";
import StudentProgressCard from "@/features/reinforcement/components/StudentProgressCard";
import { getStudentReinforcementProgress } from "@/features/reinforcement/services/reinforcementOverviewService";
import type { StudentReinforcementProgress } from "@/features/reinforcement/types";
import { isStudentEnrollmentNotFoundError } from "@/features/students-guardians/students/utils/studentProfileErrors";
import { usePermissions } from "@/hooks/usePermissions";

interface ReinforcementProgressTabProps {
  studentId: string;
  academicYearId?: string | null;
  termId?: string | null;
}

export default function ReinforcementProgressTab({
  studentId,
  academicYearId,
  termId,
}: ReinforcementProgressTabProps) {
  const t = useTranslations("reinforcement");
  const { hasPermission, isPermissionsReady } = usePermissions();
  const [progress, setProgress] = useState<StudentReinforcementProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrollmentMissing, setIsEnrollmentMissing] = useState(false);
  const canView = isPermissionsReady && hasPermission("reinforcement.overview.view");
  const fallbackError = t("common.error");
  const params = useMemo(
    () => ({
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
    }),
    [academicYearId, termId],
  );

  const loadProgress = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    setIsEnrollmentMissing(false);
    try {
      setProgress(await getStudentReinforcementProgress(studentId, params));
    } catch (caught) {
      setProgress(null);
      if (isStudentEnrollmentNotFoundError(caught)) {
        setIsEnrollmentMissing(true);
      } else {
        setError(caught instanceof Error ? caught.message : fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [canView, fallbackError, params, studentId]);

  useEffect(() => {
    if (isPermissionsReady) void Promise.resolve().then(loadProgress);
  }, [isPermissionsReady, loadProgress]);

  if (!isPermissionsReady) {
    return <StudentTabSkeleton variant="dashboard" />;
  }

  if (!canView) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5" aria-hidden="true" />
          <div><h2 className="font-semibold">{t("common.accessDenied")}</h2><p className="mt-1 text-sm">{t("common.unauthorized")}</p></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <StudentTabSkeleton variant="dashboard" />;
  }

  if (isEnrollmentMissing) {
    return <StudentEnrollmentMissingState />;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" /><p className="text-sm">{error}</p></div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadProgress()}>{t("actions.retry")}</Button>
      </div>
    );
  }

  return progress ? (
    <StudentProgressCard progress={progress} />
  ) : (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-sm text-gray-500">
      {t("emptyStates.studentProgress")}
    </div>
  );
}

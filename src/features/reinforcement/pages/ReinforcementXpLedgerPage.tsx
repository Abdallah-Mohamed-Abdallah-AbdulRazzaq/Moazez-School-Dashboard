"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Coins, Minus, Plus, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ManualXpGrantModal from "../components/ManualXpGrantModal";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import XpLedgerTable from "../components/XpLedgerTable";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import {
  getXpSummary,
  grantManualXp,
  listXpLedger,
} from "../services/reinforcementXpService";
import type { ManualXpGrantPayload, XpLedgerEntry, XpSummary } from "../types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v?: string): v is string => !!v && UUID_RE.test(v);

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

export default function ReinforcementXpLedgerPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  const {
    values,
    setValue,
  } = useReinforcementUrlFilters({
    paramKeys: ["stageId", "gradeId", "sectionId", "classroomId", "studentId", "enrollmentId"],
    defaults: {},
  });

  // Academic year and term come from the shared layout context.
  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId,
      termId,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
      studentId: values.studentId || undefined,
      enrollmentId: values.enrollmentId || undefined,
    }),
    [academicYearId, termId, values.stageId, values.gradeId, values.sectionId, values.classroomId, values.studentId, values.enrollmentId],
  );

  const [entries, setEntries] = useState<XpLedgerEntry[]>([]);
  const [summary, setSummary] = useState<XpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);

  const canView = hasPermission("reinforcement.xp.view");
  const canManage = hasPermission("reinforcement.xp.manage");

  const params = useMemo(
    () => ({
      academicYearId: isUUID(context.academicYearId) ? context.academicYearId : undefined,
      termId: isUUID(context.termId) ? context.termId : undefined,
      stageId: isUUID(context.stageId) ? context.stageId : undefined,
      gradeId: isUUID(context.gradeId) ? context.gradeId : undefined,
      sectionId: isUUID(context.sectionId) ? context.sectionId : undefined,
      studentId: isUUID(context.studentId) ? context.studentId : undefined,
      classroomId: isUUID(context.classroomId) ? context.classroomId : undefined,
      limit: 50,
    }),
    [
      context.academicYearId,
      context.classroomId,
      context.gradeId,
      context.sectionId,
      context.stageId,
      context.studentId,
      context.termId,
    ],
  );

  const summaryParams = useMemo(
    () => ({
      academicYearId: isUUID(context.academicYearId) ? context.academicYearId : undefined,
      termId: isUUID(context.termId) ? context.termId : undefined,
      stageId: isUUID(context.stageId) ? context.stageId : undefined,
      gradeId: isUUID(context.gradeId) ? context.gradeId : undefined,
      sectionId: isUUID(context.sectionId) ? context.sectionId : undefined,
      classroomId: isUUID(context.classroomId) ? context.classroomId : undefined,
      studentId: isUUID(context.studentId) ? context.studentId : undefined,
    }),
    [
      context.academicYearId,
      context.classroomId,
      context.gradeId,
      context.sectionId,
      context.stageId,
      context.studentId,
      context.termId,
    ],
  );

  const refreshLedger = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const { academicYearId, termId, ...scopeParams } = summaryParams;
      const summaryRequest =
        academicYearId &&
        termId &&
        isUUID(academicYearId) &&
        isUUID(termId)
          ? getXpSummary({ academicYearId, termId, ...scopeParams })
          : Promise.resolve(null);
      const [ledgerResponse, nextSummary] = await Promise.all([
        listXpLedger(params),
        summaryRequest,
      ]);
      setEntries(ledgerResponse.items);
      setSummary(nextSummary as XpSummary | null);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, summaryParams, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshLedger);
  }, [refreshLedger]);

  const handleGrant = async (payload: ManualXpGrantPayload) => {
    try {
      await grantManualXp(payload);
      showSuccess(t("xp.messages.granted"));
      setGrantOpen(false);
      await refreshLedger();
    } catch (nextError) {
      throw nextError;
    }
  };

  const buildStudentProgressHref = useCallback(
    (entry: XpLedgerEntry) => {
      if (!entry.studentId) return undefined;

      const query = new URLSearchParams();
      const academicYearId = entry.academicYearId || context.academicYearId;
      const termId = entry.termId || context.termId;

      if (academicYearId) query.set("academicYearId", academicYearId);
      if (termId) query.set("termId", termId);
      if (context.classroomId) query.set("classroomId", context.classroomId);

      const queryString = query.toString();
      return `/${locale}/reinforcement/students/${entry.studentId}/progress${
        queryString ? `?${queryString}` : ""
      }`;
    },
    [context.academicYearId, context.classroomId, context.termId, locale],
  );

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={t("xp.ledgerTitle")}
        description={t("xp.ledgerDescription")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshLedger}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setGrantOpen(true)}
              >
                {t("actions.grantXp")}
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("xp.ledgerFilters")}
        </h2>
        <div className="mt-4">
          <ReinforcementAcademicContextFilter
            value={context}
            showAcademicYearTerm={false}
            showSubject={false}
            showStudent
            onChange={(selection: ReinforcementAcademicContextSelection) => {
              setValue("stageId", selection.stageId || "");
              setValue("gradeId", selection.gradeId || "");
              setValue("sectionId", selection.sectionId || "");
              setValue("classroomId", selection.classroomId || "");
              setValue("studentId", selection.studentId || "");
              setValue("enrollmentId", selection.enrollmentId || "");
            }}
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KPICardV2
          title={t("xp.summary.totalXp")}
          value={Number(summary?.totalXp) || 0}
          icon={Sparkles}
          iconColor="#d97706"
          iconBgColor="#fef3c7"
          showChart={false}
        />
        <KPICardV2
          title={t("xp.summary.studentsCount")}
          value={Number(summary?.studentsCount) || 0}
          icon={Coins}
          iconColor="#16a34a"
          iconBgColor="#dcfce7"
          showChart={false}
        />
        <KPICardV2
          title={t("xp.summary.averageXp")}
          value={Number(summary?.averageXp) || 0}
          icon={Minus}
          iconColor="#ef4444"
          iconBgColor="#fef2f2"
          showChart={false}
        />
      </section>

      <XpLedgerTable
        entries={entries}
        loading={loading}
        getStudentProgressHref={buildStudentProgressHref}
      />

      <ManualXpGrantModal
        isOpen={grantOpen}
        context={context}
        onClose={() => setGrantOpen(false)}
        onSubmit={handleGrant}
      />
    </div>
  );
}

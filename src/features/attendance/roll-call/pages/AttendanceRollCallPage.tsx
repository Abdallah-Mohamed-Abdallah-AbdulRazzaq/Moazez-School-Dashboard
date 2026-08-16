"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { CalendarDays, Filter } from "lucide-react";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import ScopeBreadcrumb from "@/features/attendance/shared/components/ScopeBreadcrumb";
import AttendanceReadOnlyBanner from "@/features/attendance/shared/components/AttendanceReadOnlyBanner";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import {
  AttendanceWorkspaceContentPanel,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceRail,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceState,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
import SessionPickerPanel from "../components/SessionPickerPanel";
import RosterFiltersBar, {
  type RosterFilters,
} from "../components/RosterFiltersBar";
import RollCallFiltersDrawer from "../components/RollCallFiltersDrawer";
import RollCallHeaderBar from "../components/RollCallHeaderBar";
import AttendanceKpisBar from "../components/AttendanceKpisBar";
import RosterTable from "../components/RosterTable";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import { useAttendanceGuardedYearTermChange } from "@/features/attendance/shared/hooks/useAttendanceGuardedYearTermChange";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSessions,
} from "../services/attendanceRollCallService";
import { fetchEffectiveAttendancePolicy } from "@/features/attendance/policies/services/attendancePolicyService";
import {
  RollCallSubmissionError,
  useRollCallSessionWorkspace,
} from "../hooks/useRollCallSessionWorkspace";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import { getRollCallTimetableConfigRequest } from "../utils/policyTimetableConfig";
import { getRollCallContextKey } from "../utils/rollCallContextKey";
import {
  formatLocalDate,
  isTimetableDateActive,
  parseLocalDate,
} from "../utils/localDate";
import { exportAttendanceSession } from "../utils/attendanceExport";
import { computeAttendanceKpis } from "../utils/attendanceKpis";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  generateAttendanceExportFilename,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import {
  isScopeSelectionComplete,
  type AttendanceScopeIds,
} from "@/features/attendance/shared/attendanceScope";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import type {
  AttendanceEntry,
  AttendanceSessionMode,
  AttendanceStatus,
} from "../types";
import MainLoader from "@/components/ui/loaders/MainLoader";

export default function AttendanceRollCallPage() {
  const t = useTranslations("attendance.rollCall");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();

  // Use unified term context
  const termContext = useAttendanceYearTermLayoutContext();

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Session picker state
  const [scopeType, setScopeType] = useState<AttendanceScopeType>("SECTION");
  const [scopeIds, setScopeIds] = useState<AttendanceScopeIds>({});
  const [date, setDate] = useState(() => formatLocalDate(new Date()));

  // Policy & timetable
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [periods, setPeriods] = useState<
    import("@/features/academics/timetable/types/timetableConfig").TimetablePeriod[]
  >([]);
  const [activeDayIndexes, setActiveDayIndexes] = useState<number[] | undefined>();
  const [readyContextKey, setReadyContextKey] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [derivedPeriodSessions, setDerivedPeriodSessions] = useState<
    import("../types").AttendanceSession[]
  >([]);

  // UI state
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [contextError, setContextError] = useState<Error | null>(null);
  const [contextRetryToken, setContextRetryToken] = useState(0);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showUnsubmitConfirm, setShowUnsubmitConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const { values, setValues, reset } = useUrlQueryState<{
    search: string;
    status: string;
    excuseCompleteness: string;
    lateMin: string;
    earlyLeaveMin: string;
  }>({
    defaults: {
      search: "",
      status: "ALL",
      excuseCompleteness: "ALL",
      lateMin: "",
      earlyLeaveMin: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: (current) => {
      const nextUpdates: Partial<Record<keyof typeof current, string | null>> =
        {};
      const validStatuses = [
        "ALL",
        "UNMARKED",
        "PRESENT",
        "ABSENT",
        "LATE",
        "EXCUSED",
        "EARLY_LEAVE",
      ] satisfies Array<"ALL" | "UNMARKED" | AttendanceStatus>;
      const validExcuseCompleteness = ["ALL", "COMPLETE", "MISSING"];

      if (
        !validStatuses.includes(
          current.status as (typeof validStatuses)[number],
        )
      ) {
        nextUpdates.status = null;
      }

      if (!validExcuseCompleteness.includes(current.excuseCompleteness)) {
        nextUpdates.excuseCompleteness = null;
      }

      const lateMin = current.lateMin.trim();
      if (lateMin && (!/^\d+$/.test(lateMin) || Number(lateMin) < 0)) {
        nextUpdates.lateMin = null;
      }

      const earlyLeaveMin = current.earlyLeaveMin.trim();
      if (
        earlyLeaveMin &&
        (!/^\d+$/.test(earlyLeaveMin) || Number(earlyLeaveMin) < 0)
      ) {
        nextUpdates.earlyLeaveMin = null;
      }

      return Object.keys(nextUpdates).length > 0 ? nextUpdates : null;
    },
  });

  const filters = useMemo<RosterFilters>(() => {
    const parseMinutes = (value: string) => {
      if (!value) {
        return undefined;
      }

      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    return {
      search: values.search,
      status: values.status as RosterFilters["status"],
      excuseCompleteness:
        values.excuseCompleteness as RosterFilters["excuseCompleteness"],
      lateMin: parseMinutes(values.lateMin),
      earlyLeaveMin: parseMinutes(values.earlyLeaveMin),
    };
  }, [values]);

  const setFilters = useCallback(
    (nextFilters: RosterFilters) => {
      const onlySearchChanged =
        nextFilters.search !== filters.search &&
        nextFilters.status === filters.status &&
        nextFilters.excuseCompleteness === filters.excuseCompleteness &&
        nextFilters.lateMin === filters.lateMin &&
        nextFilters.earlyLeaveMin === filters.earlyLeaveMin;

      setValues(
        {
          search: nextFilters.search || null,
          status: nextFilters.status,
          excuseCompleteness: nextFilters.excuseCompleteness || "ALL",
          lateMin:
            nextFilters.lateMin !== undefined
              ? String(nextFilters.lateMin)
              : null,
          earlyLeaveMin:
            nextFilters.earlyLeaveMin !== undefined
              ? String(nextFilters.earlyLeaveMin)
              : null,
        },
        onlySearchChanged ? "replace" : "push",
      );
    },
    [filters, setValues],
  );

  const periodData = periods.find((period) => period.id === selectedPeriodId);
  const contextKey = useMemo(
    () =>
      getRollCallContextKey({
        yearId: termContext.yearId ?? undefined,
        termId: termContext.termId ?? undefined,
        date,
        scopeType,
        scopeIds,
      }),
    [date, scopeIds, scopeType, termContext.termId, termContext.yearId],
  );
  const isContextReady = readyContextKey === contextKey;
  const usesDerivedPeriodSessions =
    policy?.mode === "DAILY" &&
    policy.dailyComputationStrategy === "DERIVED_FROM_PERIODS";
  const isSelectedDateActive =
    !activeDayIndexes ||
    isTimetableDateActive(parseLocalDate(date), activeDayIndexes);
  const rollCallMode: AttendanceSessionMode = usesDerivedPeriodSessions
    ? "PERIOD"
    : policy?.mode || "DAILY";
  const sessionSelection = useMemo(
    () => ({
      yearId: termContext.yearId ?? undefined,
      termId: termContext.termId ?? undefined,
      date,
      scopeType,
      scopeIds,
      mode: rollCallMode,
      periodId: selectedPeriodId ?? undefined,
      periodIndex: periodData?.index,
      periodNameAr: periodData?.nameAr,
      periodNameEn: periodData?.nameEn,
      enabled:
        Boolean(policy) &&
        isContextReady &&
        isSelectedDateActive &&
        isScopeSelectionComplete(scopeType, scopeIds) &&
        (rollCallMode !== "PERIOD" || Boolean(selectedPeriodId)),
    }),
    [
      date,
      periodData,
      policy,
      isContextReady,
      isSelectedDateActive,
      rollCallMode,
      scopeIds,
      scopeType,
      selectedPeriodId,
      termContext.termId,
      termContext.yearId,
    ],
  );
  const rollCall = useRollCallSessionWorkspace(sessionSelection);
  const { roster, session, entries, isDirty } = rollCall;
  const setEntries = rollCall.setEntries;
  const { saveDraft, submitDraft, unsubmit, resetDraft } = rollCall;
  const isReadOnly = termContext.isReadOnly;
  const canManageSessions = hasPermission("attendance.sessions.manage");
  const canManageEntries = hasPermission("attendance.entries.manage");
  const canSubmitSessions = hasPermission("attendance.sessions.submit");
  const isSubmitted = session?.status === "SUBMITTED";
  const derivedPeriodStatuses = useMemo(() => {
    const statuses: Record<string, "DRAFT" | "SUBMITTED"> = {};

    for (const derivedSession of derivedPeriodSessions) {
      if (derivedSession.periodId) {
        statuses[derivedSession.periodId] = derivedSession.status;
      }
    }

    if (usesDerivedPeriodSessions && session?.periodId) {
      statuses[session.periodId] = session.status;
    }

    return statuses;
  }, [derivedPeriodSessions, session, usesDerivedPeriodSessions]);
  const canReopenForEdit =
    Boolean(isSubmitted) &&
    !isReadOnly &&
    termContext.termStatus !== "closed" &&
    canSubmitSessions;
  const shouldGuardNavigation = isDirty && !isReadOnly && !isSubmitted;
  const suppressNextPopStateRef = useRef(false);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  // Compute KPIs
  const kpis = useMemo(() => {
    return computeAttendanceKpis(roster, entries);
  }, [roster, entries]);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return roster.filter((student) => {
      const entry = entries.find((e) => e.studentId === student.id);

      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const nameMatch =
          student.nameAr.toLowerCase().includes(query) ||
          student.nameEn.toLowerCase().includes(query) ||
          student.studentNumber.toLowerCase().includes(query);
        if (!nameMatch) return false;
      }

      // Status filter
      if (filters.status !== "ALL") {
        if (filters.status === "UNMARKED" && entry?.status !== "UNMARKED")
          return false;
        if (filters.status !== "UNMARKED" && entry?.status !== filters.status)
          return false;
      }

      // Excuse completeness filter
      if (filters.excuseCompleteness && filters.excuseCompleteness !== "ALL") {
        if (entry?.status !== "EXCUSED") return false;
        const hasReason = !!entry.excuseReason;
        const hasAttachment = (entry.excuseAttachments?.length ?? 0) > 0;
        const isComplete =
          hasReason && (!policy?.requireAttachmentForExcuse || hasAttachment);

        if (filters.excuseCompleteness === "COMPLETE" && !isComplete)
          return false;
        if (filters.excuseCompleteness === "MISSING" && isComplete)
          return false;
      }

      // Late minutes filter
      if (filters.lateMin !== undefined) {
        if (
          entry?.status !== "LATE" ||
          !entry.minutesLate ||
          entry.minutesLate < filters.lateMin
        ) {
          return false;
        }
      }

      // Early leave minutes filter
      if (filters.earlyLeaveMin !== undefined) {
        if (
          entry?.status !== "EARLY_LEAVE" ||
          !entry.minutesEarlyLeave ||
          entry.minutesEarlyLeave < filters.earlyLeaveMin
        ) {
          return false;
        }
      }

      return true;
    });
  }, [roster, entries, filters, policy]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "ALL" ||
    filters.excuseCompleteness !== "ALL" ||
    filters.lateMin !== undefined ||
    filters.earlyLeaveMin !== undefined;

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      void Promise.resolve().then(() => setShowFilters(true));
    }
  }, [hasActiveFilters, showFilters]);

  // Load structure tree
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) {
      void Promise.resolve().then(() => setIsContextLoading(false));
      return;
    }

    let cancelled = false;
    const loadStructure = async () => {
      try {
        const tree = await fetchStructureTree(
          termContext.yearId!,
          termContext.termId!,
        );
        if (cancelled) return;
        setStages(tree.stages);
        setGrades(tree.grades);
        setSections(tree.sections);
        setClassrooms(tree.classrooms);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load structure:", error);
        setContextError(
          error instanceof Error ? error : new Error("structure-load-failed"),
        );
      }
    };

    loadStructure();
    return () => {
      cancelled = true;
    };
  }, [contextRetryToken, termContext.yearId, termContext.termId]);

  // Load policy and timetable when scope/date changes
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId || !date) {
      void Promise.resolve().then(() => setReadyContextKey(null));
      void Promise.resolve().then(() => setIsContextLoading(false));
      return;
    }

    if (!isScopeSelectionComplete(scopeType, scopeIds)) {
      void Promise.resolve().then(() => setReadyContextKey(null));
      void Promise.resolve().then(() => setPolicy(null));
      void Promise.resolve().then(() => setPeriods([]));
      void Promise.resolve().then(() => setActiveDayIndexes(undefined));
      void Promise.resolve().then(() => setIsContextLoading(false));
      return;
    }

    let cancelled = false;
    const loadPolicyAndTimetable = async () => {
      try {
        setIsContextLoading(true);
        setReadyContextKey(null);
        setContextError(null);
        const effectivePolicy = await fetchEffectiveAttendancePolicy({
          yearId: termContext.yearId!,
          termId: termContext.termId!,
          scopeType,
          scopeIds,
          date,
        });
        if (cancelled) return;
        setPolicy(effectivePolicy);

        const usesDerivedPeriods =
          effectivePolicy?.mode === "DAILY" &&
          effectivePolicy.dailyComputationStrategy === "DERIVED_FROM_PERIODS";

        const timetableRequest = effectivePolicy
          ? getRollCallTimetableConfigRequest(
              scopeType,
              scopeIds,
              termContext.yearId!,
              termContext.termId!,
            )
          : null;
        const timetableConfig = timetableRequest
          ? await fetchTimetableConfig(timetableRequest)
          : null;
        if (cancelled) return;
        setActiveDayIndexes(
          timetableConfig?.days
            .filter((day) => day.isActive)
            .map((day) => day.index),
        );

        // Derived daily policies still require period sessions. The backend
        // derives the daily result from their submitted entries.
        if (effectivePolicy?.mode === "PERIOD" || usesDerivedPeriods) {
          const policyPeriodIds = new Set(
            effectivePolicy?.selectedPeriodIds || [],
          );
          const allowedPeriods =
            policyPeriodIds.size > 0
              ? (timetableConfig?.periods || []).filter((period) =>
                  policyPeriodIds.has(period.id),
                )
              : timetableConfig?.periods || [];
          setPeriods(allowedPeriods);

          // Keep the current period only while it remains allowed by policy.
          setSelectedPeriodId(
            (current) =>
              current && allowedPeriods.some((period) => period.id === current)
                ? current
                : allowedPeriods[0]?.id ?? null,
          );
        } else {
          setPeriods([]);
          setSelectedPeriodId(null);
        }
        setReadyContextKey(contextKey);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load policy/timetable:", error);
        setPolicy(null);
        setPeriods([]);
        setActiveDayIndexes(undefined);
        setContextError(
          error instanceof Error
            ? error
            : new Error("attendance-context-load-failed"),
        );
      } finally {
        if (!cancelled) setIsContextLoading(false);
      }
    };

    loadPolicyAndTimetable();
    return () => {
      cancelled = true;
    };
  }, [
    termContext.yearId,
    termContext.termId,
    contextRetryToken,
    contextKey,
    scopeType,
    scopeIds,
    date,
  ]);

  useEffect(() => {
    if (
      !usesDerivedPeriodSessions ||
      !policy?.id ||
      !termContext.yearId ||
      !termContext.termId ||
      !date ||
      !isScopeSelectionComplete(scopeType, scopeIds)
    ) {
      void Promise.resolve().then(() => setDerivedPeriodSessions([]));
      return;
    }

    const yearId = termContext.yearId;
    const termId = termContext.termId;
    const policyId = policy.id;
    let cancelled = false;
    const loadDerivedPeriodSessions = async () => {
      try {
        const sessions = await fetchSessions(
          yearId,
          termId,
          date,
          date,
          { scopeType, scopeIds },
        );
        if (cancelled) return;

        setDerivedPeriodSessions(
          sessions.filter(
            (candidate) =>
              candidate.mode === "PERIOD" && candidate.policyId === policyId,
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load derived period sessions:", error);
          setDerivedPeriodSessions([]);
        }
      }
    };

    void loadDerivedPeriodSessions();
    return () => {
      cancelled = true;
    };
  }, [
    date,
    policy?.id,
    scopeIds,
    scopeType,
    termContext.termId,
    termContext.yearId,
    usesDerivedPeriodSessions,
  ]);

  // Handle entry change
  const handleEntryChange = useCallback(
    (studentId: string, updates: Partial<AttendanceEntry>) => {
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.studentId === studentId);

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        } else {
          // Create new
          const newEntry: AttendanceEntry = {
            id: `${session?.id || "preview"}:${studentId}`,
            sessionId: session?.id || "",
            studentId,
            status: updates.status || "PRESENT",
            minutesLate: updates.minutesLate,
            minutesEarlyLeave: updates.minutesEarlyLeave,
            note: updates.note,
            updatedAt: new Date().toISOString(),
          };
          return [...prev, newEntry];
        }
      });
    },
    [session, setEntries],
  );

  // Save
  const handleSave = useCallback(async () => {
    if (!session) return;

    try {
      await saveDraft();
      showSuccess(t("messages.saved"));
    } catch (error) {
      console.error("Failed to save:", error);
      showError(tCommon("error_saving"));
    }
  }, [session, saveDraft, t, tCommon, showSuccess, showError]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!session) return;

    // Check completion
    if (kpis.unmarkedCount > 0) {
      const confirmed = window.confirm(
        t("messages.submitIncomplete", { count: kpis.unmarkedCount }),
      );
      if (!confirmed) return;
    }

    try {
      await submitDraft();
      showSuccess(t("messages.submitted"));
    } catch (error) {
      console.error("Failed to submit:", error);
      showError(
        error instanceof RollCallSubmissionError
          ? t("workspace.submitError")
          : tCommon("error_saving"),
      );
    }
  }, [
    session,
    kpis,
    submitDraft,
    t,
    tCommon,
    showSuccess,
    showError,
  ]);

  // Unsubmit
  const handleUnsubmit = useCallback(async () => {
    if (!session) return;

    try {
      await unsubmit();
      showSuccess(t("messages.unsubmittedSuccess"));
    } catch (error) {
      console.error("Failed to unsubmit:", error);
      showError(tCommon("error_saving"));
    }
  }, [session, unsubmit, t, tCommon, showSuccess, showError]);

  const handleUnsubmitConfirm = useCallback(() => {
    setShowUnsubmitConfirm(false);
    handleUnsubmit();
  }, [handleUnsubmit]);

  // Reset
  const handleReset = useCallback(() => {
    resetDraft();
  }, [resetDraft]);

  // Export
  const handleLegacyExport = useCallback(() => {
    if (!session) return;

    const scopeName = getAttendanceScopeLabel({
      scopeType,
      scopeIds,
      stages,
      grades,
      sections,
      classrooms,
      locale,
    });
    exportAttendanceSession({
      session,
      entries,
      roster,
      locale,
      scopeName,
    });
  }, [
    classrooms,
    entries,
    grades,
    locale,
    roster,
    scopeIds,
    scopeType,
    sections,
    session,
    stages,
  ]);

  const selectedYearName =
    (locale === "ar"
      ? termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameAr
      : termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameEn) ||
    termContext.yearId ||
    "";

  const selectedTermName = term
    ? locale === "ar"
      ? term.nameAr || term.name
      : term.nameEn || term.name
    : "";

  const handleExport = useCallback(
    async (format: AttendanceExportFormat) => {
      if (!session) return;

      const scopeName = getAttendanceScopeLabel({
        scopeType,
        scopeIds,
        stages,
        grades,
        sections,
        classrooms,
        locale,
      });

      if (format === "excel") {
        handleLegacyExport();
        return;
      }

      const columns: ExportColumn[] = [
        {
          key: "studentNumber",
          label: locale === "ar" ? "رقم الطالب" : "Student Number",
        },
        { key: "studentName", label: locale === "ar" ? "الطالب" : "Student" },
        {
          key: "studentNameEn",
          label: locale === "ar" ? "الطالب (بالإنجليزية)" : "Student (English)",
        },
        {
          key: "studentNameAr",
          label: locale === "ar" ? "الطالب (بالعربية)" : "Student (Arabic)",
        },
        { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
        {
          key: "minutesLate",
          label: locale === "ar" ? "دقائق التأخير" : "Minutes Late",
        },
        {
          key: "minutesEarlyLeave",
          label:
            locale === "ar" ? "دقائق المغادرة المبكرة" : "Minutes Early Leave",
        },
        {
          key: "excuseReason",
          label: locale === "ar" ? "سبب العذر" : "Excuse Reason",
        },
        { key: "note", label: locale === "ar" ? "ملاحظة" : "Note" },
      ];

      const rowsForExport = filteredRoster.map((student) => {
        const entry = entries.find((item) => item.studentId === student.id);
        return {
          studentNumber: student.studentNumber,
          studentName: locale === "ar" ? student.nameAr : student.nameEn,
          studentNameEn: student.nameEn,
          studentNameAr: student.nameAr,
          status: entry?.status || "UNMARKED",
          minutesLate: entry?.minutesLate ?? "",
          minutesEarlyLeave: entry?.minutesEarlyLeave ?? "",
          excuseReason: entry?.excuseReason || "",
          note: entry?.note || "",
        };
      });

      exportAttendanceData({
        title:
          locale === "ar"
            ? session.mode === "DAILY"
              ? "كشف الحضور المباشر"
              : `كشف الحضور - ${session.periodNameAr || session.periodIndex || ""}`
            : session.mode === "DAILY"
              ? "Roll Call"
              : `Roll Call - ${session.periodNameEn || session.periodIndex || ""}`,
        metadata: {
          yearName: selectedYearName,
          termName: selectedTermName,
          scopeTypeName: scopeType,
          scopeName,
          dateLabel: session.date,
          viewName: locale === "ar" ? "الحضور المباشر" : "Roll Call",
          exportDate: formatAttendanceExportDate(locale),
        },
        filename: generateAttendanceExportFilename(
          "attendance-roll-call",
          termContext.termId || undefined,
          scopeType.toLowerCase(),
        ),
        format,
        columns,
        rows: rowsForExport,
        jsonData: {
          title: "Attendance Roll Call",
          metadata: {
            yearName:
              termContext.academicYears.find(
                (item) => item.id === termContext.yearId,
              )?.nameEn ||
              termContext.yearId ||
              "",
            termName: term?.nameEn || term?.name || "",
            scopeTypeName: scopeType,
            scopeName: getAttendanceScopeLabel({
              scopeType,
              scopeIds,
              stages,
              grades,
              sections,
              classrooms,
              locale: "en",
            }),
            dateLabel: session.date,
            viewName: "Roll Call",
            exportDate: formatAttendanceExportDate("en"),
          },
          filters: {
            search: filters.search,
            status: filters.status,
            excuseCompleteness: filters.excuseCompleteness,
            lateMin: filters.lateMin,
            earlyLeaveMin: filters.earlyLeaveMin,
          },
          session,
          scope: { scopeType, scopeIds },
          policy: policy
            ? {
                id: policy.id,
                nameEn: policy.nameEn,
                nameAr: policy.nameAr,
                mode: policy.mode,
              }
            : null,
          roster: filteredRoster.map((student) => {
            const entry = entries.find((item) => item.studentId === student.id);
            return {
              studentId: student.id,
              studentNumber: student.studentNumber,
              studentNameEn: student.nameEn,
              studentNameAr: student.nameAr,
              entry: entry || null,
            };
          }),
        },
        locale,
        emptyMessage: t("empty.noStudentsDesc"),
      });

      showSuccess(t("actions.export"));
    },
    [
      classrooms,
      entries,
      filteredRoster,
      filters.earlyLeaveMin,
      filters.excuseCompleteness,
      filters.lateMin,
      filters.search,
      filters.status,
      grades,
      handleLegacyExport,
      locale,
      policy,
      scopeIds,
      scopeType,
      sections,
      selectedTermName,
      selectedYearName,
      session,
      showSuccess,
      stages,
      t,
      term?.name,
      term?.nameEn,
      termContext.academicYears,
      termContext.termId,
      termContext.yearId,
    ],
  );

  // Bulk actions
  const handleMarkAllPresent = useCallback(() => {
    roster.forEach((student) => {
      handleEntryChange(student.id, { status: "PRESENT" });
    });
  }, [roster, handleEntryChange]);

  const handleClearAll = useCallback(() => {
    setEntries((currentEntries) =>
      currentEntries.map((entry) => ({
        ...entry,
        status: "UNMARKED",
        minutesLate: undefined,
        minutesEarlyLeave: undefined,
        excuseReason: undefined,
        excuseAttachments: undefined,
        note: undefined,
        updatedAt: new Date().toISOString(),
      })),
    );
  }, [setEntries]);

  // Unsaved changes guard
  const checkUnsavedChanges = useCallback(
    (action: () => void) => {
      if (isDirty && !isReadOnly && !isSubmitted) {
        setPendingAction(() => action);
        setShowDiscardDialog(true);
      } else {
        action();
      }
    },
    [isDirty, isReadOnly, isSubmitted],
  );

  const handleDiscardConfirm = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowDiscardDialog(false);
  }, [pendingAction]);

  // Wrapped handlers with unsaved check
  const handleScopeChange = useCallback(
    (newScopeType: AttendanceScopeType) => {
      checkUnsavedChanges(() => {
        setScopeType(newScopeType);
        setScopeIds({});
      });
    },
    [checkUnsavedChanges],
  );

  const handleScopeIdsChange = useCallback(
    (newScopeIds: AttendanceScopeIds) => {
      checkUnsavedChanges(() => setScopeIds(newScopeIds));
    },
    [checkUnsavedChanges],
  );

  const handleDateChange = useCallback(
    (newDate: string) => {
      checkUnsavedChanges(() => setDate(newDate));
    },
    [checkUnsavedChanges],
  );

  const handlePeriodChange = useCallback(
    (periodId: string) => {
      checkUnsavedChanges(() => setSelectedPeriodId(periodId));
    },
    [checkUnsavedChanges],
  );

  const handleResetFilters = () => {
    reset(undefined, "replace");
  };

  useAttendanceGuardedYearTermChange({
    onYearChange: (yearId) => {
      checkUnsavedChanges(() => {
        void termContext.setYearId(yearId);
      });
    },
    onTermChange: (termId) => {
      checkUnsavedChanges(() => {
        termContext.setTermId(termId);
      });
    },
  });

  useEffect(() => {
    if (!shouldGuardNavigation) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        !anchor.href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) return;

      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      const currentPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

      if (nextPath === currentPath) return;

      event.preventDefault();
      checkUnsavedChanges(() => {
        router.push(nextPath);
      });
    };

    const handlePopState = () => {
      if (suppressNextPopStateRef.current) {
        suppressNextPopStateRef.current = false;
        return;
      }

      window.history.go(1);
      checkUnsavedChanges(() => {
        suppressNextPopStateRef.current = true;
        window.history.back();
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [checkUnsavedChanges, router, shouldGuardNavigation]);

  const handleOpenSession = async () => {
    try {
      await rollCall.openSession();
      setShowSessionDrawer(false);
    } catch (error) {
      console.error("Failed to open roll-call session:", error);
      showError(t("workspace.openError"));
    }
  };

  const handleRetryContext = () => {
    setContextRetryToken((value) => value + 1);
  };

  if (isContextLoading && !term) {
    return <MainLoader />;
  }

  const scopeComplete = isScopeSelectionComplete(scopeType, scopeIds);
  const showNoPolicy = scopeComplete && !policy && !isContextLoading;
  const showNoTimetable =
    rollCallMode === "PERIOD" && periods.length === 0 && !isContextLoading;
  const showInactiveDate =
    Boolean(policy) &&
    isContextReady &&
    !isSelectedDateActive &&
    !isContextLoading;
  const pickerDisabled =
    isReadOnly ||
    rollCall.isOpening ||
    rollCall.isSaving;

  const sessionPickerProps = {
    scopeType,
    scopeIds,
    stages,
    grades,
    sections,
    classrooms,
    onScopeChange: handleScopeChange,
    onScopeIdsChange: handleScopeIdsChange,
    date,
    onDateChange: handleDateChange,
    termStartDate: term?.startDate || "",
    termEndDate: term?.endDate || "",
    activeDayIndexes,
    mode: rollCallMode,
    isDailyDerivedFromPeriods: usesDerivedPeriodSessions,
    periods,
    periodStatuses: derivedPeriodStatuses,
    selectedPeriodId,
    onPeriodChange: handlePeriodChange,
    sessionStatus: session?.status || null,
    canReopenForEdit,
    onReopenForEdit: () => setShowUnsubmitConfirm(true),
    lockSessionContext: Boolean(isSubmitted),
    disabled: pickerDisabled,
  };

  let workspaceContent;
  if (contextError) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("workspace.contextError")}
        action={
          <Button onClick={handleRetryContext}>{t("workspace.retry")}</Button>
        }
      />
    );
  } else if (!scopeComplete) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("workspace.chooseSession")}
        description={t("workspace.chooseSessionDescription")}
      />
    );
  } else if (showNoPolicy) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("empty.noPolicy")}
        description={t("empty.noPolicyDesc")}
      />
    );
  } else if (showNoTimetable) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("empty.noTimetable")}
        description={t("empty.noTimetableDesc")}
      />
    );
  } else if (showInactiveDate) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("empty.inactiveDate")}
        description={t("empty.inactiveDateDesc")}
      />
    );
  } else if (rollCall.loadError) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("workspace.previewError")}
        action={
          <Button onClick={rollCall.retryPreview}>
            {t("workspace.retry")}
          </Button>
        }
      />
    );
  } else if (
    !isContextLoading &&
    !rollCall.isPreviewLoading &&
    roster.length === 0
  ) {
    workspaceContent = (
      <AttendanceWorkspaceState
        title={t("empty.noStudents")}
        description={t("empty.noStudentsDesc")}
      />
    );
  } else if (!session && roster.length > 0) {
    workspaceContent = (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--background-secondary)",
          }}
        >
          <div>
            <h3
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("workspace.openSession")}
            </h3>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("workspace.openSessionDescription")}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleOpenSession}
            disabled={isReadOnly || !canManageSessions || rollCall.isOpening}
          >
            {t("workspace.openSession")}
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          <RosterTable
            roster={filteredRoster}
            entries={entries}
            policy={policy}
            onEntryChange={handleEntryChange}
            isReadOnly={true}
            searchQuery={filters.search}
          />
        </div>
      </div>
    );
  } else if (session) {
    workspaceContent = (
      <RosterTable
        roster={filteredRoster}
        entries={entries}
        policy={policy}
        onEntryChange={handleEntryChange}
        isReadOnly={isReadOnly || isSubmitted || !canManageEntries}
        searchQuery={filters.search}
      />
    );
  }

  const mainContent = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {session && roster.length > 0 ? (
        <RollCallHeaderBar
          isDirty={isDirty}
          isReadOnly={isReadOnly || !canManageEntries}
          isSubmitted={isSubmitted}
          canSubmit={canSubmitSessions && !isReadOnly && !isSubmitted}
          canReopenForEdit={canReopenForEdit}
          onSave={handleSave}
          onSubmit={handleSubmit}
          onUnsubmit={() => setShowUnsubmitConfirm(true)}
          onReset={handleReset}
          onExport={() => setShowExportModal(true)}
          onMarkAllPresent={handleMarkAllPresent}
          onClearAll={handleClearAll}
          isSaving={rollCall.isSaving}
        />
      ) : null}

      {roster.length > 0 ? (
        <ScopeBreadcrumb
          scopeType={scopeType}
          scopeIds={scopeIds}
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
        />
      ) : null}

      {session && roster.length > 0 ? <AttendanceKpisBar kpis={kpis} /> : null}

      {session && roster.length > 0 ? (
        <div className="hidden lg:block">
          <RosterFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
        </div>
      ) : null}

      <AttendanceWorkspaceMobileActions columns={2} className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSessionDrawer(true)}
          leftIcon={<CalendarDays className="h-4 w-4" />}
        >
          {t("workspace.sessionAction")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFiltersDrawer(true)}
          leftIcon={<Filter className="h-4 w-4" />}
          disabled={!session}
        >
          {t("filters.openFilters")}
        </Button>
      </AttendanceWorkspaceMobileActions>

      <AttendanceWorkspaceContentPanel
        loading={
          isContextLoading || rollCall.isPreviewLoading || rollCall.isOpening
        }
      >
        {workspaceContent}
      </AttendanceWorkspaceContentPanel>
    </div>
  );

  return (
    <AttendanceWorkspaceShell
      readOnlyBanner={
        isReadOnly ? (
          <AttendanceReadOnlyBanner message={t("readonly_banner")} />
        ) : null
      }
    >
      <AttendanceWorkspaceRail
        rail={<SessionPickerPanel variant="rail" {...sessionPickerProps} />}
        main={mainContent}
      />

      <AttendanceBottomDrawer
        isOpen={showSessionDrawer}
        onClose={() => setShowSessionDrawer(false)}
      >
        <SessionPickerPanel variant="drawer" {...sessionPickerProps} />
      </AttendanceBottomDrawer>

      <RollCallFiltersDrawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={() => setShowFiltersDrawer(false)}
        onReset={handleResetFilters}
      />

      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
        title={t("confirm.discardChangesTitle")}
        description={t("confirm.discardChangesMessage")}
        confirmLabel={tCommon("discard")}
        cancelLabel={tCommon("stay")}
        severity="warning"
      />

      <ConfirmDialog
        isOpen={showUnsubmitConfirm}
        onClose={() => setShowUnsubmitConfirm(false)}
        onConfirm={handleUnsubmitConfirm}
        title={t("confirm.unsubmitTitle")}
        description={t("confirm.unsubmitMessage")}
        confirmLabel={t("confirm.unsubmitConfirm")}
        cancelLabel={tCommon("cancel")}
        severity="warning"
      />

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={filteredRoster.length}
        emptyStateMessage={t("empty.noStudentsDesc")}
      />
    </AttendanceWorkspaceShell>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, X, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { getUploadRules } from "@/utils/upload/validateFile";
import { fetchRoster } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { ExcuseRequest, ExcuseType, AttachmentMeta } from "../types";
import { formatLocalDate } from "../../utils/dateFormatting";
import { getExcusePeriodKeysForSave } from "../utils/excusePeriodSelection";
import { getThresholdState } from "@/features/attendance/shared/policyThresholds";
import { fetchPolicies } from "@/features/attendance/policies/services/attendancePolicyService";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import {
  resolveEffectiveExcuseAttendancePolicy,
  type ExcusePolicyIssue,
} from "../utils/excusePolicyValidation";
import { deriveExcusePolicyState } from "../utils/excusePolicyState";
import { shouldLoadExcusePeriods } from "../utils/excusePeriodLoading";
import { createTimetableConfigCache } from "../utils/timetableConfigCache";
import {
  getExcuseTimetableCandidates,
  resolveExcuseTimetableConfig,
} from "../utils/excuseTimetableScope";
import {
  ExcuseAttachmentLinkError,
  linkExcuseRequestAttachments,
} from "../services/attendanceExcusesService";
import { uploadFile } from "@/services/filesService";
import { uploadExcuseAttachments } from "../utils/uploadExcuseAttachments";
import FilePreviewModal from "@/components/ui/file-preview-modal";

interface ExcuseRequestModalProps {
  isOpen: boolean;
  isReadOnly: boolean;
  yearId: string;
  termId: string;
  termRange: { startDate: string; endDate: string };
  initialRequest?: ExcuseRequest | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSave: (payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds" | "yearId" | "termId">) => Promise<void>;
}

interface FormState {
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber?: string;
  type: ExcuseType;
  dateFrom: string;
  dateTo: string;
  selectedPeriodIds: string[];
  minutesLate?: number;
  minutesEarlyLeave?: number;
  reasonAr: string;
  reasonEn: string;
  attachments: AttachmentMeta[];
}

interface RosterStudent {
  id: string;
  nameAr: string;
  nameEn: string;
  studentNumber: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export default function ExcuseRequestModal({
  isOpen,
  isReadOnly,
  yearId,
  termId,
  termRange,
  initialRequest,
  onClose,
  onRefresh,
  onSave,
}: ExcuseRequestModalProps) {
  const t = useTranslations("attendance.excuses.modal");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const locale = useLocale();

  const [form, setForm] = useState<FormState>({
    studentId: "",
    studentNameAr: "",
    studentNameEn: "",
    studentNumber: "",
    type: "ABSENCE",
    dateFrom: "",
    dateTo: "",
    selectedPeriodIds: [],
    reasonAr: "",
    reasonEn: "",
    attachments: [],
  });

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [periodsError, setPeriodsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pendingAttachmentRetry, setPendingAttachmentRetry] = useState<{
    requestId: string;
    fileIds: string[];
  } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);
  const [policySnapshot, setPolicySnapshot] = useState<AttendancePolicy[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyLoadFailed, setPolicyLoadFailed] = useState(false);
  const rosterRequestId = useRef(0);
  const timetableRequestId = useRef(0);
  const timetableConfigCache = useRef(
    createTimetableConfigCache(fetchTimetableConfig),
  );

  // The backend resolves excuse requests at the school level and does not
  // persist a grade, section, or classroom scope.
  const readyScope = useMemo(
    () => ({ scopeType: "SCHOOL" as const, scopeIds: {} }),
    [],
  );
  const studentScope = useMemo(() => {
    const student = roster.find((item) => item.id === form.studentId);
    if (!student?.gradeId) return null;

    const scopeIds: AttendanceScopeIds = {
      stageId: student.stageId,
      gradeId: student.gradeId,
      sectionId: student.sectionId,
      classroomId: student.classroomId,
    };
    if (student.classroomId && student.sectionId) {
      return { scopeType: "CLASSROOM" as const, scopeIds };
    }
    if (student.sectionId) return { scopeType: "SECTION" as const, scopeIds };
    return { scopeType: "GRADE" as const, scopeIds };
  }, [form.studentId, roster]);
  const timetableScope = form.type === "ABSENCE" ? null : studentScope;
  const policyScope = studentScope ?? readyScope;
  const policyState = useMemo(() => {
    return deriveExcusePolicyState(policySnapshot, {
      dateFrom: form.dateFrom,
      dateTo:
        form.type === "ABSENCE"
          ? form.dateTo || form.dateFrom
          : form.dateFrom,
      scopeType: policyScope.scopeType,
      scopeIds: policyScope.scopeIds,
      attachments: form.attachments,
      reasonAr: form.reasonAr,
      reasonEn: form.reasonEn,
    });
  }, [policySnapshot, policyScope, form.dateFrom, form.dateTo, form.type, form.attachments, form.reasonAr, form.reasonEn]);
  const attendancePolicy = useMemo(
    () =>
      resolveEffectiveExcuseAttendancePolicy(
        policySnapshot,
        form.dateFrom,
        policyScope.scopeType,
        policyScope.scopeIds,
      ),
    [policySnapshot, form.dateFrom, policyScope],
  );
  const resolvedPolicy = policyState.policy;
  const policyIssue: ExcusePolicyIssue | null =
    readyScope && !policyLoading && policyLoadFailed
      ? { code: "NO_ACTIVE_POLICY", date: form.dateFrom }
      : policyState.issue;

  const rules = getUploadRules("ATTENDANCE_EXCUSE");
  const requireReason = resolvedPolicy?.requireExcuseReason ?? false;
  const requireAttachment = resolvedPolicy?.requireAttachmentForExcuse ?? false;
  const allowExcuses = resolvedPolicy?.allowExcuses ?? false;
  const isDailyAttendance = attendancePolicy?.mode === "DAILY";
  const lateThresholdState = getThresholdState("LATE", form.minutesLate, resolvedPolicy);
  const earlyLeaveThresholdState = getThresholdState("EARLY_LEAVE", form.minutesEarlyLeave, resolvedPolicy);
  const isPolicyBlocking = !!policyIssue || !allowExcuses;
  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialRequest) {
      // Editing existing request
      void Promise.resolve().then(() => {
        setForm({
          studentId: initialRequest.studentId,
          studentNameAr: initialRequest.studentNameAr,
          studentNameEn: initialRequest.studentNameEn,
          studentNumber: initialRequest.studentNumber,
          type: initialRequest.type,
          dateFrom: initialRequest.dateFrom,
          dateTo: initialRequest.dateTo,
          selectedPeriodIds: initialRequest.selectedPeriodIds || [],
          minutesLate: initialRequest.minutesLate,
          minutesEarlyLeave: initialRequest.minutesEarlyLeave,
          reasonAr: initialRequest.reasonAr,
          reasonEn: initialRequest.reasonEn,
          attachments: initialRequest.attachments,
        });
      });
    } else {
      // Creating new request
      void Promise.resolve().then(() => setForm({
        studentId: "",
        studentNameAr: "",
        studentNameEn: "",
        studentNumber: "",
        type: "ABSENCE",
        dateFrom: termRange.startDate,
        dateTo: termRange.startDate,
        selectedPeriodIds: [],
        minutesLate: undefined,
        minutesEarlyLeave: undefined,
        reasonAr: "",
        reasonEn: "",
        attachments: [],
      }));
    }

    void Promise.resolve().then(() => setErrors({}));
    void Promise.resolve().then(() => setSaveError(""));
    void Promise.resolve().then(() => setPendingAttachmentRetry(null));
    void Promise.resolve().then(() => setRosterError(false));
  }, [isOpen, initialRequest, termRange.startDate]);

  useEffect(() => {
    if (!isOpen || !yearId || !termId) {
      void Promise.resolve().then(() => {
        setPolicySnapshot([]);
        setPolicyLoading(false);
        setPolicyLoadFailed(false);
      });
      return;
    }

    let cancelled = false;

    const loadPolicySnapshot = async () => {
      try {
        setPolicyLoading(true);
        setPolicyLoadFailed(false);
        const policies = await fetchPolicies(yearId, termId);
        if (!cancelled) {
          setPolicySnapshot(policies);
        }
      } catch (error) {
        console.error("Failed to load excuse policies:", error);
        if (!cancelled) {
          setPolicySnapshot([]);
          setPolicyLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setPolicyLoading(false);
        }
      }
    };

    loadPolicySnapshot();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    yearId,
    termId,
    initialRequest,
    readyScope,
  ]);

  const getPolicyIssueMessage = (issue: ExcusePolicyIssue | null) => {
    if (!issue) return "";
    if (issue.code === "NO_ACTIVE_POLICY") return t("messages.noActivePolicyOnDate", { date: issue.date });
    if (issue.code === "REASON_REQUIRED") return t("messages.reasonRequiredOnDate", { date: issue.date });
    if (issue.code === "ATTACHMENT_REQUIRED") return t("messages.attachmentRequiredOnDate", { date: issue.date });
    return t("messages.excusesDisabledOnDate", { date: issue.date });
  };

  // Load roster when scope changes
  useEffect(() => {
    if (
      !isOpen ||
      !yearId ||
      !termId ||
      !form.dateFrom ||
      !readyScope
    ) {
      rosterRequestId.current += 1;
      void Promise.resolve().then(() => {
        setRoster([]);
        setRosterLoading(false);
      });
      return;
    }

    const loadRoster = async () => {
      const requestId = ++rosterRequestId.current;
      setRosterLoading(true);
      setRosterError(false);
      try {
        const students = await fetchRoster(readyScope.scopeType, readyScope.scopeIds || {}, {
          yearId,
          termId,
          date: form.dateFrom,
        });
        if (requestId === rosterRequestId.current) setRoster(students);
      } catch (error) {
        console.error("Failed to load roster:", error);
        if (requestId === rosterRequestId.current) {
          setRosterError(true);
          setRoster([]);
        }
      } finally {
        if (requestId === rosterRequestId.current) setRosterLoading(false);
      }
    };

    loadRoster();
  }, [isOpen, yearId, termId, form.dateFrom, readyScope]);

  useEffect(() => {
    if (!isOpen || form.type === "ABSENCE" || !resolvedPolicy) return;

    void Promise.resolve().then(() => {
      setForm((previous) => {
        const selectedPeriodIds = isDailyAttendance
          ? ["daily"]
          : previous.selectedPeriodIds.filter((periodId) => periodId !== "daily");
        if (
          selectedPeriodIds.length === previous.selectedPeriodIds.length &&
          selectedPeriodIds.every(
            (periodId, index) => periodId === previous.selectedPeriodIds[index],
          )
        ) {
          return previous;
        }
        return { ...previous, selectedPeriodIds };
      });
    });
  }, [isOpen, form.type, resolvedPolicy, isDailyAttendance]);

  // Daily attendance uses the backend's fixed "daily" period key. Period
  // attendance uses the selected student's timetable scope.
  useEffect(() => {
    if (!isOpen) {
      timetableRequestId.current += 1;
      void Promise.resolve().then(() => {
        setPeriods([]);
        setPeriodsError(false);
      });
      return;
    }

    if (
      !shouldLoadExcusePeriods(form.type) ||
      policyLoading ||
      !resolvedPolicy ||
      isDailyAttendance ||
      !timetableScope
    ) {
      void Promise.resolve().then(() => setPeriods([]));
      void Promise.resolve().then(() => setPeriodsError(false));
      return;
    }

    const loadPeriods = async () => {
      const requestId = ++timetableRequestId.current;
      try {
        const candidates = getExcuseTimetableCandidates(
          yearId,
          termId,
          timetableScope.scopeType,
          timetableScope.scopeIds,
        );
        if (candidates.length === 0) {
          setPeriods([]);
          setPeriodsError(false);
          return;
        }
        const config = await resolveExcuseTimetableConfig(
          candidates,
          (candidate) => {
            const scopeId =
              candidate.classroomId ||
              candidate.sectionId ||
              candidate.gradeId ||
              candidate.termId;
            const cacheKey = `${candidate.academicYearId}:${candidate.termId}:${candidate.scopeType}:${scopeId}`;
            return timetableConfigCache.current.get(cacheKey, candidate);
          },
        );
        if (requestId !== timetableRequestId.current) return;
        if (!config) {
          setPeriods([]);
          setPeriodsError(true);
          return;
        }
        setPeriods(config.periods);
        setPeriodsError(false);
      } catch (error) {
        console.error("Failed to load periods:", error);
        if (requestId === timetableRequestId.current) {
          setPeriods([]);
          setPeriodsError(true);
        }
      }
    };

    loadPeriods();
  }, [
    isOpen,
    yearId,
    termId,
    form.type,
    policyLoading,
    resolvedPolicy,
    isDailyAttendance,
    timetableScope,
  ]);

  // Student options with locale-aware rendering
  const studentOptions = useMemo(
    () =>
      roster.map((student) => ({
        value: student.id,
        label: locale === "ar"
          ? `${student.nameAr} (${student.studentNumber})`
          : `${student.nameEn} (${student.studentNumber})`,
        searchText: [student.nameAr, student.nameEn, student.studentNumber]
          .filter(Boolean)
          .join(" "),
      })),
    [roster, locale]
  );

  const validateDateFields = (dateFrom: string, dateTo: string) => {
    const nextDateErrors: Record<string, string> = {};

    if (!dateFrom) {
      nextDateErrors.dateFrom = t("validation.dateRequired");
    } else if (dateFrom < termRange.startDate || dateFrom > termRange.endDate) {
      nextDateErrors.dateFrom = t("validation.termRange");
    }

    if (!dateTo) {
      nextDateErrors.dateTo = t("validation.dateRequired");
    } else if (dateTo < termRange.startDate || dateTo > termRange.endDate) {
      nextDateErrors.dateTo = t("validation.termRange");
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      nextDateErrors.dateTo = t("validation.dateOrder");
    }

    setErrors((prev) => ({
      ...prev,
      dateFrom: nextDateErrors.dateFrom || "",
      dateTo: nextDateErrors.dateTo || "",
    }));

    return nextDateErrors;
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.studentId) nextErrors.studentId = t("validation.studentRequired");
    Object.assign(nextErrors, validateDateFields(form.dateFrom, form.dateTo));
    if ((policyIssue?.code === "REASON_REQUIRED" || requireReason) && !form.reasonAr.trim() && !form.reasonEn.trim()) {
      nextErrors.reason = t("validation.reasonRequired");
    }
    
    // Period validation for LATE/EARLY_LEAVE
    if ((form.type === "LATE" || form.type === "EARLY_LEAVE") && form.selectedPeriodIds.length === 0) {
      nextErrors.periods = t("validation.periodRequired");
    }

    // Minutes validation for LATE
    if (form.type === "LATE") {
      if (form.minutesLate === undefined || form.minutesLate === null || form.minutesLate === 0) {
        nextErrors.minutesLate = t("validation.minutesRequired");
      } else if (form.minutesLate <= 0) {
        nextErrors.minutesLate = t("validation.minutesPositive");
      }
    }

    // Minutes validation for EARLY_LEAVE
    if (form.type === "EARLY_LEAVE") {
      if (form.minutesEarlyLeave === undefined || form.minutesEarlyLeave === null || form.minutesEarlyLeave === 0) {
        nextErrors.minutesEarlyLeave = t("validation.minutesRequired");
      } else if (form.minutesEarlyLeave <= 0) {
        nextErrors.minutesEarlyLeave = t("validation.minutesPositive");
      }
    }

    // Policy-based validation
    if (policyIssue?.code === "EXCUSES_DISABLED") {
      nextErrors.policy = t("validation.policyDisabled");
    }

    if (policyIssue?.code === "REASON_REQUIRED") {
      nextErrors.reason = t("validation.reasonRequired");
    }

    if (policyIssue?.code === "ATTACHMENT_REQUIRED" || (requireAttachment && form.attachments.length === 0)) {
      nextErrors.attachments = t("validation.attachmentRequired");
    }

    if (policyIssue?.code === "NO_ACTIVE_POLICY") {
      nextErrors.policy = t("validation.noActivePolicy");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFilesSelected = async (files: File[]) => {
    if (isReadOnly) return;
    try {
      setUploadingAttachments(true);
      setSaveError("");
      const uploaded = await uploadExcuseAttachments(files, uploadFile);
      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploaded],
      }));
      setErrors((prev) => ({ ...prev, attachments: "" }));
    } catch {
      setSaveError(t("fileUploadFailed"));
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    if (isReadOnly) return;
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((att) => att.id !== attachmentId),
    }));
  };

  const handleSave = async () => {
    if (pendingAttachmentRetry) {
      try {
        setSaving(true);
        setSaveError("");
        await linkExcuseRequestAttachments(
          pendingAttachmentRetry.requestId,
          pendingAttachmentRetry.fileIds,
        );
        await onRefresh();
        setPendingAttachmentRetry(null);
        onClose();
      } catch {
        setSaveError(t("attachmentLinkFailed"));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!validate()) return;

    try {
      setSaving(true);
      setSaveError("");
      
      // Normalize selected period IDs before saving
      const normalizedPeriodIds = getExcusePeriodKeysForSave(
        form.selectedPeriodIds,
        periods,
      );

      await onSave({
        studentId: form.studentId,
        studentNameAr: form.studentNameAr,
        studentNameEn: form.studentNameEn,
        studentNumber: form.studentNumber,
        type: form.type,
        dateFrom: form.dateFrom,
        dateTo: form.type === "LATE" || form.type === "EARLY_LEAVE" ? form.dateFrom : form.dateTo,
        selectedPeriodIds: form.type === "ABSENCE" ? [] : normalizedPeriodIds,
        minutesLate: form.type === "LATE" ? form.minutesLate : undefined,
        minutesEarlyLeave: form.type === "EARLY_LEAVE" ? form.minutesEarlyLeave : undefined,
        reasonAr: form.reasonAr,
        reasonEn: form.reasonEn,
        attachments: form.attachments,
      });
      onClose();
    } catch (error) {
      if (error instanceof ExcuseAttachmentLinkError) {
        await onRefresh();
        setPendingAttachmentRetry({
          requestId: error.request.id,
          fileIds: error.fileIds,
        });
        setSaveError(t("attachmentLinkFailed"));
        return;
      }
      setSaveError(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (type: ExcuseType) => {
    if (isReadOnly) return;

    setForm((prev) => {
      return {
      ...prev,
      type,
      // For LATE/EARLY_LEAVE, ensure dateTo matches dateFrom (single date)
      dateTo: (type === "LATE" || type === "EARLY_LEAVE") ? prev.dateFrom : prev.dateTo,
      // Clear period selection when changing type
      selectedPeriodIds: [],
      // Clear minutes when changing type
      minutesLate: type === "LATE" ? prev.minutesLate : undefined,
      minutesEarlyLeave: type === "EARLY_LEAVE" ? prev.minutesEarlyLeave : undefined,
    };
    });
  };

  const handleDateFromChange = (date: Date | null) => {
    if (isReadOnly) return;

    const dateStr = date ? formatLocalDate(date) : "";
    setForm((prev) => {
      const nextDateTo = (prev.type === "LATE" || prev.type === "EARLY_LEAVE") ? dateStr : prev.dateTo;
      validateDateFields(dateStr, nextDateTo);
      return {
      ...prev,
      dateFrom: dateStr,
      // For LATE/EARLY_LEAVE, dateTo must match dateFrom
      dateTo: nextDateTo,
    };
    });
  };

  const handleDateToChange = (date: Date | null) => {
    if (isReadOnly) return;
    
    // Only allow dateTo change for ABSENCE
    if (form.type === "LATE" || form.type === "EARLY_LEAVE") return;

    const dateStr = date ? formatLocalDate(date) : "";
    setForm((prev) => {
      validateDateFields(prev.dateFrom, dateStr);
      return { ...prev, dateTo: dateStr };
    });
  };

  const handlePeriodToggle = (periodId: string) => {
    if (isReadOnly) return;

    setForm((prev) => ({
      ...prev,
      selectedPeriodIds: prev.selectedPeriodIds.includes(periodId)
        ? prev.selectedPeriodIds.filter((id) => id !== periodId)
        : [...prev.selectedPeriodIds, periodId],
    }));
    setErrors((prev) => ({ ...prev, periods: "" }));
  };

  const isSingleDateType = form.type === "LATE" || form.type === "EARLY_LEAVE";

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRequest ? t("editTitle") : t("createTitle")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {tCommon("cancel")}
          </Button>
          {!isReadOnly && (
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={uploadingAttachments || policyLoading || isPolicyBlocking || periodsError}>
              {pendingAttachmentRetry ? t("retryAttachments") : tCommon("save")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {saveError && (
          <div role="alert" className="flex items-start gap-2 rounded-md p-3 text-sm" style={{ backgroundColor: "var(--color-danger-50)", color: "var(--color-danger-700)" }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{saveError}</span>
          </div>
        )}
        <section className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--background-secondary)" }}>
          <Select
            label={t("type")}
            value={form.type}
            onChange={(value) => handleTypeChange(value as ExcuseType)}
            options={[
              { value: "ABSENCE", label: t("absence") },
              { value: "LATE", label: t("late") },
              { value: "EARLY_LEAVE", label: t("earlyLeave") },
            ]}
            disabled={isReadOnly}
          />
        </section>

        {/* Policy warning */}
        {(policyLoading || policyIssue || resolvedPolicy) && (
          <div className="flex items-start gap-2 p-3 rounded" style={{ backgroundColor: "var(--color-warning-50)", borderLeft: "3px solid var(--color-warning-500)" }}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-warning-700)" }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-warning-800)" }}>
                {policyLoading
                  ? t("policy.loading")
                  : policyIssue
                    ? t("policy.actionBlocked")
                    : t("policy.active")}
              </p>
              {policyLoading ? null : (
                <>
                  <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                    {policyIssue ? getPolicyIssueMessage(policyIssue) : t("policy.summary")}
                  </p>
                  {resolvedPolicy?.requireAttachmentForExcuse && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                      {t("policy.attachmentRequired")}
                    </p>
                  )}
                  {resolvedPolicy?.requireExcuseReason && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-warning-700)" }}>
                      {t("policy.reasonRequired")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* The backend supports choosing a student only when creating a request. */}
        {!initialRequest ? (
          <section className="space-y-4 rounded-lg border p-4" style={{ borderColor: "var(--border-color)" }}>
        {rosterLoading ? (
          <div className="flex items-center justify-center py-4">
            <PartialLoader />
          </div>
        ) : rosterError ? (
          <div className="p-3 rounded" style={{ backgroundColor: "var(--color-accent-50)", color: "var(--color-accent-700)" }}>
            <p className="text-sm">{t("rosterLoadError")}</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="p-3 rounded" style={{ backgroundColor: "var(--color-info-50)", color: "var(--color-info-700)" }}>
            <p className="text-sm">{t("noStudentsInScope")}</p>
          </div>
        ) : (
          <Select
            label={t("student")}
            value={form.studentId}
            onChange={(studentId) => {
              if (isReadOnly) return;
              const selected = roster.find((item) => item.id === studentId);
              setForm((prev) => ({
                ...prev,
                studentId,
                studentNameAr: selected?.nameAr || "",
                studentNameEn: selected?.nameEn || "",
                studentNumber: selected?.studentNumber || "",
              }));
              setErrors((prev) => ({ ...prev, studentId: "" }));
            }}
            options={studentOptions}
            placeholder={t("selectStudent")}
            error={errors.studentId}
            disabled={isReadOnly}
            searchable={true}
            searchPlaceholder={t("searchStudent")}
            noResultsText={t("noStudentsFound")}
          />
        )}
          </section>
        ) : (
          <section className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--background-secondary)" }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              {t("selectedStudent")}
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {locale === "ar" ? form.studentNameAr || form.studentNameEn : form.studentNameEn || form.studentNameAr}
            </p>
            {form.studentNumber && (
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {form.studentNumber}
              </p>
            )}
            <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              {t("studentLockedHelp")}
            </p>
          </section>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DatePicker
            label={isSingleDateType ? t("date") : t("dateFrom")}
            value={form.dateFrom ? new Date(form.dateFrom + "T00:00:00") : null}
            onChange={handleDateFromChange}
            minDate={new Date(termRange.startDate + "T00:00:00")}
            maxDate={new Date(termRange.endDate + "T00:00:00")}
            error={errors.dateFrom}
            disabled={isReadOnly}
          />
          {!isSingleDateType && (
            <DatePicker
              label={t("dateTo")}
              value={form.dateTo ? new Date(form.dateTo + "T00:00:00") : null}
              onChange={handleDateToChange}
              minDate={new Date(termRange.startDate + "T00:00:00")}
              maxDate={new Date(termRange.endDate + "T00:00:00")}
              error={errors.dateTo}
              disabled={isReadOnly}
            />
          )}
        </div>

        {/* Period Selection for LATE/EARLY_LEAVE */}
        {periodsError && form.type !== "ABSENCE" && (
          <div className="p-3 rounded text-sm" style={{ backgroundColor: "var(--color-danger-50)", color: "var(--color-danger-700)" }}>
            {t("timetableConfigurationRequired")}
          </div>
        )}

        {form.type !== "ABSENCE" && periods.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              {t("periods")} {form.type === "LATE" || form.type === "EARLY_LEAVE" ? "*" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => {
                const checked = form.selectedPeriodIds.includes(period.id);
                return (
                  <label
                    key={period.id}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                      isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      borderColor: checked ? "var(--color-primary-500)" : "var(--border-color)",
                      backgroundColor: checked ? "var(--color-primary-50)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handlePeriodToggle(period.id)}
                      disabled={isReadOnly}
                      className="cursor-pointer"
                    />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {locale === "ar" ? period.nameAr : period.nameEn}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.periods && (
              <p className="text-xs mt-1" style={{ color: "var(--color-accent-700)" }}>
                {errors.periods}
              </p>
            )}
            {form.type === "LATE" || form.type === "EARLY_LEAVE" ? (
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                {t("periodRequiredHelp")}
              </p>
            ) : null}
          </div>
        )}

        {/* Absence helper text */}
        {form.type === "ABSENCE" && (
          <div className="p-3 rounded" style={{ backgroundColor: "var(--color-info-50)" }}>
            <p className="text-xs" style={{ color: "var(--color-info-700)" }}>
              {t("absenceAppliesToPolicyPeriods")}
            </p>
          </div>
        )}

        {/* Minutes field for LATE */}
        {form.type === "LATE" && (
          <div>
            <Input
              label={t("minutesLate")}
              type="number"
              value={form.minutesLate?.toString() || ""}
              onChange={(e) => {
                if (isReadOnly) return;
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setForm((prev) => ({ ...prev, minutesLate: value }));
                setErrors((prev) => ({ ...prev, minutesLate: "" }));
              }}
              error={errors.minutesLate}
              disabled={isReadOnly}
              min={1}
              placeholder="0"
              helperText={t("minutesLateHelper")}
            />
            {lateThresholdState.isReached && typeof lateThresholdState.threshold === "number" && (
              <div className="flex items-start gap-2 mt-2 p-2 rounded" style={{ backgroundColor: "var(--color-accent-50)" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-accent-700)" }} />
                <p className="text-xs" style={{ color: "var(--color-accent-700)" }}>
                  {t("thresholdReached", { threshold: lateThresholdState.threshold })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Minutes field for EARLY_LEAVE */}
        {form.type === "EARLY_LEAVE" && (
          <div>
            <Input
              label={t("minutesEarlyLeave")}
              type="number"
              value={form.minutesEarlyLeave?.toString() || ""}
              onChange={(e) => {
                if (isReadOnly) return;
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                setForm((prev) => ({ ...prev, minutesEarlyLeave: value }));
                setErrors((prev) => ({ ...prev, minutesEarlyLeave: "" }));
              }}
              error={errors.minutesEarlyLeave}
              disabled={isReadOnly}
              min={1}
              placeholder="0"
              helperText={t("minutesEarlyLeaveHelper")}
            />
            {earlyLeaveThresholdState.isReached && typeof earlyLeaveThresholdState.threshold === "number" && (
              <div className="flex items-start gap-2 mt-2 p-2 rounded" style={{ backgroundColor: "var(--color-accent-50)" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-accent-700)" }} />
                <p className="text-xs" style={{ color: "var(--color-accent-700)" }}>
                  {t("thresholdReached", { threshold: earlyLeaveThresholdState.threshold })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            {t("reason")} {requireReason ? "*" : ""}
          </p>
          <BilingualTextField
            label=""
            value={{ ar: form.reasonAr, en: form.reasonEn }}
            onChange={(value) => {
              if (isReadOnly) return;
              setForm((prev) => ({ ...prev, reasonAr: value.ar, reasonEn: value.en }));
              setErrors((prev) => ({ ...prev, reason: "" }));
            }}
            requiredAr={false}
            requiredEn={false}
            errors={{ ar: errors.reason, en: errors.reason }}
            disabled={isReadOnly}
          />
          {requireReason && (
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {t("reasonRequiredByPolicy")}
            </p>
          )}
        </div>

        {/* Attachments */}
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            {t("attachments")} {requireAttachment ? "*" : ""}
          </p>
          <DragDropUploadArea
            uploadArea="ATTENDANCE_EXCUSE"
            onFilesSelected={handleFilesSelected}
            disabled={isReadOnly}
            isUploading={uploadingAttachments}
            helperText={`${tUpload(rules.acceptLabelKey)} - ${Math.round(rules.maxSizeBytes / (1024 * 1024))}MB`}
          />
          {errors.attachments && (
            <p className="text-xs mt-1" style={{ color: "var(--color-accent-700)" }}>
              {errors.attachments}
            </p>
          )}
          {requireAttachment && (
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {t("attachmentRequiredByPolicy")}
            </p>
          )}
          {form.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {form.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 rounded border"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--background)" }}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(attachment)}
                    className="min-w-0 flex-1 cursor-pointer rounded text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    title={tUpload("previewAttachment")}
                  >
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {attachment.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {Math.round(attachment.size / 1024)} KB
                    </p>
                  </button>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      aria-label={t("removeAttachment", { name: attachment.name })}
                      className="ml-2 cursor-pointer rounded p-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: "var(--color-accent-700)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
    <FilePreviewModal
      attachment={previewAttachment}
      isOpen={!!previewAttachment}
      onClose={() => setPreviewAttachment(null)}
    />
    </>
  );
}

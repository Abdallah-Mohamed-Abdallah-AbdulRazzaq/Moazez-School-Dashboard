"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import { isApiError } from "@/lib/api-error";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "./ReinforcementAcademicContextFilter";
import { listReinforcementTasks } from "../services/reinforcementTasksService";
import {
  getEffectiveXpPolicy,
  getXpSummary,
} from "../services/reinforcementXpService";
import type {
  ManualXpGrantPayload,
  ReinforcementTask,
  XpPolicy,
  XpSummary,
} from "../types";

interface ManualXpGrantModalProps {
  isOpen: boolean;
  context?: ReinforcementAcademicContextValue;
  onClose: () => void;
  onSubmit: (payload: ManualXpGrantPayload) => Promise<void>;
}

export const makeManualXpDedupeKey = () =>
  `manual-xp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function ManualXpGrantModal({
  isOpen,
  context,
  onClose,
  onSubmit,
}: ManualXpGrantModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [selection, setSelection] = useState<ReinforcementAcademicContextValue>(
    context || {},
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonAr, setReasonAr] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [dedupeKey, setDedupeKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [policy, setPolicy] = useState<XpPolicy | null>(null);
  const [summary, setSummary] = useState<XpSummary | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      setSelection(context || {});
      setAmount("");
      setReason("");
      setReasonAr("");
      setSourceId("");
      setDedupeKey("");
      setError("");
      setPolicy(null);
      setSummary(null);
      void Promise.resolve().then(() => setPolicyError(""));
      setSaving(false);
    });
  }, [context, isOpen]);

  // Fetch tasks for the source dropdown when academic context changes
  useEffect(() => {
    if (!selection.academicYearId || !selection.termId) {
      void Promise.resolve().then(() => setTasks([]));
      return;
    }
    let cancelled = false;
    void Promise.resolve().then(() => setTasksLoading(true));
    void listReinforcementTasks({
      academicYearId: selection.academicYearId,
      termId: selection.termId,
      limit: 100,
    })
      .then((response) => {
        if (!cancelled) setTasks(response.items);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selection.academicYearId, selection.termId]);

  useEffect(() => {
    if (
      !isOpen ||
      !selection.academicYearId ||
      !selection.termId ||
      !selection.studentId
    ) {
      void Promise.resolve().then(() => setPolicy(null));
      void Promise.resolve().then(() => setSummary(null));
    void Promise.resolve().then(() => setPolicyError(""));
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => setPolicyLoading(true));
    void Promise.resolve().then(() => setPolicyError(""));
    Promise.all([
      getEffectiveXpPolicy({
        academicYearId: selection.academicYearId,
        termId: selection.termId,
        studentId: selection.studentId,
      }),
      getXpSummary({
        academicYearId: selection.academicYearId,
        termId: selection.termId,
        studentId: selection.studentId,
      }),
    ])
      .then(([nextPolicy, nextSummary]) => {
        if (cancelled) return;
        setPolicy(nextPolicy);
        setSummary(nextSummary);
      })
      .catch((nextError) => {
        if (!cancelled) {
          setPolicy(null);
          setSummary(null);
          setPolicyError(
            nextError instanceof Error
              ? nextError.message
              : t("xp.policyInstructions.loadFailed"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPolicyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    selection.academicYearId,
    selection.studentId,
    selection.termId,
    t,
  ]);

  const sourceOptions = useMemo(() => {
    const options = [{ value: "", label: t("xp.noSource") }];
    for (const task of tasks) {
      const label =
        locale === "ar"
          ? task.titleAr || task.titleEn || task.id
          : task.titleEn || task.titleAr || task.id;
      options.push({ value: task.id, label });
    }
    return options;
  }, [tasks, locale, t]);

  const resolvedDedupeKey = useMemo(
    () => dedupeKey.trim() || makeManualXpDedupeKey(),
    [dedupeKey],
  );

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!selection.termId) {
      setError(t("xp.validation.termRequired"));
      return;
    }
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1) {
      setError(t("validation.xpAmountRequired"));
      return;
    }
    if (!reason.trim()) {
      setError(t("validation.required"));
      return;
    }
    if (
      policy?.allowedReasons.length &&
      !policy.allowedReasons.includes(reason.trim())
    ) {
      setError(t("xp.validation.disallowedReason"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        academicYearId: selection.academicYearId,
        termId: selection.termId,
        studentId: selection.studentId!,
        enrollmentId: selection.enrollmentId,
        amount: parsedAmount,
        reason: reason.trim(),
        reasonAr: reasonAr.trim() || undefined,
        sourceId: sourceId.trim() || undefined,
        dedupeKey: resolvedDedupeKey,
      });
    } catch (nextError) {
      if (isApiError(nextError)) {
        const details =
          nextError.details && typeof nextError.details === "object"
            ? (nextError.details as Record<string, unknown>)
            : {};
        const isWeeklyCapError =
          nextError.code === "reinforcement.xp.weekly_cap_reached" ||
          (nextError.code === "validation.failed" &&
            "weeklyCap" in details &&
            "currentXp" in details &&
            "requestedAmount" in details);
        const messageKey = {
          "reinforcement.xp.daily_cap_reached":
            "xp.policyInstructions.dailyCapReached",
        }[nextError.code] ??
          (isWeeklyCapError
            ? "xp.policyInstructions.weeklyCapReached"
            : undefined);
        const detailValue = (value: unknown): string | number =>
          typeof value === "string" || typeof value === "number" ? value : "-";
        setError(
          messageKey
            ? t(messageKey, {
                dailyCap: detailValue(details.dailyCap),
                weeklyCap: detailValue(details.weeklyCap),
                currentXp: detailValue(details.currentXp),
                requestedAmount: detailValue(details.requestedAmount),
              })
            : nextError.message,
        );
      } else {
        setError(
          nextError instanceof Error ? nextError.message : t("common.error"),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("xp.manualGrantTitle")}
      description={t("xp.manualGrantDescription")}
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button type="button" loading={saving} onClick={handleSubmit}>
            {t("actions.grantXp")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <ReinforcementAcademicContextFilter
          value={selection}
          showAcademicYearTerm={false}
          showSubject={false}
          showStudent
          onChange={(next: ReinforcementAcademicContextSelection) =>
            setSelection({
              academicYearId: context?.academicYearId,
              termId: context?.termId,
              stageId: next.stageId,
              gradeId: next.gradeId,
              sectionId: next.sectionId,
              classroomId: next.classroomId,
              studentId: next.studentId,
              enrollmentId: next.enrollmentId,
            })
          }
        />
        {policyLoading ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {t("xp.policyInstructions.loading")}
          </div>
        ) : policy ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">{t("xp.policyInstructions.title")}</p>
            <p className="mt-1">{t("xp.policyInstructions.description")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <span>
                {t("xp.dailyCap")}: {policy.dailyCap ?? t("xp.notSet")}
              </span>
              <span>
                {t("xp.weeklyCap")}: {policy.weeklyCap ?? t("xp.notSet")}
              </span>
              <span>
                {t("xp.cooldownMinutes")}:{" "}
                {policy.cooldownMinutes ?? t("xp.notSet")}
              </span>
              {summary?.totalXp !== undefined ? (
                <span>
                  {t("xp.policyInstructions.currentTotal")}: {summary.totalXp}
                </span>
              ) : null}
            </div>
            {policy.allowedReasons.length ? (
              <p className="mt-2">
                {t("xp.allowedReasons")}: {policy.allowedReasons.join(", ")}
              </p>
            ) : null}
          </div>
        ) : policyError ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {policyError}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            type="number"
            min={1}
            step={1}
            label={t("xp.amount")}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Select
            label={t("xp.sourceId")}
            value={sourceId}
            onChange={(value) => setSourceId(value)}
            options={sourceOptions}
            searchable
            searchPlaceholder={t("common.search") || "Search..."}
            noOptionsText={
              tasksLoading ? t("common.loading") : t("xp.noTasksAvailable")
            }
            disabled={tasksLoading}
          />
          <TextArea
            label={t("xp.reason")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <TextArea
            label={t("xp.reasonAr")}
            value={reasonAr}
            dir="rtl"
            onChange={(event) => setReasonAr(event.target.value)}
          />
          <Input
            label={t("xp.dedupeKey")}
            helperText={t("xp.dedupeKeyHelp")}
            value={dedupeKey}
            onChange={(event) => setDedupeKey(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

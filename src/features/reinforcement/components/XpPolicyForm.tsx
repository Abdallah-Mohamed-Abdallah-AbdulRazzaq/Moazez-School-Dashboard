"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import type {
  CreateXpPolicyPayload,
  ReinforcementTargetScope,
  XpPolicy,
  XpPolicyScopeType,
} from "../types";
import ReinforcementTaskTargetSelector, {
  type ReinforcementTaskTargetSelection,
} from "./ReinforcementTaskTargetSelector";

interface XpPolicyFormProps {
  onSubmit: (payload: CreateXpPolicyPayload) => Promise<void>;
  onCancel: () => void;
  mode?: "create" | "edit";
  initialPolicy?: XpPolicy | null;
  academicYearId?: string;
  termId?: string;
}

const parseOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const reasonsFromText = (value: string): string[] | undefined => {
  const reasons = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return reasons.length ? reasons : undefined;
};

export const isXpPolicyDateRangeValid = (
  startsAt: string,
  endsAt: string,
): boolean => !startsAt || !endsAt || startsAt <= endsAt;

const dateInputValue = (value: string | null | undefined): string =>
  value ? value.slice(0, 10) : "";

const initialTargetFor = (
  policy: XpPolicy | null | undefined,
): ReinforcementTaskTargetSelection[] =>
  policy
    ? [
        {
          scopeType: policy.scopeType,
          scopeId: policy.scopeKey,
          label: policy.scopeKey,
        },
      ]
    : [];

export default function XpPolicyForm({
  onSubmit,
  onCancel,
  mode = "create",
  initialPolicy = null,
  academicYearId,
  termId,
}: XpPolicyFormProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const context = {
    academicYearId: academicYearId || initialPolicy?.academicYearId,
    termId: termId || initialPolicy?.termId,
  };
  const [targets, setTargets] =
    useState<ReinforcementTaskTargetSelection[]>(initialTargetFor(initialPolicy));
  const [dailyCap, setDailyCap] = useState(
    initialPolicy?.dailyCap === null || initialPolicy?.dailyCap === undefined
      ? ""
      : String(initialPolicy.dailyCap),
  );
  const [weeklyCap, setWeeklyCap] = useState(
    initialPolicy?.weeklyCap === null || initialPolicy?.weeklyCap === undefined
      ? ""
      : String(initialPolicy.weeklyCap),
  );
  const [cooldownMinutes, setCooldownMinutes] = useState(
    initialPolicy?.cooldownMinutes === null ||
      initialPolicy?.cooldownMinutes === undefined
      ? ""
      : String(initialPolicy.cooldownMinutes),
  );
  const [allowedReasons, setAllowedReasons] = useState(
    initialPolicy?.allowedReasons.join("\n") ?? "",
  );
  const [startsAt, setStartsAt] = useState(dateInputValue(initialPolicy?.startsAt));
  const [endsAt, setEndsAt] = useState(dateInputValue(initialPolicy?.endsAt));
  const [isActive, setIsActive] = useState(initialPolicy?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const selectedTarget = targets[0];
    if (!context.academicYearId || !context.termId) {
      setError(t("validation.required"));
      return;
    }
    if (!selectedTarget) {
      setError(t("validation.targetRequired"));
      return;
    }
    if (!isXpPolicyDateRangeValid(startsAt, endsAt)) {
      setError(t("xp.invalidDateRange"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        academicYearId: context.academicYearId,
        termId: context.termId,
        scopeType: selectedTarget.scopeType as XpPolicyScopeType,
        scopeId: selectedTarget.scopeId,
        dailyCap: parseOptionalNumber(dailyCap),
        weeklyCap: parseOptionalNumber(weeklyCap),
        cooldownMinutes: parseOptionalNumber(cooldownMinutes),
        allowedReasons: reasonsFromText(allowedReasons),
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-100 bg-white p-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t("xp.policyScope")}
        </h3>
        <div className="mt-4">
          <ReinforcementTaskTargetSelector
            academicYearId={context.academicYearId}
            termId={context.termId}
            defaultScope={
              (initialPolicy?.scopeType || "student") as ReinforcementTargetScope
            }
            value={targets}
            onChange={(nextTargets) => setTargets(nextTargets.slice(-1))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t("xp.policyCaps")}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input
            type="number"
            label={t("xp.dailyCap")}
            value={dailyCap}
            onChange={(event) => setDailyCap(event.target.value)}
          />
          <Input
            type="number"
            label={t("xp.weeklyCap")}
            value={weeklyCap}
            onChange={(event) => setWeeklyCap(event.target.value)}
          />
          <Input
            type="number"
            label={t("xp.cooldownMinutes")}
            value={cooldownMinutes}
            onChange={(event) => setCooldownMinutes(event.target.value)}
          />
          <Input
            type="date"
            label={t("xp.startsAt")}
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <Input
            type="date"
            label={t("xp.endsAt")}
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>{t("xp.isActive")}</span>
          </label>
        </div>
        <div className="mt-4">
          <TextArea
            label={t("xp.allowedReasons")}
            helperText={t("xp.allowedReasonsHelp")}
            value={allowedReasons}
            onChange={(event) => setAllowedReasons(event.target.value)}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" loading={saving} onClick={handleSubmit}>
          {mode === "edit" ? t("actions.update") : t("actions.create")}
        </Button>
      </div>
    </div>
  );
}

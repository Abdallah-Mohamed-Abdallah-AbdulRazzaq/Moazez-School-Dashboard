"use client";

import { useState } from "react";
import { Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Input from "@/components/ui/input/Input";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentNotificationPolicy } from "../hooks/useAcademicContentNotificationPolicy";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import { parseReminderOffsets } from "../model/academicContentNotificationPolicy";
import type { AcademicContentNotificationPolicy } from "../types/contracts";

type BooleanPolicyKey = {
  [
    Key in keyof AcademicContentNotificationPolicy
  ]: AcademicContentNotificationPolicy[Key] extends boolean ? Key : never;
}[keyof AcademicContentNotificationPolicy];

const GROUPS: ReadonlyArray<{
  key: string;
  fields: readonly BooleanPolicyKey[];
}> = [
  {
    key: "delivery",
    fields: [
      "notificationsEnabled",
      "studentNotificationsEnabled",
      "guardianNotificationsEnabled",
    ],
  },
  {
    key: "content_types",
    fields: [
      "weeklyPlanNotificationsEnabled",
      "guardianWeeklyNoteNotificationsEnabled",
      "subjectResourceNotificationsEnabled",
      "onlineSessionNotificationsEnabled",
      "generalResourceNotificationsEnabled",
    ],
  },
  {
    key: "events",
    fields: [
      "significantUpdateNotificationsEnabled",
      "cancellationNotificationsEnabled",
      "onlineSessionRemindersEnabled",
    ],
  },
];

export default function AcademicContentNotificationPolicyPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("academics.academic_content.settings.manage");
  const state = useAcademicContentNotificationPolicy();
  const t = useAcademicContentTranslations("notification_policy");
  const [offsetsOverride, setOffsetsOverride] = useState<string | null>(null);
  const [offsetError, setOffsetError] = useState<string | null>(null);

  if (state.isLoading) {
    return (
      <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
        <PartialLoader />
      </main>
    );
  }

  if (!state.draft) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <EmptyState
          title={t("unavailable_title")}
          message={state.error?.message ?? t("unavailable_message")}
          action={
            <Button onClick={() => void state.reload()}>{t("retry")}</Button>
          }
        />
      </main>
    );
  }

  const draft = state.draft;
  const savedOffsets = draft.onlineSessionReminderOffsetsMinutes.join(", ");
  const offsets = offsetsOverride ?? savedOffsets;
  const disabled = !canManage || state.isSaving;
  const save = async () => {
    const parsed = parseReminderOffsets(offsets);
    if (parsed.error) {
      setOffsetError(t(`offset_errors.${parsed.error}`));
      return;
    }
    setOffsetError(null);
    setOffsetsOverride(parsed.value.join(", "));
    await state.save({ onlineSessionReminderOffsetsMinutes: parsed.value });
  };

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-950">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
          </div>
        </div>

        {state.error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error.message}
          </p>
        ) : null}
        {state.saved ? (
          <p
            role="status"
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            {t("saved")}
          </p>
        ) : null}
        {!canManage ? (
          <p className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            {t("read_only")}
          </p>
        ) : null}

        <div className="mt-6 space-y-6">
          {GROUPS.map((group) => (
            <fieldset key={group.key}>
              <legend className="mb-3 text-sm font-semibold text-gray-900">
                {t(`groups.${group.key}`)}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.fields.map((field) => {
                  const parentDisabled =
                    field !== "notificationsEnabled" &&
                    !draft.notificationsEnabled;
                  return (
                    <Checkbox
                      key={field}
                      label={t(`fields.${field}.label`)}
                      description={t(`fields.${field}.description`)}
                      checked={draft[field]}
                      disabled={disabled || parentDisabled}
                      onChange={(event) =>
                        state.updateDraft({ [field]: event.target.checked })
                      }
                    />
                  );
                })}
              </div>
            </fieldset>
          ))}

          <Input
            label={t("offsets.label")}
            value={offsets}
            disabled={
              disabled ||
              !draft.notificationsEnabled ||
              !draft.onlineSessionRemindersEnabled
            }
            helperText={offsetError ?? t("offsets.help")}
            aria-invalid={Boolean(offsetError)}
            onChange={(event) => {
              setOffsetsOverride(event.target.value);
              setOffsetError(null);
            }}
          />
        </div>

        {canManage ? (
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              loading={state.isSaving}
              disabled={!state.isDirty && offsets === savedOffsets}
              leftIcon={<Save aria-hidden="true" className="size-4" />}
              onClick={() => void save()}
            >
              {t("save")}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

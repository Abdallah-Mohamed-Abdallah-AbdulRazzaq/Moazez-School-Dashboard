"use client";

import { Download, Inbox, Plus } from "lucide-react";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { GoogleLocationPicker } from "@/components/ui/google-location-picker";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { timezones } from "@/features/settings/constants/timezones";
import NedaaGateFormModal from "@/features/nedaa/components/NedaaGateFormModal";
import type {
  CreateDismissalGatePayload,
  NedaaGate,
  NedaaSettingsPatch,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import {
  getNedaaDefaultGateOptions,
  getNedaaOrderedGates,
} from "@/features/nedaa/utils/nedaaPresentation";
import { getNedaaLocationPickerLabels } from "@/features/nedaa/utils/nedaaLocationPicker";

interface NedaaSettingsViewProps {
  settings: NedaaSettings;
  initialSettings: NedaaSettings;
  isSaving?: boolean;
  isReadOnly?: boolean;
  canManage?: boolean;
  manageNotice?: string | null;
  isGateModalOpen: boolean;
  gateModalMode: "create" | "edit";
  editingGate?: NedaaGate | null;
  onChange: (updates: NedaaSettingsPatch) => void;
  onReset: () => void;
  onSave: () => void;
  onOpenExport: () => void;
  onOpenCreateGate: () => void;
  onOpenEditGate: (gate: NedaaGate) => void;
  onCloseGateModal: () => void;
  onSubmitGate: (payload: CreateDismissalGatePayload) => Promise<void> | void;
  onGateUpdated?: (gate: NedaaGate) => void;
  onToggleGateActive: (gate: NedaaGate) => void;
}

function GateMetaBadge({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "slate" | "blue" | "amber";
}) {
  const toneClasses: Record<"emerald" | "slate" | "blue" | "amber", string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function SettingsToggle({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      className="flex min-h-20 items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-start transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <span
        aria-hidden
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-gray-600">
          {description}
        </span>
      </span>
    </button>
  );
}

export default function NedaaSettingsView({
  settings,
  initialSettings,
  isSaving = false,
  isReadOnly = false,
  canManage = true,
  manageNotice = null,
  isGateModalOpen,
  gateModalMode,
  editingGate = null,
  onChange,
  onReset,
  onSave,
  onOpenExport,
  onOpenCreateGate,
  onOpenEditGate,
  onCloseGateModal,
  onSubmitGate,
  onGateUpdated,
  onToggleGateActive,
}: NedaaSettingsViewProps) {
  const locale = useLocale();
  const t = useTranslations("nedaa");
  const isDirty =
    JSON.stringify(settings.settings) !==
    JSON.stringify(initialSettings.settings);
  const canEdit = canManage && !isReadOnly;
  const orderedGates = useMemo(
    () => getNedaaOrderedGates(settings.gates),
    [settings.gates],
  );
  const defaultGateOptions = useMemo(
    () => getNedaaDefaultGateOptions(settings.gates),
    [settings.gates],
  );
  const defaultGateId = settings.settings.defaultGate?.id || "";
  const lastUpdated = settings.settings.updatedAt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(settings.settings.updatedAt))
    : t("settings.not_available");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("settings.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onOpenExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {t("export.button")}
          </Button>
          <Button
            variant="secondary"
            disabled={!isDirty || isSaving || !canEdit}
            onClick={onReset}
          >
            {t("settings.reset")}
          </Button>
          <Button
            loading={isSaving}
            disabled={!isDirty || isSaving || !canEdit}
            onClick={onSave}
          >
            {t("settings.save")}
          </Button>
        </div>
      </div>

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("read_only_notice")}
        </div>
      ) : null}

      {!isReadOnly && !canManage && manageNotice ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {manageNotice}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings.rules_title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.rules_subtitle")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${
                  settings.settings.configured ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {settings.settings.configured
                ? t("settings.configured")
                : t("settings.not_configured")}
            </span>
            <span>{t("settings.last_updated", { value: lastUpdated })}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SettingsToggle
            checked={settings.settings.enabled}
            description={t("settings.enabled_description")}
            disabled={!canEdit}
            label={t("settings.enabled")}
            onChange={() => onChange({ enabled: !settings.settings.enabled })}
          />
          <Select
            label={t("settings.timezone")}
            value={settings.settings.timezone}
            disabled={!canEdit}
            onChange={(timezone) => onChange({ timezone })}
            options={timezones.map((timezone) => ({
              value: timezone,
              label: timezone,
            }))}
          />
          <Input
            type="number"
            label={t("settings.allowed_radius")}
            value={String(settings.settings.allowedRadiusMeters)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({ allowedRadiusMeters: Number(event.target.value || 0) })
            }
          />
          <Input
            type="number"
            label={t("settings.delay_threshold")}
            value={String(settings.settings.thresholds.delayMinutes)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({
                delayThresholdMinutes: Number(event.target.value || 0),
              })
            }
          />
          <Input
            type="number"
            label={t("settings.urgent_threshold")}
            value={String(settings.settings.thresholds.urgentMinutes)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({
                urgentThresholdMinutes: Number(event.target.value || 0),
              })
            }
          />
          <Input
            type="number"
            label={t("settings.expiry_threshold")}
            value={String(settings.settings.thresholds.expiryMinutes)}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({
                expiryThresholdMinutes: Number(event.target.value || 0),
              })
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings.policies_title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.policies_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SettingsToggle
            checked={settings.settings.policies.requirePickupCode}
            description={t("settings.require_pickup_code_description")}
            disabled={!canEdit}
            label={t("settings.require_pickup_code")}
            onChange={() =>
              onChange({
                requirePickupCode: !settings.settings.policies.requirePickupCode,
              })
            }
          />
          <SettingsToggle
            checked={settings.settings.policies.allowDelegatePickup}
            description={t("settings.allow_delegate_pickup_description")}
            disabled={!canEdit}
            label={t("settings.allow_delegate_pickup")}
            onChange={() =>
              onChange({
                allowDelegatePickup:
                  !settings.settings.policies.allowDelegatePickup,
              })
            }
          />
          <SettingsToggle
            checked={settings.settings.policies.allowParentCancelBeforeCalled}
            description={t("settings.allow_parent_cancel_description")}
            disabled={!canEdit}
            label={t("settings.allow_parent_cancel")}
            onChange={() =>
              onChange({
                allowParentCancelBeforeCalled:
                  !settings.settings.policies.allowParentCancelBeforeCalled,
              })
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("settings.pickup_window_title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.pickup_window_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            type="time"
            label={t("settings.pickup_start")}
            value={settings.settings.requestWindow.startLocal || ""}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({ requestWindowStartLocal: event.target.value || null })
            }
          />
          <Input
            type="time"
            label={t("settings.pickup_end")}
            value={settings.settings.requestWindow.endLocal || ""}
            disabled={!canEdit}
            onChange={(event) =>
              onChange({ requestWindowEndLocal: event.target.value || null })
            }
          />
        </div>
        <div className="mt-5">
          <GoogleLocationPicker
            value={
              settings.settings.schoolZone.latitude !== null &&
              settings.settings.schoolZone.longitude !== null
                ? {
                    latitude: settings.settings.schoolZone.latitude,
                    longitude: settings.settings.schoolZone.longitude,
                    label: settings.settings.schoolZone.label || "",
                    formattedAddress: settings.settings.schoolZone.label || "",
                  }
                : null
            }
            radiusMeters={settings.settings.allowedRadiusMeters}
            labels={getNedaaLocationPickerLabels(t)}
            disabled={!canEdit}
            onChange={(location) =>
              onChange({
                schoolLatitude: location?.latitude ?? null,
                schoolLongitude: location?.longitude ?? null,
                schoolZoneLabel: location?.label ?? null,
              })
            }
          />
          <p className="mt-2 text-xs text-gray-500">
            {t("settings.location_source", {
              source: t(
                `settings.location_sources.${settings.settings.schoolZone.source}`,
              ),
            })}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("settings.gate_management_title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("settings.gate_management_subtitle")}
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Select
              label={t("settings.default_gate")}
              value={defaultGateId}
              disabled={!canEdit}
              onChange={(value) => onChange({ defaultGateId: value || null })}
              options={[
                {
                  value: "",
                  label: t("settings.no_default_gate"),
                },
                ...defaultGateOptions.map((gate) => ({
                  value: gate.id,
                  label: `${gate.name} (${gate.code})`,
                })),
              ]}
            />
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onOpenCreateGate}
            disabled={!canEdit}
          >
            {t("settings.add_gate")}
          </Button>
        </div>

        <div className="space-y-3">
          {orderedGates.map((gate) => (
            <div
              key={gate.id}
              className="rounded-2xl border border-gray-200 px-4 py-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {gate.name}
                      </h3>
                      {defaultGateId === gate.id ? (
                        <GateMetaBadge
                          label={t("settings.default_gate_badge")}
                          tone="blue"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wide text-gray-500">
                      {gate.code}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <GateMetaBadge
                      label={
                        gate.isActive
                          ? t("settings.gate_status.active")
                          : t("settings.gate_status.inactive")
                      }
                      tone={gate.isActive ? "emerald" : "slate"}
                    />
                    <GateMetaBadge
                      label={t(`settings.status_options.${gate.status}`)}
                      tone={gate.status === "open" ? "amber" : "slate"}
                    />
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-900">
                        {t("settings.campus")}:
                      </span>{" "}
                      {gate.campus || t("settings.no_location_hint")}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        {t("settings.notes")}:
                      </span>{" "}
                      {gate.notes || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenEditGate(gate)}
                    disabled={!canEdit}
                  >
                    {t("settings.edit_gate")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleGateActive(gate)}
                    disabled={!canEdit}
                  >
                    {gate.isActive
                      ? t("settings.deactivate_gate")
                      : t("settings.activate_gate")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {orderedGates.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              title={t("settings.gate_management_empty_title")}
              message={t("settings.gate_management_empty_description")}
              action={
                <Button
                  variant="secondary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={onOpenCreateGate}
                  disabled={!canEdit}
                >
                  {t("settings.add_gate")}
                </Button>
              }
            />
          ) : null}
        </div>
      </section>

      <NedaaGateFormModal
        isOpen={isGateModalOpen}
        mode={gateModalMode}
        initialGate={editingGate}
        existingGateIds={orderedGates.map((gate) => gate.code)}
        onClose={onCloseGateModal}
        onSubmit={onSubmitGate}
        onGateUpdated={onGateUpdated}
      />
    </div>
  );
}

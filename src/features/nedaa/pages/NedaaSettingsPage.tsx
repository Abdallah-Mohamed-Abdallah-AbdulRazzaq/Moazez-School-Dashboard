"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getNedaaApiErrorMessage } from "@/features/nedaa/utils/nedaaApiErrors";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaGlobalExportModal from "@/features/nedaa/shared/components/export/NedaaGlobalExportModal";
import {
  createDismissalGate,
  fetchDismissalSettings,
  listDismissalGates,
  updateDismissalGate,
  updateDismissalSettings,
} from "@/features/nedaa/services/dismissalApiService";
import {
  exportNedaaData,
  formatNedaaExportDate,
  generateNedaaExportFilename,
  type ExportColumn,
  type NedaaExportFormat,
} from "@/features/nedaa/shared/utils/nedaaExport";
import type {
  CreateDismissalGatePayload,
  NedaaGate,
  NedaaSettingsPatch,
  NedaaSettings,
  UpdateDismissalSettingsPayload,
} from "@/features/nedaa/types/nedaa";
import NedaaSettingsView from "@/features/nedaa/views/NedaaSettingsView";
import { getNedaaOrderedGates } from "@/features/nedaa/utils/nedaaPresentation";

async function fetchDismissalSettingsBundle(): Promise<NedaaSettings> {
  const [settings, gatesResponse] = await Promise.all([
    fetchDismissalSettings(),
    listDismissalGates({ limit: 100 }),
  ]);

  return {
    settings,
    gates: gatesResponse.data,
  };
}

function cloneSettingsValue(settings: NedaaSettings): NedaaSettings {
  return {
    settings: {
      ...settings.settings,
      schoolZone: { ...settings.settings.schoolZone },
      requestWindow: { ...settings.settings.requestWindow },
      thresholds: { ...settings.settings.thresholds },
      policies: { ...settings.settings.policies },
      defaultGate: settings.settings.defaultGate
        ? { ...settings.settings.defaultGate }
        : null,
    },
    gates: settings.gates.map((gate) => ({
      ...gate,
      location: { ...gate.location },
      waitingZones: [...gate.waitingZones],
    })),
  };
}

function applySettingsPatch(
  current: NedaaSettings,
  patch: UpdateDismissalSettingsPayload,
  schoolZoneLabel?: string | null,
): NedaaSettings {
  const defaultGate =
    patch.defaultGateId !== undefined
      ? (current.gates.find((gate) => gate.id === patch.defaultGateId) ?? null)
      : current.settings.defaultGate;

  return {
    ...current,
    settings: {
      ...current.settings,
      enabled: patch.enabled ?? current.settings.enabled,
      timezone: patch.timezone ?? current.settings.timezone,
      allowedRadiusMeters:
        patch.allowedRadiusMeters ?? current.settings.allowedRadiusMeters,
      schoolZone: {
        ...current.settings.schoolZone,
        label:
          schoolZoneLabel !== undefined
            ? schoolZoneLabel
            : current.settings.schoolZone.label,
        latitude:
          patch.schoolLatitude !== undefined
            ? patch.schoolLatitude
            : current.settings.schoolZone.latitude,
        longitude:
          patch.schoolLongitude !== undefined
            ? patch.schoolLongitude
            : current.settings.schoolZone.longitude,
        source:
          patch.schoolLatitude !== undefined ||
          patch.schoolLongitude !== undefined
            ? "settings"
            : current.settings.schoolZone.source,
      },
      requestWindow: {
        startLocal:
          patch.requestWindowStartLocal !== undefined
            ? patch.requestWindowStartLocal
            : current.settings.requestWindow.startLocal,
        endLocal:
          patch.requestWindowEndLocal !== undefined
            ? patch.requestWindowEndLocal
            : current.settings.requestWindow.endLocal,
      },
      thresholds: {
        delayMinutes:
          patch.delayThresholdMinutes ??
          current.settings.thresholds.delayMinutes,
        urgentMinutes:
          patch.urgentThresholdMinutes ??
          current.settings.thresholds.urgentMinutes,
        expiryMinutes:
          patch.expiryThresholdMinutes ??
          current.settings.thresholds.expiryMinutes,
      },
      policies: {
        requirePickupCode:
          patch.requirePickupCode ??
          current.settings.policies.requirePickupCode,
        allowDelegatePickup:
          patch.allowDelegatePickup ??
          current.settings.policies.allowDelegatePickup,
        allowParentCancelBeforeCalled:
          patch.allowParentCancelBeforeCalled ??
          current.settings.policies.allowParentCancelBeforeCalled,
      },
      defaultGate: defaultGate
        ? {
            id: defaultGate.id,
            code: defaultGate.code,
            name: defaultGate.name,
            status: defaultGate.status,
          }
        : null,
    },
  };
}

export default function NedaaSettingsPage() {
  const locale = useLocale();
  const t = useTranslations("nedaa");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const isReadOnly = false;
  const canViewSettings = hasPermission("dismissal.settings.view");
  const canManageSettings = hasPermission("dismissal.settings.manage");
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<NedaaSettings | null>(
    null,
  );
  const [pendingSettingsPatch, setPendingSettingsPatch] =
    useState<UpdateDismissalSettingsPayload>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [gateModalMode, setGateModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingGate, setEditingGate] = useState<NedaaGate | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!canViewSettings) {
      void Promise.resolve().then(() => setIsLoading(false));
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const nextSettings = await fetchDismissalSettingsBundle();
        if (!cancelled) {
          setSettings(cloneSettingsValue(nextSettings));
          setInitialSettings(cloneSettingsValue(nextSettings));
          setPendingSettingsPatch({});
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_settings_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canViewSettings, t]);

  const updateSettings = (updates: NedaaSettingsPatch) => {
    const { schoolZoneLabel, ...apiUpdates } = updates;
    setPendingSettingsPatch((current) => ({ ...current, ...apiUpdates }));
    setSettings((current) =>
      current ? applySettingsPatch(current, apiUpdates, schoolZoneLabel) : current,
    );
  };

  const handleSave = async () => {
    if (!settings || !canManageSettings || isReadOnly) {
      return;
    }

    setIsSaving(true);
    try {
      const savedSettings = await updateDismissalSettings(pendingSettingsPatch);
      const saved = {
        ...settings,
        settings: savedSettings,
      };
      setSettings(cloneSettingsValue(saved));
      setInitialSettings(cloneSettingsValue(saved));
      setPendingSettingsPatch({});
      showSuccess(t("messages.settings_saved"));
    } catch (error) {
      showError(getNedaaApiErrorMessage(error, t, "messages.settings_save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitGate = async (payload: CreateDismissalGatePayload) => {
    if (!settings || !canManageSettings || isReadOnly) {
      return;
    }

    try {
      const savedGate =
        gateModalMode === "edit" && editingGate
          ? await updateDismissalGate(editingGate.id, payload)
          : await createDismissalGate(payload);

      const nextSettings = {
        ...settings,
        gates:
          gateModalMode === "edit"
            ? settings.gates.map((gate) =>
                gate.id === savedGate.id ? savedGate : gate,
              )
            : [...settings.gates, savedGate],
      };
      setSettings(cloneSettingsValue(nextSettings));
      setInitialSettings((current) =>
        current
          ? cloneSettingsValue({
              ...current,
              gates:
                gateModalMode === "edit"
                  ? current.gates.map((gate) =>
                      gate.id === savedGate.id ? savedGate : gate,
                    )
                  : [...current.gates, savedGate],
            })
          : current,
      );
      setIsGateModalOpen(false);
      setEditingGate(null);
      setGateModalMode("create");
      showSuccess(t("messages.settings_saved"));
    } catch (error) {
      showError(getNedaaApiErrorMessage(error, t, "messages.settings_save_failed"));
    }
  };

  const handleGateUpdated = (updatedGate: NedaaGate) => {
    if (!settings) return;
    const nextSettings = {
      ...settings,
      gates: settings.gates.map((gate) =>
        gate.id === updatedGate.id ? updatedGate : gate,
      ),
    };
    setSettings(cloneSettingsValue(nextSettings));
    setInitialSettings((current) =>
      current
        ? cloneSettingsValue({
            ...current,
            gates: current.gates.map((gate) =>
              gate.id === updatedGate.id ? updatedGate : gate,
            ),
          })
        : current,
    );
  };


  const handleToggleGateActive = async (gate: NedaaGate) => {
    if (!settings || !canManageSettings || isReadOnly) {
      return;
    }

    try {
      const savedGate = await updateDismissalGate(gate.id, {
        isActive: !gate.isActive,
      });
      const nextSettings = {
        ...settings,
        gates: settings.gates.map((item) =>
          item.id === savedGate.id ? savedGate : item,
        ),
      };
      setSettings(cloneSettingsValue(nextSettings));
      setInitialSettings((current) =>
        current
          ? cloneSettingsValue({
              ...current,
              gates: current.gates.map((item) =>
                item.id === savedGate.id ? savedGate : item,
              ),
            })
          : current,
      );
      showSuccess(t("messages.settings_saved"));
    } catch (error) {
      showError(getNedaaApiErrorMessage(error, t, "messages.settings_save_failed"));
    }
  };

  const handleExport = async (format: NedaaExportFormat) => {
    if (!settings) return;

    const rulesColumns: ExportColumn[] = [
      { key: "setting", label: t("settings.export_setting") },
      { key: "value", label: t("settings.export_value") },
    ];

    const gateColumns: ExportColumn[] = [
      { key: "code", label: t("table.code") },
      { key: "name", label: t("table.name") },
      { key: "campus", label: t("table.campus") },
      { key: "status", label: t("table.status") },
      { key: "isActive", label: t("table.active") },
      { key: "sortOrder", label: t("settings.gate_form.sort_order") },
      { key: "notes", label: t("settings.notes") },
    ];

    const rulesRows = [
      { setting: t("settings.enabled"), value: settings.settings.enabled },
      { setting: t("settings.timezone"), value: settings.settings.timezone },
      {
        setting: t("settings.allowed_radius"),
        value: settings.settings.allowedRadiusMeters,
      },
      {
        setting: t("settings.pickup_start"),
        value: settings.settings.requestWindow.startLocal || "",
      },
      {
        setting: t("settings.pickup_end"),
        value: settings.settings.requestWindow.endLocal || "",
      },
      {
        setting: t("settings.delay_threshold"),
        value: settings.settings.thresholds.delayMinutes,
      },
      {
        setting: t("settings.urgent_threshold"),
        value: settings.settings.thresholds.urgentMinutes,
      },
      {
        setting: t("settings.expiry_threshold"),
        value: settings.settings.thresholds.expiryMinutes,
      },
      {
        setting: t("settings.default_gate"),
        value:
          settings.settings.defaultGate?.name || t("settings.no_default_gate"),
      },
    ];

    const gateRows = getNedaaOrderedGates(settings.gates).map((gate) => ({
      code: gate.code,
      name: gate.name,
      campus: gate.campus || "",
      status: t(`settings.status_options.${gate.status}`),
      isActive: gate.isActive ? t("table.yes") : t("table.no"),
      sortOrder: gate.sortOrder,
      notes: gate.notes || "",
    }));

    exportNedaaData({
      title: t("settings.title"),
      metadata: {
        yearName: "",
        termName: "",
        viewName: t("settings.title"),
        exportDate: formatNedaaExportDate(locale),
      },
      filename: generateNedaaExportFilename("nedaa-settings", null),
      format,
      sections: [
        {
          title: t("settings.rules_title"),
          columns: rulesColumns,
          rows: rulesRows,
        },
        {
          title: t("settings.gate_management_title"),
          columns: gateColumns,
          rows: gateRows,
        },
      ],
      jsonData: {
        title: t("settings.title"),
        metadata: {
          yearName: "",
          termName: "",
          viewName: t("settings.title"),
          exportDate: formatNedaaExportDate("en"),
        },
        settings: settings.settings,
        gates: getNedaaOrderedGates(settings.gates),
      },
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  if (!canViewSettings) {
    return <NedaaAccessNotice />;
  }

  if (isLoading) {
    return <MainLoader />;
  }

  if (loadError || !settings || !initialSettings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {loadError || t("messages.load_settings_failed")}
        </p>
      </div>
    );
  }

  return (
    <>
      <NedaaSettingsView
        settings={settings}
        initialSettings={initialSettings}
        isSaving={isSaving}
        isReadOnly={isReadOnly}
        canManage={canManageSettings}
        manageNotice={!canManageSettings ? t("access.manage_notice") : null}
        isGateModalOpen={isGateModalOpen}
        gateModalMode={gateModalMode}
        editingGate={editingGate}
        onChange={updateSettings}
        onOpenExport={() => setShowExportModal(true)}
        onOpenCreateGate={() => {
          setGateModalMode("create");
          setEditingGate(null);
          setIsGateModalOpen(true);
        }}
        onOpenEditGate={(gate) => {
          setGateModalMode("edit");
          setEditingGate(gate);
          setIsGateModalOpen(true);
        }}
        onCloseGateModal={() => {
          setIsGateModalOpen(false);
          setEditingGate(null);
          setGateModalMode("create");
        }}
        onSubmitGate={handleSubmitGate}
        onGateUpdated={handleGateUpdated}
        onToggleGateActive={(gate) => {
          void handleToggleGateActive(gate);
        }}
        onReset={() => {
          setSettings(cloneSettingsValue(initialSettings));
          setPendingSettingsPatch({});
          setIsGateModalOpen(false);
          setEditingGate(null);
          setGateModalMode("create");
        }}
        onSave={handleSave}
      />
      <NedaaGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={(settings?.gates.length || 0) + 1}
        emptyStateMessage={t("export.errors.noData")}
      />
    </>
  );
}

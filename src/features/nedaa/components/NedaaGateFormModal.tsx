"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import {
  GoogleLocationPicker,
  type GoogleLocationValue,
} from "@/components/ui/google-location-picker";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type {
  CreateDismissalGatePayload,
  DismissalGateStatus,
  NedaaGate,
} from "@/features/nedaa/types/nedaa";
import { createNedaaGateIdFromName } from "@/features/nedaa/utils/nedaaPresentation";
import { getNedaaLocationPickerLabels } from "@/features/nedaa/utils/nedaaLocationPicker";
import { getNedaaApiErrorMessage } from "@/features/nedaa/utils/nedaaApiErrors";
import { updateDismissalGate } from "@/features/nedaa/services/dismissalApiService";
import { useToast } from "@/components/ui/toast/Toast";

interface NedaaGateFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialGate?: NedaaGate | null;
  existingGateIds: string[];
  onClose: () => void;
  onSubmit: (payload: CreateDismissalGatePayload) => Promise<void> | void;
  onGateUpdated?: (gate: NedaaGate) => void;
}

const GATE_STATUSES: DismissalGateStatus[] = [
  "open",
  "busy",
  "closed",
  "maintenance",
];

export default function NedaaGateFormModal({
  isOpen,
  mode,
  initialGate,
  existingGateIds,
  onClose,
  onSubmit,
  onGateUpdated,
}: NedaaGateFormModalProps) {
  const t = useTranslations("nedaa");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [campus, setCampus] = useState("");
  const [status, setStatus] = useState<DismissalGateStatus>("open");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [location, setLocation] = useState<GoogleLocationValue | null>(null);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [waitingZones, setWaitingZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState("");
  const [isUpdatingZones, setIsUpdatingZones] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void Promise.resolve().then(() => {
      setName(initialGate?.name || "");
      setCode(initialGate?.code || "");
      setCampus(initialGate?.campus || "");
      setStatus(initialGate?.status || "open");
      setIsActive(initialGate?.isActive ?? true);
      setSortOrder(String(initialGate?.sortOrder ?? 0));
      setLocation(
        initialGate?.location.latitude !== null &&
          initialGate?.location.latitude !== undefined &&
          initialGate.location.longitude !== null &&
          initialGate.location.longitude !== undefined
          ? {
              latitude: initialGate.location.latitude,
              longitude: initialGate.location.longitude,
              label: initialGate.name,
              formattedAddress: initialGate.campus || initialGate.name,
            }
          : null,
      );
      setIsLocationValid(true);
      setWaitingZones(initialGate?.waitingZones || []);
      setNotes(initialGate?.notes || "");
      setIsSubmitting(false);
      setSubmitError(null);
    });
  }, [initialGate, isOpen]);

  const normalizedCode = useMemo(
    () =>
      code.trim() ||
      createNedaaGateIdFromName(name)
        .toUpperCase()
        .replace(/_/g, "-")
        .slice(0, 50),
    [code, name],
  );

  const duplicateIdExists =
    mode === "create" &&
    normalizedCode !== "" &&
    existingGateIds.includes(normalizedCode);
  const nameError =
    name.trim() === ""
      ? t("settings.gate_form.validation.name_en_required")
      : undefined;
  const gateCodeError = !normalizedCode
    ? t("settings.gate_form.validation.invalid_id")
    : duplicateIdExists
      ? t("settings.gate_form.validation.duplicate_id")
      : undefined;
  const canSubmit =
    !nameError && !gateCodeError && isLocationValid && !isSubmitting && !isUpdatingZones;

  const handleAddZone = async () => {
    const trimmed = newZone.trim();
    if (!trimmed) return;

    if (waitingZones.includes(trimmed)) {
      showError(t("settings.gate_form.validation.duplicate_zone") || "Zone already exists");
      return;
    }

    const nextZones = [...waitingZones, trimmed];
    setWaitingZones(nextZones);
    setNewZone("");

    if (mode === "edit" && initialGate?.id) {
      setIsUpdatingZones(true);
      try {
        const savedGate = await updateDismissalGate(initialGate.id, {
          waitingZones: nextZones,
        });
        onGateUpdated?.(savedGate);
        showSuccess(t("messages.settings_saved") || "Settings saved successfully");
      } catch (error) {
        showError(
          getNedaaApiErrorMessage(error, t, "messages.settings_save_failed"),
        );
        setWaitingZones(waitingZones);
      } finally {
        setIsUpdatingZones(false);
      }
    }
  };

  const handleRemoveZone = async (zoneToRemove: string) => {
    const nextZones = waitingZones.filter((z) => z !== zoneToRemove);
    setWaitingZones(nextZones);

    if (mode === "edit" && initialGate?.id) {
      setIsUpdatingZones(true);
      try {
        const savedGate = await updateDismissalGate(initialGate.id, {
          waitingZones: nextZones,
        });
        onGateUpdated?.(savedGate);
        showSuccess(t("messages.settings_saved") || "Settings saved successfully");
      } catch (error) {
        showError(
          getNedaaApiErrorMessage(error, t, "messages.settings_save_failed"),
        );
        setWaitingZones(waitingZones);
      } finally {
        setIsUpdatingZones(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setSubmitError(gateCodeError || nameError || null);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        code: normalizedCode,
        name: name.trim(),
        campus: campus.trim() || null,
        status,
        isActive,
        sortOrder: Number(sortOrder || 0),
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        waitingZones,
        notes: notes.trim() || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? t("settings.gate_form.create_title")
          : t("settings.gate_form.edit_title")
      }
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting
              ? tCommon("saving")
              : mode === "create"
                ? t("settings.gate_form.create_action")
                : t("settings.gate_form.save_action")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={t("settings.gate_form.name_en")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={submitError && !name.trim() ? nameError : undefined}
        />
        <Input
          label={t("settings.gate_form.generated_id")}
          value={normalizedCode}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          helperText={t("settings.gate_form.generated_id_help")}
          error={submitError ? gateCodeError : undefined}
          dir="ltr"
        />
        <Input
          label={t("settings.campus")}
          value={campus}
          onChange={(event) => setCampus(event.target.value)}
          placeholder={t("settings.gate_form.location_hint_placeholder")}
        />
        <Select
          label={t("settings.gate_form.status")}
          value={status}
          onChange={(value) => setStatus(value as DismissalGateStatus)}
          options={GATE_STATUSES.map((gateStatus) => ({
            value: gateStatus,
            label: t(`settings.status_options.${gateStatus}`),
          }))}
        />

        <div className="grid grid-cols-1 gap-3">
          <Input
            type="number"
            label={t("settings.gate_form.sort_order")}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </div>

        <GoogleLocationPicker
          value={location}
          labels={getNedaaLocationPickerLabels(t)}
          onChange={setLocation}
          onValidityChange={setIsLocationValid}
        />

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            {t("settings.gate_form.waiting_zones")}
          </label>
          <div className="flex gap-2">
            <div className="grow">
              <Input
                value={newZone}
                onChange={(event) => setNewZone(event.target.value)}
                placeholder={t("settings.gate_form.waiting_zones_placeholder") || "Type a zone name"}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAddZone();
                  }
                }}
                disabled={isSubmitting || isUpdatingZones}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddZone}
              disabled={!newZone.trim() || isSubmitting || isUpdatingZones}
            >
              {tCommon("add") || "Add"}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {waitingZones.map((zone) => (
              <span
                key={zone}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20"
              >
                {zone}
                <button
                  type="button"
                  onClick={() => handleRemoveZone(zone)}
                  disabled={isSubmitting || isUpdatingZones}
                  className="rounded-full hover:bg-primary/20 p-0.5"
                  aria-label={`Remove ${zone}`}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}
            {waitingZones.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                {t("settings.gate_form.no_waiting_zones") || "No waiting zones configured."}
              </p>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            {t("settings.gate_form.waiting_zones_help")}
          </p>
        </div>
        <TextArea
          label={t("settings.notes")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <div className="grid grid-cols-1 gap-3">
          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-gray-900">
                {t("settings.gate_form.active_toggle")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("settings.gate_form.active_toggle_help")}
              </p>
            </div>
          </label>
        </div>

        {submitError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

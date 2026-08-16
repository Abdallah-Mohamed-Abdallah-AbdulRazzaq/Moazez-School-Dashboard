"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import type { IncidentType } from "../types";

interface MinutesEditorModalProps {
  isOpen: boolean;
  type: IncidentType;
  initialMinutes: number;
  isReadOnly: boolean;
  onClose: () => void;
  onSave: (input: { minutes: number; correctionReason: string }) => Promise<void>;
}

export default function MinutesEditorModal({
  isOpen,
  type,
  initialMinutes,
  isReadOnly,
  onClose,
  onSave,
}: MinutesEditorModalProps) {
  const t = useTranslations("attendance.lateEarly.modal");
  const tCommon = useTranslations("common");
  const tForm = useTranslations("attendance.policies.form");
  const locale = useLocale();

  const [minutes, setMinutes] = useState<string>("0");
  const [correctionReason, setCorrectionReason] = useState("");
  const [errors, setErrors] = useState({ minutes: "", correctionReason: "" });
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void Promise.resolve().then(() => {
      setMinutes(String(initialMinutes));
      setCorrectionReason("");
      setErrors({ minutes: "", correctionReason: "" });
      setSaving(false);
      setShowDiscardConfirm(false);
    });
  }, [isOpen, initialMinutes]);

  const dirty = useMemo(
    () => minutes !== String(initialMinutes) || correctionReason.trim().length > 0,
    [minutes, initialMinutes, correctionReason],
  );

  const title = type === "LATE" ? t("editLateMinutes") : t("editEarlyLeaveMinutes");

  const validate = () => {
    if (minutes.trim() === "") {
      setErrors({ minutes: t("required"), correctionReason: "" });
      return false;
    }

    const numeric = Number(minutes);
    if (!Number.isInteger(numeric) || numeric < 1) {
      setErrors({ minutes: t("invalidMinutes"), correctionReason: "" });
      return false;
    }

    if (!correctionReason.trim()) {
      setErrors({ minutes: "", correctionReason: t("correctionReasonRequired") });
      return false;
    }

    if (correctionReason.trim().length > 1000) {
      setErrors({ minutes: "", correctionReason: t("correctionReasonTooLong") });
      return false;
    }

    setErrors({ minutes: "", correctionReason: "" });
    return true;
  };

  const handleRequestClose = () => {
    if (dirty && !saving) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      await onSave({ minutes: Number(minutes), correctionReason: correctionReason.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={title}
        size="sm"
        closeOnOverlayClick={!saving}
        closeOnEscape={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={handleRequestClose} disabled={saving}>
              {tCommon("cancel")}
            </Button>
            {!isReadOnly && (
              <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
                {tCommon("save")}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3 pb-2">
          <div className="relative">
            <Input
              type="number"
              min={1}
              required
              value={minutes}
              onChange={(event) => {
                setMinutes(event.target.value);
                if (errors.minutes) setErrors((previous) => ({ ...previous, minutes: "" }));
              }}
              label={t("minutesLabel")}
              error={errors.minutes}
              disabled={isReadOnly || saving}
              className={locale === "ar" ? "pl-16" : "pr-16"}
            />
            <div className={`absolute inset-y-0 ${locale === "ar" ? "left-0 pl-3" : "right-0 pr-3"} flex items-center pointer-events-none`} style={{ top: "1.5rem" }}>
              <span className="text-sm text-gray-500">{tForm("minutes")}</span>
            </div>
          </div>
          <Input
            value={correctionReason}
            onChange={(event) => {
              setCorrectionReason(event.target.value);
              if (errors.correctionReason) {
                setErrors((previous) => ({ ...previous, correctionReason: "" }));
              }
            }}
            label={t("correctionReason")}
            error={errors.correctionReason}
            disabled={isReadOnly || saving}
            maxLength={1000}
            required
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        title={t("discardTitle")}
        description={t("discardDescription")}
        confirmLabel={tCommon("discard")}
        cancelLabel={tCommon("stay")}
        severity="warning"
      />
    </>
  );
}

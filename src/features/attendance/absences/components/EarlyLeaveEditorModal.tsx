"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";

interface EarlyLeaveEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: { minutes: number; correctionReason: string }) => Promise<void>;
  initialMinutes?: number;
  isReadOnly: boolean;
}

export default function EarlyLeaveEditorModal({
  isOpen,
  onClose,
  onSave,
  initialMinutes = 0,
  isReadOnly,
}: EarlyLeaveEditorModalProps) {
  const t = useTranslations("attendance.absences.earlyLeave");
  const tCommon = useTranslations("common");
  const tForm = useTranslations("attendance.policies.form");
  const locale = useLocale();

  const [minutes, setMinutes] = useState(0);
  const [correctionReason, setCorrectionReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setMinutes(initialMinutes);
        setCorrectionReason("");
        setError("");
        setSaving(false);
      });
    }
  }, [isOpen, initialMinutes]);

  const handleSave = async () => {
    if (!Number.isInteger(minutes) || minutes < 1) {
      setError(t("invalidMinutes"));
      return;
    }
    if (!correctionReason.trim() || correctionReason.trim().length > 1000) {
      setError(t("invalidCorrectionReason"));
      return;
    }

    try {
      setSaving(true);
      await onSave({ minutes, correctionReason: correctionReason.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="space-y-4 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ color: "var(--color-gray-900)" }} className="text-xl font-semibold">{t("title")}</h2>
          <button
            onClick={onClose}
            style={{ color: "var(--color-neutral-400)" }}
            className="hover:text-[var(--color-gray-600)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {t("minutesLabel")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                value={minutes}
                onChange={(e) => {
                  setMinutes(parseInt(e.target.value) || 0);
                  setError("");
                }}
                disabled={isReadOnly || saving}
                min={1}
                placeholder="1"
                className={locale === "ar" ? "pl-16" : "pr-16"}
              />
              <div className={`absolute inset-y-0 ${locale === "ar" ? "left-0 pl-3" : "right-0 pr-3"} flex items-center pointer-events-none`}>
                <span style={{ color: "var(--color-neutral-500)" }} className="text-sm">{tForm("minutes")}</span>
              </div>
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <p style={{ color: "var(--color-neutral-500)" }} className="mt-1 text-xs">{t("helper")}</p>
          </div>
          <Input
            value={correctionReason}
            onChange={(event) => {
              setCorrectionReason(event.target.value);
              setError("");
            }}
            label={t("correctionReason")}
            maxLength={1000}
            disabled={isReadOnly || saving}
            required
          />
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--color-border)" }} className="flex items-center justify-end gap-3 mt-6 pt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {tCommon("cancel")}
          </Button>
          {!isReadOnly && (
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
              {tCommon("save")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useTranslations } from "next-intl";
import {
  Save,
  Send,
  RotateCcw,
  Download,
  CheckCircle,
  Undo2,
} from "lucide-react";
import Button from "@/components/ui/button/Button";

interface RollCallHeaderBarProps {
  isDirty: boolean;
  isReadOnly: boolean;
  isSubmitted: boolean;
  canSubmit: boolean;
  canReopenForEdit: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onUnsubmit?: () => void;
  onReset: () => void;
  onExport: () => void;
  onMarkAllPresent: () => void;
  onClearAll: () => void;
  isSaving?: boolean;
}

export default function RollCallHeaderBar({
  isDirty,
  isReadOnly,
  isSubmitted,
  canSubmit,
  canReopenForEdit,
  onSave,
  onSubmit,
  onUnsubmit,
  onReset,
  onExport,
  onMarkAllPresent,
  onClearAll,
  isSaving = false,
}: RollCallHeaderBarProps) {
  const t = useTranslations("attendance.rollCall.actions");
  const canUnsubmit = isSubmitted && canReopenForEdit && onUnsubmit;

  return (
    <div
      style={{ backgroundColor: "var(--background)" }}
      className="rounded-lg border border-border px-3 py-3"
    >
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left: Bulk Actions */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {!isReadOnly && !isSubmitted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllPresent}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {t("markAllPresent")}
              </Button>
              <Button variant="outline" size="sm" onClick={onClearAll}>
                {t("clearAll")}
              </Button>
            </>
          )}
        </div>

        {/* Right: Save/Submit/Export Actions */}
        <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>

          {/* Unsubmit - only show when submitted and user has permission */}
          {canUnsubmit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUnsubmit}
              leftIcon={<Undo2 className="w-4 h-4" />}
            >
              {t("unsubmit")}
            </Button>
          )}

          {!isReadOnly && !isSubmitted && (
            <>
              {/* Reset */}
              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  {t("reset")}
                </Button>
              )}

              {/* Save */}
              <Button
                variant="secondary"
                size="sm"
                onClick={onSave}
                disabled={!isDirty || isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? t("saving") : t("save")}
              </Button>

              {/* Submit */}
              <Button
                variant="primary"
                size="sm"
                onClick={onSubmit}
                disabled={!canSubmit || isSaving}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {t("submit")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

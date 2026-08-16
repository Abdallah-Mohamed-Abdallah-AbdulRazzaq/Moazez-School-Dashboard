"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { PrintButton } from "@/components/print";

interface ReportsExportActionsProps {
  onOpenExport: () => void;
  onPrint?: () => void;
  disabled?: boolean;
  printLabel?: string;
}

export default function ReportsExportActions({
  onOpenExport,
  onPrint,
  disabled = false,
  printLabel,
}: ReportsExportActionsProps) {
  const t = useTranslations("attendance.reportsPage.export");

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={onOpenExport}
        disabled={disabled}
        leftIcon={<Download className="w-4 h-4" />}
      >
        {t("button")}
      </Button>
      {onPrint ? (
        <PrintButton onClick={onPrint} disabled={disabled} label={printLabel} />
      ) : null}
    </div>
  );
}

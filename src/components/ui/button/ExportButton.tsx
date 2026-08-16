// FILE: src/components/ui/button/ExportButton.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import Button from "./Button";

export interface ExportButtonProps {
  onExport: (format: "csv" | "excel") => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Reusable Export Button with format selection dropdown
 * Uses token-based styling and i18n
 */
export default function ExportButton({
  onExport,
  disabled = false,
  label,
}: ExportButtonProps) {
  const t = useTranslations("common.export");
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: "csv" | "excel") => {
    setShowMenu(false);
    onExport(format);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        variant="secondary"
        leftIcon={<Download className="w-4 h-4" />}
      >
        {label || t("button")}
      </Button>

      {showMenu && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute left-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-20 bg-white border-border">
            <button
              onClick={() => handleExport("excel")}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
              style={{
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--hover-background)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>{t("excel")}</span>
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
              style={{
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--hover-background)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <FileText className="w-4 h-4 text-primary-600" />
              <span>{t("csv")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Settings2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { ValidationErrors } from "../types/types";

interface BuilderSettingsSidebarProps {
  children: ReactNode;
  validationErrors: ValidationErrors;
}

export default function BuilderSettingsSidebar({ children, validationErrors }: BuilderSettingsSidebarProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const isWideScreen = useMediaQuery("(min-width:1280px)");
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const isOpen = expandedOverride ?? isWideScreen;
  const panelId = useId();
  const errorCount = Object.entries(validationErrors)
    .filter(([field, message]) => field !== "questions" && field !== "general" && Boolean(message)).length;

  return (
    <aside className={`flex min-h-0 shrink-0 flex-col border-s border-gray-200 bg-white ${isOpen ? "w-80 xl:w-[22rem]" : "w-16"}`}>
      <div className="flex min-h-16 items-center justify-between gap-2 border-b border-gray-200 p-3">
        {isOpen && <h2 className="text-sm font-semibold text-gray-900">{t("settings")}</h2>}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpandedOverride(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={t(isOpen ? "hideSettings" : "showSettings")}
          title={t(isOpen ? "hideSettings" : "showSettings")}
          className="relative min-h-10 min-w-10 shrink-0 !px-2 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          {errorCount > 0 && <span className="absolute -end-1 -top-1 rounded-full bg-amber-100 px-1.5 text-xs text-amber-900">{errorCount}<span className="sr-only"> {t("settingsNeedAttention")}</span></span>}
        </Button>
      </div>
      <div id={panelId} hidden={!isOpen} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </aside>
  );
}

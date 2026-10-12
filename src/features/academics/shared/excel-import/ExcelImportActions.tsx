"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Upload } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import ExcelImportDialog from "./ExcelImportDialog";
import { createImportTemplate, downloadImportTemplate } from "./templateDownload";
import type { ImportedDraft, ImportContext, ImportModule } from "./types";

interface ExcelImportActionsProps {
  module: ImportModule;
  context: ImportContext;
  pendingImport: ImportedDraft | null;
  disabled: boolean;
  onApply: (draft: ImportedDraft) => void;
  onRemove: () => void;
}
export default function ExcelImportActions(props: ExcelImportActionsProps) {
  const t = useTranslations("academics.excelImport");
  const locale = useLocale();
  const { showError } = useToast();
  const [dialog, setDialog] = useState<"import" | "review" | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const download = async () => {
    setIsDownloading(true);
    try {
      const instructions = ["heading", "details", "targeting", "numbering", "dates", "booleans", "mcqSingle", "mcqMulti", "trueFalse", "shortAnswer", "essay", "languages", "marks", "limits", "modes", "optional"].map((key) => [t(`instructions.${key}`)]);
      const blob = await createImportTemplate({ module: props.module, locale: locale === "ar" ? "ar" : "en", instructions });
      downloadImportTemplate({ blob, filename: t(`filenames.${props.module}`) });
    } catch { showError(t("messages.parseFailed")); }
    finally { setIsDownloading(false); }
  };
  return <div className="my-4 space-y-3 rounded-lg border border-border p-4">
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" loading={isDownloading} onClick={download} leftIcon={<Download size={16} />}>{t("actions.download")}</Button>
      <Button variant="secondary" size="sm" disabled={props.disabled} onClick={() => setDialog("import")} leftIcon={<Upload size={16} />}>{t("actions.import")}</Button>
    </div>
    {props.pendingImport && <div className="flex flex-wrap items-center gap-3 text-sm" role="status">
      <span>{t("labels.pending", { count: props.pendingImport.questions.length })}</span>
      <Button variant="secondary" size="sm" disabled={props.disabled} onClick={() => setDialog("review")}>{t("actions.review")}</Button>
      <Button variant="secondary" size="sm" disabled={props.disabled} onClick={props.onRemove}>{t("actions.remove")}</Button>
    </div>}
    {dialog && <ExcelImportDialog key={dialog} isOpen module={props.module} context={props.context} initialImport={dialog === "review" ? props.pendingImport ?? undefined : undefined} disabled={props.disabled} onClose={() => setDialog(null)} onApply={(draft) => { props.onApply(draft); setDialog(null); }} />}
  </div>;
}

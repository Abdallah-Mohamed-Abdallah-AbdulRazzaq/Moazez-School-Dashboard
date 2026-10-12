"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import FileUploadButton from "@/components/ui/file-upload/FileUploadButton";
import { homeworkImportFromWorkbook, validateHomeworkImportDraft } from "@/features/academics/homework/utils/homeworkExcelImport";
import { assessmentImportFromWorkbook, validateAssessmentImportDraft } from "@/features/grades/assessments/utils/assessmentExcelImport";
import { importIssue, readImportWorkbook } from "./workbookReader";
import { MAX_IMPORT_BYTES } from "./templateSchemas";
import ExcelImportPreview, { ImportIssues } from "./ExcelImportPreview";
import type { ImportedDraft, ImportContext, ImportModule, ImportValidation } from "./types";

interface ExcelImportDialogProps {
  isOpen: boolean;
  module: ImportModule;
  context: ImportContext;
  initialImport?: ImportedDraft;
  disabled: boolean;
  onClose: () => void;
  onApply: (draft: ImportedDraft) => void;
}
function reviewDraft(draft: ImportedDraft | undefined, context: ImportContext) {
  if (!draft) return null;
  return draft.module === "assignment" ? validateHomeworkImportDraft(draft, context) : validateAssessmentImportDraft(draft, context);
}

export default function ExcelImportDialog(props: ExcelImportDialogProps) {
  const t = useTranslations("academics.excelImport");
  const [validation, setValidation] = useState<ImportValidation<ImportedDraft> | null>(() => reviewDraft(props.initialImport, props.context));
  const [isParsing, setIsParsing] = useState(false);
  const attempt = useRef(0);
  useEffect(() => () => { attempt.current++; }, []);
  const closeDialog = () => { attempt.current++; props.onClose(); };

  const selectWorkbook = async (files: File[]) => {
    const request = ++attempt.current;
    setIsParsing(true);
    setValidation(null);
    try {
      const parsed = await readImportWorkbook(files[0], props.module);
      const checked = parsed.kind === "invalid" ? parsed : props.module === "assignment"
        ? homeworkImportFromWorkbook(parsed.draft, props.context) : assessmentImportFromWorkbook(parsed.draft, props.context);
      if (request === attempt.current) setValidation(checked);
    } catch {
      if (request === attempt.current) setValidation({ kind: "invalid", issues: [importIssue("File", 0, "", "unreadableWorkbook")] });
    } finally {
      if (request === attempt.current) setIsParsing(false);
    }
  };

  return <Modal isOpen={props.isOpen} onClose={closeDialog} title={t(`title.${props.module}`)} description={t("description")} size="xl" footer={<>
    <Button variant="secondary" onClick={closeDialog}>{t("actions.cancel")}</Button>
    <Button disabled={props.disabled || isParsing || validation?.kind !== "valid"} onClick={() => { if (validation?.kind === "valid") props.onApply(validation.draft); }}>{t("actions.apply")}</Button>
  </>}>
    <div className="space-y-4">
      <FileUploadButton accept=".xlsx" multiple={false} maxSizeBytes={MAX_IMPORT_BYTES} disabled={props.disabled || isParsing} buttonLabel={t("actions.chooseFile")} onFilesSelected={selectWorkbook} helperText={t("labels.limits")} formatSizeError={(name, megabytes) => t("errors.fileTooLarge", { name, megabytes })} onError={() => setValidation(null)} />
      {isParsing && <p role="status" aria-live="polite">{t("labels.parsing")}</p>}
      {validation?.kind === "invalid" && <ImportIssues issues={validation.issues} />}
      {validation?.kind === "valid" && <ExcelImportPreview draft={validation.draft} warnings={validation.warnings} />}
    </div>
  </Modal>;
}

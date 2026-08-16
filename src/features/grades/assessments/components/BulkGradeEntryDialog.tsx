"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { Input, Select, TextArea } from "@/components/ui/input";
import Modal from "@/components/ui/modal/Modal";
import type { Assessment, AssessmentRosterItem, BulkGradeItemPayload, GradeItemStatus } from "../types";

const MAX_BULK_GRADE_ITEMS = 200;
type BulkEntryTranslator = ReturnType<typeof useTranslations>;
type EditableGradeField = "status" | "score" | "comment";

interface BulkGradeEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: BulkGradeItemPayload[]) => Promise<void>;
  assessment: Assessment | null;
  rows: AssessmentRosterItem[];
  isSubmitting: boolean;
}

function rowChanged(current: AssessmentRosterItem, initial: AssessmentRosterItem): boolean {
  return current.status !== initial.status || current.score !== initial.score || current.comment !== initial.comment;
}

function rowError(row: AssessmentRosterItem, maxScore: number, t: BulkEntryTranslator): string | undefined {
  if (row.status === "entered" && row.score == null) return t("errors.scoreRequired");
  if (row.status === "entered" && (row.score! < 0 || row.score! > maxScore)) return t("errors.scoreRange", { maxScore });
  if (row.status === "entered" && !Number.isInteger(row.score! * 100)) return t("errors.scorePrecision");
  if ((row.comment?.length ?? 0) > 500) return t("errors.commentLength");
  return undefined;
}

function matchesSearch(row: AssessmentRosterItem, normalizedSearch: string, locale: string): boolean {
  if (!normalizedSearch) return true;
  return [row.studentNameAr, row.studentNameEn, row.classroomName].some((label) =>
    label?.toLocaleLowerCase(locale).includes(normalizedSearch),
  );
}

function updateEditableRow(
  row: AssessmentRosterItem,
  studentId: string,
  field: EditableGradeField,
  value: string,
): AssessmentRosterItem {
  if (row.studentId !== studentId) return row;
  if (field === "status") {
    const status = value as GradeItemStatus;
    return { ...row, status, score: status === "entered" ? row.score : null };
  }
  if (field === "score") return { ...row, score: value === "" ? null : Number(value) };
  return { ...row, comment: value };
}

function toBulkPayload(row: AssessmentRosterItem): BulkGradeItemPayload {
  return {
    studentId: row.studentId,
    status: row.status,
    score: row.status === "entered" ? row.score : null,
    comment: row.comment,
  };
}

export default function BulkGradeEntryDialog({ isOpen, onClose, onSubmit, assessment, rows, isSubmitting }: BulkGradeEntryDialogProps) {
  const t = useTranslations("academics.grades.dialogs.bulkEntry");
  const locale = useLocale();
  const [editableRows, setEditableRows] = useState(rows);
  const [search, setSearch] = useState("");
  const [bulkStatus, setBulkStatus] = useState<GradeItemStatus>("missing");
  const initialRowsByStudent = useMemo(() => new Map(rows.map((row) => [row.studentId, row])), [rows]);
  const changedRows = editableRows.filter((row) => rowChanged(row, initialRowsByStudent.get(row.studentId)!));
  const rowErrors = new Map(editableRows.map((row) => [row.studentId, rowError(row, assessment?.maxScore ?? 0, t)]));
  const hasErrors = [...rowErrors.values()].some(Boolean);
  const batchTooLarge = changedRows.length > MAX_BULK_GRADE_ITEMS;
  const normalizedSearch = search.trim().toLocaleLowerCase(locale);
  const visibleRows = editableRows.filter((row) => matchesSearch(row, normalizedSearch, locale));
  const statusOptions = ["entered", "missing", "absent"].map((status) => ({
    value: status,
    label: t(`statuses.${status}`),
  }));

  const updateRow = (studentId: string, field: EditableGradeField, value: string) => {
    setEditableRows((current) => current.map((row) => updateEditableRow(row, studentId, field, value)));
  };

  const applyStatusToVisible = () => {
    const visibleStudentIds = new Set(visibleRows.map((row) => row.studentId));
    setEditableRows((current) => current.map((row) => visibleStudentIds.has(row.studentId)
      ? { ...row, status: bulkStatus, score: bulkStatus === "entered" ? row.score : null }
      : row));
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    if (changedRows.length > 0 && !window.confirm(t("unsavedConfirm"))) return;
    onClose();
  };

  const submitChanges = async () => {
    if (changedRows.length === 0 || hasErrors || batchTooLarge) return;
    await onSubmit(changedRows.map(toBulkPayload));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title={t("title")}
      description={t("description", { assessment: locale === "ar" ? assessment?.titleAr || "-" : assessment?.title || "-" })}
      size="xl"
      footer={<>
        <Button variant="secondary" onClick={closeDialog} disabled={isSubmitting}>{t("cancel")}</Button>
        <Button variant="primary" onClick={submitChanges} loading={isSubmitting} disabled={changedRows.length === 0 || hasErrors || batchTooLarge}>
          {t("saveChanged", { count: changedRows.length })}
        </Button>
      </>}
    >
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto]">
        <Input aria-label={t("search")} placeholder={t("search")} value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        <Select aria-label={t("applyStatus")} value={bulkStatus} onChange={(value) => setBulkStatus(value as GradeItemStatus)} options={statusOptions} />
        <Button variant="secondary" onClick={applyStatusToVisible}>{t("applyToVisible", { count: visibleRows.length })}</Button>
      </div>
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <span>{assessment ? t("scoreHelp", { maxScore: assessment.maxScore }) : ""}</span>
        <span>{t("changedCount", { count: changedRows.length, limit: MAX_BULK_GRADE_ITEMS })}</span>
      </div>
      {batchTooLarge ? <p className="mb-3 text-sm text-[var(--error-text)]">{t("batchLimit", { limit: MAX_BULK_GRADE_ITEMS })}</p> : null}
      <div className="max-h-[60vh] overflow-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: "var(--surface-secondary)" }}><tr>
            <th className="px-3 py-2 text-start font-medium">{t("student")}</th><th className="px-3 py-2 text-start font-medium">{t("classroom")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("status")}</th><th className="px-3 py-2 text-start font-medium">{t("score")}</th><th className="px-3 py-2 text-start font-medium">{t("comment")}</th>
          </tr></thead>
          <tbody>{visibleRows.map((row) => {
            const changed = rowChanged(row, initialRowsByStudent.get(row.studentId)!);
            return <tr key={row.studentId} className="border-t" style={{ borderColor: "var(--border-color)", backgroundColor: changed ? "var(--warning-bg)" : undefined }}>
              <td className="px-3 py-3 font-medium">{locale === "ar" ? row.studentNameAr : row.studentNameEn}{changed ? <span className="ms-2 text-xs text-[var(--warning-text)]">{t("changed")}</span> : null}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{row.classroomName || t("notAssigned")}</td>
              <td className="px-3 py-3 align-top"><Select value={row.status} onChange={(value) => updateRow(row.studentId, "status", value)} options={statusOptions} /></td>
              <td className="px-3 py-3 align-top"><Input type="number" min="0" max={assessment?.maxScore || 100} step="0.01" value={row.score == null ? "" : String(row.score)} onChange={(event) => updateRow(row.studentId, "score", event.target.value)} disabled={row.status !== "entered"} error={rowErrors.get(row.studentId)} /></td>
              <td className="px-3 py-3 align-top"><TextArea value={row.comment || ""} onChange={(event) => updateRow(row.studentId, "comment", event.target.value)} rows={2} maxLength={501} /></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Modal>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicYearDto } from "../api/enrollmentDtos";
import { promoteEnrollment, transferEnrollment, withdrawEnrollment } from "../api/enrollmentApi";
import type { EnrollmentRecord } from "../model/enrollment";
import { enrollmentErrorKey } from "../model/enrollmentErrorMessages";

interface Option { id: string; name: string; parentId?: string }
interface Props {
  action: "transfer" | "withdraw" | "promote" | null;
  enrollment: EnrollmentRecord | null;
  stages: Option[];
  grades: Option[];
  sections: Option[];
  classrooms: Option[];
  academicYears: AcademicYearDto[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function EnrollmentWorkflowDialog({ action, enrollment, stages, grades, sections, classrooms, academicYears, onClose, onSuccess }: Props) {
  const t = useTranslations("admissions.enrollment");
  const [targetSectionId, setTargetSectionId] = useState("");
  const [targetClassroomId, setTargetClassroomId] = useState("");
  const [targetStageId, setTargetStageId] = useState("");
  const [targetGradeId, setTargetGradeId] = useState("");
  const [targetAcademicYear, setTargetAcademicYear] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const availableGrades = useMemo(
    () => grades.filter((item) => !targetStageId || item.parentId === targetStageId),
    [grades, targetStageId],
  );
  const availableSections = useMemo(
    () => sections.filter((item) => !targetGradeId || item.parentId === targetGradeId),
    [sections, targetGradeId],
  );
  const availableClassrooms = useMemo(
    () =>
      classrooms.filter(
        (item) => !targetSectionId || item.parentId === targetSectionId,
      ),
    [classrooms, targetSectionId],
  );
  if (!action || !enrollment) return null;

  const submit = async () => {
    setSaving(true); setError("");
    try {
      if (action === "transfer") await transferEnrollment({ studentId: enrollment.studentId, targetSectionId, targetClassroomId, effectiveDate, reason: reason.trim(), notes: notes.trim() || undefined });
      if (action === "withdraw") await withdrawEnrollment({ studentId: enrollment.studentId, effectiveDate, reason: reason.trim(), notes: notes.trim() || undefined, actionType: "withdrawn" });
      if (action === "promote") await promoteEnrollment({ studentId: enrollment.studentId, targetAcademicYear, effectiveDate, notes: notes.trim() || undefined });
      await onSuccess(); onClose();
    } catch (caughtError) {
      setError(t(`errors.${enrollmentErrorKey(caughtError)}`));
    }
    finally { setSaving(false); }
  };

  const valid = effectiveDate && (action === "transfer" ? targetSectionId && targetClassroomId && reason.trim() : action === "withdraw" ? reason.trim() : targetAcademicYear);
  return <Modal isOpen onClose={onClose} title={t(`dialogs.workflow.titles.${action}`)} size="md" footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button onClick={() => void submit()} disabled={!valid} loading={saving}>{t("confirm")}</Button></>}>
    <div className="space-y-4">
      <p className="font-medium">{enrollment.studentName}</p>
      {action === "transfer" && <>
        <Select label={t("dialogs.workflow.target_stage")} value={targetStageId} onChange={(value) => { setTargetStageId(value); setTargetGradeId(""); setTargetSectionId(""); setTargetClassroomId(""); }} options={stages.map((option) => ({ value: option.id, label: option.name }))} />
        <Select label={t("dialogs.workflow.target_grade")} value={targetGradeId} disabled={!targetStageId} onChange={(value) => { setTargetGradeId(value); setTargetSectionId(""); setTargetClassroomId(""); }} options={availableGrades.map((option) => ({ value: option.id, label: option.name }))} />
        <Select label={t("dialogs.workflow.target_section")} value={targetSectionId} disabled={!targetGradeId} onChange={(value) => { setTargetSectionId(value); setTargetClassroomId(""); }} options={availableSections.map((option) => ({ value: option.id, label: option.name }))} />
        <Select label={t("dialogs.workflow.target_classroom")} value={targetClassroomId} disabled={!targetSectionId} onChange={setTargetClassroomId} options={availableClassrooms.map((option) => ({ value: option.id, label: option.name, disabled: option.id === enrollment.classroomId }))} />
      </>}
      {action === "promote" && <Select label={t("dialogs.workflow.target_academic_year")} value={targetAcademicYear} onChange={setTargetAcademicYear} options={academicYears.map((year) => ({ value: year.name, label: year.name, disabled: !year.isActive || year.id === enrollment.academicYearId }))} />}
      <Input label={t("dialogs.workflow.effective_date")} type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
      {action !== "promote" && <TextArea label={t("dialogs.workflow.reason")} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />}
      <TextArea label={t("dialogs.workflow.notes_optional")} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  </Modal>;
}

"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import SubjectDialog from "@/features/academics/subjects/components/SubjectDialog";
import {
  bulkUpsertSubjectAllocations,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import type { SubjectsSetupData } from "../../types";

export interface SubjectsSetupStepCopy {
  summary: string;
  createSubject: string;
  grade: string;
  subject: string;
  weeklyHours: string;
  saveAllocation: string;
  saving: string;
  saveFailed: string;
  manage: string;
}

interface SubjectsSetupStepProps {
  copy: SubjectsSetupStepCopy;
  termId: string;
  grades: Grade[];
  subjectsData: SubjectsSetupData;
  refreshStep(stepId: "subjects"): Promise<void> | void;
}

export function SubjectsSetupStep({
  copy,
  termId,
  grades,
  subjectsData,
  refreshStep,
}: SubjectsSetupStepProps) {
  const locale = useLocale();
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(subjectsData.subjects[0]?.id ?? "");
  const [weeklyHours, setWeeklyHours] = useState("1");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const gradeOptions = useMemo(
    () =>
      grades.map((grade) => ({
        value: grade.id,
        label: locale === "ar" ? grade.nameAr || grade.name : grade.nameEn || grade.name,
      })),
    [grades, locale],
  );
  const subjectOptions = useMemo(
    () =>
      subjectsData.subjects.map((subject) => ({
        value: subject.id,
        label:
          locale === "ar"
            ? subject.nameAr || subject.name
            : subject.nameEn || subject.name,
      })),
    [locale, subjectsData.subjects],
  );

  const handleSubjectSuccess = () => {
    void refreshStep("subjects");
  };

  const handleSaveAllocation = async () => {
    const hours = Number(weeklyHours);
    if (!gradeId || !subjectId || !Number.isFinite(hours) || hours <= 0) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const allocation: SubjectAllocation = { gradeId, subjectId, weeklyHours: hours };
      await bulkUpsertSubjectAllocations(termId, [allocation]);
      await refreshStep("subjects");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      {subjectsData.subjects.length === 0 ? (
        <Button onClick={() => setIsSubjectDialogOpen(true)} type="button">
          {copy.createSubject}
        </Button>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto] md:items-end">
          <Select label={copy.grade} onChange={setGradeId} options={gradeOptions} value={gradeId} />
          <Select
            label={copy.subject}
            onChange={setSubjectId}
            options={subjectOptions}
            value={subjectId}
          />
          <Input
            inputMode="numeric"
            label={copy.weeklyHours}
            min={1}
            onChange={(event) => setWeeklyHours(event.target.value)}
            type="number"
            value={weeklyHours}
          />
          <Button loading={isSaving} onClick={() => void handleSaveAllocation()} type="button">
            {isSaving ? copy.saving : copy.saveAllocation}
          </Button>
        </div>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {subjectsData.subjects.map((subject) => (
        <Button key={subject.id} onClick={() => { setEditingSubjectId(subject.id); setIsSubjectDialogOpen(true); }} size="sm" type="button" variant="secondary">
          {copy.manage}: {locale === "ar" ? subject.nameAr || subject.name : subject.nameEn || subject.name}
        </Button>
      ))}
      <SubjectDialog
        existingSubjects={subjectsData.subjects}
        isOpen={isSubjectDialogOpen}
        onClose={() => { setIsSubjectDialogOpen(false); setEditingSubjectId(null); }}
        onSuccess={handleSubjectSuccess}
        subject={subjectsData.subjects.find((subject) => subject.id === editingSubjectId) ?? null}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Select from "@/components/ui/input/Select";
import type { AcademicStructureTree } from "@/features/academics/services/academicStructureApiService";
import type { AnnouncementEditorLabels } from "./AnnouncementEditor";

const audienceLevels = ["stage", "grade", "section", "classroom"] as const;
type AudienceLevel = (typeof audienceLevels)[number];

interface AnnouncementAudienceChainProps {
  audienceType: AudienceLevel;
  audienceId: string;
  labels: AnnouncementEditorLabels;
  disabled: boolean;
  error?: string;
  structure: AcademicStructureTree | null;
  isLoading: boolean;
  loadFailed: boolean;
  onChange: (audienceId: string) => void;
}

function audienceOptions(
  entities: { id: string; name: string; nameEn?: string; nameAr?: string }[],
  selectedId: string,
) {
  return [
    { value: "", label: "Select..." },
    ...(selectedId && !entities.some((entity) => entity.id === selectedId)
      ? [{ value: selectedId, label: selectedId }]
      : []),
    ...entities.map((entity) => ({
      value: entity.id,
      label: entity.name || entity.nameEn || entity.nameAr || entity.id,
    })),
  ];
}

function savedAudienceSelection(
  structure: AcademicStructureTree | null,
  audienceType: AudienceLevel,
  audienceId: string,
) {
  const classroom = audienceType === "classroom" ? audienceId : "";
  const section = audienceType === "section" ? audienceId
    : structure?.classrooms.find((entry) => entry.id === classroom)?.sectionId ?? "";
  const grade = audienceType === "grade" ? audienceId
    : structure?.sections.find((entry) => entry.id === section)?.gradeId ?? "";
  const stage = audienceType === "stage" ? audienceId
    : structure?.grades.find((entry) => entry.id === grade)?.stageId ?? "";
  return { stage, grade, section, classroom };
}

export default function AnnouncementAudienceChain({
  audienceType,
  audienceId,
  labels,
  disabled,
  error,
  structure,
  isLoading,
  loadFailed,
  onChange,
}: AnnouncementAudienceChainProps) {
  const locale = useLocale();
  const loadError = loadFailed
    ? (locale.startsWith("ar")
      ? "تعذر تحميل خيارات الجمهور."
      : "Unable to load audience options.")
    : undefined;
  const [editedSelection, setSelection] = useState<ReturnType<typeof savedAudienceSelection> | null>(null);
  const selection = editedSelection ?? savedAudienceSelection(structure, audienceType, audienceId);
  const targetLevel = audienceLevels.indexOf(audienceType);

  const selectLevel = (level: AudienceLevel, audienceId: string) => {
    const changedLevel = audienceLevels.indexOf(level);
    const nextSelection = { ...selection, [level]: audienceId };
    for (const childLevel of audienceLevels.slice(changedLevel + 1)) {
      nextSelection[childLevel] = "";
    }
    setSelection(nextSelection);
    onChange(level === audienceType ? audienceId : "");
  };

  return (
    <>
      <Select
        searchable
        label={labels.stage}
        options={audienceOptions(structure?.stages ?? [], selection.stage)}
        value={selection.stage}
        disabled={disabled || isLoading || loadFailed}
        error={loadError ?? (audienceType === "stage" ? error : undefined)}
        onChange={(stageId) => selectLevel("stage", stageId)}
      />
      {targetLevel >= 1 ? (
        <Select
          searchable
          label={labels.grade}
          options={audienceOptions(
            structure?.grades.filter((grade) => grade.stageId === selection.stage) ?? [],
            selection.grade,
          )}
          value={selection.grade}
          disabled={disabled || isLoading || loadFailed || !selection.stage}
          error={audienceType === "grade" ? error : undefined}
          onChange={(gradeId) => selectLevel("grade", gradeId)}
        />
      ) : null}
      {targetLevel >= 2 ? (
        <Select
          searchable
          label={labels.section}
          options={audienceOptions(
            structure?.sections.filter((section) => section.gradeId === selection.grade) ?? [],
            selection.section,
          )}
          value={selection.section}
          disabled={disabled || isLoading || loadFailed || !selection.grade}
          error={audienceType === "section" ? error : undefined}
          onChange={(sectionId) => selectLevel("section", sectionId)}
        />
      ) : null}
      {targetLevel >= 3 ? (
        <Select
          searchable
          label={labels.classroom}
          options={audienceOptions(
            structure?.classrooms.filter((classroom) => classroom.sectionId === selection.section) ?? [],
            selection.classroom,
          )}
          value={selection.classroom}
          disabled={disabled || isLoading || loadFailed || !selection.section}
          error={error}
          onChange={(classroomId) => selectLevel("classroom", classroomId)}
        />
      ) : null}
    </>
  );
}

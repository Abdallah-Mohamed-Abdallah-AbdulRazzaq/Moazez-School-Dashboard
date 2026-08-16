"use client";

import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { Classroom, Stage, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";

interface FilterBarProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  onStageChange: (stageId: string) => void;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onClassroomChange: (classroomId: string) => void;
  locale: string;
}

export default function FilterBar({
  stages,
  grades,
  sections,
  classrooms,
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  onStageChange,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  locale,
}: FilterBarProps) {
  const t = useTranslations("academics.timetable.filters");

  const stageOptions = stages.map((stage) => ({
    value: stage.id,
    label: locale === "ar" ? stage.nameAr || stage.name : stage.nameEn || stage.name,
  }));

  const filteredGrades = selectedStageId
    ? grades.filter((g) => g.stageId === selectedStageId)
    : grades;

  const gradeOptions = filteredGrades.map((grade) => ({
    value: grade.id,
    label: locale === "ar" ? grade.nameAr || grade.name : grade.nameEn || grade.name,
  }));

  const filteredSections = selectedGradeId
    ? sections.filter((s) => s.gradeId === selectedGradeId)
    : [];

  const sectionOptions = filteredSections.map((section) => ({
    value: section.id,
    label: locale === "ar" ? section.nameAr || section.name : section.nameEn || section.name,
  }));

  const filteredClassrooms = selectedSectionId
    ? classrooms.filter((classroom) => classroom.sectionId === selectedSectionId)
    : [];

  const classroomOptions = filteredClassrooms.map((classroom) => ({
    value: classroom.id,
    label: locale === "ar" ? classroom.nameAr || classroom.name : classroom.nameEn || classroom.name,
  }));

  const handleStageChange = (value: string) => {
    onStageChange(value);
  };

  const handleGradeChange = (value: string) => {
    onGradeChange(value);
  };

  const handleSectionChange = (value: string) => {
    onSectionChange(value);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
        <div className="w-full lg:w-64">
          <Select
            label={t("selectStage")}
            value={selectedStageId}
            onChange={handleStageChange}
            options={stageOptions}
            placeholder={t("selectStage")}
          />
        </div>
        <div className="w-full lg:w-64">
          <Select
            label={t("selectGrade")}
            value={selectedGradeId}
            onChange={handleGradeChange}
            options={gradeOptions}
            placeholder={t("selectGrade")}
            disabled={!selectedStageId}
          />
        </div>
        <div className="w-full lg:w-64">
          <Select
            label={t("selectSection")}
            value={selectedSectionId}
            onChange={handleSectionChange}
            options={sectionOptions}
            placeholder={t("selectSection")}
            disabled={!selectedGradeId}
          />
        </div>
        <div className="w-full lg:w-64">
          <Select
            label={t("selectClassroom")}
            value={selectedClassroomId}
            onChange={onClassroomChange}
            options={classroomOptions}
            placeholder={t("selectClassroom")}
            disabled={!selectedSectionId || filteredClassrooms.length === 0}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import Select from "@/components/ui/input/Select";
import {
  Classroom,
  Grade,
  Section,
  Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { Subject } from "@/features/academics/subjects/services/subjectsService";
import { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

interface LessonPlansFiltersProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  teachers: Teacher[];
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  assignedTeacherId: string;
  onStageChange: (stageId: string) => void;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onClassroomChange: (classroomId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function LessonPlansFilters({
  stages,
  grades,
  sections,
  classrooms,
  subjects,
  teachers,
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  selectedSubjectId,
  assignedTeacherId,
  onStageChange,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  onSubjectChange,
  disabled = false,
  loading = false,
}: LessonPlansFiltersProps) {
  const t = useTranslations("academics.lessonPlans.filters");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const isDisabled = disabled || loading;

  const assignedTeacher = teachers.find((t) => t.id === assignedTeacherId);

  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {/* Stage */}
        <div>
          <Select
            label={t("stage")}
            value={selectedStageId}
            onChange={onStageChange}
            disabled={isDisabled}
            options={[
              { value: "", label: t("selectStage") },
              ...stages.map((stage) => ({
                value: stage.id,
                label: isRTL ? stage.nameAr : stage.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Grade */}
        <div>
          <Select
            label={t("grade")}
            value={selectedGradeId}
            onChange={onGradeChange}
            disabled={isDisabled || !selectedStageId}
            options={[
              { value: "", label: t("selectGrade") },
              ...grades.map((grade) => ({
                value: grade.id,
                label: isRTL ? grade.nameAr : grade.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Section */}
        <div>
          <Select
            label={t("section")}
            value={selectedSectionId}
            onChange={onSectionChange}
            disabled={isDisabled || !selectedGradeId}
            options={[
              { value: "", label: t("selectSection") },
              ...sections.map((section) => ({
                value: section.id,
                label: isRTL ? section.nameAr : section.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Subject */}
        <div>
          <Select
            label={t("subject")}
            value={selectedSubjectId}
            onChange={onSubjectChange}
            disabled={isDisabled}
            options={[
              { value: "", label: t("selectSubject") },
              ...subjects.map((subject) => ({
                value: subject.id,
                label: isRTL ? subject.nameAr : subject.nameEn,
              })),
            ]}
            selectSize="sm"
          />
        </div>

        {/* Classroom */}
        {classrooms.length > 0 && (
          <div>
            <Select
              label={t("classroom")}
              value={selectedClassroomId}
              onChange={onClassroomChange}
              disabled={isDisabled || !selectedSectionId}
              options={[
                { value: "", label: t("selectClassroom") },
                ...classrooms.map((classroom) => ({
                  value: classroom.id,
                  label: isRTL ? classroom.nameAr : classroom.nameEn,
                })),
              ]}
              selectSize="sm"
            />
          </div>
        )}

        {/* Assigned Teacher (display only) */}
        {assignedTeacher && (
          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-5">
            <span className="text-sm text-gray-600">{t("teacher")}:</span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20">
              {isRTL ? assignedTeacher.nameAr : assignedTeacher.nameEn}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

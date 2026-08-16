"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { subjectsForLessonPlanGrade } from "@/features/academics/lesson-plans/hooks/useLessonPlansFilters";

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stages: { id: string; nameAr: string; nameEn: string }[];
  grades: { id: string; nameAr: string; nameEn: string; stageId: string }[];
  sections: { id: string; nameAr: string; nameEn: string; gradeId: string }[];
  classrooms: {
    id: string;
    nameAr: string;
    nameEn: string;
    sectionId: string;
  }[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teachers: Teacher[];
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  assignedTeacherId: string;
  onApply: (filters: {
    stageId: string;
    gradeId: string;
    sectionId: string;
    classroomId: string;
    subjectId: string;
  }) => void;
}

export default function FiltersDrawer({
  isOpen,
  onClose,
  stages,
  grades,
  sections,
  classrooms,
  subjects,
  subjectAllocations,
  teachers,
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  selectedSubjectId,
  assignedTeacherId,
  onApply,
}: FiltersDrawerProps) {
  const t = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const classroomLabel = isRTL ? "\u0627\u0644\u0641\u0635\u0644" : "Classroom";
  const selectClassroomLabel = isRTL
    ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0635\u0644"
    : "Select Classroom";

  // Local state for filters
  const [localStageId, setLocalStageId] = useState(selectedStageId);
  const [localGradeId, setLocalGradeId] = useState(selectedGradeId);
  const [localSectionId, setLocalSectionId] = useState(selectedSectionId);
  const [localClassroomId, setLocalClassroomId] = useState(selectedClassroomId);
  const [localSubjectId, setLocalSubjectId] = useState(selectedSubjectId);

  // Reset the local draft filters whenever the drawer opens with external values.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setLocalStageId(selectedStageId);
      setLocalGradeId(selectedGradeId);
      setLocalSectionId(selectedSectionId);
      setLocalClassroomId(selectedClassroomId);
      setLocalSubjectId(selectedSubjectId);
    }
  }, [
    isOpen,
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleStageChange = (stageId: string) => {
    setLocalStageId(stageId);
    setLocalGradeId("");
    setLocalSectionId("");
    setLocalClassroomId("");
    setLocalSubjectId("");
  };

  const handleGradeChange = (gradeId: string) => {
    setLocalGradeId(gradeId);
    setLocalSectionId("");
    setLocalClassroomId("");
    setLocalSubjectId("");
  };

  const handleSectionChange = (sectionId: string) => {
    setLocalSectionId(sectionId);
    setLocalClassroomId("");
  };

  const handleApply = () => {
    onApply({
      stageId: localStageId,
      gradeId: localGradeId,
      sectionId: localSectionId,
      classroomId: localClassroomId,
      subjectId: localSubjectId,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalStageId("");
    setLocalGradeId("");
    setLocalSectionId("");
    setLocalClassroomId("");
    setLocalSubjectId("");
  };

  const assignedTeacher = teachers.find((t) => t.id === assignedTeacherId);
  const filteredGrades = useMemo(
    () =>
      grades.filter((grade) => !localStageId || grade.stageId === localStageId),
    [grades, localStageId],
  );
  const filteredSections = useMemo(
    () =>
      sections.filter(
        (section) => !localGradeId || section.gradeId === localGradeId,
      ),
    [sections, localGradeId],
  );
  const filteredClassrooms = useMemo(
    () =>
      classrooms.filter(
        (classroom) =>
          !localSectionId || classroom.sectionId === localSectionId,
      ),
    [classrooms, localSectionId],
  );
  const filteredSubjects = useMemo(
    () =>
      subjectsForLessonPlanGrade({
        subjects,
        subjectAllocations,
        gradeId: localGradeId,
        currentSubjectId: localSubjectId,
      }),
    [localGradeId, localSubjectId, subjectAllocations, subjects],
  );

  return (
    <Drawer
      anchor={isRTL ? "right" : "left"}
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: "85%", maxWidth: 400 },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("filters.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stage */}
          <Select
            label={t("filters.stage")}
            value={localStageId}
            onChange={handleStageChange}
            options={[
              { value: "", label: t("filters.selectStage") },
              ...stages.map((stage) => ({
                value: stage.id,
                label: isRTL ? stage.nameAr : stage.nameEn,
              })),
            ]}
          />

          {/* Grade */}
          <Select
            label={t("filters.grade")}
            value={localGradeId}
            onChange={handleGradeChange}
            options={[
              { value: "", label: t("filters.selectGrade") },
              ...filteredGrades.map((grade) => ({
                value: grade.id,
                label: isRTL ? grade.nameAr : grade.nameEn,
              })),
            ]}
            disabled={!localStageId}
          />

          {/* Section */}
          <Select
            label={t("filters.section")}
            value={localSectionId}
            onChange={handleSectionChange}
            options={[
              { value: "", label: t("filters.selectSection") },
              ...filteredSections.map((section) => ({
                value: section.id,
                label: isRTL ? section.nameAr : section.nameEn,
              })),
            ]}
            disabled={!localGradeId}
          />

          {filteredClassrooms.length > 0 && (
            <Select
              label={classroomLabel}
              value={localClassroomId}
              onChange={setLocalClassroomId}
              options={[
                { value: "", label: selectClassroomLabel },
                ...filteredClassrooms.map((classroom) => ({
                  value: classroom.id,
                  label: isRTL ? classroom.nameAr : classroom.nameEn,
                })),
              ]}
              disabled={!localSectionId}
            />
          )}

          {/* Subject */}
          <Select
            label={t("filters.subject")}
            value={localSubjectId}
            onChange={setLocalSubjectId}
            options={[
              { value: "", label: t("filters.selectSubject") },
              ...filteredSubjects.map((subject) => ({
                value: subject.id,
                label: isRTL ? subject.nameAr : subject.nameEn,
              })),
            ]}
          />

          {/* Assigned Teacher (Read-only) */}
          {assignedTeacher && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("filters.assignedTeacher")}
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">
                  {isRTL ? assignedTeacher.nameAr : assignedTeacher.nameEn}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            onClick={handleApply}
            variant="primary"
            fullWidth
            disabled={!localSectionId || !localSubjectId}
          >
            {t("filters.apply")}
          </Button>
          <Button onClick={handleClear} variant="secondary" fullWidth>
            {t("filters.clear")}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

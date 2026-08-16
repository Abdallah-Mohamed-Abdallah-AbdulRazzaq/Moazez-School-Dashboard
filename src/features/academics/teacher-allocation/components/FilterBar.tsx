"use client";

import { useTranslations, useLocale } from "next-intl";
import { Filter, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Drawer, IconButton, useMediaQuery, useTheme } from "@mui/material";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { Classroom, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import { Subject } from "@/features/academics/subjects/services/subjectsService";

interface FilterBarProps {
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  subjects: Subject[];
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  selectedSubjectId: string;
  showOnlyMissing: boolean;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onClassroomChange: (classroomId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onShowOnlyMissingChange: (show: boolean) => void;
  onValidate: () => void;
}

export default function FilterBar({
  grades,
  sections,
  classrooms,
  subjects,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  selectedSubjectId,
  showOnlyMissing,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  onSubjectChange,
  onShowOnlyMissingChange,
  onValidate,
}: FilterBarProps) {
  const t = useTranslations("academics.teacherAllocation");
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const filteredSections = selectedGradeId
    ? sections.filter((s) => s.gradeId === selectedGradeId)
    : sections;
  const filteredSectionIds = new Set(filteredSections.map((section) => section.id));

  const gradeOptions = [
    { value: "", label: t("filters.allGrades") },
    ...grades.map((grade) => ({
      value: grade.id,
      label: locale === "ar" 
        ? (grade.nameAr || grade.nameEn || grade.name)
        : (grade.nameEn || grade.nameAr || grade.name),
    })),
  ];

  const sectionOptions = [
    { value: "", label: t("filters.allSections") },
    ...filteredSections.map((section) => ({
      value: section.id,
      label: locale === "ar"
        ? (section.nameAr || section.nameEn || section.name)
        : (section.nameEn || section.nameAr || section.name),
    })),
  ];

  const filteredClassrooms = classrooms.filter((classroom) => {
    if (selectedSectionId) {
      return classroom.sectionId === selectedSectionId;
    }
    return !selectedGradeId || filteredSectionIds.has(classroom.sectionId);
  });

  const classroomOptions = [
    { value: "", label: t("filters.allClassrooms") },
    ...filteredClassrooms.map((classroom) => ({
      value: classroom.id,
      label: locale === "ar"
        ? (classroom.nameAr || classroom.nameEn || classroom.name)
        : (classroom.nameEn || classroom.nameAr || classroom.name),
    })),
  ];

  const subjectOptions = [
    { value: "", label: t("filters.allSubjects") },
    ...subjects.map((subject) => ({
      value: subject.id,
      label: locale === "ar"
        ? (subject.nameAr || subject.nameEn || subject.name)
        : (subject.nameEn || subject.nameAr || subject.name),
    })),
  ];

  const handleGradeFilterChange = (value: string) => {
    onGradeChange(value);
  };

  const handleSectionFilterChange = (value: string) => {
    onSectionChange(value);
  };

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            {/* Filters */}
            <div className="flex items-end gap-4 flex-wrap flex-1">
              {isMobile ? (
                // Mobile: Show filter button
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => setShowFiltersDrawer(true)}
                >
                  {t("filters.grade")}
                </Button>
              ) : (
                // Desktop: Show inline filters
                <>
                  <div className="w-48">
                    <Select
                      label={t("filters.grade")}
                      value={selectedGradeId}
                      onChange={handleGradeFilterChange}
                      options={gradeOptions}
                      selectSize="sm"
                    />
                  </div>

                  <div className="w-48">
                    <Select
                      label={t("filters.section")}
                      value={selectedSectionId}
                      onChange={handleSectionFilterChange}
                      options={sectionOptions}
                      selectSize="sm"
                      disabled={!selectedGradeId}
                    />
                  </div>

                  <div className="w-48">
                    <Select
                      label={t("filters.classroom")}
                      value={selectedClassroomId}
                      onChange={onClassroomChange}
                      options={classroomOptions}
                      selectSize="sm"
                      disabled={filteredClassrooms.length === 0}
                    />
                  </div>

                  <div className="w-48">
                    <Select
                      label={t("filters.subject")}
                      value={selectedSubjectId}
                      onChange={onSubjectChange}
                      options={subjectOptions}
                      selectSize="sm"
                    />
                  </div>

                  <div className="flex items-center h-10">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyMissing}
                        onChange={(e) => onShowOnlyMissingChange(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-700 whitespace-nowrap">
                        {t("filters.showOnlyMissing")}
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={onValidate}
              >
                {t("actions.validate")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="bottom"
        open={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "80vh",
            },
          },
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("filters.grade")}
            </h2>
            <IconButton
              size="small"
              onClick={() => setShowFiltersDrawer(false)}
              sx={{ color: "var(--color-text-secondary, #6b7280)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>

          <div className="space-y-4">
            {/* Grade Filter */}
            <div>
              <Select
                label={t("filters.grade")}
                value={selectedGradeId}
                onChange={handleGradeFilterChange}
                options={gradeOptions}
                selectSize="sm"
              />
            </div>

            {/* Section Filter */}
            <div>
              <Select
                label={t("filters.section")}
                value={selectedSectionId}
                onChange={handleSectionFilterChange}
                options={sectionOptions}
                selectSize="sm"
                disabled={!selectedGradeId}
              />
            </div>

            <div>
              <Select
                label={t("filters.classroom")}
                value={selectedClassroomId}
                onChange={onClassroomChange}
                options={classroomOptions}
                selectSize="sm"
                disabled={filteredClassrooms.length === 0}
              />
            </div>

            {/* Subject Filter */}
            <div>
              <Select
                label={t("filters.subject")}
                value={selectedSubjectId}
                onChange={onSubjectChange}
                options={subjectOptions}
                selectSize="sm"
              />
            </div>

            {/* Show Only Missing Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyMissing}
                  onChange={(e) => onShowOnlyMissingChange(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">{t("filters.showOnlyMissing")}</span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowFiltersDrawer(false)}
              className="w-full"
            >
              {t("actions.save")}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}

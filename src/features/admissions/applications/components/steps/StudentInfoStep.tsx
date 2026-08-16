"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input, Select, DatePicker, TextArea } from "@/components/ui/input";
import type {
  AcademicStructureStage as Stage,
  AcademicStructureGrade as Grade,
  AcademicStructureSection as Section,
} from "@/features/academics/services/academicStructureApiService";

// Nationality keys matching translation keys
const NATIONALITY_KEYS = [
  "saudi_arabian",
  "emirati",
  "kuwaiti",
  "qatari",
  "bahraini",
  "omani",
  "jordanian",
  "lebanese",
  "syrian",
  "palestinian",
  "egyptian",
  "moroccan",
  "tunisian",
  "algerian",
  "iraqi",
  "pakistani",
  "indian",
  "filipino",
  "indonesian",
  "malaysian",
  "singaporean",
  "thai",
  "vietnamese",
  "chinese",
  "japanese",
  "south_korean",
  "british",
  "american",
  "canadian",
  "australian",
  "irish",
  "german",
  "french",
  "spanish",
  "italian",
  "portuguese",
  "dutch",
  "swedish",
  "norwegian",
  "danish",
  "finnish",
  "greek",
  "turkish",
  "iranian",
  "afghan",
  "bangladeshi",
  "sri_lankan",
  "nepalese",
];

interface StudentInfoStepProps {
  formData: {
    first_name_ar: string;
    father_name_ar: string;
    grandfather_name_ar: string;
    family_name_ar: string;
    first_name_en: string;
    father_name_en: string;
    grandfather_name_en: string;
    family_name_en: string;
    gender: string;
    date_of_birth: string;
    nationality: string;
    stage: string;
    grade_requested: string;
    section: string;
    address_line: string;
    city: string;
    district: string;
    previous_school: string;
    medical_conditions: string;
    notes: string;
  };
  errors: Record<string, string>;
  updateFormData: (field: string, value: unknown) => void;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  isLoadingStructure: boolean;
}

export default function StudentInfoStep({
  formData,
  errors,
  updateFormData,
  stages,
  grades,
  sections,
  isLoadingStructure,
}: StudentInfoStepProps) {
  const t = useTranslations("admissions.create_application");
  const tNationalities = useTranslations("nationalities");
  const locale = useLocale();

  // Helper to get proper language name
  const getLocalizedName = (item: { name?: string; nameAr?: string; nameEn?: string }): string => {
    if (locale === "ar") {
      return item.nameAr || item.name || item.nameEn || "";
    }
    return item.nameEn || item.name || item.nameAr || "";
  };

  // Build nationalities options from translations
  const nationalityOptions = useMemo(() => {
    return NATIONALITY_KEYS.map((key) => ({
      value: tNationalities(key),
      label: tNationalities(key),
    }));
  }, [tNationalities]);

  // Filter grades based on selected stage
  const filteredGrades = useMemo(() => {
    if (!formData.stage) return [];
    const selectedStage = stages.find((s) => s.id === formData.stage);
    if (!selectedStage) return [];
    return grades
      .filter((g) => g.stageId === selectedStage.id)
      .sort((a, b) => (a.nameEn || a.name).localeCompare(b.nameEn || b.name));
  }, [formData.stage, stages, grades]);

  // Filter sections based on selected grade
  const filteredSections = useMemo(() => {
    if (!formData.grade_requested) return [];
    return sections
      .filter((s) => s.gradeId === formData.grade_requested)
      .sort((a, b) => (a.nameEn || a.name).localeCompare(b.nameEn || b.name));
  }, [formData.grade_requested, sections]);

  // Clear grade and section when stage changes
  const handleStageChange = (value: string) => {
    updateFormData("stage", value);
    updateFormData("grade_requested", "");
    updateFormData("section", "");
  };

  // Clear section when grade changes
  const handleGradeChange = (value: string) => {
    updateFormData("grade_requested", value);
    updateFormData("section", "");
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 mb-4">{t("student.title")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t("student.first_name_ar")}
          value={formData.first_name_ar}
          onChange={(e) => updateFormData("first_name_ar", e.target.value)}
          error={errors.first_name_ar}
          placeholder={t("student.first_name_ar_placeholder")}
          required
          dir="rtl"
        />
        <Input
          label={t("student.first_name_en")}
          value={formData.first_name_en}
          onChange={(e) => updateFormData("first_name_en", e.target.value)}
          error={errors.first_name_en}
          placeholder={t("student.first_name_en_placeholder")}
          required
        />
        <Input
          label={t("student.father_name_ar")}
          value={formData.father_name_ar}
          onChange={(e) => updateFormData("father_name_ar", e.target.value)}
          error={errors.father_name_ar}
          placeholder={t("student.father_name_ar_placeholder")}
          required
          dir="rtl"
        />
        <Input
          label={t("student.father_name_en")}
          value={formData.father_name_en}
          onChange={(e) => updateFormData("father_name_en", e.target.value)}
          error={errors.father_name_en}
          placeholder={t("student.father_name_en_placeholder")}
          required
        />
        <Input
          label={t("student.grandfather_name_ar")}
          value={formData.grandfather_name_ar}
          onChange={(e) =>
            updateFormData("grandfather_name_ar", e.target.value)
          }
          error={errors.grandfather_name_ar}
          placeholder={t("student.grandfather_name_ar_placeholder")}
          required
          dir="rtl"
        />
        <Input
          label={t("student.grandfather_name_en")}
          value={formData.grandfather_name_en}
          onChange={(e) =>
            updateFormData("grandfather_name_en", e.target.value)
          }
          error={errors.grandfather_name_en}
          placeholder={t("student.grandfather_name_en_placeholder")}
          required
        />
        <Input
          label={t("student.family_name_ar")}
          value={formData.family_name_ar}
          onChange={(e) => updateFormData("family_name_ar", e.target.value)}
          error={errors.family_name_ar}
          placeholder={t("student.family_name_ar_placeholder")}
          required
          dir="rtl"
        />
        <Input
          label={t("student.family_name_en")}
          value={formData.family_name_en}
          onChange={(e) => updateFormData("family_name_en", e.target.value)}
          error={errors.family_name_en}
          placeholder={t("student.family_name_en_placeholder")}
          required
        />
        <DatePicker
          label={t("student.date_of_birth")}
          value={
            formData.date_of_birth ? new Date(formData.date_of_birth) : null
          }
          onChange={(date) =>
            updateFormData(
              "date_of_birth",
              date ? date.toISOString().split("T")[0] : "",
            )
          }
          error={errors.date_of_birth}
          disableFuture
          required
        />
        <Select
          label={t("student.gender")}
          value={formData.gender}
          onChange={(value) => updateFormData("gender", value)}
          error={errors.gender}
          placeholder={t("student.gender_placeholder")}
          options={[
            { value: "male", label: t("student.male") },
            { value: "female", label: t("student.female") },
          ]}
          required
        />
        <Select
          label={t("student.nationality")}
          value={formData.nationality}
          onChange={(value) => updateFormData("nationality", value)}
          error={errors.nationality}
          placeholder={t("student.nationality_placeholder")}
          options={nationalityOptions}
          required
        />
        <Select
          label={t("student.stage")}
          value={formData.stage}
          onChange={(value) => handleStageChange(value)}
          placeholder={t("student.stage_placeholder")}
          options={stages.map((stage) => ({
            value: stage.id,
            label: getLocalizedName(stage),
          }))}
          disabled={isLoadingStructure}
        />
        <Select
          label={t("student.grade_requested")}
          value={formData.grade_requested}
          onChange={(value) => handleGradeChange(value)}
          error={errors.grade_requested}
          placeholder={t("student.grade_placeholder")}
          options={filteredGrades.map((grade) => ({
            value: grade.id,
            label: getLocalizedName(grade),
          }))}
          disabled={!formData.stage || isLoadingStructure}
          required
        />
        <Select
          label={t("student.section")}
          value={formData.section}
          onChange={(value) => updateFormData("section", value)}
          placeholder={t("student.section_placeholder")}
          options={filteredSections.map((section) => ({
            value: section.id,
            label: getLocalizedName(section),
          }))}
          disabled={!formData.grade_requested || isLoadingStructure}
        />
        <Input
          label={t("student.address_line")}
          value={formData.address_line}
          onChange={(e) => updateFormData("address_line", e.target.value)}
          placeholder={t("student.address_placeholder")}
        />
        <Input
          label={t("student.city")}
          value={formData.city}
          onChange={(e) => updateFormData("city", e.target.value)}
          placeholder={t("student.city_placeholder")}
        />
        <Input
          label={t("student.district")}
          value={formData.district}
          onChange={(e) => updateFormData("district", e.target.value)}
          placeholder={t("student.district_placeholder")}
        />
        <Input
          label={t("student.previous_school")}
          value={formData.previous_school}
          onChange={(e) => updateFormData("previous_school", e.target.value)}
          placeholder={t("student.previous_school_placeholder")}
        />
        <Input
          label={t("student.medical_conditions")}
          value={formData.medical_conditions}
          onChange={(e) => updateFormData("medical_conditions", e.target.value)}
          placeholder={t("student.medical_placeholder")}
        />
        <div className="md:col-span-2">
          <TextArea
            label={t("student.notes")}
            value={formData.notes}
            onChange={(e) => updateFormData("notes", e.target.value)}
            rows={3}
            placeholder={t("student.notes_placeholder")}
          />
        </div>
      </div>
    </div>
  );
}

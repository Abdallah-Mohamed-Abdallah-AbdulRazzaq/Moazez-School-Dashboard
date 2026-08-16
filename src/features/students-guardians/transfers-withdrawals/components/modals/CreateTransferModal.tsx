"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Search, Upload, ChevronDown } from "lucide-react";
import {
  fetchStudentsWithEnrollment,
  type StudentWithEnrollmentContext,
} from "@/features/students-guardians/students/services/studentsService";
import type { TransferApplication } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  getStructureTreeSnapshot,
  resolveStructureContextForAcademicYear,
} from "@/features/academics/academic-structure-tree/services/structureService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TransferApplication>) => void;
}

type SearchableOption = {
  id: string;
  label: string;
  secondary?: string;
};

const getStageFromGrade = (grade: string): "primary" | "preparatory" | "secondary" => {
  const gradeNumber = parseInt(grade.replace(/\D/g, ""), 10);
  if (gradeNumber >= 1 && gradeNumber <= 5) return "primary";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "preparatory";
  return "secondary";
};

function SearchableDropdown({
  label,
  placeholder,
  noResultsLabel,
  value,
  searchValue,
  options,
  isOpen,
  onToggle,
  onSearchChange,
  onSelect,
  disabled = false,
  error,
}: {
  label: string;
  placeholder: string;
  noResultsLabel: string;
  value: string;
  searchValue: string;
  options: SearchableOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (option: SearchableOption) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between ${
          disabled
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 bg-white hover:border-gray-400"
        } ${error ? "border-red-300" : ""}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(option)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  {option.secondary ? (
                    <div className="text-xs text-gray-500 mt-1">{option.secondary}</div>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">{noResultsLabel}</div>
            )}
          </div>
        </div>
      )}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function CreateTransferModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTransferModalProps) {
  const t = useTranslations(
    "students_guardians.transfers_withdrawals.modals.transfer",
  );

  const [formData, setFormData] = useState<Partial<TransferApplication>>({
    studentId: "",
    studentName: "",
    studentNameAr: "",
    stage: undefined,
    grade: "",
    section: "",
    classroom: "",
    type: "internal",
    targetSection: "",
    targetSectionId: "",
    targetClassroom: "",
    targetClassroomId: "",
    targetClass: "",
    externalSchool: "",
    reason: "",
    effectiveDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [sectionSearch, setSectionSearch] = useState("");
  const [classroomSearch, setClassroomSearch] = useState("");
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showClassroomDropdown, setShowClassroomDropdown] = useState(false);

  const [allStudents, setAllStudents] = useState<
    StudentWithEnrollmentContext[]
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      try {
        const students = await fetchStudentsWithEnrollment();
        if (!isCancelled) {
          setAllStudents(students);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStudents(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(
    () =>
      allStudents.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
          student.full_name_en.toLowerCase().includes(query) ||
          student.full_name_ar.includes(searchQuery) ||
          student.student_id?.toLowerCase().includes(query)
        );
      }),
    [allStudents, searchQuery],
  );

  const selectedStudent = formData.studentId
    ? allStudents.find((item) => (item.student_id || item.id) === formData.studentId)
    : undefined;

  const selectedEnrollment = selectedStudent?.enrollment;

  const academicYear = selectedEnrollment?.academicYear;
  const structureContext = academicYear
    ? resolveStructureContextForAcademicYear(academicYear)
    : undefined;
  const structureTree = structureContext
    ? getStructureTreeSnapshot(structureContext.academicYearId, structureContext.termId)
    : undefined;
  const currentGradeId = selectedEnrollment?.gradeId;
  const availableSections = structureTree
    ? structureTree.sections.filter((section) => section.gradeId === currentGradeId)
    : [];
  const availableClassrooms = structureTree?.classrooms ?? [];

  const sectionQuery = sectionSearch.trim().toLowerCase();
  const sectionOptions = availableSections
    .filter((section) => {
      const sectionLabel = section.nameEn || section.nameAr || section.name;
      return (
        !sectionQuery ||
        sectionLabel.toLowerCase().includes(sectionQuery) ||
        section.nameAr.includes(sectionSearch)
      );
    })
    .map((section) => ({
      id: section.id,
      label: section.nameEn || section.nameAr || section.name,
      secondary:
        section.id === selectedEnrollment?.sectionId
          ? t("fields.current_section")
          : undefined,
    }));

  const classroomQuery = classroomSearch.trim().toLowerCase();
  const classroomOptions = availableClassrooms
    .filter((classroom) => classroom.sectionId === formData.targetSectionId)
    .filter((classroom) => {
      const label = classroom.nameEn || classroom.nameAr || classroom.name;
      return (
        !classroomQuery ||
        label.toLowerCase().includes(classroomQuery) ||
        classroom.nameAr.includes(classroomSearch)
      );
    })
    .map((classroom) => ({
      id: classroom.id,
      label: classroom.nameEn || classroom.nameAr || classroom.name,
      secondary:
        classroom.id === selectedEnrollment?.classroomId
          ? t("fields.current_classroom")
          : undefined,
    }));

  const handleStudentSelect = (student: StudentWithEnrollmentContext) => {
    const enrollment = student.enrollment;

    setFormData((prev) => ({
      ...prev,
        studentId: student.id,
      studentName: student.full_name_en,
      studentNameAr: student.full_name_ar || "",
      stage:
        enrollment?.grade
          ? getStageFromGrade(enrollment.grade)
          : (student.stage as "primary" | "preparatory" | "secondary") ||
            getStageFromGrade(student.gradeRequested),
      grade: enrollment?.grade || student.gradeRequested,
      section: enrollment?.section || "",
      classroom: enrollment?.classroom || "",
      targetSection: "",
      targetSectionId: "",
      targetClassroom: "",
      targetClassroomId: "",
      targetClass: "",
    }));
    setShowStudentSearch(false);
    setSearchQuery("");
    setSectionSearch("");
    setClassroomSearch("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) newErrors.studentId = t("errors.student_required");
    if (!formData.type) newErrors.type = t("errors.type_required");
    if (formData.type === "internal") {
      if (!formData.targetSectionId) {
        newErrors.targetSection = t("errors.target_section_required");
      }
      if (!formData.targetClassroomId) {
        newErrors.targetClassroom = t("errors.target_classroom_required");
      }
      if (
        formData.targetSectionId === selectedEnrollment?.sectionId &&
        formData.targetClassroomId === selectedEnrollment?.classroomId
      ) {
        newErrors.targetClassroom = t("errors.target_must_change");
      }
    }
    if (formData.type === "external" && !formData.externalSchool) {
      newErrors.externalSchool = t("errors.external_school_required");
    }
    if (!formData.reason) newErrors.reason = t("errors.reason_required");
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = t("errors.date_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        targetClass:
          formData.type === "internal"
            ? [formData.targetSection, formData.targetClassroom]
                .filter(Boolean)
                .join(" • ")
            : formData.targetClass,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {isLoadingStudents ? <PartialLoader /> : null}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.student")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.studentName || searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowStudentSearch(true);
                    }}
                    onFocus={() => setShowStudentSearch(true)}
                    placeholder={t("fields.search_student")}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentSearch(!showStudentSearch)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                {showStudentSearch && searchQuery && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const enrollment = student.enrollment;
                        const placement = [
                          enrollment?.grade || student.gradeRequested,
                          enrollment?.section,
                          enrollment?.classroom,
                        ]
                          .filter(Boolean)
                          .join(" • ");

                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleStudentSelect(student)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900">
                              {student.full_name_en}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.student_id || student.id} • {placement}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {t("no_students_found")}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
              )}
            </div>

            {formData.studentId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t("fields.student_id")}:</span>
                    <span className="ml-2 font-medium">{formData.studentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.stage")}:</span>
                    <span className="ml-2 font-medium">{formData.stage}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.grade")}:</span>
                    <span className="ml-2 font-medium">{formData.grade}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.section")}:</span>
                    <span className="ml-2 font-medium">{formData.section || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t("fields.classroom")}:</span>
                    <span className="ml-2 font-medium">{formData.classroom || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.type")} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "internal",
                      externalSchool: "",
                    })
                  }
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.type === "internal"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t("types.internal")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "external",
                      targetSection: "",
                      targetSectionId: "",
                      targetClassroom: "",
                      targetClassroomId: "",
                      targetClass: "",
                    })
                  }
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.type === "external"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t("types.external")}
                </button>
              </div>
            </div>

            {formData.type === "internal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableDropdown
                  label={`${t("fields.target_section")} *`}
                  placeholder={t("fields.search_target_section")}
                  noResultsLabel={t("no_sections_found")}
                  value={formData.targetSection || ""}
                  searchValue={sectionSearch}
                  options={sectionOptions}
                  isOpen={showSectionDropdown}
                  onToggle={() => {
                    setShowSectionDropdown((prev) => !prev);
                    setShowClassroomDropdown(false);
                  }}
                  onSearchChange={setSectionSearch}
                  onSelect={(option) => {
                    setFormData((prev) => ({
                      ...prev,
                      targetSection: option.label,
                      targetSectionId: option.id,
                      targetClassroom: "",
                      targetClassroomId: "",
                      targetClass: "",
                    }));
                    setSectionSearch("");
                    setShowSectionDropdown(false);
                  }}
                  disabled={!formData.studentId}
                  error={errors.targetSection}
                />
                <SearchableDropdown
                  label={`${t("fields.target_classroom")} *`}
                  placeholder={t("fields.search_target_classroom")}
                  noResultsLabel={t("no_classrooms_found")}
                  value={formData.targetClassroom || ""}
                  searchValue={classroomSearch}
                  options={classroomOptions}
                  isOpen={showClassroomDropdown}
                  onToggle={() => {
                    setShowClassroomDropdown((prev) => !prev);
                    setShowSectionDropdown(false);
                  }}
                  onSearchChange={setClassroomSearch}
                  onSelect={(option) => {
                    setFormData((prev) => ({
                      ...prev,
                      targetClassroom: option.label,
                      targetClassroomId: option.id,
                      targetClass: [prev.targetSection, option.label]
                        .filter(Boolean)
                        .join(" • "),
                    }));
                    setClassroomSearch("");
                    setShowClassroomDropdown(false);
                  }}
                  disabled={!formData.targetSectionId}
                  error={errors.targetClassroom}
                />
              </div>
            )}

            {formData.type === "external" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fields.external_school")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.externalSchool}
                  onChange={(e) =>
                    setFormData({ ...formData, externalSchool: e.target.value })
                  }
                  placeholder={t("fields.external_school_placeholder")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.externalSchool && (
                  <p className="mt-1 text-sm text-red-600">{errors.externalSchool}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.reason")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t("fields.reason_placeholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.effective_date")} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveDate: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.effectiveDate && (
                <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder={t("fields.notes_placeholder")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.attachments")}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{t("fields.upload_files")}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium transition-colors"
              >
                {t("submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

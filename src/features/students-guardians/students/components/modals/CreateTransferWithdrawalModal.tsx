"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import {
  fetchStudentsWithEnrollment,
  type StudentWithEnrollmentContext,
} from "@/features/students-guardians/students/services/studentsService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { Button, Input, Modal, Select, TextArea } from "@/components/ui";

interface CreateTransferWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => void;
}

interface ApplicationData {
  studentId: string;
  studentName: string;
  type: "transfer" | "withdrawal";
  reason: string;
  stage: string;
  grade: string;
  section: string;
  classroom: string;
  effectiveDate: string;
  notes: string;
}

const getStageFromGrade = (grade: string): string => {
  const gradeNumber = parseInt(grade.replace(/\D/g, ""), 10);
  if (gradeNumber >= 1 && gradeNumber <= 5) return "Primary";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "Preparatory";
  if (gradeNumber >= 10 && gradeNumber <= 12) return "Secondary";
  return "Primary";
};

const initialFormData: ApplicationData = {
  studentId: "",
  studentName: "",
  type: "withdrawal",
  reason: "",
  stage: "",
  grade: "",
  section: "",
  classroom: "",
  effectiveDate: "",
  notes: "",
};

export default function CreateTransferWithdrawalModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTransferWithdrawalModalProps) {
  const t = useTranslations("students_guardians.modal");

  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [allStudents, setAllStudents] = useState<
    StudentWithEnrollmentContext[]
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const loadStudents = async () => {
      setIsLoadingStudents(true);

      try {
        const students = await fetchStudentsWithEnrollment();

        if (!isMounted) {
          return;
        }

        setAllStudents(students);
      } finally {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      }
    };

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    const searchValue = searchQuery.toLowerCase();

    return allStudents.filter((student) => {
      return (
        student.full_name_en.toLowerCase().includes(searchValue) ||
        student.full_name_ar.includes(searchQuery) ||
        student.student_id?.toLowerCase().includes(searchValue) ||
        student.id.toLowerCase().includes(searchValue)
      );
    });
  }, [allStudents, searchQuery]);

  const handleStudentSelect = (student: StudentWithEnrollmentContext) => {
    const enrollment = student.enrollment;
    const stage = student.stage || getStageFromGrade(student.gradeRequested);

    setFormData((prev) => ({
      ...prev,
        studentId: student.id,
      studentName: student.full_name_en,
      stage,
      grade: enrollment?.grade || student.gradeRequested,
      section: enrollment?.section || "",
      classroom: enrollment?.classroom || "",
    }));
    setShowStudentSearch(false);
    setSearchQuery("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) {
      newErrors.studentId = t("errors.student_required");
    }
    if (!formData.type) {
      newErrors.type = t("errors.type_required");
    }
    if (!formData.reason) {
      newErrors.reason = t("errors.reason_required");
    }
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = t("errors.date_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(formData);
    setFormData(initialFormData);
    setErrors({});
    setSearchQuery("");
    setShowStudentSearch(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="create-transfer-withdrawal-form">
            {t("submit")}
          </Button>
        </>
      }
    >
          <form id="create-transfer-withdrawal-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
            {isLoadingStudents ? <PartialLoader /> : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("fields.student")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={formData.studentName || searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        studentName: prev.studentId ? prev.studentName : e.target.value,
                      }));
                      setShowStudentSearch(true);
                    }}
                    onFocus={() => setShowStudentSearch(true)}
                    placeholder={t("fields.search_student")}
                    error={errors.studentId}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowStudentSearch(!showStudentSearch)}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
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
                          <Button
                            key={student.id}
                            type="button"
                            variant="ghost"
                            fullWidth
                            onClick={() => handleStudentSelect(student)}
                            className="justify-start rounded-none border-b border-gray-100 px-4 py-3 text-left last:border-0"
                          >
                            <div className="font-medium text-gray-900">
                              {student.full_name_en}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.student_id || student.id} • {student.stage || getStageFromGrade(student.gradeRequested)} • {placement}
                            </div>
                          </Button>
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
                <Button
                  type="button"
                  variant={formData.type === "transfer" ? "primary" : "secondary"}
                  onClick={() => setFormData((prev) => ({ ...prev, type: "transfer" }))}
                  className="py-3"
                >
                  {t("types.transfer")}
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "withdrawal" ? "primary" : "secondary"}
                  onClick={() => setFormData((prev) => ({ ...prev, type: "withdrawal" }))}
                  className="py-3"
                >
                  {t("types.withdrawal")}
                </Button>
              </div>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

              <Select
                label={t("fields.reason")}
                value={formData.reason}
                onChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
                placeholder={t("fields.select_reason")}
                error={errors.reason}
                options={[
                  { value: "relocation", label: t("reasons.relocation") },
                  { value: "financial", label: t("reasons.financial") },
                  { value: "academic", label: t("reasons.academic") },
                  { value: "behavior", label: t("reasons.behavior") },
                  { value: "other", label: t("reasons.other") },
                ]}
              />

              <Input
                label={t("fields.effective_date")}
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                error={errors.effectiveDate}
              />

              <TextArea
                label={t("fields.notes")}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                placeholder={t("fields.notes_placeholder")}
                resize="none"
              />
          </form>
    </Modal>
  );
}

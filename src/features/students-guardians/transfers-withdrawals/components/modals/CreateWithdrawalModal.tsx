"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Search, Upload } from "lucide-react";
import {
  fetchStudentsWithEnrollment,
  type StudentWithEnrollmentContext,
} from "@/features/students-guardians/students/services/studentsService";
import type { WithdrawalApplication } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface CreateWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<WithdrawalApplication>) => void;
}

const getStageFromGrade = (grade: string): "primary" | "preparatory" | "secondary" => {
  const gradeNumber = parseInt(grade.replace(/\D/g, ""), 10);
  if (gradeNumber >= 1 && gradeNumber <= 5) return "primary";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "preparatory";
  return "secondary";
};

export default function CreateWithdrawalModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateWithdrawalModalProps) {
  const t = useTranslations(
    "students_guardians.transfers_withdrawals.modals.withdrawal",
  );

  const [formData, setFormData] = useState<Partial<WithdrawalApplication>>({
    studentId: "",
    studentName: "",
    studentNameAr: "",
    stage: undefined,
    grade: "",
    section: "",
    classroom: "",
    reason: "relocation",
    effectiveDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);

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

  const handleStudentSelect = useCallback(
    (student: StudentWithEnrollmentContext) => {
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
      }));
      setShowStudentSearch(false);
      setSearchQuery("");
    },
    [],
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) newErrors.studentId = t("errors.student_required");
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
      onSubmit(formData);
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
                {t("fields.reason")} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reason: e.target.value as WithdrawalApplication["reason"],
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="relocation">{t("reasons.relocation")}</option>
                <option value="financial">{t("reasons.financial")}</option>
                <option value="academic">{t("reasons.academic")}</option>
                <option value="behavior">{t("reasons.behavior")}</option>
                <option value="health">{t("reasons.health")}</option>
                <option value="other">{t("reasons.other")}</option>
              </select>
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

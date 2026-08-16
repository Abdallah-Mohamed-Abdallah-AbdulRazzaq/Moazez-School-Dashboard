// FILE: src/components/students-guardians/guardian-tabs/StudentsTab.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Users,
  GraduationCap,
  ArrowRight,
  UserPlus,
  Search,
  AlertCircle,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type {
  Student,
  StudentGuardian,
} from "@/features/students-guardians/students/types";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

interface StudentsTabProps {
  guardian: StudentGuardian;
}

export default function StudentsTab({ guardian }: StudentsTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");
  const router = useRouter();
  const permissions = usePermissions();
  const { canLinkGuardianToStudent } =
    getStudentsGuardiansCapabilities(permissions);
  const params = useParams();
  const lang = (params.lang as string) || "en";

  // ── Linked students ────────────────────────────────────────────────────────
  const [linkedStudents, setLinkedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLinkedStudents = async () => {
    setIsLoading(true);
    try {
      const students = await studentsService.fetchGuardianStudents(
        guardian.guardianId,
      );
      setLinkedStudents(students);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const students = await studentsService.fetchGuardianStudents(
          guardian.guardianId,
        );
        if (!isCancelled) setLinkedStudents(students);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [guardian.guardianId]);

  const handleStudentClick = (studentId: string) => {
    router.push(`/${lang}/students-guardians/students/${studentId}`);
  };

  // ── Link-student modal state ───────────────────────────────────────────────
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<Student[]>(
    [],
  );
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [linkAsPrimary, setLinkAsPrimary] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinkingStudent, setIsLinkingStudent] = useState(false);

  // Rebuild the set of already-linked IDs whenever linkedStudents changes
  const linkedStudentIds = new Set(linkedStudents.map((s) => s.id));

  // Search students whenever the modal is open and the search term changes
  useEffect(() => {
    if (!isLinkModalOpen) return;

    let isCancelled = false;

    const search = async () => {
      setIsSearchingStudents(true);
      try {
        const results = await studentsService.fetchAllStudents({
          search: studentSearch,
        });
        if (!isCancelled) {
          setStudentSearchResults(
            results.filter((s) => !linkedStudentIds.has(s.id)),
          );
        }
      } catch {
        if (!isCancelled) setStudentSearchResults([]);
      } finally {
        if (!isCancelled) setIsSearchingStudents(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => {
      isCancelled = true;
      clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearch, isLinkModalOpen]);

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setStudentSearch("");
    setStudentSearchResults([]);
    setSelectedStudentId("");
    setLinkAsPrimary(false);
    setLinkError(null);
  };

  const handleLinkStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canLinkGuardianToStudent || !selectedStudentId) return;

    setIsLinkingStudent(true);
    setLinkError(null);

    try {
      await studentsService.linkGuardianToStudent(selectedStudentId, {
        guardianId: guardian.guardianId,
        is_primary: linkAsPrimary,
      });
      closeLinkModal();
      await loadLinkedStudents();
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "Failed to link student.",
      );
    } finally {
      setIsLinkingStudent(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {isLoading ? <PartialLoader /> : null}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("sections.linked_students")} ({linkedStudents.length})
          </h2>

          <Button type="button" leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsLinkModalOpen(true)}
            disabled={!canLinkGuardianToStudent}
          >
            Link Student
          </Button>
        </div>

        {linkedStudents.length === 0 ? (
          <EmptyState icon={<Users className="w-12 h-12" />} message={t("no_linked_students")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentClick(student.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white font-semibold">
                      {student.full_name_en
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {student.full_name_en}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {student.student_id || student.id}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {student.grade || student.gradeRequested}
                    </span>
                    {student.section && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{student.section}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : student.status === "Suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Link Student Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isLinkModalOpen} onClose={closeLinkModal} title="Link Student" size="lg">
        {isLinkModalOpen && (
          <form
            onSubmit={handleLinkStudent}
            className="space-y-4"
          >
            {/* Search input */}
                <Input
                  label="Search students"
                  leftIcon={<Search className="w-4 h-4" />}
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId("");
                  }}
                  placeholder={t("searchPlaceholder")}
                />

            {/* Results list */}
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {isSearchingStudents ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  Searching…
                </p>
              ) : studentSearchResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  {studentSearch
                    ? "No students found."
                    : "Start typing to search students."}
                </p>
              ) : (
                studentSearchResults.map((student) => (
                  <label
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selectedStudentId === student.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {student.full_name_en
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          {student.full_name_en}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {student.student_id || student.id}
                          {student.grade ? ` · Grade ${student.grade}` : ""}
                          {student.status ? ` · ${student.status}` : ""}
                        </span>
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Primary checkbox */}
            <label className="mt-5 flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <Button type="button" size="sm" variant={linkAsPrimary ? "primary" : "secondary"} onClick={() => setLinkAsPrimary((current) => !current)}>{linkAsPrimary ? "✓" : "○"}</Button>
              Set as primary guardian for this student
            </label>

            {/* Error */}
            {linkError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {linkError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary"
                onClick={closeLinkModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedStudentId || isLinkingStudent}
                loading={isLinkingStudent}
              >
                Link Student
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

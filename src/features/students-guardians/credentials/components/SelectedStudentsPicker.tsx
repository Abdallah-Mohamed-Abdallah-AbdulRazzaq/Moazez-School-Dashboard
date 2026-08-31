"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { fetchStudents } from "@/features/students-guardians/students/services/studentsApiService";
import type { Student } from "@/features/students-guardians/students/types";
import { MAX_SELECTED_CREDENTIAL_STUDENTS } from "../model/credentialAudience";

export interface SelectedCredentialStudent {
  id: string;
  label: string;
  reference?: string;
}

interface SelectedStudentsPickerProps {
  selected: SelectedCredentialStudent[];
  onChange: (students: SelectedCredentialStudent[]) => void;
  disabled?: boolean;
}

const copy = {
  en: {
    students: "Students",
    search: "Search students...",
    noOptions: "No students found",
    selected: "selected",
    remove: "Remove",
    loadError: "Students could not be loaded.",
    limit: "The maximum of 10,000 students has been reached.",
  },
  ar: {
    students: "الطلاب",
    search: "ابحث عن الطلاب...",
    noOptions: "لم يتم العثور على طلاب",
    selected: "محدد",
    remove: "إزالة",
    loadError: "تعذر تحميل الطلاب.",
    limit: "تم الوصول إلى الحد الأقصى البالغ 10,000 طالب.",
  },
} as const;

function getStudentLabel(student: Student, locale: "ar" | "en"): string {
  return locale === "ar"
    ? student.full_name_ar || student.full_name_en || student.id
    : student.full_name_en || student.full_name_ar || student.id;
}

export default function SelectedStudentsPicker({
  selected,
  onChange,
  disabled = false,
}: SelectedStudentsPickerProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestSequence = useRef(0);
  const atLimit = selected.length >= MAX_SELECTED_CREDENTIAL_STUDENTS;

  useEffect(() => {
    const sequence = ++requestSequence.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await fetchStudents({
          ...(query.trim() ? { search: query.trim() } : {}),
        });
        if (sequence === requestSequence.current) setStudents(response);
      } catch {
        if (sequence === requestSequence.current) {
          setStudents([]);
          setLoadError(true);
        }
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [query]);

  const studentsById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );
  const options = students.map((student) => ({
    value: student.id,
    label: getStudentLabel(student, locale),
    searchText: `${student.student_id ?? ""} ${student.full_name_ar} ${student.full_name_en}`,
  }));

  const addStudent = (studentId: string) => {
    if (atLimit || selected.some((student) => student.id === studentId)) return;
    const student = studentsById.get(studentId);
    if (!student) return;
    onChange([
      ...selected,
      {
        id: student.id,
        label: getStudentLabel(student, locale),
        reference: student.student_id,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <Select
        label={text.students}
        value=""
        options={options}
        searchable
        searchMode="server"
        searchPlaceholder={text.search}
        noOptionsText={loading ? `${text.students}...` : text.noOptions}
        noResultsText={text.noOptions}
        disabled={disabled || atLimit}
        onSearchChange={setQuery}
        onChange={addStudent}
      />

      <p className="text-sm text-gray-600">
        {selected.length} {text.selected}
      </p>
      {loadError && <p className="text-sm text-red-600">{text.loadError}</p>}
      {atLimit && <p className="text-sm text-amber-700">{text.limit}</p>}

      {selected.length > 0 && (
        <ul className="space-y-2">
          {selected.map((student) => (
            <li
              key={student.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {student.label}
                </p>
                {student.reference && (
                  <p className="text-xs text-gray-500">{student.reference}</p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`${text.remove} ${student.label}`}
                onClick={() =>
                  onChange(selected.filter((item) => item.id !== student.id))
                }
              >
                {text.remove}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

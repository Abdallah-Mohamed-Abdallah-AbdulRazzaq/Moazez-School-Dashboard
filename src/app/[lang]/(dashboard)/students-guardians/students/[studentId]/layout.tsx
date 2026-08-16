"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  Users,
  GraduationCap,
  Heart,
  FileText,
  MessageSquare,
  Clock,
  Award,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { Student } from "@/features/students-guardians/students/types";
import {
  getStudentDisplayName,
  getStudentDisplayId,
  getStudentGrade,
} from "@/features/students-guardians/students/utils/studentUtils";
import { useSectionTabs, type TabConfig } from "@/hooks/useSectionTabs";
import { buildLocalePath } from "@/lib/routing/localePath";
import { StudentProfileProvider } from "@/features/students-guardians/students/components/StudentProfileContext";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

const tabs: TabConfig[] = [
  { key: "personal", labelKey: "tabs.personal_info", icon: User },
  { key: "guardians", labelKey: "tabs.guardians", icon: Users },
  {
    key: "enrollment",
    labelKey: "tabs.enrollment_history",
    icon: GraduationCap,
  },
  { key: "grades", labelKey: "tabs.grades", icon: GraduationCap },
  { key: "hero-journey", labelKey: "tabs.hero_journey", icon: Award },
  { key: "reinforcement", labelKey: "tabs.reinforcement_progress", icon: ListChecks },
  { key: "behavior", labelKey: "tabs.behavior", icon: Award },
  { key: "documents", labelKey: "tabs.documents", icon: FileText },
  { key: "medical", labelKey: "tabs.medical", icon: Heart },
  { key: "notes", labelKey: "tabs.notes", icon: MessageSquare },
  { key: "timeline", labelKey: "tabs.timeline", icon: Clock },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Suspended":
      return "bg-yellow-100 text-yellow-700";
    case "Withdrawn":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function StudentProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentsGuardiansPermissionGuard permissions={["students.records.view"]}>
      <StudentProfileLayoutContent>{children}</StudentProfileLayoutContent>
    </StudentsGuardiansPermissionGuard>
  );
}

function StudentProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations("students_guardians.profile");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  const {
    activeTab,
    entityId: studentId,
    handleTabClick,
  } = useSectionTabs({
    basePath: ["students-guardians", "students"],
    idParam: "studentId",
    tabs,
  });

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoadingStudent(true);
      setStudentLoadError(null);

      try {
        const fetchedStudent =
          await studentsService.fetchStudentWithEnrollment(studentId);
        if (!cancelled) {
          setStudent(fetchedStudent || null);
        }
      } catch (error) {
        if (!cancelled) {
          setStudent(null);
          setStudentLoadError(
            error instanceof Error ? error.message : t("student_not_found"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStudent(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [studentId, t]);

  if (isLoadingStudent) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">Loading student...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">{t("student_not_found")}</p>
          {studentLoadError ? (
            <p className="mt-2 text-sm text-gray-400">{studentLoadError}</p>
          ) : null}
          <button
            onClick={() =>
              router.push(
                buildLocalePath(lang, "students-guardians", "students"),
              )
            }
            className="mt-4 text-[#036b80] hover:underline"
          >
            {t("back_to_students")}
          </button>
        </div>
      </div>
    );
  }

  const studentName =
    locale === "ar"
      ? student.full_name_ar || getStudentDisplayName(student)
      : student.full_name_en || getStudentDisplayName(student);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            router.push(buildLocalePath(lang, "students-guardians", "students"))
          }
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          {locale === "en" ? <ArrowLeft /> : <ArrowRight />}
          <span className="text-sm font-medium">{t("back_to_students")}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#036b80] bg-opacity-10 flex items-center justify-center">
              <User className="w-8 h-8 text-[#036b80]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {studentName}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>
                  {t("student_id")}: {getStudentDisplayId(student)}
                </span>
                <span>
                  {t("grade")}: {getStudentGrade(student) || t("na")}
                </span>
                <span>
                  {t("section")}:{" "}
                  {(student as Student & { enrollment?: { section?: string } }).enrollment?.section ||
                    student.section ||
                    t("na")}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}
          >
            {t(`status.${student.status.toLowerCase()}`)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-visible">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-[#036b80] text-[#036b80]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {String(t(tab.labelKey))}
                </button>
              );
            })}
          </div>
        </div>
        <StudentProfileProvider
          value={{
            student,
            updateStudent: (updatedStudent) =>
              setStudent((currentStudent) =>
                currentStudent
                  ? { ...currentStudent, ...updatedStudent }
                  : updatedStudent,
              ),
          }}
        >
          <div className="p-6">{children}</div>
        </StudentProfileProvider>
      </div>
    </div>
  );
}

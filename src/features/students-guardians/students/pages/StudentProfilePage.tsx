// FILE: src/components/students-guardians/StudentProfilePage.tsx

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  Users,
  Calendar,
  GraduationCap,
  Heart,
  FileText,
  MessageSquare,
  Clock,
  Award,
  ArrowRight,
  ArrowLeftRight,
  LogOut,
  Lock,
  ListChecks,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { Student } from "@/features/students-guardians/students/types";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import StudentAccountLinkModal from "@/features/students-guardians/students/components/StudentAccountLinkModal";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";
import {
  StudentAttendanceTab,
  StudentBehaviorTab,
  StudentDocumentsTab,
  StudentEnrollmentHistoryTab,
  StudentGradesTab,
  StudentHeroJourneyTab,
  StudentReinforcementProgressTab,
  StudentGuardiansTab,
  StudentMedicalTab,
  StudentNotesTab,
  StudentPersonalInfoTab,
  StudentTimelineTab,
  StudentTransfersTab,
  StudentWithdrawalTab,
} from "@/features/students-guardians/students/components/tabs";
import {
  getStudentDisplayName,
  getStudentDisplayId,
  getStudentGrade,
  getStudentSection,
  getStudentClassroom,
} from "@/features/students-guardians/students/utils/studentUtils";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";


interface StudentProfilePageProps {
  studentId: string;
}

type TabKey =
  | "personal"
  | "guardians"
  | "enrollment"
  | "attendance"
  | "grades"
  | "heroJourney"
  | "reinforcementProgress"
  | "behavior"
  | "documents"
  | "medical"
  | "notes"
  | "timeline"
  | "transfers"
  | "withdrawal";

const tabs = [
  { key: "personal" as TabKey, labelKey: "tabs.personal_info", icon: User },
  { key: "guardians" as TabKey, labelKey: "tabs.guardians", icon: Users },
  {
    key: "enrollment" as TabKey,
    labelKey: "tabs.enrollment_history",
    icon: GraduationCap,
  },
  { key: "attendance" as TabKey, labelKey: "tabs.attendance", icon: Calendar },
  { key: "grades" as TabKey, labelKey: "tabs.grades", icon: GraduationCap },
  { key: "heroJourney" as TabKey, labelKey: "tabs.hero_journey", icon: Award },
  { key: "reinforcementProgress" as TabKey, labelKey: "tabs.reinforcement_progress", icon: ListChecks },
  { key: "behavior" as TabKey, labelKey: "tabs.behavior", icon: Award },
  { key: "documents" as TabKey, labelKey: "tabs.documents", icon: FileText },
  { key: "medical" as TabKey, labelKey: "tabs.medical", icon: Heart },
  { key: "notes" as TabKey, labelKey: "tabs.notes", icon: MessageSquare },
  { key: "timeline" as TabKey, labelKey: "tabs.timeline", icon: Clock },
  {
    key: "transfers" as TabKey,
    labelKey: "tabs.transfers",
    icon: ArrowLeftRight,
  },
  { key: "withdrawal" as TabKey, labelKey: "tabs.withdrawal", icon: LogOut },
];

export default function StudentProfilePage({
  studentId,
}: StudentProfilePageProps) {
  const t = useTranslations("students_guardians.profile");
  const locale = useLocale();
  const router = useRouter();
  const permissions = usePermissions();
  const { canLinkStudentAccount } =
    getStudentsGuardiansCapabilities(permissions);
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const { yearId, termId } = useStudentsGuardiansYearTermContext();
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [studentRevision, setStudentRevision] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [enrichedStudent, setEnrichedStudent] =
    useState<studentsService.StudentWithEnrollmentContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const studentData = await studentsService.fetchStudentWithEnrollment(
          studentId,
          yearId,
        );

        if (isCancelled) {
          return;
        }

        setStudent(studentData ?? null);
        setEnrichedStudent(studentData ?? null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setStudent(null);
        setEnrichedStudent(null);
        setLoadError(
          error instanceof Error ? error.message : t("student_not_found"),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [studentId, studentRevision, yearId, t]);

  if (isLoading) {
    return <MainLoader />;
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 text-center">
          <EmptyState
            message={loadError || t("student_not_found")}
            action={
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/${lang}/students-guardians/students`)}
              >
                {t("back_to_students")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "withdrawn":
        return "bg-gray-100 text-gray-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKey = status.toLowerCase() as
      | "active"
      | "withdrawn"
      | "suspended";
    return t(`status.${statusKey}`);
  };

  const studentWithNames = student as Student & {
    full_name_ar?: string;
    studentNameArabic?: string;
    full_name_en?: string;
    studentName?: string;
  };

  const studentName =
    locale === "ar"
      ? studentWithNames.full_name_ar ||
        studentWithNames.studentNameArabic ||
        studentWithNames.full_name_en ||
        studentWithNames.studentName ||
        getStudentDisplayName(student)
      : studentWithNames.full_name_en ||
        studentWithNames.studentName ||
        studentWithNames.full_name_ar ||
        getStudentDisplayName(student);

  const profileStudent = enrichedStudent ?? student;

  const tabContent: Record<TabKey, ReactNode> = {
    personal: (
      <StudentPersonalInfoTab
        student={profileStudent}
        onStudentUpdated={() => setStudentRevision((current) => current + 1)}
      />
    ),
    guardians: <StudentGuardiansTab student={profileStudent} />,
    enrollment: <StudentEnrollmentHistoryTab student={profileStudent} />,
    attendance: <StudentAttendanceTab student={profileStudent} />,
    grades: (
      <StudentGradesTab
        student={profileStudent}
        academicYearId={yearId}
        termId={termId}
      />
    ),
    heroJourney: <StudentHeroJourneyTab student={profileStudent} academicYearId={yearId} termId={termId} />,
    reinforcementProgress: <StudentReinforcementProgressTab studentId={profileStudent.id} academicYearId={yearId} termId={termId} />,
    behavior: <StudentBehaviorTab student={profileStudent} />,
    documents: <StudentDocumentsTab student={profileStudent} />,
    medical: <StudentMedicalTab student={profileStudent} />,
    notes: <StudentNotesTab student={profileStudent} />,
    timeline: <StudentTimelineTab student={profileStudent} />,
    transfers: <StudentTransfersTab student={profileStudent} />,
    withdrawal: <StudentWithdrawalTab student={profileStudent} />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 sm:p-6">
          {/* Back Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/${lang}/students-guardians/students`)}
            className="mb-4 px-0 text-gray-600"
            leftIcon={
              locale === "ar" ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )
            }
          >
            {t("back_to_students")}
          </Button>

          {/* Student Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {studentName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {studentName}
                </h1>
                <span
                  className={`w-fit inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}
                >
                  {getStatusLabel(student.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("student_id")}:</span>{" "}
                  {getStudentDisplayId(profileStudent)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("grade")}:</span>{" "}
                  {locale === "ar" &&
                  getStudentGrade(profileStudent).startsWith("Grade ")
                    ? `الصف ${getStudentGrade(profileStudent).replace("Grade ", "")}`
                    : getStudentGrade(profileStudent)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("section")}:</span>{" "}
                  {getStudentSection(profileStudent) ?? t("na")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("classroom")}:</span>{" "}
                  {getStudentClassroom(profileStudent)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Lock className="h-4 w-4" />}
              disabled={!canLinkStudentAccount}
              title={
                canLinkStudentAccount
                  ? t("account_linking.action")
                  : t("account_linking.manage_required")
              }
              onClick={() => setIsAccountModalOpen(true)}
            >
              {t("account_linking.action")}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.key}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-none border-b-2 px-4 py-3 whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                  leftIcon={<Icon className="w-4 h-4" />}
                >
                  {t(tab.labelKey)}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {tabContent[activeTab] || (
          <div className="bg-white rounded-xl border border-gray-200">
            <EmptyState message={t("no_data")} />
          </div>
        )}
      </div>
      <StudentAccountLinkModal
        isOpen={isAccountModalOpen}
        student={student}
        onClose={() => setIsAccountModalOpen(false)}
        onLinked={() => setStudentRevision((current) => current + 1)}
      />
    </div>
  );
}

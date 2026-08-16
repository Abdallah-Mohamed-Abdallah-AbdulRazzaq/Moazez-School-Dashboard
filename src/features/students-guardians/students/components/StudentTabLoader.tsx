"use client";

import type { Student } from "@/features/students-guardians/students/types";
import OverviewTab from "@/features/students-guardians/students/components/tabs/OverviewTab";
import PersonalInfoTab from "@/features/students-guardians/students/components/tabs/PersonalInfoTab";
import GuardiansTab from "@/features/students-guardians/students/components/tabs/GuardiansTab";
import EnrollmentHistoryTab from "@/features/students-guardians/students/components/tabs/EnrollmentHistoryTab";
import DocumentsTab from "@/features/students-guardians/students/components/tabs/DocumentsTab";
import MedicalTab from "@/features/students-guardians/students/components/tabs/MedicalTab";
import NotesTab from "@/features/students-guardians/students/components/tabs/NotesTab";
import TimelineTab from "@/features/students-guardians/students/components/tabs/TimelineTab";
import BehaviorTab from "@/features/students-guardians/students/components/tabs/BehaviorTab";
import GradesTab from "@/features/students-guardians/students/components/tabs/GradesTab";
import HeroJourneyTab from "@/features/students-guardians/students/components/tabs/HeroJourneyTab";
import ReinforcementProgressTab from "@/features/students-guardians/students/components/tabs/ReinforcementProgressTab";
import { useStudentProfile } from "@/features/students-guardians/students/components/StudentProfileContext";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import { Clock } from "lucide-react";

export type StudentTabKey =
  | "overview"
  | "personal"
  | "guardians"
  | "enrollment"
  | "documents"
  | "medical"
  | "notes"
  | "timeline"
  | "behavior"
  | "attendance"
  | "grades"
  | "reinforcement"
  | "hero-journey";

interface StudentTabLoaderProps {
  studentId: string;
  tab: StudentTabKey;
}

interface RenderTabOptions {
  tab: StudentTabKey;
  student: Student;
  onStudentUpdated: (student: Student) => void;
  academicYearId?: string | null;
  termId?: string | null;
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
      <Clock className="w-12 h-12" />
      <p className="text-lg font-semibold">{label} — Coming Soon</p>
      <p className="text-sm text-gray-400">
        This section will be available when the API endpoint is ready.
      </p>
    </div>
  );
}

function renderTab({
  tab,
  student,
  onStudentUpdated,
  academicYearId,
  termId,
}: RenderTabOptions) {
  switch (tab) {
    case "overview":
      return <OverviewTab student={student} />;
    case "personal":
      return (
        <PersonalInfoTab student={student} onStudentUpdated={onStudentUpdated} />
      );
    case "guardians":
      return <GuardiansTab student={student} />;
    case "enrollment":
      return <EnrollmentHistoryTab student={student} />;
    case "documents":
      return <DocumentsTab student={student} />;
    case "medical":
      return <MedicalTab student={student} />;
    case "notes":
      return <NotesTab student={student} />;
    case "timeline":
      return <TimelineTab student={student} />;
    case "behavior":
      return <BehaviorTab student={student} />;
    case "attendance":
      return <ComingSoonTab label="Attendance" />;
    case "grades":
      return (
        <GradesTab
          student={student}
          academicYearId={academicYearId}
          termId={termId}
        />
      );
    case "reinforcement":
      return (
        <ReinforcementProgressTab
          studentId={student.id}
          academicYearId={academicYearId}
          termId={termId}
        />
      );
    case "hero-journey":
      return <HeroJourneyTab student={student} academicYearId={academicYearId} termId={termId} />;
    default:
      return null;
  }
}

export default function StudentTabLoader({
  tab,
}: StudentTabLoaderProps) {
  const { yearId, termId } = useStudentsGuardiansYearTermContext();
  const { student, updateStudent } = useStudentProfile();

  return renderTab({
    tab,
    student,
    onStudentUpdated: updateStudent,
    academicYearId: yearId,
    termId,
  });
}

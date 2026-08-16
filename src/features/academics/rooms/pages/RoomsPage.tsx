"use client";

import RoomsView from "@/features/academics/rooms/components/RoomsView";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAuth } from "@/hooks/use-auth";
import type { ActiveMembership } from "@/types/user";

type ActiveMembershipWithSchool = ActiveMembership & {
  school?: {
    id?: string | null;
  } | null;
};

export default function RoomsPage() {
  const { academicYearId, termId, termStatus } =
    useAcademicYearTermLayoutContext();
  const { user } = useAuth();
  const activeMembership =
    user?.activeMembership as ActiveMembershipWithSchool | null | undefined;
  const schoolId =
    activeMembership?.schoolId || activeMembership?.school?.id || "active-school";

  return (
    <RoomsView
      schoolId={schoolId}
      academicYearId={academicYearId}
      termId={termId}
      isReadOnly={termStatus === "closed"}
    />
  );
}

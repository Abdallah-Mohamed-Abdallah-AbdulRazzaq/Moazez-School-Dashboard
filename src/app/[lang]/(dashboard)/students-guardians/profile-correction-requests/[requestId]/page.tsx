"use client";

import { useParams } from "next/navigation";
import ProfileCorrectionRequestDetailPage from "@/features/students-guardians/profile-correction-requests/pages/ProfileCorrectionRequestDetailPage";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default function StudentsGuardiansProfileCorrectionRequestDetailRoute() {
  const params = useParams();
  const requestId = Array.isArray(params.requestId)
    ? params.requestId[0]
    : params.requestId;

  return (
    <main className="flex-1 min-w-0 overflow-x-hidden">
      <StudentsGuardiansPermissionGuard permissions={["students.records.view"]}>
        <ProfileCorrectionRequestDetailPage requestId={requestId ?? ""} />
      </StudentsGuardiansPermissionGuard>
    </main>
  );
}

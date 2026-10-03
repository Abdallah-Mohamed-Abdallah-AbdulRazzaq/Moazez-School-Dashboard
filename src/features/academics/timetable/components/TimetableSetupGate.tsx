"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TimetableSetupNotice } from "@/features/academics/timetable/components/TimetableSetupFeedback";
import { useTimetableSetupStatus } from "@/features/academics/timetable/hooks/useTimetableSetupStatus";

interface TimetableSetupGateProps {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  canManage: boolean;
  children: ReactNode;
}

export default function TimetableSetupGate({
  academicYearId,
  termId,
  termStatus,
  canManage,
  children,
}: TimetableSetupGateProps) {
  const router = useRouter();
  const setup = useTimetableSetupStatus({
    academicYearId,
    termId,
    termStatus,
    canManage,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!setup.isLoading && setup.status?.kind !== "ready" && setup.status && (
        <TimetableSetupNotice
          status={setup.status}
          onOpenSetup={() => router.push("/academics/timetable/setup")}
          onRetry={setup.reload}
        />
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

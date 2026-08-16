"use client";

import OverviewTab from "@/features/students-guardians/guardians/components/tabs/OverviewTab";
import { useGuardianProfile } from "@/features/students-guardians/guardians/context/GuardianProfileContext";

export default function GuardianProfile() {
  const guardian = useGuardianProfile();

  return <OverviewTab guardian={guardian} />;
}

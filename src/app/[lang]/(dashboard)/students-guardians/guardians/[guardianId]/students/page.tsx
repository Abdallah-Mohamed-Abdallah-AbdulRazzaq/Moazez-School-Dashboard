"use client";

import StudentsTab from "@/features/students-guardians/guardians/components/tabs/StudentsTab";
import { useGuardianProfile } from "@/features/students-guardians/guardians/context/GuardianProfileContext";

export default function GuardianStudentsPage() {
  const guardian = useGuardianProfile();

  return <StudentsTab guardian={guardian} />;
}

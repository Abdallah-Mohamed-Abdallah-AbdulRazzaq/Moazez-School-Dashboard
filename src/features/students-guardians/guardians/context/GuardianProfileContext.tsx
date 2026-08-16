"use client";

import { createContext, useContext } from "react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";

const GuardianProfileContext = createContext<StudentGuardian | null>(null);

export function GuardianProfileProvider({
  guardian,
  children,
}: {
  guardian: StudentGuardian;
  children: React.ReactNode;
}) {
  return (
    <GuardianProfileContext.Provider value={guardian}>
      {children}
    </GuardianProfileContext.Provider>
  );
}

export function useGuardianProfile() {
  const guardian = useContext(GuardianProfileContext);

  if (!guardian) {
    throw new Error("useGuardianProfile must be used within GuardianProfileProvider");
  }

  return guardian;
}

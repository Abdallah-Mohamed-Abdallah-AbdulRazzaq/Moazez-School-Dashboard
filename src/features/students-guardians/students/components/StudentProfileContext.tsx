"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Student } from "@/features/students-guardians/students/types";

interface StudentProfileContextValue {
  student: Student;
  updateStudent: (student: Student) => void;
}

const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);

export function StudentProfileProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: StudentProfileContextValue;
}) {
  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const context = useContext(StudentProfileContext);

  if (!context) {
    throw new Error("useStudentProfile must be used within StudentProfileProvider");
  }

  return context;
}

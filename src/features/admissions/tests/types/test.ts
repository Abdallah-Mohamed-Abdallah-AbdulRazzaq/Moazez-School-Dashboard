// FILE: src/types/admissions/test.ts
// Test model

import type { TestStatus } from "@/features/admissions/types/enums";

export interface Test {
  id: string;
  applicationId: string;
  studentName?: string;
  subjectId?: string | null;
  subjectName?: string | null;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  duration?: string;
  location: string;
  proctor?: string;
  proctorPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  status: TestStatus;
  score?: number | null;
  maxScore?: number;
  result?: string | null;
  notes?: string;
}

// FILE: src/types/admissions/interview.ts
// Interview model

import type { InterviewStatus } from "@/features/admissions/types/enums";

export interface Interview {
  id: string;
  applicationId: string;
  studentName?: string;
  scheduledAt?: string;
  interviewerUserId?: string;
  interviewerName?: string;
  createdAt?: string;
  updatedAt?: string;
  date: string;
  time: string;
  duration?: string;
  interviewer: string;
  interviewerPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  location: string;
  status: InterviewStatus;
  notes?: string;
  rating?: number;
}

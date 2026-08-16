// FILE: src/types/admissions/application.ts
// Application model (main entity)

import type {
  ApplicationStatus,
  ApplicationSource,
} from "@/features/admissions/types/enums";
import type { Guardian } from "./guardian";
import type { Document } from "./document";
import type { Test } from "@/features/admissions/tests/types/test";
import type { Interview } from "@/features/admissions/interviews/types/interview";
import type { Decision } from "@/features/admissions/decisions/types/decision";
import type { DashboardStateDto, DocumentsSummaryDto } from "../api/applicationDtos";

export interface Application {
  // Allow additional properties for flexibility
  [key: string]: unknown;

  // Core Identification
  id: string;
  leadId?: string;
  source?: ApplicationSource;
  status: ApplicationStatus;
  submittedDate: string;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requestedAcademicYearId?: string | null;
  requestedGradeId?: string | null;
  registrationState?: {
    registered: boolean;
    studentId: string | null;
    enrollmentId: string | null;
    enrollmentStatus: string | null;
    registeredVia: string | null;
    registeredAt: string | null;
    source: string;
  };
  documentsSummary?: DocumentsSummaryDto;
  dashboardState?: DashboardStateDto;

  // Student Information
  first_name_ar?: string;
  father_name_ar?: string;
  grandfather_name_ar?: string;
  family_name_ar?: string;
  first_name_en?: string;
  father_name_en?: string;
  grandfather_name_en?: string;
  family_name_en?: string;
  full_name_ar: string;
  full_name_en: string;
  studentName: string; // Display name (backward compatibility)
  studentNameArabic?: string; // Alias for full_name_ar
  gender: string;
  date_of_birth: string;
  dateOfBirth?: string; // Alias for date_of_birth
  nationality: string;

  // Contact Information
  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;

  // Academic Information
  grade_requested: string;
  gradeRequested: string; // Alias for grade_requested
  stage?: string; // Educational stage (Primary, Preparatory, Secondary)
  section?: string; // Section/Class name
  previous_school?: string;
  previousSchool?: string; // Alias for previous_school
  join_date?: string;

  // Medical & Additional Notes
  medical_conditions?: string;
  notes?: string;

  // Guardians
  guardians: Guardian[];
  guardianName: string; // Primary guardian name (backward compatibility)
  guardianPhone: string; // Primary guardian phone (backward compatibility)
  guardianEmail: string; // Primary guardian email (backward compatibility)

  // Related Data (Nested)
  documents: Document[];
  tests: Test[];
  interviews: Interview[];
  decision?: Decision;
}

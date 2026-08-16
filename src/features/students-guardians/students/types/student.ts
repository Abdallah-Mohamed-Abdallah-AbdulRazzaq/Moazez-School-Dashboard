// FILE: src/types/students/student.ts
// Student model

import type { ApplicationSource } from "@/features/admissions/types/admissions";
import type { StudentStatus, RiskFlag } from "@/features/students-guardians/students/types/enums";

/**
 * Student Contact Information
 */
export interface StudentContact {
  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;
}

/**
 * Main Student Interface
 * Represents an enrolled student derived from an accepted application
 */
export interface Student {
  // ============================================================================
  // CORE IDENTIFICATION
  // ============================================================================
  id: string; // Primary key: "STU-" + application.id
  applicationId?: string; // Link to original application (optional for previously enrolled)
  leadId?: string; // Link to original lead (if exists)
  student_id?: string; // Display ID (e.g., "STU-APP-2024-001")

  // ============================================================================
  // PERSONAL INFORMATION
  // ============================================================================
  first_name_ar?: string;
  father_name_ar?: string;
  grandfather_name_ar?: string;
  family_name_ar?: string;
  first_name_en?: string;
  father_name_en?: string;
  grandfather_name_en?: string;
  family_name_en?: string;
  full_name_ar: string; // Arabic name
  full_name_en: string; // English name
  name?: string; // Alias for full_name_en (backward compatibility)
  gender: string; // "Male" | "Female"
  dateOfBirth: string; // ISO date string
  date_of_birth?: string; // Alias for dateOfBirth (backward compatibility)
  nationality: string; // Country of nationality

  // ============================================================================
  // ACADEMIC INFORMATION (Admissions)
  // ============================================================================
  gradeRequested: string; // Grade level requested during admission (e.g., "Grade 4")
  stage?: string; // Educational stage: "Primary" | "Preparatory" | "Secondary"

  // DEPRECATED: Use StudentEnrollment for current grade/section/term
  // These fields are kept for backward compatibility only
  grade?: string; // @deprecated Use enrollment data instead
  section?: string; // @deprecated Use enrollment data instead
  enrollment_year?: number; // @deprecated Use enrollment data instead
  academic_year?: string; // @deprecated Use enrollment data instead
  term?: string; // @deprecated Use enrollment data instead

  // ============================================================================
  // STATUS & TRACKING
  // ============================================================================
  status: StudentStatus; // Current enrollment status
  source?: ApplicationSource; // How they applied (in_app, referral, walk_in, other)
  submittedDate: string; // Application submission date
  created_at?: string; // Alias for submittedDate (backward compatibility)
  updated_at?: string; // Last update timestamp

  // ============================================================================
  // CONTACT INFORMATION
  // ============================================================================
  contact: StudentContact; // Contact details

  // DEPRECATED: Use EnrollmentTerm for performance data
  // These fields are kept for backward compatibility only
  attendance_percentage?: number; // @deprecated Use EnrollmentTerm data instead
  current_average?: number; // @deprecated Use EnrollmentTerm data instead
  risk_flags?: RiskFlag[]; // @deprecated Use EnrollmentTerm data instead
}

export interface UpdateStudentPayload {
  name?: string;
  first_name_ar?: string;
  father_name_ar?: string;
  grandfather_name_ar?: string;
  family_name_ar?: string;
  first_name_en?: string;
  father_name_en?: string;
  grandfather_name_en?: string;
  family_name_en?: string;
  full_name_en?: string;
  full_name_ar?: string;
  gender?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  nationality?: string;
  status?: StudentStatus;
  contact?: StudentContact;
}

// Backward compatibility aliases

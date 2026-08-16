// FILE: src/types/students/guardian.ts
// Student guardian models

/**
 * Student Guardian
 * Represents a parent or guardian of a student
 */
export interface StudentGuardian {
  guardianId: string; // Unique guardian identifier
  full_name: string; // Guardian's full name
  relation: string; // Relationship to student (father, mother, etc.)
  phone_primary: string; // Primary contact number
  phone_secondary: string; // Secondary contact number
  email: string; // Email address
  national_id: string; // National ID number
  job_title: string; // Occupation
  workplace: string; // Place of employment
  is_primary: boolean; // Is this the primary guardian?
  can_pickup: boolean; // Authorized to pick up student?
  can_receive_notifications: boolean; // Should receive notifications?
}

/**
 * Student Guardian Link
 * Represents the many-to-many relationship between students and guardians
 * (A student can have multiple guardians, a guardian can have multiple students)
 */
export interface StudentGuardianLink {
  studentId: string; // Student ID
  guardianId: string; // Guardian ID
  relation: string; // Relationship type
  is_primary: boolean; // Is this the primary guardian for this student?
}

// Backward compatibility aliases

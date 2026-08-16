// FILE: src/types/students/medical.ts
// Student medical profile model

/**
 * Student Medical Profile
 * Contains medical information and health records for a student
 */
export interface StudentMedicalProfile {
  studentId: string; // Student this profile belongs to
  blood_type?: string; // Blood type (A+, B+, O-, etc.)
  allergies?: string; // Known allergies
  conditions?: string[]; // Known conditions
  medications?: string[]; // Current medications
  notes?: string; // Additional medical notes
}

// Backward compatibility alias

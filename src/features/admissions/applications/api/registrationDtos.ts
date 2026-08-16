export type RegistrationAccountMode = "none" | "create" | "link";
export type RegistrationStudentStatus = "Active" | "Suspended" | "Withdrawn";

export interface RegistrationAccountRequest {
  mode: RegistrationAccountMode;
  userId?: string;
  username?: string;
  fullName?: string;
  contactEmail?: string;
  generatePassword?: boolean;
  temporaryPasswordMode?: "generate" | "none";
  roleId?: string;
}

export interface RegistrationStudentRequest {
  name?: string | null;
  first_name_en?: string | null;
  father_name_en?: string | null;
  grandfather_name_en?: string | null;
  family_name_en?: string | null;
  full_name_en?: string;
  first_name_ar?: string | null;
  father_name_ar?: string | null;
  grandfather_name_ar?: string | null;
  family_name_ar?: string | null;
  full_name_ar?: string | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  status?: RegistrationStudentStatus;
  contact?: {
    address_line?: string | null;
    city?: string | null;
    district?: string | null;
    student_phone?: string | null;
    student_email?: string | null;
  };
}

export interface RegistrationGuardianRequest {
  profile: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    relation?: string | null;
    phone_primary?: string | null;
    phone_secondary?: string | null;
    email?: string | null;
    national_id?: string | null;
    job_title?: string | null;
    workplace?: string | null;
    can_pickup?: boolean;
    can_receive_notifications?: boolean;
  };
  relationship?: { is_primary?: boolean };
  account?: RegistrationAccountRequest;
}

export interface RegisterApplicationRequest {
  student: RegistrationStudentRequest;
  guardians: RegistrationGuardianRequest[];
  enrollment: {
    academicYearId: string;
    gradeId: string;
    sectionId: string;
    classroomId: string;
    termId: string;
    enrollmentDate: string;
    status: string;
  };
  studentAccount: RegistrationAccountRequest;
}

export interface RegistrationHandoffResponseDto {
  applicationId: string;
  status: string;
  eligible: boolean;
  alreadyRegistered: boolean;
  eligibility?: {
    canPrepareHandoff?: boolean;
    canSubmitRegistration?: boolean;
    reasonCodes?: string[];
    placementTests?: { total: number; completed: number };
    interviews?: { total: number; completed: number };
    documents?: {
      included: boolean;
      blockingPolicy: "not_enforced_by_current_handoff";
    };
  };
  source?: {
    application?: {
      id: string;
      studentName: string;
      requestedAcademicYearId: string | null;
      requestedAcademicYearName: string | null;
      requestedGradeId: string | null;
      requestedGradeName: string | null;
      source: string;
      status: string;
      submittedAt: string | null;
    };
    applicantRequest?: {
      id: string;
      childFullName: string;
      childFirstName: string;
      childLastName: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      nationality: string | null;
      requestedAcademicYearId: string | null;
      requestedAcademicYearName: string | null;
      requestedGradeId: string | null;
      requestedGradeName: string | null;
      previousSchool: string | null;
      notesProvided: boolean;
      submittedAt: string | null;
      applicant: {
        fullName: string;
        relationship: string;
        phoneNumber: string | null;
        city: string | null;
        email: string | null;
      };
    } | null;
    lead?: {
      id: string;
      studentName: string;
      primaryContactName: string | null;
      phone: string;
      email: string | null;
    } | null;
  };
  wizardDraft?: {
    student?: Partial<RegistrationStudentRequest>;
    guardians?: RegistrationGuardianRequest[];
    enrollment?: Partial<RegisterApplicationRequest["enrollment"]>;
    studentAccount?: RegistrationAccountRequest;
  };
  documents?: Array<{
    applicationDocumentId: string;
    documentType: string;
    status: "pending_review" | "complete" | "missing";
    notes: string | null;
    source: "applicant_upload" | "admissions_upload" | "unknown";
    file: {
      id: string;
      originalName: string;
      mimeType: string;
      sizeBytes: string;
    };
  }>;
  registered?: { student?: { id?: string }; enrollment?: { id?: string } } | null;
  warnings?: string[];
  missingRequiredForRegistration?: string[];
}

export interface EnrollmentHandoffPreviewDto {
  applicationId: string;
  eligible: boolean;
  handoff: {
    studentDraft: { fullName: string };
    guardianDrafts: Array<{
      fullName: string | null;
      phone: string | null;
      email: string | null;
    }>;
    enrollmentDraft: {
      requestedAcademicYearId: string | null;
      requestedAcademicYearName: string | null;
      requestedGradeId: string | null;
      requestedGradeName: string | null;
    };
  };
}

export interface RegisterApplicationResponseDto {
  applicationId: string;
  registered: boolean;
  alreadyRegistered: boolean;
  registration: {
    registrationId?: string;
    student?: { id?: string; [key: string]: unknown };
    guardians?: unknown[];
    enrollment?: { id?: string; [key: string]: unknown };
    parentAccounts?: unknown[];
    studentAccount?: unknown;
    warnings?: string[];
  };
  warnings?: string[];
}

export interface UploadedApplicationDocumentInput {
  configId: string;
  labelEn: string;
  labelAr: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  fileType?: "pdf" | "image" | "doc";
  file?: File;
}

export interface ApplicationCreationPayload {
  leadId?: string;
  source?: string;
  requestedAcademicYearId?: string;
  student: {
    first_name_ar: string;
    father_name_ar: string;
    grandfather_name_ar: string;
    family_name_ar: string;
    first_name_en: string;
    father_name_en: string;
    grandfather_name_en: string;
    family_name_en: string;
    full_name_ar: string;
    full_name_en: string;
    gender: string;
    date_of_birth: string;
    nationality: string;
    stage: string;
    grade_requested: string;
    section?: string;
    address_line: string;
    city: string;
    district: string;
    status: string;
    join_date: string;
    notes: string;
    previous_school: string;
    medical_conditions: string;
  };
  guardians: Array<{
    full_name: string;
    relation: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    national_id: string;
    job_title: string;
    workplace: string;
    is_primary: boolean;
    can_pickup: boolean;
    can_receive_notifications: boolean;
  }>;
  documents: UploadedApplicationDocumentInput[];
}

export function mapLeadChannelToApplicationSource(channel?: string): string {
  const normalized = (channel || "").trim().toLowerCase();
  if (normalized === "referral") return "referral";
  if (normalized === "walk-in" || normalized === "walk_in") return "walk_in";
  if (normalized === "in-app" || normalized === "in_app") return "in_app";
  return "other";
}

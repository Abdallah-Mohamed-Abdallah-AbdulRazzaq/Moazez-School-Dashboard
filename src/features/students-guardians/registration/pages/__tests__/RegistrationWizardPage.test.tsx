import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ lang: "en" }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchAcademicYears: vi.fn(() => new Promise(() => undefined)), fetchTermsByYear: vi.fn().mockResolvedValue([]), fetchStructureTree: vi.fn().mockResolvedValue(null),
}));

const translations: Record<string, string> = {
  "steps.student": "Student",
  "steps.guardians": "Guardians",
  "steps.accounts": "Accounts",
  "steps.enrollment": "Enrollment",
  "steps.review": "Review",
  "buttons.next": "Next",
  "buttons.previous": "Previous",
  "buttons.submit": "Submit registration",
  "buttons.select": "Select…",
  "student_step.title": "Student information",
  "student_step.description": "Identity and contact details.",
  "student_step.fields.full_name_en": "English full name",
  "student_step.fields.full_name_ar": "Arabic full name",
  "student_step.fields.date_of_birth": "Date of birth",
  "student_step.fields.gender": "Gender",
  "student_step.fields.gender_options.male": "Male",
  "student_step.fields.gender_options.female": "Female",
  "student_step.fields.nationality": "Nationality",
  "student_step.fields.email": "Student email",
  "student_step.fields.phone": "Student phone",
  "student_step.fields.address": "Address",
  "student_step.fields.city": "City",
  "student_step.fields.district": "District",
  "guardians_step.title": "Guardians",
  "guardians_step.description": "Add one or more guardians and select exactly one primary guardian.",
  "guardians_step.add_guardian": "Add guardian",
  "guardians_step.guardian_title": "Guardian {number}",
  "guardians_step.remove_guardian": "Remove guardian",
  "guardians_step.primary_guardian": "Primary guardian",
  "guardians_step.fields.profile": "Profile",
  "guardians_step.fields.profile_options.create": "New guardian",
  "guardians_step.fields.profile_options.existing": "Existing guardian",
  "guardians_step.fields.search_placeholder": "Search by name, phone, or national ID",
  "guardians_step.fields.full_name": "Full name",
  "guardians_step.fields.relation": "Relation",
  "guardians_step.fields.phone_primary": "Primary phone",
  "guardians_step.fields.phone_secondary": "Secondary phone",
  "guardians_step.fields.email": "Email",
  "guardians_step.fields.national_id": "National ID",
  "guardians_step.fields.job_title": "Job title",
  "guardians_step.fields.workplace": "Workplace",
  "guardians_step.fields.change_existing": "Change",
  "accounts_step.title": "Accounts",
  "accounts_step.description": "Create or link an account for every person.",
  "accounts_step.student_account": "Student account",
  "accounts_step.guardian_account": "Guardian {number}: {name}",
  "accounts_step.guardian_account_help": "Guardian account metadata is not exposed by the current API. Select an eligible parent account only if this guardian is not already linked.",
  "accounts_step.fields.action": "Account action",
  "accounts_step.fields.action_options.create": "Create account",
  "accounts_step.fields.action_options.link": "Link existing account",
  "accounts_step.fields.username": "Username",
  "accounts_step.fields.contact_email": "Contact email",
  "accounts_step.fields.generate_password": "Generate temporary password",
  "accounts_step.fields.search_users": "Search users",
  "enrollment_step.title": "Enrollment",
  "enrollment_step.description": "Choose a valid academic placement.",
  "enrollment_step.fields.academic_year": "Academic year",
  "enrollment_step.fields.term": "Term",
  "enrollment_step.fields.grade": "Grade",
  "enrollment_step.fields.section": "Section",
  "enrollment_step.fields.classroom": "Classroom",
  "enrollment_step.fields.enrollment_date": "Enrollment date",
  "review_step.title": "Review",
  "review_step.description": "Confirm the registration before submission.",
  "review_step.warning_existing_guardian": "This registration uses a staged, non-atomic flow because it includes an existing guardian. Enrollment is created before account operations.",
  "review_step.fields.student": "Student",
  "review_step.fields.guardians": "Guardians",
  "review_step.fields.accounts": "Accounts",
  "review_step.fields.enrollment": "Enrollment",
  "review_step.fields.not_selected": "Not selected",
  "review_step.fields.edit": "Edit",
  "review_step.fields.accounts_configured": "{count} configured"
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    let text = translations[key] || key;
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
}));

import RegistrationWizardPage from "@/features/students-guardians/registration/pages/RegistrationWizardPage";

describe("RegistrationWizardPage step navigation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the user on the current step when validation fails", () => {
    render(<RegistrationWizardPage />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByRole("heading", { name: "Student information" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Guardians" })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("at least two words");
  });

  it("keeps native input values in wizard state across step navigation", () => {
    render(<RegistrationWizardPage />);

    fireEvent.input(screen.getByLabelText(/English full name/), { target: { value: "Ahmed Mostafa" } });
    fireEvent.input(screen.getByLabelText("Date of birth"), { target: { value: "2015-05-10" } });
    fireEvent.input(screen.getByLabelText("Nationality"), { target: { value: "Egyptian" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.input(screen.getByLabelText(/Full name/), { target: { value: "Guardian One" } });
    fireEvent.input(screen.getByLabelText(/Primary phone/), { target: { value: "+201001112233" } });
    fireEvent.input(screen.getByLabelText("Job title"), { target: { value: "Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));

    expect(screen.getByLabelText("Job title")).toHaveValue("Engineer");
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getByLabelText("Date of birth")).toHaveValue("2015-05-10");
    expect(screen.getByLabelText("Nationality")).toHaveValue("Egyptian");
  });
});

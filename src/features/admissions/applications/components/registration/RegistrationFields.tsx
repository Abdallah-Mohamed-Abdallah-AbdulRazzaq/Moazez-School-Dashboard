import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import Select from "@/components/ui/input/Select";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import type {
  AcademicStructureClassroom,
  AcademicStructureGrade,
  AcademicStructureSection,
} from "@/features/academics/services/academicStructureApiService";
import type {
  RegistrationFormState,
  RegistrationGuardianFormState,
} from "../../model/registrationForm";

interface RegistrationFieldsProps {
  form: RegistrationFormState;
  grades: AcademicStructureGrade[];
  sections: AcademicStructureSection[];
  classrooms: AcademicStructureClassroom[];
  labels: Record<string, string>;
  updateField: <Key extends keyof RegistrationFormState>(
    key: Key,
    fieldValue: RegistrationFormState[Key],
  ) => void;
  updateGuardian: <Key extends keyof RegistrationGuardianFormState>(
    index: number,
    key: Key,
    fieldValue: RegistrationGuardianFormState[Key],
  ) => void;
  addGuardian: () => void;
  removeGuardian: (index: number) => void;
  setPrimaryGuardian: (index: number) => void;
}

export default function RegistrationFields({
  form,
  grades,
  sections,
  classrooms,
  labels,
  updateField,
  updateGuardian,
  addGuardian,
  removeGuardian,
  setPrimaryGuardian,
}: RegistrationFieldsProps) {
  const locale = useLocale();
  const visibleSections = sections.filter((section) => section.gradeId === form.gradeId);
  const visibleClassrooms = classrooms.filter(
    (classroom) => classroom.sectionId === form.sectionId,
  );

  return (
    <div className="space-y-6">
      <FieldSection title={labels.studentSection}>
        <FieldGroup title={labels.fullNameGroup}>
          <TextField label={labels.fullNameEn} value={form.fullNameEn} onChange={(value) => updateField("fullNameEn", value)} />
          <TextField label={labels.fullNameAr} required={false} value={form.fullNameAr} onChange={(value) => updateField("fullNameAr", value)} />
        </FieldGroup>
        <FieldGroup title={labels.englishNameGroup}>
          <TextField label={labels.firstNameEn} required={false} value={form.firstNameEn} onChange={(value) => updateField("firstNameEn", value)} />
          <TextField label={labels.fatherNameEn} required={false} value={form.fatherNameEn} onChange={(value) => updateField("fatherNameEn", value)} />
          <TextField label={labels.grandfatherNameEn} required={false} value={form.grandfatherNameEn} onChange={(value) => updateField("grandfatherNameEn", value)} />
          <TextField label={labels.familyNameEn} required={false} value={form.familyNameEn} onChange={(value) => updateField("familyNameEn", value)} />
        </FieldGroup>
        <FieldGroup title={labels.arabicNameGroup}>
          <TextField label={labels.firstNameAr} required={false} value={form.firstNameAr} onChange={(value) => updateField("firstNameAr", value)} />
          <TextField label={labels.fatherNameAr} required={false} value={form.fatherNameAr} onChange={(value) => updateField("fatherNameAr", value)} />
          <TextField label={labels.grandfatherNameAr} required={false} value={form.grandfatherNameAr} onChange={(value) => updateField("grandfatherNameAr", value)} />
          <TextField label={labels.familyNameAr} required={false} value={form.familyNameAr} onChange={(value) => updateField("familyNameAr", value)} />
        </FieldGroup>
        <TextField label={labels.dateOfBirth} type="date" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
        <Select label={labels.gender} required value={form.gender} options={[{ value: "male", label: labels.male }, { value: "female", label: labels.female }]} onChange={(value) => updateField("gender", value)} />
        <TextField label={labels.nationality} value={form.nationality} onChange={(value) => updateField("nationality", value)} />
      </FieldSection>

      <FieldSection title={labels.contactSection}>
        <TextField label={labels.addressLine} required={false} value={form.addressLine} onChange={(value) => updateField("addressLine", value)} />
        <TextField label={labels.city} required={false} value={form.city} onChange={(value) => updateField("city", value)} />
        <TextField label={labels.district} required={false} value={form.district} onChange={(value) => updateField("district", value)} />
        <TextField label={labels.studentPhone} type="tel" required={false} value={form.studentPhone} onChange={(value) => updateField("studentPhone", value)} />
        <TextField label={labels.studentEmail} type="email" required={false} value={form.studentEmail} onChange={(value) => updateField("studentEmail", value)} />
      </FieldSection>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{labels.guardiansSection}</h3>
          <button type="button" onClick={addGuardian} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {labels.addGuardian}
          </button>
        </div>
        {form.guardians.map((guardian, index) => (
          <GuardianFields
            key={index}
            guardian={guardian}
            index={index}
            labels={labels}
            canRemove={form.guardians.length > 1}
            updateGuardian={updateGuardian}
            removeGuardian={removeGuardian}
            setPrimaryGuardian={setPrimaryGuardian}
          />
        ))}
      </div>

      <FieldSection title={labels.enrollmentSection}>
        <Select label={labels.grade} required value={form.gradeId} options={grades.map((grade) => getLocalizedRegistrationOption(grade, locale))} onChange={(value) => { updateField("gradeId", value); updateField("sectionId", ""); updateField("classroomId", ""); }} />
        <Select label={labels.section} required value={form.sectionId} options={visibleSections.map((section) => getLocalizedRegistrationOption(section, locale))} onChange={(value) => { updateField("sectionId", value); updateField("classroomId", ""); }} />
        <Select label={labels.classroom} required value={form.classroomId} options={visibleClassrooms.map((classroom) => getLocalizedRegistrationOption(classroom, locale))} onChange={(value) => updateField("classroomId", value)} />
        <TextField label={labels.enrollmentDate} type="date" value={form.enrollmentDate} onChange={(value) => updateField("enrollmentDate", value)} />
      </FieldSection>
    </div>
  );
}

function GuardianFields({
  guardian,
  index,
  labels,
  canRemove,
  updateGuardian,
  removeGuardian,
  setPrimaryGuardian,
}: {
  guardian: RegistrationGuardianFormState;
  index: number;
  labels: Record<string, string>;
  canRemove: boolean;
  updateGuardian: RegistrationFieldsProps["updateGuardian"];
  removeGuardian: (index: number) => void;
  setPrimaryGuardian: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{labels.guardian} {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={() => removeGuardian(index)} className="text-sm font-medium text-red-600 hover:text-red-700">
            {labels.removeGuardian}
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label={labels.guardianName} value={guardian.fullName} onChange={(value) => updateGuardian(index, "fullName", value)} />
        <TextField label={labels.guardianRelation} value={guardian.relation} onChange={(value) => updateGuardian(index, "relation", value)} />
        <TextField label={labels.guardianFirstName} required={false} value={guardian.firstName} onChange={(value) => updateGuardian(index, "firstName", value)} />
        <TextField label={labels.guardianLastName} required={false} value={guardian.lastName} onChange={(value) => updateGuardian(index, "lastName", value)} />
        <TextField label={labels.guardianPhone} type="tel" value={guardian.phonePrimary} onChange={(value) => updateGuardian(index, "phonePrimary", value)} />
        <TextField label={labels.guardianSecondaryPhone} type="tel" required={false} value={guardian.phoneSecondary} onChange={(value) => updateGuardian(index, "phoneSecondary", value)} />
        <TextField label={labels.guardianEmail} type="email" required={false} value={guardian.email} onChange={(value) => updateGuardian(index, "email", value)} />
        <TextField label={labels.guardianNationalId} required={false} value={guardian.nationalId} onChange={(value) => updateGuardian(index, "nationalId", value)} />
        <TextField label={labels.guardianJobTitle} required={false} value={guardian.jobTitle} onChange={(value) => updateGuardian(index, "jobTitle", value)} />
        <TextField label={labels.guardianWorkplace} required={false} value={guardian.workplace} onChange={(value) => updateGuardian(index, "workplace", value)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <CheckboxField label={labels.primaryGuardian} checked={guardian.isPrimary} onChange={() => setPrimaryGuardian(index)} />
        <CheckboxField label={labels.canPickup} checked={guardian.canPickup} onChange={(checked) => updateGuardian(index, "canPickup", checked)} />
        <CheckboxField label={labels.canReceiveNotifications} checked={guardian.canReceiveNotifications} onChange={(checked) => updateGuardian(index, "canReceiveNotifications", checked)} />
      </div>
    </div>
  );
}

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="col-span-full space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</h4>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function getLocalizedRegistrationOption(
  namedEntity: { id: string; nameEn?: string; nameAr?: string; name: string },
  locale: string,
) {
  const label = locale === "ar"
    ? namedEntity.nameAr || namedEntity.nameEn || namedEntity.name
    : namedEntity.nameEn || namedEntity.nameAr || namedEntity.name;
  return { value: namedEntity.id, label };
}

function TextField({
  label,
  value,
  type = "text",
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  if (type === "date") {
    return (
      <DatePicker
        label={label}
        required={required}
        value={value ? new Date(`${value}T00:00:00`) : null}
        onChange={(date) => onChange(date ? formatDateValue(date) : "")}
      />
    );
  }

  return (
    <Input
      label={label}
      type={type}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
      {label}
    </label>
  );
}

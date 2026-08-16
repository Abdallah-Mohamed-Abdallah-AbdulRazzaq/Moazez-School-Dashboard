"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdmissionsAcademicSelection } from "@/features/admissions/shared/hooks/useAdmissionsAcademicSelection";
import { useApplicationRegistration } from "../../hooks/useApplicationRegistration";
import RegistrationFields from "./RegistrationFields";

interface ApplicationRegistrationWizardProps {
  applicationId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
  onRegistered: () => void | Promise<void>;
}

const requiredPermissions = [
  "admissions.applications.manage",
  "students.records.manage",
  "students.guardians.manage",
  "students.enrollments.manage",
] as const;

export default function ApplicationRegistrationWizard(props: ApplicationRegistrationWizardProps) {
  const { applicationId, studentName, isOpen, onClose, onRegistered } = props;
  const t = useTranslations("admissions.application360.registration");
  const tContext = useTranslations("admissions.context_bar");
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasAllPermissions } = usePermissions();
  const academicSelection = useAdmissionsAcademicSelection({ enabled: isOpen });
  const { yearId, termId } = academicSelection;
  const canRegister = hasAllPermissions([...requiredPermissions]);
  const registration = useApplicationRegistration({
    applicationId,
    studentName,
    academicYearId: yearId,
    termId,
    enabled: isOpen,
  });

  useEffect(() => {
    const handoff = registration.context?.handoff;
    const preferredYearId =
      handoff?.wizardDraft?.enrollment?.academicYearId ??
      handoff?.source?.application?.requestedAcademicYearId ??
      handoff?.source?.applicantRequest?.requestedAcademicYearId ??
      null;
    const preferredTermId = handoff?.wizardDraft?.enrollment?.termId ?? null;
    if (!preferredYearId || preferredYearId === yearId) return;
    void academicSelection.setYearAndTerm(preferredYearId, preferredTermId);
  }, [academicSelection, registration.context?.handoff, yearId]);

  const submitRegistration = async () => {
    const registrationResponse = await registration.submit();
    if (!registrationResponse) return;
    showToast(
      registrationResponse.alreadyRegistered ? t("registered_existing") : t("registered"),
      "success",
    );
    await onRegistered();
    onClose();
  };

  const handoff = registration.context?.handoff;
  const validationMessages = registration.isLoading
    ? []
    : registration.validationIssues.map((issue) => t(`validation.${issue}`));
  const messages = [
    ...(handoff?.warnings ?? []),
    ...(handoff?.missingRequiredForRegistration ?? []),
  ]
    .map((message) => translateRegistrationMessage(message, t))
    .filter((message, index, allMessages) =>
      allMessages.indexOf(message) === index && !validationMessages.includes(message),
    );
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={`${studentName} - ${applicationId}`}
      size="xl"
      closeOnOverlayClick={!registration.isSubmitting}
      closeOnEscape={!registration.isSubmitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={registration.isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void submitRegistration()}
            disabled={!canRegister || !registration.isValid || registration.isLoading}
            loading={registration.isSubmitting}
          >
            {t("register")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {registration.isLoading && <p className="text-sm text-gray-600">{t("loading")}</p>}
        {registration.error && <ErrorMessage message={translateError(registration.error, t)} />}
        {!canRegister && <Notice message={t("permission_required")} tone="warning" />}
        {handoff?.alreadyRegistered && <Notice message={t("already_registered")} tone="success" />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={tContext("academic_year")}
            required
            value={yearId || ""}
            options={academicSelection.academicYears.map((year) => ({
              value: year.id,
              label:
                locale === "ar"
                  ? year.nameAr || year.name
                  : year.nameEn || year.name,
            }))}
            disabled={academicSelection.isLoading || registration.isSubmitting}
            onChange={(nextYearId) => void academicSelection.setYearId(nextYearId)}
          />
          <Select
            label={tContext("term")}
            required
            value={termId || ""}
            options={academicSelection.terms.map((term) => ({
              value: term.id,
              label:
                locale === "ar"
                  ? term.nameAr || term.name
                  : term.nameEn || term.name,
            }))}
            disabled={
              academicSelection.isLoading ||
              registration.isSubmitting ||
              !yearId
            }
            onChange={academicSelection.setTermId}
          />
        </div>
        {messages.length > 0 && <MessageList messages={messages} />}
        {validationMessages.length > 0 && <MessageList messages={validationMessages} />}
        {registration.context?.handoff.eligible && !registration.isLoading && (
          <p className="text-sm text-emerald-700">{t("readiness_passed")}</p>
        )}
        <RegistrationFields
          form={registration.form}
          grades={registration.context?.grades ?? []}
          sections={registration.context?.sections ?? []}
          classrooms={registration.context?.classrooms ?? []}
          updateField={registration.updateField}
          updateGuardian={registration.updateGuardian}
          addGuardian={registration.addGuardian}
          removeGuardian={registration.removeGuardian}
          setPrimaryGuardian={registration.setPrimaryGuardian}
          labels={{
            studentSection: t("student_section"),
            contactSection: t("contact_section"),
            guardiansSection: t("guardians_section"),
            enrollmentSection: t("enrollment_section"),
            fullNameGroup: t("full_name_group"),
            englishNameGroup: t("english_name_group"),
            arabicNameGroup: t("arabic_name_group"),
            fullNameEn: t("full_name_en"),
            fullNameAr: t("full_name_ar"),
            firstNameEn: t("first_name_en"),
            fatherNameEn: t("father_name_en"),
            grandfatherNameEn: t("grandfather_name_en"),
            familyNameEn: t("family_name_en"),
            firstNameAr: t("first_name_ar"),
            fatherNameAr: t("father_name_ar"),
            grandfatherNameAr: t("grandfather_name_ar"),
            familyNameAr: t("family_name_ar"),
            dateOfBirth: t("date_of_birth"),
            gender: t("gender"),
            male: t("male"),
            female: t("female"),
            nationality: t("nationality"),
            addressLine: t("address_line"),
            city: t("city"),
            district: t("district"),
            studentPhone: t("student_phone"),
            studentEmail: t("student_email"),
            guardian: t("guardian"),
            guardianName: t("guardian_name"),
            guardianRelation: t("guardian_relation"),
            guardianFirstName: t("guardian_first_name"),
            guardianLastName: t("guardian_last_name"),
            guardianPhone: t("guardian_phone"),
            guardianSecondaryPhone: t("guardian_secondary_phone"),
            guardianEmail: t("guardian_email"),
            guardianNationalId: t("guardian_national_id"),
            guardianJobTitle: t("guardian_job_title"),
            guardianWorkplace: t("guardian_workplace"),
            primaryGuardian: t("primary_guardian"),
            canPickup: t("can_pickup"),
            canReceiveNotifications: t("can_receive_notifications"),
            addGuardian: t("add_guardian"),
            removeGuardian: t("remove_guardian"),
            grade: t("grade"),
            section: t("section"),
            classroom: t("classroom"),
            enrollmentDate: t("enrollment_date"),
          }}
        />
      </div>
    </Modal>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}
    </div>
  );
}

function Notice({ message, tone }: { message: string; tone: "warning" | "success" }) {
  const classes = tone === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <div className={`flex gap-2 rounded-lg border p-3 text-sm ${classes}`}>
      {tone === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4" />}{message}
    </div>
  );
}

function MessageList({ messages }: { messages: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      {messages.map((message) => <p key={message}>• {message}</p>)}
    </div>
  );
}

type RegistrationMessageTranslator = (key: string) => string;

export function translateRegistrationMessage(
  message: string,
  translate: RegistrationMessageTranslator,
): string {
  if (message === "guardian.source_missing" || message.startsWith("guardian[")) {
    if (message.includes("full_name")) return translate("validation.guardian_name_required");
    if (message.includes("relation")) return translate("validation.guardian_relation_required");
    if (message.includes("phone_primary")) return translate("validation.guardian_phone_required");
    return translate("validation.guardian_required");
  }
  if (message.includes("classroomId")) return translate("validation.classroom_required");
  if (message.includes("enrollmentDate")) return translate("validation.enrollment_date_required");
  return translate("validation.registration_incomplete");
}

function translateError(
  message: string,
  t: ReturnType<typeof useTranslations>,
): string {
  return message.startsWith("validation.") ? t(message) : message;
}

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import TeacherFormSections from "./TeacherFormSections";
import { emptyCreateTeacherForm, createFormToRequest } from "@/features/teachers/utils/teacherFormMappers";
import { validateTeacherForm } from "@/features/teachers/utils/teacherValidation";
import { toTeacherSubmissionFormErrors } from "@/features/teachers/utils/teacherErrors";
import { checkUsernameAvailability } from "@/features/settings/login-identity/services/loginIdentityService";
import type {
  CreateTeacherFormState,
  CreateTeacherRequest,
  TeacherFormErrors,
} from "@/features/teachers/types/index";

interface CreateTeacherDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTeacherRequest) => Promise<void>;
}

export default function CreateTeacherDialog(props: CreateTeacherDialogProps) {
  const locale = useLocale();
  const t = useTranslations("teachers");
  const preferredLanguage = locale === "ar" ? "AR" : "EN";
  const [form, setForm] = useState<CreateTeacherFormState>(() =>
    emptyCreateTeacherForm(preferredLanguage),
  );
  const [errors, setErrors] = useState<TeacherFormErrors>({});

  const submit = async () => {
    const validationErrors = validateTeacherForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    if (form.identity.identityMode === "username") {
      try {
        const availability = await checkUsernameAvailability(form.identity.username.trim());
        if (!availability.available) {
          setErrors({ username: availability.reason || "username_unavailable" });
          return;
        }
      } catch {
        setErrors({ form: t("messages.username_availability_failed") });
        return;
      }
    }

    try {
      await props.onSubmit(createFormToRequest(form));
    } catch (submissionError) {
      setErrors(toTeacherSubmissionFormErrors(submissionError));
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("dialog.create_title")}
      size="xl"
      footer={<><Button variant="secondary" onClick={props.onClose} disabled={props.isSubmitting}>{t("actions.cancel")}</Button><Button onClick={() => void submit()} loading={props.isSubmitting}>{t("dialog.create_action")}</Button></>}
    >
      <div className="space-y-4">
        {errors.form ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form.startsWith("backend.") ? t(`errors.${errors.form.slice("backend.".length)}`) : errors.form}</p> : null}
        <TeacherFormSections form={form} errors={errors} showIdentityTools onChange={(nextForm) => setForm({ ...nextForm, employmentStatus: form.employmentStatus })} />
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("messages.activation_caveat")}</p>
      </div>
    </Modal>
  );
}

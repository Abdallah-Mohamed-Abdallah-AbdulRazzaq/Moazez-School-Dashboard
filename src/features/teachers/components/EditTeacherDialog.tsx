"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import TeacherFormSections from "./TeacherFormSections";
import { buildTeacherPatch } from "@/features/teachers/utils/buildTeacherPatch";
import { detailToEditForm, editFormToRequest } from "@/features/teachers/utils/teacherFormMappers";
import { validateTeacherForm } from "@/features/teachers/utils/teacherValidation";
import { toTeacherSubmissionFormErrors } from "@/features/teachers/utils/teacherErrors";
import type {
  EditTeacherFormState,
  PreferredDisplayLanguage,
  TeacherDirectoryDetail,
  TeacherFormErrors,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";

interface EditTeacherDialogProps {
  isOpen: boolean;
  teacher: TeacherDirectoryDetail;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: UpdateTeacherRequest) => Promise<void>;
}

export default function EditTeacherDialog(props: EditTeacherDialogProps) {
  const locale = useLocale();
  const t = useTranslations("teachers");
  const preferredLanguage: PreferredDisplayLanguage = locale === "ar" ? "AR" : "EN";
  const [form, setForm] = useState<EditTeacherFormState>(() =>
    detailToEditForm(props.teacher, preferredLanguage),
  );
  const [errors, setErrors] = useState<TeacherFormErrors>({});

  const submit = async () => {
    const validationErrors = validateTeacherForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const patch = buildTeacherPatch(
      props.teacher,
      editFormToRequest(form),
      form.profile.preferredDisplayLanguage as PreferredDisplayLanguage,
    );
    if (!Object.keys(patch).length) {
      setErrors({ form: t("validation.no_changes") });
      return;
    }

    try {
      await props.onSubmit(patch);
    } catch (submissionError) {
      setErrors(toTeacherSubmissionFormErrors(submissionError));
    }
  };

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={t("dialog.edit_title")} size="xl" footer={<><Button variant="secondary" onClick={props.onClose} disabled={props.isSubmitting}>{t("actions.cancel")}</Button><Button onClick={() => void submit()} loading={props.isSubmitting}>{t("dialog.save_action")}</Button></>}>
      <div className="space-y-4">
        {errors.form ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p> : null}
        <TeacherFormSections form={form} errors={errors} onChange={setForm} loginIdentityReadOnly />
      </div>
    </Modal>
  );
}

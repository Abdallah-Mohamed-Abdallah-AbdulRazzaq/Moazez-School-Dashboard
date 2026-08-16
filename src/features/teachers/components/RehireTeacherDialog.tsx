"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Input, Modal } from "@/components/ui";
import TeacherFormSections from "./TeacherFormSections";
import { emptyCreateTeacherForm, editFormToRehireRequest } from "@/features/teachers/utils/teacherFormMappers";
import { toTeacherUiError } from "@/features/teachers/utils/teacherErrors";
import { validateRehireTeacherForm } from "@/features/teachers/utils/teacherValidation";
import type {
  CreateTeacherFormState,
  RehireTeacherRequest,
  TeacherFormErrors,
} from "@/features/teachers/types/index";

interface RehireTeacherDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (teacherId: string, input: RehireTeacherRequest) => Promise<void>;
}

export default function RehireTeacherDialog(props: RehireTeacherDialogProps) {
  const locale = useLocale();
  const t = useTranslations("teachers");
  const [teacherId, setTeacherId] = useState("");
  const [form, setForm] = useState<CreateTeacherFormState>(() =>
    emptyCreateTeacherForm(locale === "ar" ? "AR" : "EN"),
  );
  const [errors, setErrors] = useState<TeacherFormErrors>({});

  const submit = async () => {
    const nextErrors = validateRehireTeacherForm(form);
    if (!teacherId.trim()) nextErrors.archivedTeacherId = "required";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      await props.onSubmit(teacherId.trim(), editFormToRehireRequest(form));
    } catch (submissionError) {
      const uiError = toTeacherUiError(submissionError);
      setErrors({ ...uiError.fieldErrors, form: uiError.message });
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("rehire.title")}
      size="xl"
      footer={<><Button variant="secondary" onClick={props.onClose} disabled={props.isSubmitting}>{t("actions.cancel")}</Button><Button loading={props.isSubmitting} onClick={() => void submit()}>{t("actions.rehire")}</Button></>}
    >
      <div className="space-y-4">
        {errors.form ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p> : null}
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("rehire.discovery_gap")}</p>
        <Input label={t("rehire.archived_teacher_id")} value={teacherId} onChange={(event) => setTeacherId(event.target.value)} error={errors.archivedTeacherId ? t("validation.required") : undefined} required />
        <TeacherFormSections form={form} errors={errors} showIdentity={false} onChange={(nextForm) => setForm({ ...nextForm, employmentStatus: form.employmentStatus })} />
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t("rehire.resulting_state")}</p>
      </div>
    </Modal>
  );
}

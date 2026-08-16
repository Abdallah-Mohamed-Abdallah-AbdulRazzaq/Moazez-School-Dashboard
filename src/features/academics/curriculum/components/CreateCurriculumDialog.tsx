"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import { createCurriculum } from "@/features/academics/curriculum/services/curriculumService";
import {
  curriculumFormErrors,
  curriculumUiError,
} from "@/features/academics/curriculum/services/curriculumErrors";

interface CreateCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  gradeName: string;
  subjectName: string;
}

type CreateCurriculumField = "title" | "description";
const createCurriculumFields = ["title", "description"] as const;

export default function CreateCurriculumDialog({
  isOpen,
  onClose,
  onSuccess,
  academicYearId,
  termId,
  gradeId,
  subjectId,
  gradeName,
  subjectName,
}: CreateCurriculumDialogProps) {
  const t = useTranslations("academics.curriculum.create_dialog");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CreateCurriculumField, string>>
  >({});
  const [formMessages, setFormMessages] = useState<string[]>([]);

  const defaultTitle = `${gradeName} - ${subjectName}`;

  const handleSubmit = async () => {
    setFieldErrors({});
    setFormMessages([]);
    setIsSubmitting(true);
    try {
      await createCurriculum({
        academicYearId,
        termId,
        gradeId,
        subjectId,
        title: title.trim() || defaultTitle,
        description: description.trim() || null,
      });
      onSuccess();
      setTitle("");
      setDescription("");
    } catch (error) {
      const mapped = curriculumUiError(error, "Unable to create curriculum.");
      const projected = curriculumFormErrors(mapped, createCurriculumFields);
      setFieldErrors(projected.fieldErrors);
      setFormMessages([...new Set([mapped.message, ...projected.formMessages])]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
            {isSubmitting ? t("creating") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t("description")}</p>

        {formMessages.length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {formMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <Input
          label={t("name")}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setFieldErrors((current) => ({ ...current, title: undefined }));
          }}
          placeholder={defaultTitle}
          helperText={t("name_helper")}
          error={fieldErrors.title}
        />

        <TextArea
          label="Description (Optional)"
          rows={3}
          value={description}
          error={fieldErrors.description}
          onChange={(e) => {
            setDescription(e.target.value);
            setFieldErrors((current) => ({ ...current, description: undefined }));
          }}
        />
      </div>
    </Modal>
  );
}

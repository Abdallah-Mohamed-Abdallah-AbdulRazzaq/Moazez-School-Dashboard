"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Modal, Select, TextArea } from "@/components/ui";
import {
  NOTE_CATEGORIES,
  NoteCategory,
  NoteVisibility,
} from "@/features/students-guardians/students/types/note";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: NoteFormData) => void;
  studentName: string;
  initialData?: NoteFormData;
}

export interface NoteFormData {
  category: NoteCategory;
  note: string;
  visibility: NoteVisibility;
}

const EMPTY_NOTE_FORM: NoteFormData = {
  category: "general",
  note: "",
  visibility: "internal",
};

export default function AddNoteModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  initialData,
}: AddNoteModalProps) {
  const t = useTranslations("students_guardians.profile.notes");
  const [formData, setFormData] = useState<NoteFormData>(
    initialData ?? EMPTY_NOTE_FORM,
  );
  const isEditing = initialData !== undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit(formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData(EMPTY_NOTE_FORM);
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={isEditing ? t("edit") : t("add_note")}
      description={t("note_for_student", { studentName })}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="add-note-form">
            {isEditing ? t("save") : t("add_note")}
          </Button>
        </>
      }
    >
      <form id="add-note-form" onSubmit={handleSubmit}>
        <div className="space-y-6 pb-4">
          <Select
            label={t("category")}
            required
            value={formData.category}
            onChange={(value) =>
              setFormData({
                ...formData,
                category: value as NoteCategory,
              })
            }
            options={NOTE_CATEGORIES.map((category) => ({
              value: category,
              label: t(category),
            }))}
          />
          <p className="mt-1 text-xs text-gray-500">{t("category_help")}</p>

          <TextArea
            label={t("note")}
            required
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={6}
            placeholder={t("note_placeholder")}
            resize="none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t("characters", { count: formData.note.length })}
          </p>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              {t("visibility")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                className={`justify-start rounded-lg border p-3 text-left ${
                  formData.visibility === "internal"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
                onClick={() =>
                  setFormData({ ...formData, visibility: "internal" })
                }
              >
                <div className="flex-1 text-start">
                  <div className="mb-1 flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {t("internal")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{t("internal_help")}</p>
                </div>
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                className={`justify-start rounded-lg border p-3 text-left ${
                  formData.visibility === "guardian_visible"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
                onClick={() =>
                  setFormData({
                    ...formData,
                    visibility: "guardian_visible",
                  })
                }
              >
                <div className="flex-1 text-start">
                  <div className="mb-1 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {t("guardian_visible")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("guardian_visible_help")}
                  </p>
                </div>
              </Button>
            </div>
          </div>

          {formData.visibility === "guardian_visible" ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="mb-1 text-sm font-medium text-blue-900">
                    {t("guardian_visibility_title")}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t("guardian_visibility_help")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

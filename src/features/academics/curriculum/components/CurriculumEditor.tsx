"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useTranslations } from "next-intl";
import { Save, Trash2, BookOpen, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import TextArea from "@/components/ui/input/TextArea";
import Input from "@/components/ui/input/Input";
import {
  Curriculum,
  Unit,
  Lesson,
  createUnit,
  updateUnit,
  deleteUnit,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  curriculumFormErrors,
  curriculumUiError,
} from "@/features/academics/curriculum/services/curriculumErrors";
import LearningContentPanel from "./LearningContentPanel";

interface CurriculumEditorProps {
  curriculum: Curriculum;
  units: Unit[];
  lessons: Lesson[];
  selectedNode: { type: "unit" | "lesson"; id: string } | null;
  termWeeks: number;
  onRefresh: () => Promise<void>;
  onDirtyChange: (isDirty: boolean) => void;
  isReadOnly: boolean;
  onSelectNode?: (node: { type: "unit" | "lesson"; id: string } | null) => void;
}

type CurriculumEditorForm = {
  title: string;
  description: string;
  objectives: string;
  estimatedLessons: string;
  estimatedMinutes: string;
};

const emptyForm: CurriculumEditorForm = {
  title: "",
  description: "",
  objectives: "",
  estimatedLessons: "",
  estimatedMinutes: "",
};

type CurriculumNodeSelection = { type: "unit" | "lesson"; id: string };

const curriculumEditorFields = [
  "title",
  "description",
  "objectives",
  "estimatedLessons",
  "estimatedMinutes",
] as const satisfies readonly (keyof CurriculumEditorForm)[];

export default function CurriculumEditor({
  curriculum,
  units,
  lessons,
  selectedNode,
  termWeeks, // No longer used for planned week dropdown, but kept in props
  onRefresh,
  onDirtyChange,
  isReadOnly,
  onSelectNode,
}: CurriculumEditorProps) {
  const t = useTranslations("academics.curriculum.editor");
  const tValidation = useTranslations("validation");
  void termWeeks;

  const [formData, setFormData] = useState<CurriculumEditorForm>(emptyForm);
  const [originalData, setOriginalData] =
    useState<CurriculumEditorForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CurriculumEditorForm, string>>
  >({});
  const [formMessages, setFormMessages] = useState<string[]>([]);
  const [pendingDeleteNode, setPendingDeleteNode] =
    useState<CurriculumNodeSelection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState<"form" | "learningContent">("form");

  useLayoutEffect(() => {
    void Promise.resolve().then(() => {
      setFieldErrors({});
      setFormMessages([]);
      setPendingDeleteNode(null);
      setViewMode("form");
    });
    if (!selectedNode) {
      void Promise.resolve().then(() => {
        setFormData(emptyForm);
        setOriginalData(emptyForm);
      });
      onDirtyChange(false);
      return;
    }

    if (selectedNode.type === "unit") {
      if (selectedNode.id === "new") {
        void Promise.resolve().then(() => {
          setFormData(emptyForm);
          setOriginalData(emptyForm);
        });
      } else {
        const unit = units.find((u) => u.id === selectedNode.id);
        if (unit) {
          const data: CurriculumEditorForm = {
            title: unit.title,
            description: unit.description || "",
            objectives: "",
            estimatedLessons: unit.estimatedLessons?.toString() ?? "",
            estimatedMinutes: "",
          };
          void Promise.resolve().then(() => {
            setFormData(data);
            setOriginalData(data);
          });
        }
      }
    } else if (selectedNode.type === "lesson") {
      if (selectedNode.id.startsWith("new-")) {
        void Promise.resolve().then(() => {
          setFormData(emptyForm);
          setOriginalData(emptyForm);
        });
      } else {
        const lesson = lessons.find((l) => l.id === selectedNode.id);
        if (lesson) {
          const data: CurriculumEditorForm = {
            title: lesson.title,
            description: lesson.description || "",
            objectives: lesson.objectives.join("\n"),
            estimatedLessons: "",
            estimatedMinutes: lesson.estimatedMinutes?.toString() ?? "",
          };
          void Promise.resolve().then(() => {
            setFormData(data);
            setOriginalData(data);
          });
        }
      }
    }
  }, [selectedNode, units, lessons, onDirtyChange]);

  useEffect(() => {
    const dirty = JSON.stringify(formData) !== JSON.stringify(originalData);
    void Promise.resolve().then(() => setIsDirty(dirty));
    onDirtyChange(dirty);
  }, [formData, originalData, onDirtyChange]);

  const updateFormField = <Field extends keyof CurriculumEditorForm>(
    field: Field,
    value: CurriculumEditorForm[Field],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    if (isReadOnly || !selectedNode) return;

    const title = formData.title.trim();
    if (!title) {
      setFieldErrors({ title: tValidation("required") });
      return;
    }

    setFieldErrors({});
    setFormMessages([]);
    setIsSaving(true);
    try {
      if (selectedNode.type === "unit") {
        const estimatedLessons = formData.estimatedLessons.trim()
          ? Number(formData.estimatedLessons)
          : null;
        const payload = {
          title,
          description: formData.description.trim() || null,
          estimatedLessons,
        };
        if (selectedNode.id === "new") {
          await createUnit(curriculum.id, {
            ...payload,
            sortOrder: units.length,
          });
        } else {
          await updateUnit(curriculum.id, selectedNode.id, payload);
        }
      } else {
        const estimatedMinutes = formData.estimatedMinutes.trim()
          ? Number(formData.estimatedMinutes)
          : null;
        const objectives = formData.objectives
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);
        if (selectedNode.id.startsWith("new-")) {
          const unitId = selectedNode.id.replace("new-", "");
          const unitLessons = lessons.filter(
            (lesson) => lesson.unitId === unitId,
          );
          await createLesson(curriculum.id, unitId, {
            title,
            description: formData.description.trim() || null,
            objectives,
            estimatedMinutes,
            sortOrder: unitLessons.length,
          });
        } else {
          const lesson = lessons.find((item) => item.id === selectedNode.id);
          if (!lesson) return;
          await updateLesson(curriculum.id, lesson.unitId, selectedNode.id, {
            title,
            description: formData.description.trim() || null,
            objectives,
            estimatedMinutes,
          });
        }
      }

      await onRefresh();
      onDirtyChange(false);
    } catch (error) {
      const mapped = curriculumUiError(error, tValidation("invalid"));
      const projected = curriculumFormErrors(mapped, curriculumEditorFields);
      setFieldErrors(projected.fieldErrors);
      setFormMessages([
        ...new Set([mapped.message, ...projected.formMessages]),
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = () => {
    if (isReadOnly || !selectedNode) return;
    setPendingDeleteNode(selectedNode);
  };

  const confirmDeleteNode = async () => {
    if (!pendingDeleteNode) return;

    setIsDeleting(true);
    try {
      if (pendingDeleteNode.type === "unit") {
        await deleteUnit(curriculum.id, pendingDeleteNode.id);
      } else {
        const lesson = lessons.find((item) => item.id === pendingDeleteNode.id);
        if (!lesson) return;
        await deleteLesson(curriculum.id, lesson.unitId, pendingDeleteNode.id);
      }
      await onRefresh();
      setPendingDeleteNode(null);
      if (onSelectNode) {
        onSelectNode(null);
      }
    } catch (error) {
      const mapped = curriculumUiError(error, tValidation("invalid"));
      setFormMessages([...new Set([mapped.message, ...mapped.details])]);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t("no_selection")}</p>
      </div>
    );
  }

  const isNew = selectedNode.id === "new" || selectedNode.id.startsWith("new-");

  if (viewMode === "learningContent" && selectedNode.type === "lesson" && !isNew) {
    const selectedLesson = lessons.find((l) => l.id === selectedNode.id);
    if (selectedLesson) {
      return (
        <div className="flex flex-col h-full bg-white">
          <div className="p-4 border-b border-border flex items-center justify-between bg-white">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setViewMode("form")}
              leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            >
              {t("back_to_form")}
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <LearningContentPanel
              curriculumId={curriculum.id}
              unitId={selectedLesson.unitId}
              lessonId={selectedLesson.id}
              isReadOnly={isReadOnly}
              onClose={() => setViewMode("form")}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="p-6">
      <div className="">
        <div className="bg-white rounded-lg shadow-sm border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {selectedNode.type === "unit"
                  ? isNew
                    ? t("new_unit")
                    : t("edit_unit")
                  : isNew
                    ? t("new_lesson")
                    : t("edit_lesson")}
              </h2>
              {isDirty && (
                <span className="text-sm text-amber-600 font-medium">
                  {t("unsaved_changes")}
                </span>
              )}
            </div>
          </div>

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
            label={t("title")}
            value={formData.title}
            onChange={(e) => updateFormField("title", e.target.value)}
            required
            error={fieldErrors.title}
            disabled={isReadOnly}
          />

          <TextArea
            label={t("description")}
            value={formData.description}
            onChange={(e) => updateFormField("description", e.target.value)}
            error={fieldErrors.description}
            disabled={isReadOnly}
            rows={3}
          />

          {selectedNode.type === "unit" && (
            <Input
              label={t("estimated_lessons")}
              type="number"
              value={formData.estimatedLessons}
              onChange={(e) =>
                updateFormField("estimatedLessons", e.target.value)
              }
              error={fieldErrors.estimatedLessons}
              disabled={isReadOnly}
            />
          )}

          {selectedNode.type === "lesson" && (
            <>
              <TextArea
                label={t("objectives")}
                value={formData.objectives}
                onChange={(e) => updateFormField("objectives", e.target.value)}
                error={fieldErrors.objectives}
                disabled={isReadOnly}
                rows={4}
              />
              <Input
                label={t("duration_minutes")}
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) =>
                  updateFormField("estimatedMinutes", e.target.value)
                }
                error={fieldErrors.estimatedMinutes}
                disabled={isReadOnly}
              />
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              disabled={isReadOnly || isSaving || !isDirty}
            >
              {isSaving ? t("saving") : t("save")}
            </Button>

            {!isNew && selectedNode.type === "lesson" && (
              <Button
                type="button"
                onClick={() => setViewMode("learningContent")}
                variant="secondary"
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                {t("learning_content")}
              </Button>
            )}

            {!isNew && (
              <>
                <Button
                  onClick={requestDelete}
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  disabled={isReadOnly}
                >
                  {t("delete")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteNode !== null}
        onClose={() => {
          if (!isDeleting) setPendingDeleteNode(null);
        }}
        onConfirm={() => void confirmDeleteNode()}
        title={t("delete")}
        description={t("confirm_delete")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={isDeleting}
        severity="danger"
      />
    </div>
  );
}

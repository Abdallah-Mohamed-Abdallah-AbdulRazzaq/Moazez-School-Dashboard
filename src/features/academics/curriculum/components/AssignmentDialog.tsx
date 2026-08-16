"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { Assignment } from "@/features/academics/curriculum/services/curriculumService";
import DatePicker from "@/components/ui/input/DatePicker";
import { Alert } from "@mui/material";
import { AlertTriangle } from "lucide-react";
import { AcademicEvent } from "@/features/academics/calendar/services/calendarService";
import { isHolidayDate } from "@/features/academics/calendar/utils/termTeachingDays";

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Partial<Assignment>) => Promise<void>;
  assignment?: Assignment | null;
  isReadOnly: boolean;
  termEvents?: AcademicEvent[]; // Calendar events for holiday checking
  gradeId?: string; // For scope-aware holiday checking
}

export default function AssignmentDialog({
  isOpen,
  onClose,
  onSave,
  assignment,
  isReadOnly,
  termEvents = [],
  gradeId,
}: AssignmentDialogProps) {
  const t = useTranslations("academics.curriculum.assignments");
  const tAssignments = useTranslations("academics.assignments");
  const tValidation = useTranslations("validation");

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [errors, setErrors] = useState<{ ar?: string; en?: string; maxScore?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        void Promise.resolve().then(() => {
          setTitleAr(assignment.titleAr);
          setTitleEn(assignment.titleEn);
          setDescriptionAr(assignment.descriptionAr || "");
          setDescriptionEn(assignment.descriptionEn || "");
          setDueDate(assignment.dueDate ? new Date(assignment.dueDate) : null);
          setMaxScore(assignment.maxScore ?? "");
        });
      } else {
        void Promise.resolve().then(() => {
          setTitleAr("");
          setTitleEn("");
          setDescriptionAr("");
          setDescriptionEn("");
          setDueDate(null);
          setMaxScore("");
        });
      }
      void Promise.resolve().then(() => setErrors({}));
    }
  }, [isOpen, assignment]);

  const validate = (): boolean => {
    const newErrors: { ar?: string; en?: string; maxScore?: string } = {};

    if (!titleAr.trim()) newErrors.ar = tValidation("required_ar");
    if (!titleEn.trim()) newErrors.en = tValidation("required_en");

    if (maxScore !== "" && (Number(maxScore) < 0 || isNaN(Number(maxScore)))) {
      newErrors.maxScore = t("max_score_invalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        descriptionAr: descriptionAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        dueDate: dueDate?.toISOString(),
        maxScore: maxScore !== "" ? Number(maxScore) : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save assignment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment ? t("edit_assignment") : t("add_assignment")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSaving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={isReadOnly || isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <BilingualTextField
          label={t("assignment_title")}
          value={{ ar: titleAr, en: titleEn }}
          onChange={(value) => {
            setTitleAr(value.ar);
            setTitleEn(value.en);
            setErrors({});
          }}
          requiredAr
          requiredEn
          errors={errors}
          disabled={isReadOnly}
          placeholder={{
            ar: t("titlePlaceholderAr"),
            en: t("titlePlaceholderEn"),
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("description")} (عربي)
            </label>
            <TextArea
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              disabled={isReadOnly}
              rows={3}
              placeholder={t("descriptionPlaceholderAr")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("description")} (English)
            </label>
            <TextArea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              disabled={isReadOnly}
              rows={3}
              placeholder={t("descriptionPlaceholderEn")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <DatePicker
              label={t("due_date")}
              value={dueDate}
              onChange={(date) => setDueDate(date)}
              disabled={isReadOnly}
              placeholder="YYYY-MM-DD"
              fullWidth
            />
            
            {/* Holiday Warning */}
            {dueDate && isHolidayDate(
              dueDate,
              termEvents,
              gradeId ? { type: "GRADE", id: gradeId } : { type: "SCHOOL" }
            ) && (
              <Alert 
                severity="warning" 
                icon={<AlertTriangle className="w-4 h-4" />}
                className="mt-2 text-xs"
              >
                {tAssignments("dueDateHolidayWarning")}
              </Alert>
            )}
          </div>

          <Input
            label={t("max_score")}
            type="number"
            value={maxScore}
            onChange={(e) => {
              setMaxScore(e.target.value === "" ? "" : Number(e.target.value));
              setErrors({ ...errors, maxScore: undefined });
            }}
            error={errors.maxScore}
            disabled={isReadOnly}
            min={0}
            placeholder="100"
          />
        </div>
      </div>
    </Modal>
  );
}

// FILE: src/components/students-guardians/profile-tabs/MedicalTab.tsx

"use client";

import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { FileText, Edit2, Plus, Save, X } from "lucide-react";
import type {
  Student,
  StudentMedicalProfile,
} from "@/features/students-guardians/students/types";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import { useTranslations } from "next-intl";
import { Button, Input, TextArea } from "@/components/ui";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";

interface MedicalTabProps {
  student: Student;
}

interface MedicalTagListFieldProps {
  label: string;
  emptyLabel: string;
  placeholder: string;
  maxItemsLabel: string;
  addLabel: string;
  removeLabel: (value: string) => string;
  values: string[];
  isEditing: boolean;
  onChange: (values: string[]) => void;
}

const MAX_MEDICAL_ITEMS = 20;
const MAX_MEDICAL_ITEM_LENGTH = 120;

function MedicalTagListField({
  label,
  emptyLabel,
  placeholder,
  maxItemsLabel,
  addLabel,
  removeLabel,
  values,
  isEditing,
  onChange,
}: MedicalTagListFieldProps) {
  const [draft, setDraft] = useState("");

  const normalizedValues = Array.from(
    new Map(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), value]),
    ).values(),
  );
  const canAddMore = normalizedValues.length < MAX_MEDICAL_ITEMS;

  const addDraft = () => {
    const nextValue = draft.trim().slice(0, MAX_MEDICAL_ITEM_LENGTH);
    if (!nextValue) return;

    const alreadyExists = normalizedValues.some(
      (value) => value.toLowerCase() === nextValue.toLowerCase(),
    );
    if (alreadyExists || !canAddMore) {
      setDraft("");
      return;
    }

    onChange([...normalizedValues, nextValue]);
    setDraft("");
  };

  const removeValue = (removedValue: string) => {
    onChange(normalizedValues.filter((value) => value !== removedValue));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    addDraft();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">
          {normalizedValues.length}/{MAX_MEDICAL_ITEMS}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {normalizedValues.length > 0 ? (
          normalizedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
            >
              {value}
              {isEditing ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                  onClick={() => removeValue(value)}
                  aria-label={removeLabel(value)}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          ))
        ) : (
          <p className="text-sm text-gray-500">{emptyLabel}</p>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 flex gap-2">
          <Input
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value.slice(0, MAX_MEDICAL_ITEM_LENGTH))
            }
            onKeyDown={handleKeyDown}
            disabled={!canAddMore}
            placeholder={canAddMore ? placeholder : maxItemsLabel}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addDraft}
            disabled={!canAddMore || !draft.trim()}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {addLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function MedicalTab({ student }: MedicalTabProps) {
  const t = useTranslations("students_guardians.profile.medical");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalData, setMedicalData] = useState<StudentMedicalProfile>({
    studentId: student.id,
    notes: "",
  });

  const loadMedicalProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await studentsService.fetchStudentMedicalProfile(student.id);
      setMedicalData(profile || { studentId: student.id });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load medical profile.",
      );
      setMedicalData({ studentId: student.id });
    } finally {
      setIsLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    void Promise.resolve().then(loadMedicalProfile);
  }, [loadMedicalProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await studentsService.upsertStudentMedicalProfile(
        student.id,
        medicalData,
      );
      setMedicalData(saved);
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save medical profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    void loadMedicalProfile();
    setIsEditing(false);
  };

  if (isLoading) {
    return <StudentTabSkeleton variant="form" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            leftIcon={<Edit2 className="w-4 h-4" />}
          >
            {t("edit")}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t("save")}
            </Button>
          </div>
        )}
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t("blood_type")}
          value={medicalData.blood_type || ""}
          onChange={(event) =>
            setMedicalData({ ...medicalData, blood_type: event.target.value })
          }
          disabled={!isEditing}
        />
        <Input
          label={t("allergies")}
          value={medicalData.allergies || ""}
          onChange={(event) =>
            setMedicalData({ ...medicalData, allergies: event.target.value })
          }
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MedicalTagListField
          label={t("conditions")}
          emptyLabel={t("no_conditions")}
          placeholder={t("add_condition")}
          maxItemsLabel={t("max_items_reached")}
          addLabel={t("add")}
          removeLabel={(value) => t("remove_item", { value })}
          values={medicalData.conditions ?? []}
          isEditing={isEditing}
          onChange={(conditions) =>
            setMedicalData({ ...medicalData, conditions })
          }
        />
        <MedicalTagListField
          label={t("medications")}
          emptyLabel={t("no_medications")}
          placeholder={t("add_medication")}
          maxItemsLabel={t("max_items_reached")}
          addLabel={t("add")}
          removeLabel={(value) => t("remove_item", { value })}
          values={medicalData.medications ?? []}
          isEditing={isEditing}
          onChange={(medications) =>
            setMedicalData({ ...medicalData, medications })
          }
        />
      </div>

      {/* Medical Notes */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          {t("medical_notes")}
        </h3>
        <TextArea
          value={medicalData.notes || ""}
          onChange={(e) =>
            setMedicalData({ ...medicalData, notes: e.target.value })
          }
          disabled={!isEditing}
          rows={4}
          placeholder={t("enter_notes")}
          variant={isEditing ? "default" : "filled"}
        />
      </div>
    </div>
  );
}

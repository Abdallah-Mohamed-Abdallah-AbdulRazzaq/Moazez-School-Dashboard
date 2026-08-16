// FILE: src/features/admissions/interviews/components/ScheduleInterviewModal.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import { Button } from "@/components/ui";
import {
  Input,
  TextArea,
} from "@/components/ui/input";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import type { RoleDefinition } from "@/features/settings/types";
import PaginatedUserSelect from "@/features/settings/users/components/PaginatedUserSelect";

export interface ScheduleInterviewFormData {
  date: string;
  time: string;
  interviewerUserId: string;
  notes: string;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleInterviewFormData) => Promise<void> | void;
  studentName: string;
}

const FORM_ID = "schedule-interview-form";

function isTeacherRole(role: RoleDefinition) {
  const roleKey = (role.key || "").toLowerCase();
  const roleName = (role.name || "").toLowerCase();
  return roleKey === "teacher" || roleName === "teacher";
}

function createInitialFormData(): ScheduleInterviewFormData {
  return {
    date: "",
    time: "",
    interviewerUserId: "",
    notes: "",
  };
}

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
}: ScheduleInterviewModalProps) {
  const t = useTranslations("admissions.schedule_interview");
  const [teacherRoleId, setTeacherRoleId] = useState("");
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ScheduleInterviewFormData>(() =>
    createInitialFormData(),
  );

  useEffect(() => {
    if (!isOpen) return;

    void Promise.resolve().then(() => {
      setFormData(createInitialFormData());
      setValidationError(null);
      setIsSubmitting(false);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoadingTeachers(true);
      setTeachersError(null);
      setTeacherRoleId("");

      try {
        const rolesResult = await fetchSettingsRoles();
        const teacherRole = rolesResult.items.find(isTeacherRole);
        if (!teacherRole) {
          throw new Error("teacher_role_not_found");
        }

        if (!cancelled) {
          setTeacherRoleId(teacherRole.id);
        }
      } catch (error) {
        console.error("Failed to load interviewers:", error);
        if (!cancelled) {
          setTeacherRoleId("");
          setTeachersError(t("teachers_load_failed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTeachers(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  const updateFormData = (updates: Partial<ScheduleInterviewFormData>) => {
    setFormData((current) => ({ ...current, ...updates }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!formData.interviewerUserId) {
      setValidationError(t("select_interviewer"));
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Failed to schedule interview:", error);
      setValidationError(t("schedule_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterviewerChange = (interviewerUserId: string) => {
    updateFormData({ interviewerUserId });
    setValidationError(null);
  };

  const footer = (
    <>
      <Button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        variant="secondary"
      >
        {t("cancel")}
      </Button>
      <Button
        type="submit"
        form={FORM_ID}
        disabled={isSubmitting || isLoadingTeachers}
        loading={isSubmitting}
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={`${t("student")}: ${studentName}`}
      size="lg"
      footer={footer}
      icon={<Calendar className="h-6 w-6" />}
      variant="confirm"
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("interview_details")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("date")}
              type="date"
              value={formData.date}
              onChange={(event) => updateFormData({ date: event.target.value })}
              required
            />

            <Input
              label={t("time")}
              type="time"
              value={formData.time}
              onChange={(event) => updateFormData({ time: event.target.value })}
              required
            />

            <PaginatedUserSelect
              label={t("interviewer")}
              value={formData.interviewerUserId}
              onChange={handleInterviewerChange}
              roleId={teacherRoleId}
              status="active"
              placeholder={t("select_interviewer")}
              required
              disabled={isLoadingTeachers || !teacherRoleId}
              error={validationError || teachersError || undefined}
            />
          </div>
        </div>

        <TextArea
          label={t("notes")}
          value={formData.notes}
          onChange={(event) => updateFormData({ notes: event.target.value })}
          rows={3}
          resize="none"
          placeholder={t("notes_placeholder")}
        />
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Input, Modal, Select } from "@/components/ui";
import {
  fetchSubjects,
  type Subject,
} from "@/features/academics/subjects/services/subjectsService";
import { fetchApplications } from "@/features/admissions/applications/services/applicationsApiService";
import type { Application } from "@/features/admissions/types/admissions";

export interface ScheduleTestFormData {
  applicationId: string;
  studentName: string;
  type: string;
  subjectId: string;
  subjectName: string;
  date: string;
  time: string;
}

interface ScheduleTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: ScheduleTestFormData) => Promise<void> | void;
  studentName: string;
  applicationId?: string;
}

const FORM_ID = "schedule-test-form";
const initialForm: ScheduleTestFormData = {
  applicationId: "",
  studentName: "",
  type: "Placement Test",
  subjectId: "",
  subjectName: "",
  date: "",
  time: "",
};

export default function ScheduleTestModal({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  applicationId = "",
}: ScheduleTestModalProps) {
  const t = useTranslations("admissions.schedule_test");
  const locale = useLocale();
  const [form, setForm] = useState(initialForm);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void Promise.resolve().then(() => {
      setForm({ ...initialForm, applicationId, studentName });
      setSubjectsError(null);
      setApplicationsError(null);
    });
  }, [applicationId, isOpen, studentName]);

  useEffect(() => {
    if (!isOpen || applicationId) return;
    let cancelled = false;
    void Promise.resolve().then(() => setIsLoadingApplications(true));
    void fetchApplications()
      .then((items) => {
        if (!cancelled) setApplications(items);
      })
      .catch(() => {
        if (!cancelled) {
          setApplications([]);
          setApplicationsError("Failed to load applications.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApplications(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void Promise.resolve().then(() => setIsLoadingSubjects(true));
    void fetchSubjects()
      .then((items) => {
        if (!cancelled) setSubjects(items.filter((subject) => subject.isActive));
      })
      .catch(() => {
        if (!cancelled) {
          setSubjects([]);
          setSubjectsError("Failed to load subjects.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSubjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const subjectOptions = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id,
        label: locale === "ar" ? subject.nameAr : subject.nameEn,
      })),
    [locale, subjects],
  );

  const applicationOptions = useMemo(
    () =>
      applications.map((application) => ({
        value: application.id,
        label: application.studentName,
        searchText: `${application.studentName} ${application.id}`,
      })),
    [applications],
  );

  const selectApplication = (selectedApplicationId: string) => {
    const selectedApplication = applications.find(
      (candidate) => candidate.id === selectedApplicationId,
    );
    setForm((current) => ({
      ...current,
      applicationId: selectedApplicationId,
      studentName: selectedApplication?.studentName || "",
    }));
  };

  const selectSubject = (subjectId: string) => {
    const subject = subjects.find((candidate) => candidate.id === subjectId);
    setForm((current) => ({
      ...current,
      subjectId,
      subjectName: subject ? (locale === "ar" ? subject.nameAr : subject.nameEn) : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={`${t("student")}: ${studentName}`}
      size="lg"
      footer={
        <>
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>{t("cancel")}</Button>
          <Button type="submit" form={FORM_ID} loading={isSubmitting} disabled={isLoadingSubjects || isLoadingApplications || !form.applicationId || !form.subjectId}>{t("submit")}</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
        {applicationId ? (
          <Input label={t("student_name")} value={form.studentName} readOnly />
        ) : (
          <Select
            label={t("student_name")}
            value={form.applicationId}
            onChange={selectApplication}
            options={applicationOptions}
            placeholder={t("student_name")}
            disabled={isLoadingApplications}
            error={applicationsError || undefined}
            required
            searchable
          />
        )}
        <Input label={t("test_details")} value={form.type} readOnly />
        <Select
          label={t("subject")}
          value={form.subjectId}
          onChange={selectSubject}
          options={subjectOptions}
          placeholder={t("select_subject")}
          disabled={isLoadingSubjects}
          error={subjectsError || undefined}
          required
          searchable
        />
        <Input label={t("date")} type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
        <Input label={t("time")} type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} required />
      </form>
    </Modal>
  );
}

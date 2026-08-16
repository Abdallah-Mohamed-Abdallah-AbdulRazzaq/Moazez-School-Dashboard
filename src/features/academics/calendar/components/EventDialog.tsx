"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import DatePicker from "@/components/ui/input/DatePicker";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { Alert } from "@mui/material";
import {
  AcademicEvent,
  createTermEvent,
  formatCalendarDate,
  parseCalendarDate,
  updateEvent,
  deleteEvent,
} from "@/features/academics/calendar/services/calendarService";
import { getCalendarErrorMessage } from "@/features/academics/calendar/services/calendarErrors";
import type { CalendarScopeTargetOption } from "@/features/academics/calendar/types";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: AcademicEvent | null;
  academicYearId: string;
  termId: string;
  prefilledDate: Date | null;
  isReadOnly: boolean;
  stages: CalendarScopeTargetOption[];
  grades: CalendarScopeTargetOption[];
  sections: CalendarScopeTargetOption[];
}

export default function EventDialog({
  isOpen,
  onClose,
  onSuccess,
  event,
  academicYearId,
  termId,
  prefilledDate,
  isReadOnly,
  stages,
  grades,
  sections,
}: EventDialogProps) {
  const t = useTranslations("academics.calendar");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const initialDate = prefilledDate || new Date();
  const previousInitializationRef = useRef({
    isOpen,
    event,
    prefilledDate,
  });

  // Form state
  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState<AcademicEvent["type"]>(
    event?.type ?? "OTHER",
  );
  const [allDay, setAllDay] = useState(event?.allDay ?? true);
  const [startDate, setStartDate] = useState<Date | null>(() =>
    event ? parseCalendarDate(event.startDate) : initialDate,
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    event ? parseCalendarDate(event.endDate) : initialDate,
  );
  const [scopeType, setScopeType] = useState<AcademicEvent["scopeType"]>(
    event?.scopeType ?? "SCHOOL",
  );
  const [scopeId, setScopeId] = useState(event?.scopeId ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    const previousInitialization = previousInitializationRef.current;
    if (
      previousInitialization.isOpen === isOpen &&
      previousInitialization.event === event &&
      previousInitialization.prefilledDate === prefilledDate
    ) {
      return;
    }
    previousInitializationRef.current = { isOpen, event, prefilledDate };

    if (isOpen) {
      if (event) {
        // Edit mode
        void Promise.resolve().then(() => {
          setTitle(event.title);
          setType(event.type);
          setAllDay(event.allDay);
          setStartDate(parseCalendarDate(event.startDate));
          setEndDate(parseCalendarDate(event.endDate));
          setScopeType(event.scopeType);
          setScopeId(event.scopeId || "");
          setDescription(event.description || "");
          setNotes(event.notes || "");
        });
      } else {
        // Create mode
        const dateObj = prefilledDate || new Date();

        void Promise.resolve().then(() => {
          setTitle("");
          setType("OTHER");
          setAllDay(true);
          setStartDate(dateObj);
          setEndDate(dateObj);
          setScopeType("SCHOOL");
          setScopeId("");
          setDescription("");
          setNotes("");
        });
      }
      void Promise.resolve().then(() => setErrors({}));
    }
  }, [isOpen, event, prefilledDate]);



  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = tValidation("required");
    if (title.trim().length > 180) {
      newErrors.title = t("validation.title_too_long");
    }

    // Date validation
    if (!startDate) newErrors.startDate = tValidation("required");
    if (!endDate) newErrors.endDate = tValidation("required");

    if (startDate && endDate) {
      if (startDate > endDate) {
        newErrors.endDate = t("validation.start_after_end");
      }

    }

    // Scope validation
    if (scopeType !== "SCHOOL" && !scopeId) {
      newErrors.scopeId = tValidation("required");
    }

    if (notes.trim().length > 4000) {
      newErrors.notes = t("validation.notes_too_long");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        allDay,
        startDate: startDate ? formatCalendarDate(startDate) : "",
        endDate: endDate ? formatCalendarDate(endDate) : "",
        scopeType,
        scopeId: scopeType === "SCHOOL" ? undefined : scopeId,
        description: description.trim(),
        notes: notes.trim(),
      };

      if (event) {
        await updateEvent(event.id, payload);
      } else {
        await createTermEvent(academicYearId, termId, payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save event:", error);
      setErrors({
        general: getCalendarErrorMessage(error, (key) => t(`errors.${key}`)),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly) {
      return;
    }

    if (!event) {
      return;
    }

    if (!event.id) {
      setErrors({ general: "Invalid event: missing ID" });
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      setShowDeleteConfirm(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to delete event:", error);
      setErrors({
        general: getCalendarErrorMessage(error, (key) => t(`errors.${key}`)),
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const eventTypeOptions = [
    { value: "HOLIDAY", label: t("event_types.holiday") },
    { value: "EXAM", label: t("event_types.exam") },
    { value: "ACTIVITY", label: t("event_types.activity") },
    { value: "OTHER", label: t("event_types.other") },
  ];

  const scopeTypeOptions = [
    { value: "SCHOOL", label: t("scopes.school") },
    { value: "STAGE", label: t("scopes.stage") },
    { value: "GRADE", label: t("scopes.grade") },
    { value: "SECTION", label: t("scopes.section") },
  ];

  const getLocalizedScopeTargetName = (option: CalendarScopeTargetOption) => {
    if (locale === "ar") {
      return option.nameAr || option.name;
    }

    return option.nameEn || option.name;
  };

  const getScopeTargetOptions = () => {
    switch (scopeType) {
      case "STAGE":
        return stages.map((s) => ({
          value: s.id,
          label: getLocalizedScopeTargetName(s),
        }));
      case "GRADE":
        return grades.map((g) => ({
          value: g.id,
          label: getLocalizedScopeTargetName(g),
        }));
      case "SECTION":
        return sections.map((s) => ({
          value: s.id,
          label: getLocalizedScopeTargetName(s),
        }));
      default:
        return [];
    }
  };

  const needsScopeTarget = scopeType !== "SCHOOL";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={event ? t("edit_event") : t("add_event")}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {event && !isReadOnly && (
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSaving}
                >
                  {t("delete")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="secondary" disabled={isSaving}>
                {t("cancel")}
              </Button>
              {!isReadOnly && (
                <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                  {isSaving ? t("saving") : t("save")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5 px-1">
          {/* General Error */}
          {errors.general && (
            <Alert severity="error" className="text-sm">
              {errors.general}
            </Alert>
          )}

          {/* Title */}
          <Input
            label={t("event_title")}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              const newErrors = { ...errors };
              delete newErrors.title;
              setErrors(newErrors);
            }}
            required
            maxLength={180}
            error={errors.title}
            disabled={isReadOnly}
            placeholder={t("event_title")}
          />

          {/* Type and All Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("type")}
              value={type}
              onChange={(value) => setType(value as AcademicEvent["type"])}
              options={eventTypeOptions}
              required
              disabled={isReadOnly}
            />

            <div className="flex flex-col gap-2 justify-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  disabled={isReadOnly}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t("all_day")}
                </span>
              </label>

            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label={t("start_date")}
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                const newErrors = { ...errors };
                delete newErrors.startDate;
                delete newErrors.general;
                setErrors(newErrors);
              }}
              error={errors.startDate}
              required
              disabled={isReadOnly}
              format={locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
            />

            <DatePicker
              label={t("end_date")}
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                const newErrors = { ...errors };
                delete newErrors.endDate;
                delete newErrors.general;
                setErrors(newErrors);
              }}
              error={errors.endDate}
              required
              disabled={isReadOnly}
              format={locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
            />
          </div>

          {/* Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t("scope_type")}
              value={scopeType}
              onChange={(value) => {
                setScopeType(value as AcademicEvent["scopeType"]);
                setScopeId("");
                const newErrors = { ...errors };
                delete newErrors.scopeId;
                setErrors(newErrors);
              }}
              options={scopeTypeOptions}
              required
              disabled={isReadOnly}
            />

            {needsScopeTarget && (
              <Select
                label={t("scope_target")}
                value={scopeId}
                onChange={(value) => {
                  setScopeId(value);
                  const newErrors = { ...errors };
                  delete newErrors.scopeId;
                  setErrors(newErrors);
                }}
                options={getScopeTargetOptions()}
                required
                disabled={isReadOnly}
                error={errors.scopeId}
              />
            )}
          </div>

          <TextArea
            label={`${t("description")} (${t("optional")})`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("description")}
            disabled={isReadOnly}
            rows={3}
          />

          <TextArea
            label={`${t("notes")} (${t("optional")})`}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              const newErrors = { ...errors };
              delete newErrors.notes;
              setErrors(newErrors);
            }}
            maxLength={4000}
            error={errors.notes}
            placeholder={t("notes")}
            disabled={isReadOnly}
            rows={3}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("delete_confirm.title")}
        description={t("delete_confirm.message")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        severity="danger"
        loading={isDeleting}
      />
    </>
  );
}

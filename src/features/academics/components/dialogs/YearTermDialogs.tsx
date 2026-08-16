"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/input/DatePicker";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { isApiError } from "@/lib/api-error";
import {
  AcademicYear,
  Term,
  createAcademicYear,
  updateAcademicYear,
  createTerm,
  updateTerm,
} from "@/features/academics/academic-structure-tree/services/structureService";
import dayjs from "dayjs";

interface YearDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingYears: AcademicYear[];
  editYear?: AcademicYear | null;
}

export function YearDialog({
  isOpen,
  onClose,
  onSuccess,
  existingYears,
  editYear,
}: YearDialogProps) {
  const t = useTranslations("academics.structure.year_dialog");
  const tValidation = useTranslations("academics.structure.validation");

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bilingualErrors, setBilingualErrors] = useState<{ ar?: string; en?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editYear) {
        void Promise.resolve().then(() => {
          setNameAr(editYear.nameAr || "");
          setNameEn(editYear.nameEn || "");
          setStartDate(new Date(editYear.startDate));
          setEndDate(new Date(editYear.endDate));
          setIsActive(editYear.isActive === false ? "inactive" : "active");
        });
      } else {
        void Promise.resolve().then(() => {
          setNameAr("");
          setNameEn("");
          setStartDate(null);
          setEndDate(null);
          setIsActive("active");
        });
      }
      void Promise.resolve().then(() => {
        setErrors({});
        setBilingualErrors({});
      });
    }
  }, [isOpen, editYear]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newBilingualErrors: { ar?: string; en?: string } = {};

    // Required validation
    if (!nameAr.trim()) {
      newBilingualErrors.ar = tValidation("required_ar");
    }
    if (!nameEn.trim()) {
      newBilingualErrors.en = tValidation("required_en");
    }

    if (!startDate) {
      newErrors.startDate = tValidation("start_date_required");
    }

    if (!endDate) {
      newErrors.endDate = tValidation("end_date_required");
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = tValidation("start_before_end");
    }

    // Check for overlap with other years
    if (startDate && endDate) {
      const overlappingYear = existingYears.find((year) => {
        if (editYear && year.id === editYear.id) return false;
        const yearStart = new Date(year.startDate);
        const yearEnd = new Date(year.endDate);
        return (
          (startDate >= yearStart && startDate <= yearEnd) ||
          (endDate >= yearStart && endDate <= yearEnd) ||
          (startDate <= yearStart && endDate >= yearEnd)
        );
      });

      if (overlappingYear) {
        newErrors.startDate = tValidation("year_overlap", { 
          yearName: overlappingYear.name 
        });
      }
    }

    setErrors(newErrors);
    setBilingualErrors(newBilingualErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newBilingualErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: nameEn.trim() || nameAr.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
        isActive: isActive === "active",
      };

      if (editYear) {
        await updateAcademicYear(editYear.id, payload);
      } else {
        await createAcademicYear(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save academic year:", error);
      if (isApiError(error) && error.code === "academics.year.overlapping") {
        const message = error.message?.trim() || tValidation("year_overlap", { yearName: "" });
        setErrors({
          startDate: message,
          endDate: message,
        });
      } else {
        setErrors({ submit: tValidation("save_failed") });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editYear ? t("edit_title") : t("create_title")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : editYear ? t("save") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <BilingualTextField
          label={t("name")}
          value={{ ar: nameAr, en: nameEn }}
          onChange={(value) => {
            setNameAr(value.ar);
            setNameEn(value.en);
            setBilingualErrors({});
          }}
          requiredAr
          requiredEn
          errors={bilingualErrors}
          placeholder={{
            ar: "مثال: ٢٠٢٤-٢٠٢٥",
            en: "e.g., 2024-2025",
          }}
        />

        <DatePicker
          label={t("start_date")}
          required
          value={startDate}
          onChange={setStartDate}
          error={errors.startDate}
          format="YYYY-MM-DD"
        />

        <DatePicker
          label={t("end_date")}
          required
          value={endDate}
          onChange={setEndDate}
          error={errors.endDate}
          minDate={startDate || undefined}
          format="YYYY-MM-DD"
        />

        <Select
          label={t("active_status")}
          value={isActive}
          onChange={setIsActive}
          options={[
            { value: "active", label: t("active") },
            { value: "inactive", label: t("inactive") },
          ]}
        />

        {errors.submit && (
          <div className="text-sm text-red-600">{errors.submit}</div>
        )}
      </div>
    </Modal>
  );
}

interface TermDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicYear: AcademicYear;
  existingTerms: Term[];
  editTerm?: Term | null;
  isReadOnly?: boolean;
}

export function TermDialog({
  isOpen,
  onClose,
  onSuccess,
  academicYear,
  existingTerms,
  editTerm,
  isReadOnly = false,
}: TermDialogProps) {
  const t = useTranslations("academics.structure.term_dialog");
  const tValidation = useTranslations("academics.structure.validation");

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bilingualErrors, setBilingualErrors] = useState<{ ar?: string; en?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yearStartDate = useMemo(() => new Date(academicYear.startDate), [academicYear.startDate]);
  const yearEndDate = useMemo(() => new Date(academicYear.endDate), [academicYear.endDate]);

  useEffect(() => {
    if (isOpen) {
      if (editTerm) {
        void Promise.resolve().then(() => {
          setNameAr(editTerm.nameAr || "");
          setNameEn(editTerm.nameEn || "");
          setStartDate(new Date(editTerm.startDate));
          setEndDate(new Date(editTerm.endDate));
          setStatus(editTerm.status || "open");
        });
      } else {
        void Promise.resolve().then(() => {
          setNameAr("");
          setNameEn("");
        });
        
        // Auto-suggest start date
        const sortedTerms = [...existingTerms].sort(
          (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        );
        
        let suggestedStart: Date | null = null;
        let suggestedEnd: Date | null = null;
        
        if (sortedTerms.length > 0) {
          const latestTermEnd = new Date(sortedTerms[0].endDate);
          suggestedStart = dayjs(latestTermEnd).add(1, "day").toDate();
          if (suggestedStart > yearEndDate) {
            suggestedStart = null;
          }
        } else {
          suggestedStart = yearStartDate;
        }

        void Promise.resolve().then(() => setStartDate(suggestedStart));

        // Auto-suggest end date (16 weeks from start)
        if (suggestedStart) {
          suggestedEnd = dayjs(suggestedStart).add(16, "week").toDate();
          void Promise.resolve().then(() => {
            setEndDate(
              suggestedEnd! <= yearEndDate ? suggestedEnd! : yearEndDate,
            );
          });
        } else {
          void Promise.resolve().then(() => setEndDate(null));
        }
        void Promise.resolve().then(() => setStatus("open"));
      }
      void Promise.resolve().then(() => {
        setErrors({});
        setBilingualErrors({});
      });
    }
  }, [isOpen, editTerm, existingTerms, yearStartDate, yearEndDate]);

  // Calculate duration in weeks
  const durationWeeks =
    startDate && endDate
      ? Math.round(dayjs(endDate).diff(dayjs(startDate), "week", true))
      : 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newBilingualErrors: { ar?: string; en?: string } = {};

    // Required validation
    if (!nameAr.trim()) {
      newBilingualErrors.ar = tValidation("required_ar");
    }
    if (!nameEn.trim()) {
      newBilingualErrors.en = tValidation("required_en");
    }

    // AR != EN validation
    if (nameAr.trim() && nameEn.trim()) {
      const arEnErrors = validateArEnDifferent(nameAr, nameEn);
      if (arEnErrors.arError) {
        newBilingualErrors.ar = tValidation("arEnMustDiffer");
      }
      if (arEnErrors.enError) {
        newBilingualErrors.en = tValidation("arEnMustDiffer");
      }
    }

    if (!startDate) {
      newErrors.startDate = tValidation("start_date_required");
    }

    if (!endDate) {
      newErrors.endDate = tValidation("end_date_required");
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = tValidation("start_before_end");
    }

    // Check if term is within academic year range
    if (startDate && (startDate < yearStartDate || startDate > yearEndDate)) {
      newErrors.startDate = tValidation("term_within_year", { 
        yearStart: dayjs(yearStartDate).format("YYYY-MM-DD"), 
        yearEnd: dayjs(yearEndDate).format("YYYY-MM-DD") 
      });
    }

    if (endDate && (endDate < yearStartDate || endDate > yearEndDate)) {
      newErrors.endDate = tValidation("term_within_year", { 
        yearStart: dayjs(yearStartDate).format("YYYY-MM-DD"), 
        yearEnd: dayjs(yearEndDate).format("YYYY-MM-DD") 
      });
    }

    // Check for overlap with other terms
    if (startDate && endDate) {
      const overlappingTerm = existingTerms.find((term) => {
        if (editTerm && term.id === editTerm.id) return false;
        const termStart = new Date(term.startDate);
        const termEnd = new Date(term.endDate);
        return (
          (startDate >= termStart && startDate <= termEnd) ||
          (endDate >= termStart && endDate <= termEnd) ||
          (startDate <= termStart && endDate >= termEnd)
        );
      });

      if (overlappingTerm) {
        newErrors.startDate = tValidation("term_overlap", { 
          termName: overlappingTerm.name, 
          termStart: dayjs(overlappingTerm.startDate).format("YYYY-MM-DD"), 
          termEnd: dayjs(overlappingTerm.endDate).format("YYYY-MM-DD") 
        });
      }
    }

    setErrors(newErrors);
    setBilingualErrors(newBilingualErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newBilingualErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<Term, "id"> = {
        name: nameEn.trim() || nameAr.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
        yearId: academicYear.id,
        status,
      };

      if (editTerm) {
        await updateTerm(editTerm.id, {
          name: payload.name,
          nameAr: payload.nameAr,
          nameEn: payload.nameEn,
          startDate: payload.startDate,
          endDate: payload.endDate,
          status: payload.status,
        });
      } else {
        await createTerm(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save term:", error);
      setErrors({ submit: tValidation("save_failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if there's available date range
  const hasAvailableRange = () => {
    if (editTerm) return true;
    
    const sortedTerms = [...existingTerms].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    if (sortedTerms.length === 0) return true;

    const lastTerm = sortedTerms[sortedTerms.length - 1];
    const lastTermEnd = new Date(lastTerm.endDate);
    
    return lastTermEnd < yearEndDate;
  };

  if (isReadOnly && editTerm) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t("edit_title")}
        size="md"
        footer={
          <Button onClick={onClose} variant="secondary">
            {t("close")}
          </Button>
        }
      >
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">{t("readonly_warning")}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTerm ? t("edit_title") : t("create_title")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={isSubmitting || !hasAvailableRange()}
          >
            {isSubmitting ? t("saving") : editTerm ? t("save") : t("create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!hasAvailableRange() && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{t("no_available_range")}</p>
          </div>
        )}

        <BilingualTextField
          label={t("name")}
          value={{ ar: nameAr, en: nameEn }}
          onChange={(value) => {
            setNameAr(value.ar);
            setNameEn(value.en);
            setBilingualErrors({});
          }}
          requiredAr
          requiredEn
          errors={bilingualErrors}
          placeholder={{
            ar: "مثال: الفصل الأول",
            en: "e.g., Term 1",
          }}
        />

        <DatePicker
          label={t("start_date")}
          required
          value={startDate}
          onChange={setStartDate}
          error={errors.startDate}
          minDate={yearStartDate}
          maxDate={yearEndDate}
          format="YYYY-MM-DD"
        />

        <DatePicker
          label={t("end_date")}
          required
          value={endDate}
          onChange={setEndDate}
          error={errors.endDate}
          minDate={startDate || yearStartDate}
          maxDate={yearEndDate}
          format="YYYY-MM-DD"
          helperText={
            durationWeeks > 0 ? t("duration_weeks", { count: durationWeeks }) : undefined
          }
        />

        <Select
          label={t("status")}
          value={status}
          onChange={(value) => setStatus(value as "open" | "closed")}
          options={[
            { value: "open", label: t("status_open") },
            { value: "closed", label: t("status_closed") },
          ]}
        />

        {errors.submit && (
          <div className="text-sm text-red-600">{errors.submit}</div>
        )}
      </div>
    </Modal>
  );
}

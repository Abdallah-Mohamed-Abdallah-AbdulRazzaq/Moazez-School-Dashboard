"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Save } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import WizardStepper from "@/features/academics/timetable/components/WizardStepper";
import {
  validatePolicyName,
  isAttendancePolicyConflict,
  type PolicyNameValidationResult,
} from "../services/attendancePolicyService";
import { isApiError } from "@/lib/api-error";
import {
  getScopeSelectionMissingFields,
  isScopeSelectionComplete,
} from "@/features/attendance/shared/attendanceScope";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import Step1BasicInfo from "./wizard/Step1BasicInfo";
import Step2Scope from "./wizard/Step2Scope";
import Step3ModeComputation from "./wizard/Step3ModeComputation";
import Step4Rules from "./wizard/Step4Rules";
import Step5Review from "./wizard/Step5Review";
import type { AttendancePolicy, PolicyFormData } from "../types";
import type {
  Stage,
  Grade,
  Section,
  Classroom,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";

type NameValidationStatus = "idle" | "checking" | "success" | "error";

interface PolicyWizardDialogProps {
  isOpen: boolean;
  policy: AttendancePolicy | null;
  term: Term | null;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isReadOnly: boolean;
  canManagePolicies: boolean;
  onSave: (data: PolicyFormData) => Promise<void>;
  onClose: () => void;
}

export default function PolicyWizardDialog({
  isOpen,
  policy,
  term,
  stages,
  grades,
  sections,
  classrooms,
  isReadOnly,
  canManagePolicies,
  onSave,
  onClose,
}: PolicyWizardDialogProps) {
  const t = useTranslations("attendance.policies.wizard");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("attendance.policies.validation");
  const locale = useLocale();

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nameValidationStatus, setNameValidationStatus] =
    useState<NameValidationStatus>("idle");
  const nameValidationRequestId = useRef(0);
  const periodsRequestId = useRef(0);

  // Form data
  const [formData, setFormData] = useState<PolicyFormData>({
    yearId: policy?.yearId || "",
    termId: policy?.termId || "",
    nameAr: policy?.nameAr || "",
    nameEn: policy?.nameEn || "",
    descriptionAr: policy?.descriptionAr || "",
    descriptionEn: policy?.descriptionEn || "",
    notes: policy?.notes || "",
    scopeType: policy?.scopeType || "SCHOOL",
    scopeIds: policy?.scopeIds || {},
    mode: policy?.mode || "DAILY",
    dailyComputationStrategy: policy?.dailyComputationStrategy || "MANUAL",
    selectedPeriodIds: policy?.selectedPeriodIds || [],
    lateThresholdMinutes: policy ? policy.lateThresholdMinutes : 15,
    earlyLeaveThresholdMinutes: policy ? policy.earlyLeaveThresholdMinutes : 15,
    autoAbsentAfterMinutes: policy?.autoAbsentAfterMinutes,
    absentIfMissedPeriodsCount: policy?.absentIfMissedPeriodsCount,
    allowExcuses: policy?.allowExcuses ?? true,
    requireExcuseReason: policy?.requireExcuseReason ?? false,
    requireAttachmentForExcuse: policy?.requireAttachmentForExcuse ?? false,
    notifyTeachers: policy?.notifyTeachers ?? true,
    notifyStudents: policy?.notifyStudents ?? false,
    notifyGuardians: policy?.notifyGuardians ?? true,
    notifyOnAbsent: policy?.notifyOnAbsent ?? true,
    notifyOnLate: policy?.notifyOnLate ?? true,
    notifyOnEarlyLeave: policy?.notifyOnEarlyLeave ?? false,
    effectiveStartDate: policy?.effectiveStartDate ?? null,
    effectiveEndDate: policy?.effectiveEndDate ?? null,
    isActive: policy?.isActive ?? true,
  });

  // Available periods from timetable config
  const [availablePeriods, setAvailablePeriods] = useState<TimetablePeriod[]>(
    [],
  );
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  const getDefaultPeriodIds = (periods: TimetablePeriod[]) =>
    periods.length >= 2
      ? [periods[0].id, periods[1].id]
      : periods.length === 1
        ? [periods[0].id]
        : [];

  // Reset form when dialog opens/closes or policy changes
  useEffect(() => {
    if (isOpen && policy) {
      setFormData({
        yearId: policy.yearId,
        termId: policy.termId,
        nameAr: policy.nameAr,
        nameEn: policy.nameEn,
        descriptionAr: policy.descriptionAr || "",
        descriptionEn: policy.descriptionEn || "",
        notes: policy.notes || "",
        scopeType: policy.scopeType,
        scopeIds: policy.scopeIds || {},
        mode: policy.mode,
        dailyComputationStrategy: policy.dailyComputationStrategy || "MANUAL",
        selectedPeriodIds: policy.selectedPeriodIds || [],
        lateThresholdMinutes: policy.lateThresholdMinutes,
        earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes,
        autoAbsentAfterMinutes: policy.autoAbsentAfterMinutes,
        absentIfMissedPeriodsCount: policy.absentIfMissedPeriodsCount,
        allowExcuses: policy.allowExcuses,
        requireExcuseReason: policy.requireExcuseReason,
        requireAttachmentForExcuse: policy.requireAttachmentForExcuse,
        notifyTeachers: policy.notifyTeachers,
        notifyStudents: policy.notifyStudents,
        notifyGuardians: policy.notifyGuardians,
        notifyOnAbsent: policy.notifyOnAbsent,
        notifyOnLate: policy.notifyOnLate,
        notifyOnEarlyLeave: policy.notifyOnEarlyLeave,
        effectiveStartDate: policy.effectiveStartDate,
        effectiveEndDate: policy.effectiveEndDate,
        isActive: policy.isActive,
      });
      setIsDirty(false);
      setActiveStep(0);
      setErrors({});
      setNameValidationStatus("idle");
      nameValidationRequestId.current += 1;
    } else if (isOpen && !policy) {
      setFormData({
        yearId: term?.yearId || "",
        termId: term?.id || "",
        nameAr: "",
        nameEn: "",
        descriptionAr: "",
        descriptionEn: "",
        notes: "",
        scopeType: "SCHOOL",
        scopeIds: {},
        mode: "DAILY",
        dailyComputationStrategy: "MANUAL",
        selectedPeriodIds: [],
        lateThresholdMinutes: 15,
        earlyLeaveThresholdMinutes: 15,
        autoAbsentAfterMinutes: undefined, // Not used anymore
        absentIfMissedPeriodsCount: 1,
        allowExcuses: true,
        requireExcuseReason: false,
        requireAttachmentForExcuse: false,
        notifyTeachers: true,
        notifyStudents: false,
        notifyGuardians: true,
        notifyOnAbsent: true,
        notifyOnLate: true,
        notifyOnEarlyLeave: false,
        effectiveStartDate: term?.startDate || "",
        effectiveEndDate: term?.endDate || "",
        isActive: true,
      });
      setIsDirty(false);
      setActiveStep(0);
      setErrors({});
      setNameValidationStatus("idle");
      nameValidationRequestId.current += 1;
    }
  }, [isOpen, policy, term]);

  useEffect(() => {
    if (
      !isOpen ||
      (formData.mode !== "PERIOD" &&
        formData.dailyComputationStrategy !== "DERIVED_FROM_PERIODS") ||
      availablePeriods.length === 0
    )
      return;

    setFormData((prev) => {
      const selectedPeriodIds = prev.selectedPeriodIds || [];
      const migratedPeriodIds = selectedPeriodIds.map((id) => {
        const match = id.match(/^period-(\d+)$/);
        if (!match) return id;

        const period = availablePeriods.find(
          (item) => item.index === Number(match[1]),
        );
        return period?.id || id;
      });
      const availablePeriodIds = new Set(
        availablePeriods.map((period) => period.id),
      );
      const scopedPeriodIds = migratedPeriodIds.filter((id) =>
        availablePeriodIds.has(id),
      );

      const nextPeriodIds =
        scopedPeriodIds.length > 0
          ? scopedPeriodIds
          : policy
            ? []
            : getDefaultPeriodIds(availablePeriods);

      if (
        nextPeriodIds.length === selectedPeriodIds.length &&
        nextPeriodIds.every((id, index) => id === selectedPeriodIds[index])
      ) {
        return prev;
      }

      return {
        ...prev,
        selectedPeriodIds: nextPeriodIds,
        absentIfMissedPeriodsCount:
          prev.absentIfMissedPeriodsCount || nextPeriodIds.length || 1,
      };
    });
  }, [isOpen, policy, availablePeriods, formData.mode, formData.dailyComputationStrategy]);

  async function loadAvailablePeriods(requestId: number) {
    if (!term) return;

    // Do not query timetable data while the hierarchy target is incomplete.
    // The request should start only after the selected policy scope is valid.
    if (!isScopeSelectionComplete(formData.scopeType, formData.scopeIds)) {
      if (periodsRequestId.current === requestId) {
        setAvailablePeriods([]);
        setIsLoadingPeriods(false);
      }
      return;
    }

    setIsLoadingPeriods(true);
    try {
      const targetId =
        formData.scopeType === "GRADE"
          ? formData.scopeIds?.gradeId
          : formData.scopeType === "SECTION"
            ? formData.scopeIds?.sectionId
            : formData.scopeType === "CLASSROOM"
              ? formData.scopeIds?.classroomId
              : undefined;

      const targetScopeType =
        formData.scopeType === "SCHOOL"
          ? "TERM"
          : formData.scopeType === "GRADE" ||
              formData.scopeType === "SECTION" ||
              formData.scopeType === "CLASSROOM"
            ? formData.scopeType
            : null;

      // School policies use the term timetable; stage has no timetable scope.
      if (
        !targetScopeType ||
        (targetScopeType !== "TERM" && !targetId)
      ) {
        if (periodsRequestId.current === requestId) {
          setAvailablePeriods([]);
        }
        return;
      }

      const targetConfig = await fetchTimetableConfig({
        academicYearId: formData.yearId || term.yearId,
        termId: term.id,
        scopeType: targetScopeType,
        ...(targetScopeType === "GRADE" ? { gradeId: targetId } : {}),
        ...(targetScopeType === "SECTION" ? { sectionId: targetId } : {}),
        ...(targetScopeType === "CLASSROOM" ? { classroomId: targetId } : {}),
      });

      // A missing target config must remain empty; do not silently fall back
      // to synthetic default periods for a real policy scope.
      if (periodsRequestId.current === requestId) {
        setAvailablePeriods(targetConfig?.periods || []);
      }
    } catch (error) {
      console.error("Failed to load periods:", error);
      if (periodsRequestId.current === requestId) {
        setAvailablePeriods([]);
      }
    } finally {
      if (periodsRequestId.current === requestId) {
        setIsLoadingPeriods(false);
      }
    }
  }

  // Load periods when dialog opens or scope changes (always needed now)
  useEffect(() => {
    const requestId = periodsRequestId.current + 1;
    periodsRequestId.current = requestId;

    if (
      !isOpen ||
      !term ||
      (formData.mode !== "PERIOD" &&
        formData.dailyComputationStrategy !== "DERIVED_FROM_PERIODS")
    ) {
      setAvailablePeriods([]);
      return;
    }

    setAvailablePeriods([]);
    void loadAvailablePeriods(requestId);

    return () => {
      if (periodsRequestId.current === requestId) {
        periodsRequestId.current += 1;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    formData.mode,
    formData.dailyComputationStrategy,
    formData.scopeType,
    formData.scopeIds,
    term,
  ]);

  const handleFieldChange = (
    field: keyof PolicyFormData,
    value: PolicyFormData[keyof PolicyFormData],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (
      [
        "yearId",
        "termId",
        "nameAr",
        "nameEn",
        "scopeType",
        "scopeIds",
      ].includes(field)
    ) {
      nameValidationRequestId.current += 1;
      setNameValidationStatus("idle");
    }
    if (field === "notifyGuardians") {
      setFormData((prev) => ({ ...prev, notifyOnAbsent: value as boolean }));
    }
    if (field === "notifyOnAbsent") {
      setFormData((prev) => ({ ...prev, notifyGuardians: value as boolean }));
    }
    if (["scopeType", "scopeIds", "isActive"].includes(field)) {
      setErrors((current) => {
        const next = { ...current };
        delete next.scopeConflict;
        return next;
      });
    }
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const applyNameValidationResponse = (
    validationResponse: PolicyNameValidationResult,
  ) => {
    setErrors((current) => {
      const next = { ...current };
      delete next.nameAr;
      delete next.nameEn;
      delete next.nameValidation;
      if (!validationResponse.uniqueAr)
        next.nameAr = tValidation("uniqueNameAr");
      if (!validationResponse.uniqueEn)
        next.nameEn = tValidation("uniqueNameEn");
      return next;
    });
    setNameValidationStatus("success");
    return (
      validationResponse.available &&
      validationResponse.uniqueAr &&
      validationResponse.uniqueEn
    );
  };

  const runNameValidation = async (): Promise<boolean> => {
    if (!formData.nameAr.trim() || !formData.nameEn.trim()) return false;

    const requestId = nameValidationRequestId.current + 1;
    nameValidationRequestId.current = requestId;
    setNameValidationStatus("checking");
    setErrors((current) => {
      const next = { ...current };
      delete next.nameValidation;
      return next;
    });

    try {
      const validationResponse = await validatePolicyName({
        academicYearId: formData.yearId,
        termId: formData.termId,
        scopeType: formData.scopeType,
        scopeIds: formData.scopeIds,
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim(),
        excludeId: policy?.id,
      });
      if (nameValidationRequestId.current !== requestId) return false;
      return applyNameValidationResponse(validationResponse);
    } catch (error) {
      if (nameValidationRequestId.current !== requestId) return false;
      console.error("Failed to validate attendance policy name:", error);
      setNameValidationStatus("error");
      setErrors((current) => ({
        ...current,
        nameValidation: tValidation("nameValidationUnavailable"),
      }));
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Step 1: Basic Info
      if (!formData.nameAr.trim()) {
        newErrors.nameAr = tValidation("nameArRequired");
      }
      if (!formData.nameEn.trim()) {
        newErrors.nameEn = tValidation("nameEnRequired");
      }
    } else if (step === 1) {
      // Step 2: Scope
      for (const field of getScopeSelectionMissingFields(
        formData.scopeType,
        formData.scopeIds,
      )) {
        newErrors[field] = tValidation("required");
      }
    } else if (step === 2 && formData.dailyComputationStrategy === "DERIVED_FROM_PERIODS") {
      // The backend requires periods only for derived daily computation.
      if (
        !formData.selectedPeriodIds ||
        formData.selectedPeriodIds.length === 0
      ) {
        newErrors.selectedPeriodIds = tValidation("periodsRequired");
      }
    } else if (step === 3) {
      // Step 4: Rules
      if (
        formData.lateThresholdMinutes !== null &&
        formData.lateThresholdMinutes < 0
      ) {
        newErrors.lateThresholdMinutes = tValidation("nonNegative");
      }
      if (
        formData.earlyLeaveThresholdMinutes !== null &&
        formData.earlyLeaveThresholdMinutes < 0
      ) {
        newErrors.earlyLeaveThresholdMinutes = tValidation("nonNegative");
      }

      // The backend requires this threshold only for derived daily computation.
      if (
        formData.dailyComputationStrategy === "DERIVED_FROM_PERIODS" &&
        (formData.absentIfMissedPeriodsCount == null ||
          formData.absentIfMissedPeriodsCount < 1)
      ) {
        newErrors.absentIfMissedPeriodsCount = tValidation("thresholdRequired");
      } else if (
        formData.dailyComputationStrategy === "DERIVED_FROM_PERIODS" &&
        formData.absentIfMissedPeriodsCount != null &&
        formData.selectedPeriodIds &&
        formData.absentIfMissedPeriodsCount > formData.selectedPeriodIds.length
      ) {
        newErrors.absentIfMissedPeriodsCount = tValidation(
          "thresholdOutOfRange",
          {
            max: formData.selectedPeriodIds.length,
          },
        );
      }
    } else if (step === 4) {
      // Step 5: Dates & Review
      if (formData.effectiveStartDate && formData.effectiveEndDate) {
        if (formData.effectiveStartDate > formData.effectiveEndDate) {
          newErrors.effectiveEndDate = tValidation("startBeforeEnd");
        }

      }

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) return;
    if (activeStep === 0 && !(await runNameValidation())) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!validateStep(activeStep)) return;
    if (!(await runNameValidation())) {
      setActiveStep(0);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error("Failed to save policy:", error);
      if (isAttendancePolicyConflict(error)) {
        setErrors((current) => ({
          ...current,
          scopeConflict: t(
            formData.scopeType === "CLASSROOM"
              ? "scopeConflict.classroom"
              : "scopeConflict.generic",
          ),
        }));
        setActiveStep(1);
      } else if (isApiError(error)) {
        const details = error.details as { field?: string } | undefined;
        const field = details?.field;
        if (field === "selectedPeriodIds") {
          setErrors((current) => ({ ...current, selectedPeriodIds: error.message }));
          setActiveStep(2);
        } else if (field) {
          setErrors((current) => ({ ...current, [field]: error.message }));
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    onClose();
  };

  const steps = [
    {
      title: t("steps.basicInfo.title"),
      subtitle: t("steps.basicInfo.subtitle"),
    },
    { title: t("steps.scope.title"), subtitle: t("steps.scope.subtitle") },
    { title: t("steps.mode.title"), subtitle: t("steps.mode.subtitle") },
    { title: t("steps.rules.title"), subtitle: t("steps.rules.subtitle") },
    { title: t("steps.review.title"), subtitle: t("steps.review.subtitle") },
  ];

  const isEditing = !!policy;

  // Filtered grades and sections based on selection
  const filteredGrades = useMemo(() => {
    if (!formData.scopeIds?.stageId) return grades;
    return grades.filter((g) => g.stageId === formData.scopeIds?.stageId);
  }, [grades, formData.scopeIds?.stageId]);

  const filteredSections = useMemo(() => {
    if (!formData.scopeIds?.gradeId) return sections;
    return sections.filter((s) => s.gradeId === formData.scopeIds?.gradeId);
  }, [sections, formData.scopeIds?.gradeId]);

  const filteredClassrooms = useMemo(() => {
    if (!formData.scopeIds?.sectionId) return classrooms;
    return classrooms.filter(
      (item) => item.sectionId === formData.scopeIds?.sectionId,
    );
  }, [classrooms, formData.scopeIds?.sectionId]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditing ? t("editPolicy") : t("createPolicy")}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button onClick={handleClose} variant="ghost">
              {tCommon("cancel")}
            </Button>
            <div className="flex gap-2">
              {activeStep > 0 && (
                <Button onClick={handleBack} variant="secondary">
                  {t("back")}
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  disabled={nameValidationStatus === "checking"}
                  loading={
                    activeStep === 0 && nameValidationStatus === "checking"
                  }
                >
                  {t("next")}
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isReadOnly || !canManagePolicies || isSaving}
                  loading={isSaving}
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {tCommon("save")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto">
          {/* Stepper */}
          <WizardStepper
            steps={steps}
            activeStep={activeStep}
            locale={locale}
          />

          {/* Step Content */}
          <div className="min-h-[400px] py-6">
            {activeStep === 0 && (
              <Step1BasicInfo
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly || !canManagePolicies}
                onFieldChange={handleFieldChange}
                onNameBlur={() => void runNameValidation()}
                onRetryNameValidation={() => void runNameValidation()}
                nameValidationStatus={nameValidationStatus}
                nameValidationError={errors.nameValidation}
              />
            )}

            {activeStep === 1 && (
              <Step2Scope
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly || !canManagePolicies}
                stages={stages}
                filteredGrades={filteredGrades}
                filteredSections={filteredSections}
                filteredClassrooms={filteredClassrooms}
                onFieldChange={handleFieldChange}
                conflictError={errors.scopeConflict}
              />
            )}

            {activeStep === 2 && (
              <Step3ModeComputation
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly || !canManagePolicies}
                availablePeriods={availablePeriods}
                isLoadingPeriods={isLoadingPeriods}
                onFieldChange={handleFieldChange}
              />
            )}

            {activeStep === 3 && (
              <Step4Rules
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly || !canManagePolicies}
                onFieldChange={handleFieldChange}
              />
            )}

            {activeStep === 4 && (
              <Step5Review
                formData={formData}
                errors={errors}
                isReadOnly={isReadOnly || !canManagePolicies}
                term={term}
                onFieldChange={handleFieldChange}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={handleDiscardChanges}
        title={t("unsavedChangesTitle")}
        description={t("unsavedChangesDesc")}
        confirmLabel={t("discard")}
        cancelLabel={t("stay")}
        severity="warning"
      />
    </>
  );
}

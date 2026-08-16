"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAcademicStructureTree,
  type AcademicStructureClassroom,
  type AcademicStructureGrade,
  type AcademicStructureSection,
} from "@/features/academics/services/academicStructureApiService";
import {
  getApplicationRegistrationHandoff,
  registerApplication,
} from "../api/applicationRegistrationApi";
import type {
  RegisterApplicationResponseDto,
  RegistrationHandoffResponseDto,
} from "../api/registrationDtos";
import {
  buildRegistrationRequest,
  emptyGuardian,
  emptyRegistrationForm,
  getRegistrationValidationIssues,
  isRegistrationFormValid,
  registrationFormFromHandoff,
  type RegistrationGuardianFormState,
  type RegistrationFormState,
} from "../model/registrationForm";

interface RegistrationContext {
  handoff: RegistrationHandoffResponseDto;
  grades: AcademicStructureGrade[];
  sections: AcademicStructureSection[];
  classrooms: AcademicStructureClassroom[];
}

interface RegistrationHookOptions {
  applicationId: string;
  studentName: string;
  academicYearId: string | null;
  termId: string | null;
  enabled: boolean;
}

async function loadRegistrationContext(
  applicationId: string,
  academicYearId: string | null,
  termId: string | null,
): Promise<RegistrationContext> {
  const structurePromise = academicYearId && termId
    ? fetchAcademicStructureTree({ yearId: academicYearId, termId })
    : Promise.resolve({ grades: [], sections: [], classrooms: [] });
  const [handoff, structure] = await Promise.all([
    getApplicationRegistrationHandoff(applicationId),
    structurePromise,
  ]);
  return { handoff, ...structure };
}

export function useApplicationRegistration({
  applicationId,
  studentName,
  academicYearId,
  termId,
  enabled,
}: RegistrationHookOptions) {
  const [form, setForm] = useState(() => emptyRegistrationForm(studentName));
  const [context, setContext] = useState<RegistrationContext | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      setIsLoading(true);
      setError(null);
    });
    void loadRegistrationContext(applicationId, academicYearId, termId)
      .then((loadedContext) => {
        if (cancelled) return;
        setContext(loadedContext);
        setForm((current) => registrationFormFromHandoff(
          current,
          loadedContext.handoff,
          loadedContext.handoff.wizardDraft?.enrollment?.gradeId ??
            loadedContext.handoff.source?.application?.requestedGradeId ??
            loadedContext.handoff.source?.applicantRequest?.requestedGradeId ??
            null,
        ));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(errorMessage(loadError, "Failed to prepare registration."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [academicYearId, applicationId, enabled, termId]);

  const updateField = useCallback(
    <Key extends keyof RegistrationFormState>(key: Key, fieldValue: RegistrationFormState[Key]) => {
      setForm((current) => ({ ...current, [key]: fieldValue }));
    },
    [],
  );

  const updateGuardian = useCallback(
    <Key extends keyof RegistrationGuardianFormState>(
      index: number,
      key: Key,
      fieldValue: RegistrationGuardianFormState[Key],
    ) => {
      setForm((current) => ({
        ...current,
        guardians: current.guardians.map((guardian, guardianIndex) =>
          guardianIndex === index ? { ...guardian, [key]: fieldValue } : guardian,
        ),
      }));
    },
    [],
  );

  const addGuardian = useCallback(() => {
    setForm((current) => ({
      ...current,
      guardians: [...current.guardians, emptyGuardian(false)],
    }));
  }, []);

  const removeGuardian = useCallback((index: number) => {
    setForm((current) => {
      if (current.guardians.length === 1) return current;
      const nextGuardians = current.guardians.filter((_, guardianIndex) => guardianIndex !== index);
      if (!nextGuardians.some((guardian) => guardian.isPrimary)) {
        nextGuardians[0] = { ...nextGuardians[0], isPrimary: true };
      }
      return { ...current, guardians: nextGuardians };
    });
  }, []);

  const setPrimaryGuardian = useCallback((index: number) => {
    setForm((current) => ({
      ...current,
      guardians: current.guardians.map((guardian, guardianIndex) => ({
        ...guardian,
        isPrimary: guardianIndex === index,
      })),
    }));
  }, []);

  const validationIssues = getRegistrationValidationIssues(form, academicYearId, termId);

  const submit = async (): Promise<RegisterApplicationResponseDto | null> => {
    if (validationIssues.length > 0) {
      setError(`validation.${validationIssues[0]}`);
      return null;
    }
    if (!academicYearId || !termId) return null;
    setIsSubmitting(true);
    setError(null);
    try {
      return await registerApplication(
        applicationId,
        buildRegistrationRequest(form, academicYearId, termId),
      );
    } catch (submitError) {
      setError(errorMessage(submitError, "Registration failed."));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    updateField,
    updateGuardian,
    addGuardian,
    removeGuardian,
    setPrimaryGuardian,
    context,
    isLoading,
    isSubmitting,
    error,
    validationIssues,
    isValid: isRegistrationFormValid(form, academicYearId, termId),
    submit,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

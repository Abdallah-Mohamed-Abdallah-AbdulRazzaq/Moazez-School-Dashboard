"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setupSteps } from "../config/setupSteps";
import type { SetupEvaluation, SetupSnapshot, SetupStepId } from "../types";
import type { UseSetupStatusResult } from "../hooks/useSetupStatus";
import { SetupGuide, type SetupGuideCopy } from "./SetupGuide";
import {
  OrganizationSetupStep,
  type OrganizationSetupStepCopy,
} from "./steps/OrganizationSetupStep";
import {
  AcademicContextSetupStep,
  type AcademicContextSetupStepCopy,
} from "./steps/AcademicContextSetupStep";
import {
  AcademicStructureSetupStep,
  type AcademicStructureSetupStepCopy,
} from "./steps/AcademicStructureSetupStep";
import {
  SubjectsSetupStep,
  type SubjectsSetupStepCopy,
} from "./steps/SubjectsSetupStep";
import { RoomsSetupStep, type RoomsSetupStepCopy } from "./steps/RoomsSetupStep";

const emptyAcademicContext = { years: [], termsByYear: {} };
const emptyStructure = { stages: [], grades: [], sections: [], classrooms: [] };
const emptySubjects = { subjects: [], allocations: [] };

interface SetupStepCopies {
  organization: OrganizationSetupStepCopy;
  academicContext: AcademicContextSetupStepCopy;
  structure: AcademicStructureSetupStepCopy;
  subjects: SubjectsSetupStepCopy;
  rooms: RoomsSetupStepCopy;
}

function firstSelectableStep(evaluation: SetupEvaluation): SetupStepId {
  return (
    setupSteps.find((definition) => evaluation.steps[definition.id].status !== "locked")?.id ??
    "organization"
  );
}

function createStepContent(
  result: UseSetupStatusResult,
  snapshot: SetupSnapshot,
  copy: SetupStepCopies,
) {
  const academicData =
    snapshot.academicContext.status === "success"
      ? snapshot.academicContext.data
      : snapshot.academicContext.data ?? emptyAcademicContext;
  const structure =
    snapshot.structure.status === "success"
      ? snapshot.structure.data
      : snapshot.structure.data ?? emptyStructure;
  const subjectsData =
    snapshot.subjects.status === "success"
      ? snapshot.subjects.data
      : snapshot.subjects.data ?? emptySubjects;
  const rooms = snapshot.rooms.status === "success" ? snapshot.rooms.data : snapshot.rooms.data ?? [];

  return {
    organization: (
      <OrganizationSetupStep
        copy={copy.organization}
        profile={snapshot.organization.status === "success" ? snapshot.organization.data : null}
        refreshStep={result.refreshStep}
      />
    ),
    academicContext: (
      <AcademicContextSetupStep
        copy={copy.academicContext}
        data={academicData}
        refreshStep={result.refreshStep}
        selectedYear={result.selectedYear}
      />
    ),
    structure: (
      <AcademicStructureSetupStep
        copy={copy.structure}
        refreshStep={result.refreshStep}
        termId={result.selectedTerm?.id ?? ""}
        tree={structure}
        yearId={result.selectedYear?.id ?? ""}
      />
    ),
    subjects: (
      <SubjectsSetupStep
        copy={copy.subjects}
        grades={structure.grades}
        refreshStep={result.refreshStep}
        subjectsData={subjectsData}
        termId={result.selectedTerm?.id ?? ""}
      />
    ),
    rooms: (
      <RoomsSetupStep
        copy={copy.rooms}
        refreshStep={result.refreshStep}
        rooms={rooms}
        schoolId={result.schoolId}
      />
    ),
  };
}

interface SetupGuideContentProps {
  result: UseSetupStatusResult;
  title?: string;
}

export function SetupGuideContent({ result, title }: SetupGuideContentProps) {
  const t = useTranslations("onboarding");
  const [selectedStepId, setSelectedStepId] = useState<SetupStepId>(() =>
    firstSelectableStep(result.evaluation),
  );
  const copy: SetupGuideCopy = {
    title: title ?? t("guide.cardTitle"),
    progressLabel: t("guide.progressLabel"),
    progressText: (completed, total, percent) =>
      t("guide.progressText", { completed, total, percent }),
    stepError: t("errors.stepLoadFailed"),
    retry: t("guide.retry"),
    lockedPrefix: t("guide.lockedPrefix"),
    statuses: {
      complete: t("guide.statuses.complete"),
      available: t("guide.statuses.available"),
      locked: t("guide.statuses.locked"),
      loading: t("guide.statuses.loading"),
      error: t("guide.statuses.error"),
    },
    steps: {
      organization: {
        title: t("steps.organization.title"),
        description: t("steps.organization.description"),
      },
      academicContext: {
        title: t("steps.academicContext.title"),
        description: t("steps.academicContext.description"),
      },
      structure: {
        title: t("steps.structure.title"),
        description: t("steps.structure.description"),
      },
      subjects: {
        title: t("steps.subjects.title"),
        description: t("steps.subjects.description"),
      },
      rooms: {
        title: t("steps.rooms.title"),
        description: t("steps.rooms.description"),
      },
    },
  };
  const stepCopies: SetupStepCopies = {
    organization: {
      summary: t("steps.organization.summary"),
      savedData: t("steps.organization.savedData"),
      editBranding: t("steps.organization.editBranding"),
      cancel: t("steps.organization.cancel"),
      save: t("steps.organization.save"),
      saving: t("steps.organization.saving"),
      completeness: (percent) =>
        t("steps.organization.completeness", { percent }),
      noLogo: t("steps.organization.noLogo"),
      noLocation: t("steps.organization.noLocation"),
      editor: {
        schoolName: t("steps.organization.schoolName"),
        shortName: t("steps.organization.shortName"),
        timezone: t("steps.organization.timezone"),
        address: t("steps.organization.addressLine"),
        city: t("steps.organization.city"),
        country: t("steps.organization.country"),
        footerSignature: t("steps.organization.footerSignature"),
        uploadLogo: t("steps.organization.uploadLogo"),
        uploadHint: t("steps.organization.uploadHint"),
        removeLogo: t("steps.organization.removeLogo"),
        removeLogoTitle: t("steps.organization.removeLogoTitle"),
        removeLogoDescription: t("steps.organization.removeLogoDescription"),
        confirmRemoveLogo: t("steps.organization.confirmRemoveLogo"),
        cancel: t("steps.organization.cancel"),
        pickFromMap: t("steps.organization.pickFromMap"),
        clearLocation: t("steps.organization.clearLocation"),
        selectedLocation: t("steps.organization.formattedAddress"),
        noLocation: t("steps.organization.noLocation"),
        locationStale: t("steps.organization.locationStale"),
        coordinates: (lat, lng) =>
          t("steps.organization.coordinates", { lat, lng }),
        logoUploadFailed: t("steps.organization.logoUploadFailed"),
        logoDeleteFailed: t("steps.organization.logoDeleteFailed"),
        logoUploaded: t("steps.organization.logoUploaded"),
        logoRemoved: t("steps.organization.logoRemoved"),
        validation: {
          schoolName: t("steps.organization.required"),
          shortName: t("steps.organization.shortNameRequired"),
          timezone: t("steps.organization.timezoneRequired"),
          addressLine: t("steps.organization.locationRequired"),
          city: t("steps.organization.cityRequired"),
          country: t("steps.organization.countryRequired"),
          footerSignature: t("steps.organization.footerRequired"),
          logoUrl: t("steps.organization.logoRequired"),
        },
      },
    },
    academicContext: {
      summary: t("steps.academicContext.summary"),
      yearsCount: (count) => t("steps.academicContext.yearsCount", { count }),
      termsCount: (count) => t("steps.academicContext.termsCount", { count }),
      createdContexts: t("steps.academicContext.createdContexts"),
      noTerms: t("steps.academicContext.noTerms"),
      progressLabel: t("steps.academicContext.progressLabel"),
      progressText: (completed, total) =>
        t("steps.academicContext.progressText", { completed, total }),
      academicYear: t("steps.academicContext.academicYear"),
      term: t("steps.academicContext.term"),
      done: t("steps.academicContext.done"),
      remaining: t("steps.academicContext.remaining"),
      manage: t("steps.academicContext.manage"),
      edit: t("steps.academicContext.edit"),
      createYear: t("steps.academicContext.createYear"),
      createTerm: t("steps.academicContext.createTerm"),
    },
    structure: {
      summary: t("steps.structure.summary"),
      stageTitle: t("steps.structure.stageTitle"),
      gradeTitle: t("steps.structure.gradeTitle"),
      sectionTitle: t("steps.structure.sectionTitle"),
      classroomTitle: t("steps.structure.classroomTitle"),
      nameAr: t("steps.structure.nameAr"),
      nameEn: t("steps.structure.nameEn"),
      save: t("steps.structure.save"),
      saving: t("steps.structure.saving"),
      required: t("steps.structure.required"),
      saveFailed: t("steps.structure.saveFailed"),
      stageCreated: t("steps.structure.stageCreated"),
      gradeCreated: t("steps.structure.gradeCreated"),
      sectionCreated: t("steps.structure.sectionCreated"),
      classroomCreated: t("steps.structure.classroomCreated"),
      complete: t("steps.structure.complete"),
      progressLabel: t("steps.structure.progressLabel"),
      progressText: (completed, total) =>
        t("steps.structure.progressText", { completed, total }),
      stage: t("steps.structure.stage"),
      grade: t("steps.structure.grade"),
      section: t("steps.structure.section"),
      classroom: t("steps.structure.classroom"),
      done: t("steps.structure.done"),
      remaining: t("steps.structure.remaining"),
      manage: t("steps.structure.manage"),
    },
    subjects: {
      summary: t("steps.subjects.summary"),
      createSubject: t("steps.subjects.createSubject"),
      grade: t("steps.subjects.grade"),
      subject: t("steps.subjects.subject"),
      weeklyHours: t("steps.subjects.weeklyHours"),
      saveAllocation: t("steps.subjects.saveAllocation"),
      saving: t("steps.subjects.saving"),
      saveFailed: t("steps.subjects.saveFailed"),
      manage: t("steps.subjects.manage"),
    },
    rooms: {
      summary: t("steps.rooms.summary"),
      createRoom: t("steps.rooms.createRoom"),
      missingSchool: t("steps.rooms.missingSchool"),
      saveFailed: t("steps.rooms.saveFailed"),
      manage: t("steps.rooms.manage"),
    },
  };
  const effectiveSelectedStepId =
    result.evaluation.steps[selectedStepId].status === "locked"
      ? firstSelectableStep(result.evaluation)
      : selectedStepId;

  return (
    <SetupGuide
      copy={copy}
      evaluation={result.evaluation}
      onRetryStep={result.retryStep}
      onSelectStep={setSelectedStepId}
      selectedStepId={effectiveSelectedStepId}
      stepContent={createStepContent(result, result.snapshot, stepCopies)}
    />
  );
}

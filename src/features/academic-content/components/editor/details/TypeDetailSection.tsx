"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import {
  loadAcademicContentDetailOptions,
  type AcademicContentDetailOptions,
} from "../../../services/academicContentDetailOptions";
import type {
  AcademicContentDetail,
  ReplaceAcademicContentGuardianNoteDetailRequest,
  ReplaceAcademicContentOnlineSessionDetailRequest,
  ReplaceAcademicContentPreparationDetailRequest,
  ReplaceAcademicContentSubjectResourceDetailRequest,
  ReplaceAcademicContentWeeklyPlanDetailRequest,
} from "../../../types/contracts";
import GeneralResourceNotice from "./GeneralResourceNotice";
import GuardianWeeklyNoteForm from "./GuardianWeeklyNoteForm";
import OnlineSessionForm from "./OnlineSessionForm";
import SubjectResourceForm from "./SubjectResourceForm";
import TeacherPreparationForm from "./TeacherPreparationForm";
import WeeklyPlanForm from "./WeeklyPlanForm";
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";

interface TypeDetailSectionProps {
  content: AcademicContentDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  termStartDate?: string;
  termEndDate?: string;
  onDirty: () => void;
  onSavePreparation: (request: ReplaceAcademicContentPreparationDetailRequest) => Promise<boolean>;
  onSaveWeeklyPlan: (request: ReplaceAcademicContentWeeklyPlanDetailRequest) => Promise<boolean>;
  onSaveGuardianNote: (request: ReplaceAcademicContentGuardianNoteDetailRequest) => Promise<boolean>;
  onSaveSubjectResource: (request: ReplaceAcademicContentSubjectResourceDetailRequest) => Promise<boolean>;
  onSaveOnlineSession: (request: ReplaceAcademicContentOnlineSessionDetailRequest) => Promise<boolean>;
  loadOptions?: (content: AcademicContentDetail) => Promise<AcademicContentDetailOptions>;
}

export default function TypeDetailSection(props: TypeDetailSectionProps) {
  if (props.content.type === "GENERAL_RESOURCE") {
    return <GeneralResourceNotice />;
  }
  if (props.content.type === "GUARDIAN_WEEKLY_NOTE") {
    return (
      <GuardianWeeklyNoteForm
        initial={props.content.details ?? {
          body: "",
          priority: "NORMAL",
          requiresAcknowledgement: false,
        }}
        disabled={props.disabled}
        sectionState={props.sectionState}
        onDirty={props.onDirty}
        onSave={props.onSaveGuardianNote}
      />
    );
  }

  return <LoadedTypeDetailSection {...props} />;
}

function LoadedTypeDetailSection(props: TypeDetailSectionProps) {
  const { content, disabled, sectionState, onDirty } = props;
  const [options, setOptions] = useState<AcademicContentDetailOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const t = useAcademicContentTranslations("details");

  useEffect(() => {
    let active = true;
    void (props.loadOptions ?? loadAcademicContentDetailOptions)(content)
      .then((loadedOptions) => {
        if (active) setOptions(loadedOptions);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : t("references_unavailable"),
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [content, props.loadOptions, retryKey, t]);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
          {t("loading_references")}
        </div>
      </section>
    );
  }

  if (loadError || !options) {
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-700">{loadError ?? t("references_unavailable")}</p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            setLoadError(null);
            setIsLoading(true);
            setRetryKey((key) => key + 1);
          }}
        >
          {t("retry_references")}
        </Button>
      </section>
    );
  }

  switch (content.type) {
    case "TEACHER_PREPARATION":
      return (
        <TeacherPreparationForm
          initial={content.details ?? {
            topic: null,
            objectives: [],
            learningOutcomes: [],
            teachingStrategies: [],
            activities: [],
            resourceNotes: null,
            assessmentNotes: null,
            teacherNotes: null,
            curriculumId: null,
            curriculumUnitId: null,
            curriculumLessonId: null,
            lessonPlanId: null,
            lessonPlanItemId: null,
            timetableEntryId: null,
          }}
          disabled={disabled}
          sectionState={sectionState}
          options={options}
          onDirty={onDirty}
          onSave={props.onSavePreparation}
        />
      );
    case "WEEKLY_PLAN":
      return (
        <WeeklyPlanForm
          initial={content.details ?? {
            weekStartDate: props.termStartDate ?? "",
            weekEndDate: props.termStartDate ?? "",
            objectives: [],
            topics: [],
            expectedHomework: null,
            upcomingAssessments: null,
            notes: null,
            homeworkAssignmentIds: [],
            gradeAssessmentIds: [],
          }}
          termStartDate={props.termStartDate}
          termEndDate={props.termEndDate}
          options={options}
          disabled={disabled}
          sectionState={sectionState}
          onDirty={onDirty}
          onSave={props.onSaveWeeklyPlan}
        />
      );
    case "GUARDIAN_WEEKLY_NOTE":
      return null;
    case "SUBJECT_RESOURCE":
      return (
        <SubjectResourceForm
          initial={content.details ?? {
            resourceCategory: "WORKSHEET",
            curriculumId: null,
            curriculumUnitId: null,
            curriculumLessonId: null,
          }}
          disabled={disabled}
          sectionState={sectionState}
          options={options}
          onDirty={onDirty}
          onSave={props.onSaveSubjectResource}
        />
      );
    case "ONLINE_SESSION":
      return (
        <OnlineSessionForm
          initial={content.details ?? {
            platform: "GOOGLE_MEET",
            providerName: null,
            joinUrl: "",
            accessCode: null,
            instructions: null,
            startAt: "",
            endAt: "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timetableEntryId: null,
          }}
          disabled={disabled}
          sectionState={sectionState}
          options={options}
          onDirty={onDirty}
          onSave={props.onSaveOnlineSession}
        />
      );
    case "GENERAL_RESOURCE":
      return null;
  }
}

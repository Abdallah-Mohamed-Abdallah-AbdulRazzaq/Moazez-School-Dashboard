"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import {
  AlertCircle,
  Save,
  RotateCcw,
  Settings,
  Sparkles,
  Send,
  EyeOff,
  CheckCircle,
  Clock3,
  School,
  GraduationCap,
} from "lucide-react";
import FilterBar from "./FilterBar";
import TimetableGrid from "./TimetableGrid";
import TimetableCreationStepper from "./TimetableCreationStepper";
import ValidationPanel from "./ValidationPanel";
import EditSlotDialog from "./EditSlotDialog";
import GenerateDialog from "./GenerateDialog";
import TimetableConfigDialog from "./TimetableConfigDialog";
import { AccessDenied, Button } from "@/components/ui";
import { PrintButton, usePrint } from "@/components/print";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useBrandingProfile } from "@/features/settings/hooks/useBrandingProfile";
import { resolveTeacherAllocationForTarget } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { type RoomAssignmentSource } from "@/features/academics/rooms/services/roomsService";
import { TimetableEntry } from "@/features/academics/timetable/types/timetable";
import {
  timetableErrorMessage,
  type TimetableErrorCode,
} from "@/features/academics/timetable/services/timetableErrorHandling";
import { subjectOptionsForGradeAllocations } from "@/features/academics/timetable/services/timetableSlotEditing";
import { hasBlockingValidation } from "@/features/academics/timetable/services/timetableValidationSummary";
import { createTimetablePublishFingerprint } from "@/features/academics/timetable/services/timetablePublishFingerprint";
import {
  resolveTimetableCreationProgress,
  type TimetableCreationAction,
} from "@/features/academics/timetable/services/timetableCreationProgress";
import {
  getDefaultRoomSuggestion as getSuggestedDefaultRoom,
  getRoomSource as resolveRoomSource,
} from "@/features/academics/timetable/utils/roomRecommendations";
import { usePermissions } from "@/hooks/usePermissions";
import { useTimetableData } from "@/features/academics/timetable/hooks/useTimetableData";
import { useTimetableGeneration } from "@/features/academics/timetable/hooks/useTimetableGeneration";
import type {
  Stage,
  Grade,
  Section,
  Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
  formatExportDate,
} from "@/features/academics/utils/exportAdapter";
import AcademicModuleEmptyState from "@/features/academics/components/shared/AcademicModuleEmptyState";

interface TimetableViewProps {
  schoolId: string;
  termId: string;
  termStatus: "open" | "closed";
  isReadOnly: boolean;
  onDirtyChange: (dirty: boolean) => void;
  academicYearId?: string;
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  onStageChange: (stageId: string) => void;
  onGradeChange: (gradeId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onClassroomChange: (classroomId: string) => void;
  onNormalizeSelection: (selection: {
    stageId: string;
    gradeId: string;
    sectionId: string;
    classroomId: string;
  }) => void;
}

export default function TimetableView({
  schoolId,
  termId,
  termStatus,
  isReadOnly,
  onDirtyChange,
  academicYearId = "",
  selectedStageId,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  onStageChange,
  onGradeChange,
  onSectionChange,
  onClassroomChange,
  onNormalizeSelection,
}: TimetableViewProps) {
  const t = useTranslations("academics.timetable");
  const tEmpty = useTranslations("academics.module_empty_states");
  const tRoot = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { profile: brandingProfile } = useBrandingProfile();
  const canViewTimetable = hasPermission("academics.structure.view");
  const translateTimetableError = useCallback(
    (code: TimetableErrorCode) =>
      t(`errors.${code.replace("academics.timetable.", "")}`),
    [t],
  );
  const timetableMessages = useMemo(
    () => ({
      loadFailed: t("errors.loadFailed"),
      saveFailed: t("errors.saveFailed"),
      publishFailed: t("errors.publishFailed"),
      unpublishFailed: t("errors.unpublishFailed"),
      noConfigSelected: t("errors.noConfigSelected"),
      noFilledSlotsToSave: t("errors.noFilledSlotsToSave"),
      noFilledSlotsToPublish: t("errors.noFilledSlotsToPublish"),
      resolveConflictsBeforeSaving: t("errors.resolveConflictsBeforeSaving"),
      resolveConflictsBeforePublishing: t(
        "errors.resolveConflictsBeforePublishing",
      ),
      missingTeacherAllocation: t("errors.invalid_teacher_allocation"),
    }),
    [t],
  );

  const [isDirty, setIsDirty] = useState(false);
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [periodsDialogOpen, setPeriodsDialogOpen] = useState(false);
  const [selectedSectionTabId, setSelectedSectionTabId] = useState<
    string | null
  >(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [printTimestamp] = useState("");
  const printMatrixRef = useRef<HTMLDivElement | null>(null);
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const printTimetable = usePrint({
    contentRef: printMatrixRef,
    title: t("title"),
  });

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    dayKey: string;
    periodIndex: number;
    sectionId: string;
    classroomId: string;
    entry?: TimetableEntry;
  } | null>(null);

  // Generate Dialog State
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Confirm Dialog State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishWithErrors, setPublishWithErrors] = useState(false);
  const [publishFingerprint, setPublishFingerprint] = useState<string | null>(null);

  // We need to fetch dependencies before we can normalize.
  // We can pass a preliminary normalized state to useTimetableData to prevent premature timetable loading.
  const [internalStages, setInternalStages] = useState<Stage[]>([]);
  const [internalGrades, setInternalGrades] = useState<Grade[]>([]);
  const [internalSections, setInternalSections] = useState<Section[]>([]);
  const [internalClassrooms, setInternalClassrooms] = useState<Classroom[]>([]);

  const isScopeSelectionNormalized = useMemo(() => {
    // If dependencies haven't loaded yet, return false UNLESS we have NO selection at all
    if (
      internalStages.length === 0 &&
      internalGrades.length === 0 &&
      internalSections.length === 0
    ) {
      return (
        !selectedStageId &&
        !selectedGradeId &&
        !selectedSectionId &&
        !selectedClassroomId
      );
    }

    const normalizedStageId = internalStages.some(
      (stage) => stage.id === selectedStageId,
    )
      ? selectedStageId
      : "";
    const normalizedGradeId = internalGrades.some(
      (grade) =>
        grade.id === selectedGradeId &&
        (!normalizedStageId || grade.stageId === normalizedStageId),
    )
      ? selectedGradeId
      : "";
    const normalizedSectionId = internalSections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId),
    )
      ? selectedSectionId
      : "";
    const normalizedClassroomId = internalClassrooms.some(
      (classroom) =>
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId),
    )
      ? selectedClassroomId
      : "";

    return (
      normalizedStageId === selectedStageId &&
      normalizedGradeId === selectedGradeId &&
      normalizedSectionId === selectedSectionId &&
      normalizedClassroomId === selectedClassroomId
    );
  }, [
    internalStages,
    internalGrades,
    internalSections,
    internalClassrooms,
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
  ]);

  const {
    stages,
    grades,
    sections,
    classrooms,
    subjects,
    subjectAllocations,
    teachers,
    teacherAllocations,
    rooms,
    roomDefaults,
    timetableEntries,
    setTimetableEntries,
    allTermEntries,
    resolvedConfig,
    config,
    periods,
    apiError,
    isLoading,
    timetableLoading,
    isSaving,
    isPublished,
    publication,
    conflicts: backendConflicts,
    validationSummary,
    reloadConfigs,
    loadTimetable,
    loadConflicts,
    loadValidation,
    loadPublication,
    saveTimetable,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
  } = useTimetableData({
    schoolId,
    termId,
    academicYearId,
    enabled: canViewTimetable,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    isScopeSelectionNormalized,
    showToast,
    translateErrorCode: translateTimetableError,
    messages: timetableMessages,
  });

  const currentPublishFingerprint = useMemo(
    () =>
      config
        ? createTimetablePublishFingerprint({
            configId: config.id,
            scope: {
              gradeId: config.gradeId,
              sectionId: config.sectionId,
              classroomId: config.classroomId,
            },
            activeDays: config.activeDays,
            periods,
            entries: timetableEntries,
          })
        : null,
    [config, periods, timetableEntries],
  );

  const configGuardEntries = useMemo(() => {
    const entriesById = new Map(allTermEntries.map((entry) => [entry.id, entry]));
    timetableEntries.forEach((entry) => entriesById.set(entry.id, entry));
    return [...entriesById.values()];
  }, [allTermEntries, timetableEntries]);

  // Sync internal refs for normalization
  useEffect(() => {
    void Promise.resolve().then(() => {
      setInternalStages(stages);
      setInternalGrades(grades);
      setInternalSections(sections);
      setInternalClassrooms(classrooms);
    });
  }, [stages, grades, sections, classrooms]);
  const { handleGenerate, applyGenerated } = useTimetableGeneration({
    termId,
    selectedSectionId,
    selectedClassroomId,
    resolvedConfig,
    sections,
    subjects,
    subjectAllocations,
    teacherAllocations,
    teachers,
    rooms,
    roomDefaults,
    allTermEntries,
    setTimetableEntries,
    markDirty: () => setIsDirty(true),
    showApplied: (count) =>
      showToast(t("generate.result.applied", { count }), "success"),
  });
  const configIsDraft =
    !config || String(config.status).toLowerCase() === "draft";
  const canManageTimetable =
    canViewTimetable && hasPermission("academics.structure.manage");
  const canWriteTimetable =
    canManageTimetable && termStatus !== "closed" && !isReadOnly;
  const canCreateConfig = canWriteTimetable && configIsDraft;
  const canEditTimetable = canWriteTimetable && configIsDraft;
  const readOnlyBanner = readOnlyBannerMessage({
    configStatus: config?.status,
    termStatus,
    closedTermMessage: t("readOnly.closedTerm"),
    publishedLockedMessage: t("readOnly.publishedLocked"),
  });

  // Update dirty state
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (stages.length === 0 && grades.length === 0 && sections.length === 0) {
      return;
    }

    const normalizedStageId = stages.some(
      (stage) => stage.id === selectedStageId,
    )
      ? selectedStageId
      : "";

    const normalizedGradeId = grades.some(
      (grade) =>
        grade.id === selectedGradeId &&
        (!normalizedStageId || grade.stageId === normalizedStageId),
    )
      ? selectedGradeId
      : "";

    const normalizedSectionId = sections.some(
      (section) =>
        section.id === selectedSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId),
    )
      ? selectedSectionId
      : "";

    const normalizedClassroomId = classrooms.some(
      (classroom) =>
        classroom.id === selectedClassroomId &&
        (!normalizedSectionId || classroom.sectionId === normalizedSectionId),
    )
      ? selectedClassroomId
      : "";

    if (
      normalizedStageId === selectedStageId &&
      normalizedGradeId === selectedGradeId &&
      normalizedSectionId === selectedSectionId &&
      normalizedClassroomId === selectedClassroomId
    ) {
      return;
    }

    onNormalizeSelection({
      stageId: normalizedStageId,
      gradeId: normalizedGradeId,
      sectionId: normalizedSectionId,
      classroomId: normalizedClassroomId,
    });
  }, [
    classrooms,
    grades,
    onNormalizeSelection,
    sections,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    selectedStageId,
    stages,
  ]);

  // Helper function to check if a day is a holiday
  const isHolidayDay = useCallback(
    (dayKey: string): boolean => {
      if (!resolvedConfig) {
        return dayKey === "fri" || dayKey === "sat";
      }
      const day = resolvedConfig.days.find((item) => item.key === dayKey);
      return day ? !day.isActive : false;
    },
    [resolvedConfig],
  );

  const handleSlotClick = (
    dayKey: string,
    periodIndex: number,
    targetClassroomId = selectedClassroomId,
  ) => {
    if (!canEditTimetable) return;

    const targetClassroom = classrooms.find(
      (classroom) => classroom.id === targetClassroomId,
    );
    if (!targetClassroom) {
      showToast(t("validation.selectClassroomBeforeEdit"), "error");
      return;
    }

    const period = resolvedConfig?.periods.find(
      (item) => item.index === periodIndex,
    );
    if (period?.isInstructional === false) {
      return;
    }

    // Prevent editing on holiday days
    if (isHolidayDay(dayKey)) {
      showToast(t("validation.cannotEditHoliday"), "error");
      return;
    }

    const entry = timetableEntries.find(
      (e) =>
        e.classroomId === targetClassroom.id &&
        e.dayKey === dayKey &&
        e.periodIndex === periodIndex,
    );
    setEditingSlot({
      dayKey,
      periodIndex,
      sectionId: targetClassroom.sectionId,
      classroomId: targetClassroom.id,
      entry,
    });
    setEditDialogOpen(true);
  };

  const handleSlotSave = async (
    dayKey: string,
    periodIndex: number,
    subjectId: string | null,
    teacherId: string | null,
    roomId: string | null,
  ) => {
    // Update local state
    if (!editingSlot) {
      return;
    }

    const updatedEntries = [...timetableEntries];
    const existingIndex = updatedEntries.findIndex(
      (e) =>
        e.classroomId === editingSlot.classroomId &&
        e.dayKey === dayKey &&
        e.periodIndex === periodIndex,
    );

    const newEntry: TimetableEntry = {
      id:
        existingIndex >= 0
          ? updatedEntries[existingIndex].id
          : `temp-${Date.now()}`,
      termId,
      sectionId: editingSlot.sectionId,
      classroomId: editingSlot.classroomId,
      dayKey,
      periodIndex,
      subjectId,
      teacherId,
      roomId,
      status: "DRAFT",
    };

    if (existingIndex >= 0) {
      updatedEntries[existingIndex] = newEntry;
    } else {
      updatedEntries.push(newEntry);
    }

    setTimetableEntries(updatedEntries);
    setIsDirty(true);
    setEditDialogOpen(false);
  };

  const handleSave = async () => {
    if (!hasTimetableScope || !canEditTimetable) return;

    const saveResult = await saveTimetable(timetableEntries);
    if (saveResult.ok) {
      setIsDirty(false);
      showToast(t("actions.saveSuccess"), "success");
    } else {
      if (saveResult.hasConflicts) {
        setValidationPanelOpen(true);
      }
      const message = saveResult.error ?? t("actions.saveError");
      showToast(
        saveResult.changesWereNotSaved
          ? `${message} ${t("errors.noChangesSaved")}`
          : message,
        "error",
      );
    }
  };

  const handlePublish = async () => {
    if (!hasTimetableScope || !canWriteTimetable) return;

    // Check for unsaved changes
    if (isDirty) {
      showToast(t("publish.unsavedChanges"), "error");
      return;
    }

    setIsPublishing(true);
    try {
      const [publicationReadiness, nextValidation, nextConflicts] =
        await Promise.all([
          loadPublication(),
          loadValidation(),
          loadConflicts(),
        ]);
      if (
        publicationReadiness?.canPublish !== true ||
        hasBlockingValidation(nextValidation) ||
        nextConflicts.length > 0
      ) {
        setValidationPanelOpen(true);
        showToast(
          readinessReasonText(publicationReadiness?.blockingReasons?.[0]) ??
            nextValidation.blockingReasons[0] ??
            t("publish.notReady"),
          "error",
        );
        return;
      }
      setPublishWithErrors(nextValidation.warnings.length > 0);
      setPublishFingerprint(currentPublishFingerprint);
      setPublishConfirmOpen(true);
    } catch (error) {
      console.error("Failed to check timetable publication readiness:", error);
      showToast(
        timetableErrorMessage(
          error,
          t("publish.readinessError"),
          translateTimetableError,
        ),
        "error",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const readinessReasonText = (
    reason: string | { message?: string } | undefined,
  ): string | undefined =>
    typeof reason === "string" ? reason : reason?.message;

  const confirmPublish = async () => {
    if (!hasTimetableScope || !canWriteTimetable) return;

    if (!publishFingerprint || publishFingerprint !== currentPublishFingerprint) {
      setPublishConfirmOpen(false);
      showToast(t("publish.unsavedChanges"), "error");
      return;
    }

    setIsPublishing(true);
    try {
      const publishResult = await publishCurrentTimetable(
        timetableEntries,
        validationSummary,
      );
      if (!publishResult.ok) {
        if (publishResult.hasConflicts) {
          setValidationPanelOpen(true);
        }
        showToast(publishResult.error ?? t("publish.error"), "error");
        return;
      }
      showToast(t("publish.success"), "success");
    } catch (error) {
      console.error("Failed to publish timetable:", error);
      showToast(
        timetableErrorMessage(
          error,
          t("publish.error"),
          translateTimetableError,
        ),
        "error",
      );
    } finally {
      setIsPublishing(false);
      setPublishConfirmOpen(false);
      setPublishFingerprint(null);
    }
  };

  const handleUnpublish = async () => {
    if (!hasTimetableScope || !canWriteTimetable) return;

    setIsUnpublishing(true);
    try {
      const unpublished = await unpublishCurrentTimetable();
      if (!unpublished) {
        throw new Error("UNPUBLISH_FAILED");
      }
      showToast(t("unpublish.success"), "success");
    } catch (error) {
      console.error("Failed to unpublish timetable:", error);
      showToast(
        apiError ??
          timetableErrorMessage(
            error,
            t("unpublish.error"),
            translateTimetableError,
          ),
        "error",
      );
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleReset = () => {
    if (!canEditTimetable) return;
    setResetConfirmOpen(true);
  };

  const confirmReset = async () => {
    if (!hasTimetableScope || !canEditTimetable) return;

    try {
      await loadTimetable();
      setIsDirty(false);
      showToast(t("actions.resetSuccess"), "success");
    } catch (error) {
      console.error("Failed to reset timetable:", error);
      showToast(
        timetableErrorMessage(
          error,
          t("actions.resetError"),
          translateTimetableError,
        ),
        "error",
      );
    } finally {
      setResetConfirmOpen(false);
    }
  };

  const getDefaultTeacher = (subjectId: string): string | null => {
    const targetSectionId = editingSlot?.sectionId || selectedSectionId;
    const targetClassroomId = editingSlot?.classroomId || selectedClassroomId;
    if (!targetSectionId || !targetClassroomId) return null;

    const allocation = resolveTeacherAllocationForTarget(teacherAllocations, {
      sectionId: targetSectionId,
      classroomId: targetClassroomId,
      subjectId,
    });
    return allocation?.teacherId || null;
  };

  const getDefaultRoomSuggestion = (
    subjectId: string,
  ): {
    roomId: string | null;
    source: Exclude<RoomAssignmentSource, "MANUAL"> | null;
  } =>
    getSuggestedDefaultRoom({
      subjectId,
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId:
        editingSlot?.sectionId || selectedSectionId || undefined,
      selectedClassroomId:
        editingSlot?.classroomId || selectedClassroomId || undefined,
      selectedClassroom: editingClassroom,
    });

  const getRoomSource = (
    roomId: string | null,
    subjectId?: string,
  ): RoomAssignmentSource | null =>
    resolveRoomSource({
      roomId,
      subjectId,
      subjects,
      rooms,
      roomDefaults,
      selectedSectionId:
        editingSlot?.sectionId || selectedSectionId || undefined,
      selectedClassroomId:
        editingSlot?.classroomId || selectedClassroomId || undefined,
      selectedClassroom: editingClassroom,
    });

  const selectedStage = selectedStageId
    ? stages.find((item) => item.id === selectedStageId)
    : undefined;
  const selectedGrade = selectedGradeId
    ? grades.find((item) => item.id === selectedGradeId)
    : undefined;
  const selectedSection = selectedSectionId
    ? sections.find((item) => item.id === selectedSectionId)
    : undefined;
  const selectedClassroom = selectedClassroomId
    ? classrooms.find((item) => item.id === selectedClassroomId)
    : undefined;
  const hasTimetableScope = Boolean(academicYearId && termId);
  const editingClassroom = editingSlot
    ? classrooms.find((item) => item.id === editingSlot.classroomId)
    : selectedClassroom;
  const editingSection = editingSlot
    ? sections.find((item) => item.id === editingSlot.sectionId)
    : selectedSection;
  const editingGradeId = editingSection?.gradeId ?? selectedGradeId;
  const editableSlotSubjects = subjectOptionsForGradeAllocations({
    subjects,
    subjectAllocations,
    gradeId: editingGradeId,
    currentSubjectId: editingSlot?.entry?.subjectId,
  });
  const displayedClassrooms = useMemo(() => {
    if (selectedClassroom) {
      return [selectedClassroom];
    }
    if (selectedSectionId) {
      return classrooms.filter(
        (classroom) => classroom.sectionId === selectedSectionId,
      );
    }
    if (selectedGradeId) {
      const sectionIdsForGrade = new Set(
        sections
          .filter((section) => section.gradeId === selectedGradeId)
          .map((section) => section.id),
      );
      return classrooms.filter((classroom) =>
        sectionIdsForGrade.has(classroom.sectionId),
      );
    }
    return classrooms;
  }, [
    classrooms,
    sections,
    selectedClassroom,
    selectedGradeId,
    selectedSectionId,
  ]);
  const displayedSections = sections.filter((section) =>
    displayedClassrooms.some((classroom) => classroom.sectionId === section.id),
  );
  const activeSectionTabId = displayedSections.some(
    (section) => section.id === selectedSectionTabId,
  )
    ? selectedSectionTabId
    : displayedSections[0]?.id;

  const handleValidationOpen = useCallback(async () => {
    setIsValidating(true);
    try {
      await Promise.all([loadValidation(), loadConflicts()]);
    } catch (error) {
      console.error("Failed to load timetable conflicts:", error);
      showToast(t("validation.loadError"), "error");
    } finally {
      setIsValidating(false);
      setValidationPanelOpen(true);
    }
  }, [loadConflicts, loadValidation, showToast, t]);

  const hasRoomConflictForSlot = useCallback(
    (
      dayKey: string,
      periodIndex: number,
      roomId: string,
      entryId?: string,
    ): boolean =>
      timetableEntries.some(
        (entry) =>
          entry.roomId === roomId &&
          entry.dayKey === dayKey &&
          entry.periodIndex === periodIndex &&
          entry.id !== entryId,
      ),
    [timetableEntries],
  );

  const getDisplayName = useCallback(
    (entity?: { name?: string; nameAr?: string; nameEn?: string }) => {
      if (!entity) return "";
      return locale === "ar"
        ? entity.nameAr || entity.nameEn || entity.name || ""
        : entity.nameEn || entity.nameAr || entity.name || "";
    },
    [locale],
  );

  const scopeChain = [
    selectedStage && {
      label: t("target.stage"),
      name: getDisplayName(selectedStage),
    },
    selectedGrade && {
      label: t("target.grade"),
      name: getDisplayName(selectedGrade),
    },
    selectedSection && {
      label: t("target.section"),
      name: getDisplayName(selectedSection),
    },
    selectedClassroom && {
      label: t("target.classroom"),
      name: getDisplayName(selectedClassroom),
    },
  ].filter((segment): segment is { label: string; name: string } =>
    Boolean(segment),
  );

  const getClassroomScopeChain = useCallback(
    (classroom: Classroom) => {
      const classroomSection = sections.find(
        (section) => section.id === classroom.sectionId,
      );
      const classroomGrade = classroomSection
        ? grades.find((grade) => grade.id === classroomSection.gradeId)
        : undefined;
      const classroomStage = classroomGrade
        ? stages.find((stage) => stage.id === classroomGrade.stageId)
        : undefined;

      return [classroomStage, classroomGrade, classroomSection, classroom]
        .filter(Boolean)
        .map((entity) => getDisplayName(entity))
        .join(" › ");
    },
    [getDisplayName, grades, sections, stages],
  );

  const configSourceLabel = resolvedConfig
    ? t(`config.scope.${resolvedConfig.source.scope.toLowerCase()}`)
    : "";

  const creationProgress = useMemo(
    () =>
      resolveTimetableCreationProgress({
        isLoading: isLoading || timetableLoading,
        resolvedConfig,
        entries: timetableEntries,
        isDirty,
        validationSummary,
        conflicts: backendConflicts,
        publication,
        isReadOnly: !canWriteTimetable,
      }),
    [
      backendConflicts,
      canWriteTimetable,
      isDirty,
      isLoading,
      publication,
      resolvedConfig,
      timetableEntries,
      timetableLoading,
      validationSummary,
    ],
  );

  const creationProgressCopy = {
    navigationLabel: t("creationProgress.navigationLabel"),
    checking: t("creationProgress.checking"),
    steps: {
      scope: t("creationProgress.steps.scope"),
      configuration: t("creationProgress.steps.configuration"),
      periods: t("creationProgress.steps.periods"),
      schedule: t("creationProgress.steps.schedule"),
      validation: t("creationProgress.steps.validation"),
      publish: t("creationProgress.steps.publish"),
    },
    status: {
      complete: t("creationProgress.status.complete"),
      current: t("creationProgress.status.current"),
      blocked: t("creationProgress.status.blocked"),
      published: t("creationProgress.status.published"),
    },
    prerequisites: {
      configureTimetable: t(
        "creationProgress.prerequisites.configureTimetable",
      ),
      addInstructionalPeriod: t(
        "creationProgress.prerequisites.addInstructionalPeriod",
      ),
      saveSchedule: t("creationProgress.prerequisites.saveSchedule"),
      resolveReviewIssues: t(
        "creationProgress.prerequisites.resolveReviewIssues",
      ),
      publicationNotReady: t(
        "creationProgress.prerequisites.publicationNotReady",
      ),
    },
  };

  const focusDestination = (destination: HTMLDivElement | null) => {
    if (!destination) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    destination.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    destination.focus();
  };

  const openCreationStep = (action: TimetableCreationAction) => {
    if (action === "scope") return focusDestination(scopeRef.current);
    if (action === "configuration") return setConfigDialogOpen(true);
    if (action === "periods") return setPeriodsDialogOpen(true);
    if (action === "schedule") return focusDestination(gridRef.current);
    if (action === "validation") return void handleValidationOpen();
    void handlePublish();
  };

  const handleExport = (format: AcademicsExportFormat) => {
    if (!hasTimetableScope || !resolvedConfig) return;

    const columns: ExportColumn[] = [
      { key: "classroom", label: t("target.classroom") },
      { key: "day", label: t("grid.day") },
      { key: "period", label: t("grid.period") },
      { key: "slotType", label: t("editSlot.slotType") },
      { key: "subject", label: t("editSlot.subject") },
      { key: "teacher", label: t("editSlot.teacher") },
      { key: "room", label: t("editSlot.room") },
      { key: "status", label: t("export.status") },
    ];

    const rows = displayedClassrooms.flatMap((classroom) =>
      resolvedConfig.days
        .filter((day) => day.isActive)
        .flatMap((day) =>
          resolvedConfig.periods.map((period) => {
            const entry = timetableEntries.find(
              (item) =>
                item.classroomId === classroom.id &&
                item.dayKey === day.key &&
                item.periodIndex === period.index,
            );
            const subject = entry?.subjectId
              ? subjects.find((item) => item.id === entry.subjectId)
              : undefined;
            const teacher = entry?.teacherId
              ? teachers.find((item) => item.id === entry.teacherId)
              : undefined;
            const room = entry?.roomId
              ? rooms.find((item) => item.id === entry.roomId)
              : undefined;

            return {
              classroom: getDisplayName(classroom),
              day: locale === "ar" ? day.nameAr : day.nameEn,
              period: locale === "ar" ? period.nameAr : period.nameEn,
              slotType:
                entry?.slotType === "BREAK"
                  ? t("editSlot.break")
                  : t("editSlot.class"),
              subject: subject ? getDisplayName(subject) : "",
              teacher: teacher ? getDisplayName(teacher) : "",
              room: room ? getDisplayName(room) : "",
              status:
                entry?.status === "PUBLISHED"
                  ? t("export.published")
                  : t("export.draft"),
            };
          }),
        ),
    );

    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      stageName: getDisplayName(selectedStage) || undefined,
      termName: termId,
      gradeName: getDisplayName(selectedGrade) || undefined,
      sectionName: getDisplayName(selectedSection) || undefined,
      classroomName: getDisplayName(selectedClassroom) || undefined,
      configSource: configSourceLabel || undefined,
      exportDate: formatExportDate(locale),
    };

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename(
        "timetable",
        termId,
        selectedClassroomId ||
          selectedSectionId ||
          selectedGradeId ||
          undefined,
      ),
      format,
      columns,
      rows,
      locale,
      jsonData: {
        title: t("title"),
        metadata,
        rows,
      },
    });
  };

  const schoolName = brandingProfile?.schoolName.trim() || tRoot("school_name");
  const printLogoUrl =
    brandingProfile?.logoUrl.trim() || "/images/logo/moazzez_logo.svg";

  const selectedPrintTarget = (() => {
    if (selectedClassroom) {
      return {
        label: t("target.classroom"),
        name: getDisplayName(selectedClassroom),
      };
    }
    if (selectedSection) {
      return {
        label: t("target.section"),
        name: getDisplayName(selectedSection),
      };
    }
    if (selectedGrade) {
      return {
        label: t("target.grade"),
        name: getDisplayName(selectedGrade),
      };
    }
    if (selectedStage) {
      return {
        label: t("target.stage"),
        name: getDisplayName(selectedStage),
      };
    }
    return null;
  })();

  if (!canViewTimetable) {
    return (
      <div className="flex h-full items-start justify-center p-6">
        <AccessDenied
          className="max-w-md"
          title={t("accessDenied.title")}
          description={t("accessDenied.description")}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <TimetableLoadingSkeleton />
    );
  }

  if (grades.length === 0 && stages.length === 0) {
    return (
      <AcademicModuleEmptyState
        icon={GraduationCap}
        title={tEmpty("no_grades.title")}
        description={tEmpty("no_grades.description")}
        ctaLabel={tEmpty("no_grades.cta")}
        onCtaClick={() => router.push(`/${locale}/academics/structure`)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 3mm;
          }

          html,
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden !important;
          }

          .timetable-print-matrix,
          .timetable-print-matrix * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .timetable-print-matrix {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            font-size: 8px !important;
            display: block !important;
            direction: ltr !important;
          }

          .timetable-print-page-inner {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 3mm !important;
            box-sizing: border-box !important;
            position: relative !important;
            transform: scale(var(--timetable-print-scale, 1)) !important;
            transform-origin: top center !important;
          }

          .timetable-print-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 12px !important;
            margin-bottom: 4px !important;
            padding-bottom: 3px !important;
            border-bottom: 1px solid #d1d5db !important;
          }

          .timetable-print-school {
            max-width: 45% !important;
            text-align: start !important;
          }

          .timetable-print-logo {
            width: 64px !important;
            height: auto !important;
            object-fit: contain !important;
          }

          .timetable-print-target {
            display: block !important;
            margin: 0 0 4px !important;
            padding: 3px 6px !important;
            border: 1px solid #d1d5db !important;
            background: #f8fafc !important;
            text-align: center !important;
            font-weight: 600 !important;
            color: #111827 !important;
            font-size: 9px !important;
          }

          .timetable-print-footer {
            position: absolute !important;
            bottom: 1mm !important;
            inset-inline-start: 3mm !important;
            display: block !important;
            color: #4b5563 !important;
            font-size: 8px !important;
          }

          .timetable-print-content {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          .timetable-print-matrix .hidden.lg\\:block {
            display: block !important;
          }

          .timetable-print-matrix .lg\\:hidden {
            display: none !important;
          }

          .timetable-print-matrix .overflow-x-auto {
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .timetable-print-matrix table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            font-size: 7px !important;
            line-height: 1.08 !important;
          }

          .timetable-print-rtl table {
            direction: rtl !important;
          }

          .timetable-print-ltr table {
            direction: ltr !important;
          }

          .timetable-print-matrix th,
          .timetable-print-matrix td {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding: 0 !important;
            vertical-align: top !important;
            overflow: hidden !important;
          }

          .timetable-print-matrix th {
            padding: 2px 3px !important;
            min-width: 0 !important;
            text-align: center !important;
          }

          .timetable-print-matrix [class*="min-w-"] {
            min-width: 0 !important;
          }

          .timetable-print-matrix td > div {
            min-height: 0 !important;
            padding: 2px 3px !important;
          }

          .timetable-print-matrix td,
          .timetable-print-matrix th,
          .timetable-print-matrix td * {
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }

          .timetable-print-matrix th:first-child,
          .timetable-print-matrix td:first-child {
            width: 16mm !important;
            min-width: 16mm !important;
            max-width: 16mm !important;
          }

          .timetable-print-matrix [class*="min-h-"] {
            min-height: 0 !important;
          }

          .timetable-print-matrix .text-base,
          .timetable-print-matrix .text-sm,
          .timetable-print-matrix .text-xs {
            font-size: 7px !important;
            line-height: 1.1 !important;
          }

          .timetable-print-matrix .gap-1,
          .timetable-print-matrix .gap-1\\.5,
          .timetable-print-matrix .gap-2,
          .timetable-print-matrix .gap-3 {
            gap: 2px !important;
          }

          .timetable-print-matrix .mb-1,
          .timetable-print-matrix .mb-2,
          .timetable-print-matrix .mt-1,
          .timetable-print-matrix .mt-0\\.5 {
            margin-top: 1px !important;
            margin-bottom: 1px !important;
          }

          .timetable-print-matrix svg {
            width: 8px !important;
            height: 8px !important;
          }

          .timetable-print-matrix .line-clamp-1,
          .timetable-print-matrix .line-clamp-2 {
            overflow: hidden !important;
            display: block !important;
            -webkit-line-clamp: unset !important;
            -webkit-box-orient: unset !important;
          }

          .timetable-print-matrix .sticky {
            position: static !important;
          }

          .timetable-print-matrix .shadow-sm {
            box-shadow: none !important;
          }

          .timetable-print-rtl .text-left {
            text-align: right !important;
          }

          .timetable-print-ltr .text-left {
            text-align: left !important;
          }
        }
      `}</style>
      {/* Filter Bar */}
      <div ref={scopeRef} tabIndex={-1} className="print:hidden">
        <FilterBar
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          selectedStageId={selectedStageId}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          selectedClassroomId={selectedClassroomId}
          onStageChange={onStageChange}
          onGradeChange={onGradeChange}
          onSectionChange={onSectionChange}
          onClassroomChange={onClassroomChange}
          locale={locale}
        />
      </div>

      <TimetableCreationStepper
        progress={creationProgress}
        copy={creationProgressCopy}
        onAction={openCreationStep}
      />

      {hasTimetableScope && (
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                {t("target.label")}
              </span>
              <span
                className="inline-flex flex-wrap items-center gap-x-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                aria-label={scopeChain
                  .map((segment) => `${segment.label}: ${segment.name}`)
                  .join(" > ")}
              >
                {scopeChain.length === 0
                  ? t("config.scopeOptions.term")
                  : scopeChain.map((segment, index) => (
                      <span
                        key={segment.label}
                        className="inline-flex items-center gap-x-1"
                      >
                        {index > 0 && <span aria-hidden="true">›</span>}
                        <span>
                          {segment.label}: {segment.name}
                        </span>
                      </span>
                    ))}
              </span>
            </div>
            {resolvedConfig && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">{t("target.configSource")}:</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  {configSourceLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {hasTimetableScope && readOnlyBanner && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:px-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{readOnlyBanner}</span>
          </div>
        </div>
      )}

      {hasTimetableScope && apiError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 lg:px-6 print:hidden">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {hasTimetableScope && (
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 print:hidden">
          {/* Desktop: Horizontal layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {canManageTimetable && (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={
                      !isDirty ||
                      isSaving ||
                      !canEditTimetable ||
                      !resolvedConfig
                    }
                    variant="primary"
                    loading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {isSaving ? t("actions.saving") : t("actions.save")}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={!isDirty || !canEditTimetable || !resolvedConfig}
                    variant="secondary"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    {t("actions.reset")}
                  </Button>
                  <Button
                    onClick={() => setConfigDialogOpen(true)}
                    disabled={!canEditTimetable}
                    variant="secondary"
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    {t("config.button")}
                  </Button>
                  <Button
                    onClick={() => setPeriodsDialogOpen(true)}
                    disabled={!canEditTimetable || !config}
                    variant="secondary"
                    leftIcon={<Clock3 className="w-4 h-4" />}
                  >
                    {t("config.periodsButton")}
                  </Button>
                  <Button
                    onClick={() => setGenerateDialogOpen(true)}
                    disabled={
                      !canEditTimetable ||
                      !resolvedConfig ||
                      !selectedClassroomId
                    }
                    variant="secondary"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    {t("actions.generate")}
                  </Button>
                  {!isPublished ? (
                    <Button
                      onClick={handlePublish}
                      disabled={
                        !canWriteTimetable || isDirty || !resolvedConfig
                      }
                      variant="secondary"
                      loading={isPublishing}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      {t("actions.publish")}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUnpublish}
                      disabled={
                        !canWriteTimetable ||
                        isDirty ||
                        !resolvedConfig ||
                        config?.scopeType.toUpperCase() === "SECTION"
                      }
                      variant="secondary"
                      loading={isUnpublishing}
                      leftIcon={<EyeOff className="w-4 h-4" />}
                    >
                      {t("actions.unpublish")}
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={handleValidationOpen}
                variant="secondary"
                disabled={!resolvedConfig}
                loading={isValidating}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {t("actions.validate")}
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={!hasTimetableScope || !resolvedConfig}
              >
                {t("actions.export")}
              </Button>
              <PrintButton
                onClick={printTimetable}
                disabled={!hasTimetableScope || !resolvedConfig}
                label={t("actions.print")}
              />
            </div>
            {isDirty && (
              <span className="text-sm text-orange-600">
                {t("unsavedChanges.label")}
              </span>
            )}
          </div>

          {/* Mobile: Compact layout with 2 rows */}
          <div className="lg:hidden space-y-3">
            {/* Row 1: Primary actions */}
            <div className="flex items-center gap-2">
              {canManageTimetable && (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={
                      !isDirty ||
                      isSaving ||
                      !canEditTimetable ||
                      !resolvedConfig
                    }
                    variant="primary"
                    loading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {isSaving ? t("actions.saving") : t("actions.save")}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={!isDirty || !canEditTimetable || !resolvedConfig}
                    variant="secondary"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {t("actions.reset")}
                  </Button>
                </>
              )}
            </div>

            {/* Row 2: Secondary actions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {canManageTimetable && (
                <>
                  <Button
                    onClick={() => setConfigDialogOpen(true)}
                    disabled={!canEditTimetable}
                    variant="secondary"
                    leftIcon={<Settings className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("config.button")}
                  </Button>
                  <Button
                    onClick={() => setPeriodsDialogOpen(true)}
                    disabled={!canEditTimetable || !config}
                    variant="secondary"
                    leftIcon={<Clock3 className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("config.periodsButton")}
                  </Button>
                  <Button
                    onClick={() => setGenerateDialogOpen(true)}
                    disabled={
                      !canEditTimetable ||
                      !resolvedConfig ||
                      !selectedClassroomId
                    }
                    variant="secondary"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("actions.generate")}
                  </Button>
                  {!isPublished ? (
                    <Button
                      onClick={handlePublish}
                      disabled={
                        !canWriteTimetable || isDirty || !resolvedConfig
                      }
                      variant="secondary"
                      loading={isPublishing}
                      leftIcon={<Send className="w-4 h-4" />}
                      size="sm"
                    >
                      {t("actions.publish")}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUnpublish}
                      disabled={
                        !canWriteTimetable ||
                        isDirty ||
                        !resolvedConfig ||
                        config?.scopeType.toUpperCase() === "SECTION"
                      }
                      variant="secondary"
                      loading={isUnpublishing}
                      leftIcon={<EyeOff className="w-4 h-4" />}
                      size="sm"
                    >
                      {t("actions.unpublish")}
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={handleValidationOpen}
                variant="secondary"
                disabled={!resolvedConfig}
                loading={isValidating}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                size="sm"
              >
                {t("actions.validate")}
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="secondary"
                disabled={!hasTimetableScope || !resolvedConfig}
                size="sm"
              >
                {t("actions.export")}
              </Button>
              <PrintButton
                onClick={printTimetable}
                disabled={!hasTimetableScope || !resolvedConfig}
                label={t("actions.print")}
              />
            </div>

            {/* Unsaved changes indicator */}
            {isDirty && (
              <div className="text-xs text-orange-600 text-center py-1 bg-orange-50 rounded">
                {t("unsavedChanges.label")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridRef}
        tabIndex={-1}
        className="flex-1 min-h-full overflow-auto p-3 lg:p-6 print:overflow-visible print:p-0"
      >
        {!hasTimetableScope ? (
          <AcademicModuleEmptyState
            icon={AlertCircle}
            title={tEmpty("no_timetable_selection.title")}
            description={tEmpty("no_timetable_selection.description")}
            className="h-full"
          />
        ) : !resolvedConfig ? (
          timetableLoading ? (
            <TimetableLoadingSkeleton />
          ) : (
            <AcademicModuleEmptyState
              icon={Settings}
              title={tEmpty("no_timetable_config.title")}
              description={tEmpty("no_timetable_config.description")}
              ctaLabel={tEmpty("no_timetable_config.cta")}
              ctaDisabled={!canCreateConfig}
              onCtaClick={() => setConfigDialogOpen(true)}
              className="h-full"
            />
          )
        ) : periods.length === 0 ? (
          <AcademicModuleEmptyState
            icon={Settings}
            title={tEmpty("no_timetable_periods.title")}
            description={tEmpty("no_timetable_periods.description")}
            ctaLabel={
              canManageTimetable
                ? tEmpty("no_timetable_periods.cta")
                : undefined
            }
            ctaDisabled={!canEditTimetable}
            onCtaClick={
              canManageTimetable ? () => setPeriodsDialogOpen(true) : undefined
            }
            className="h-full"
          />
        ) : displayedClassrooms.length === 0 ? (
          <AcademicModuleEmptyState
            icon={School}
            title={tEmpty("no_classrooms.title")}
            description={tEmpty("no_classrooms.description")}
            className="h-full"
          />
        ) : (
          <div
            ref={printMatrixRef}
            className={`timetable-print-matrix ${
              locale === "ar" ? "timetable-print-rtl" : "timetable-print-ltr"
            }`}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <div className="timetable-print-page-inner">
              <div
                className="hidden timetable-print-header"
                dir={locale === "ar" ? "rtl" : "ltr"}
              >
                <div className="timetable-print-school">
                  <div className="text-base font-semibold text-gray-900">
                    {schoolName}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{t("title")}</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={printLogoUrl}
                  alt={schoolName}
                  className="timetable-print-logo"
                />
              </div>
              {selectedPrintTarget && (
                <div
                  className="hidden timetable-print-target"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  {selectedPrintTarget.label}: {selectedPrintTarget.name}
                </div>
              )}
              <div
                className="timetable-print-content space-y-6"
                dir={locale === "ar" ? "rtl" : "ltr"}
              >
                {displayedSections.length > 1 && (
                  <div
                    role="group"
                    aria-label={t("target.section")}
                    className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3 print:hidden"
                  >
                    {displayedSections.map((section) => {
                      const isActive = section.id === activeSectionTabId;

                      return (
                        <button
                          key={section.id}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setSelectedSectionTabId(section.id)}
                          className={`shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors focus:outline-none${
                            isActive
                              ? "border-primary-600 bg-primary-600 text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50"
                          }`}
                        >
                          <span className="block max-w-64 truncate">
                            {getDisplayName(section)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {displayedClassrooms.map((classroom) => {
                  const classroomEntries = timetableEntries.filter(
                    (entry) => entry.classroomId === classroom.id,
                  );
                  const classroomScopeChain = getClassroomScopeChain(classroom);
                  const showClassroomHeader = displayedClassrooms.length > 1;
                  const isActive = classroom.sectionId === activeSectionTabId;

                  return (
                    <section
                      key={classroom.id}
                      aria-label={getDisplayName(classroom)}
                      className={`relative space-y-3 ${
                        isActive ? "" : "hidden print:block"
                      }`}
                    >
                      {showClassroomHeader && (
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 print:rounded-none print:border-x-0 print:px-0">
                          {classroomScopeChain}
                        </div>
                      )}
                      <TimetableGrid
                        entries={classroomEntries}
                        subjects={subjects}
                        teachers={teachers}
                        rooms={rooms}
                        conflicts={backendConflicts}
                        onSlotClick={(dayKey, periodIndex) =>
                          handleSlotClick(dayKey, periodIndex, classroom.id)
                        }
                        isHolidayDay={isHolidayDay}
                        locale={locale}
                        isReadOnly={!canEditTimetable}
                        resolvedConfig={resolvedConfig}
                      />
                    </section>
                  );
                })}
              </div>
              {printTimestamp && (
                <div
                  className="hidden timetable-print-footer"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  {locale === "ar" ? "وقت الطباعة" : "Print time"}:{" "}
                  {printTimestamp}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Drawer */}
      {hasTimetableScope && resolvedConfig && (
        <ValidationPanel
          open={validationPanelOpen}
          validationSummary={validationSummary}
          conflicts={backendConflicts}
          periods={resolvedConfig?.periods ?? []}
          teachers={teachers}
          rooms={rooms}
          onClose={() => setValidationPanelOpen(false)}
          locale={locale}
        />
      )}

      {/* Edit Dialog */}
      {editDialogOpen && editingSlot && resolvedConfig && (
        <EditSlotDialog
          open={editDialogOpen}
          dayKey={editingSlot.dayKey}
          periodIndex={editingSlot.periodIndex}
          dayName={
            locale === "ar"
              ? resolvedConfig.days.find((d) => d.key === editingSlot.dayKey)
                  ?.nameAr || ""
              : resolvedConfig.days.find((d) => d.key === editingSlot.dayKey)
                  ?.nameEn || ""
          }
          entry={editingSlot.entry}
          subjects={editableSlotSubjects}
          teachers={teachers}
          teacherAllocations={teacherAllocations}
          rooms={rooms}
          onSave={handleSlotSave}
          onClose={() => setEditDialogOpen(false)}
          getDefaultTeacher={getDefaultTeacher}
          getDefaultRoomSuggestion={getDefaultRoomSuggestion}
          getRoomSource={getRoomSource}
          selectedSectionId={editingSlot.sectionId}
          selectedClassroomId={editingSlot.classroomId}
          hasRoomConflict={(roomId) =>
            hasRoomConflictForSlot(
              editingSlot.dayKey,
              editingSlot.periodIndex,
              roomId,
              editingSlot.entry?.id,
            )
          }
          selectedClassroomName={
            locale === "ar"
              ? editingClassroom?.nameAr
              : editingClassroom?.nameEn
          }
          locale={locale}
        />
      )}

      {/* Generate Dialog */}
      {generateDialogOpen && (
        <GenerateDialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          onGenerate={handleGenerate}
          onApply={applyGenerated}
        />
      )}

      {/* Config Dialog */}
      {configDialogOpen && (
        <TimetableConfigDialog
          mode="config"
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          onSaved={async () => {
            await reloadConfigs();
          }}
          academicYearId={academicYearId}
          termId={termId}
          config={config}
          periods={periods}
          entries={configGuardEntries}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          selectedClassroomId={selectedClassroomId}
          readOnly={!canEditTimetable}
          locale={locale}
        />
      )}

      {periodsDialogOpen && (
        <TimetableConfigDialog
          mode="periods"
          open={periodsDialogOpen}
          onClose={() => setPeriodsDialogOpen(false)}
          onSaved={async () => {
            await reloadConfigs();
          }}
          academicYearId={academicYearId}
          termId={termId}
          config={config}
          periods={periods}
          entries={configGuardEntries}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          selectedClassroomId={selectedClassroomId}
          readOnly={!canEditTimetable}
          locale={locale}
        />
      )}

      {/* Reset Confirm Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={confirmReset}
        title={t("actions.resetConfirmTitle")}
        description={t("actions.resetConfirmMessage")}
        confirmLabel={t("actions.reset")}
        cancelLabel={t("publish.cancel")}
        severity="warning"
      />

      {/* Publish Confirm Dialog */}
      <ConfirmDialog
        isOpen={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        onConfirm={confirmPublish}
        title={t("publish.confirmTitle")}
        description={
          publishWithErrors
            ? t("publish.withErrors")
            : t("publish.confirmMessage")
        }
        confirmLabel={t("publish.confirm")}
        cancelLabel={t("publish.cancel")}
        severity={publishWithErrors ? "warning" : "info"}
        loading={isPublishing}
      />

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("actions.export")}
        subtitle={t("title")}
        datasetCount={
          resolvedConfig
            ? resolvedConfig.days.filter((day) => day.isActive).length *
              resolvedConfig.periods.length
            : 0
        }
      />
    </div>
  );
}

function readOnlyBannerMessage({
  configStatus,
  termStatus,
  closedTermMessage,
  publishedLockedMessage,
}: {
  configStatus?: string;
  termStatus: "open" | "closed";
  closedTermMessage: string;
  publishedLockedMessage: string;
}): string | null {
  if (termStatus === "closed") {
    return closedTermMessage;
  }
  if (configStatus && configStatus.toLowerCase() !== "draft") {
    return publishedLockedMessage;
  }
  return null;
}

function TimetableLoadingSkeleton() {
  return (
    <div className="space-y-4 p-3 lg:p-6" aria-label="Loading timetable">
      <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="h-12 animate-pulse bg-gray-200" />
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse border-t border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    </div>
  );
}

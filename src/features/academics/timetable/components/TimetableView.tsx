"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { DndContext, DragOverlay } from "@dnd-kit/core";
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
  Trash2,
  Library,
  Printer,
  Download,
} from "lucide-react";
import FilterBar from "./FilterBar";
import TimetableGrid from "./TimetableGrid";
import TimetableViewNavigation from "./TimetableViewNavigation";
import { useTimetableFocusMode } from "../hooks/useTimetableFocusMode";
import { findTimetableLessons } from "../services/timetableLessonSearch";
import TimetableWorkspaceToolbar, { type TimetableDensity } from "./TimetableWorkspaceToolbar";
import TimetableResourceLibrary from "./TimetableResourceLibrary";
import TimetableUndoBanner from "./TimetableUndoBanner";
import TimetableWorkspacePanelBar from "./TimetableWorkspacePanelBar";
import TimetableCreationStepper from "./TimetableCreationStepper";
import TimetableSourceBanner from "./TimetableSourceBanner";
import {useTimetableValidationReview} from "../hooks/useTimetableValidationReview";
import ValidationPanel from "./ValidationPanel";
import TimetableConflictDialog from "./TimetableConflictDialog";
import EditSlotDialog from "./EditSlotDialog";
import TimetableLessonTransferDialog from "./TimetableLessonTransferDialog";
import { previewLessonTransfer, type LessonTransferMode, type LessonTransferInput } from "../services/timetableLessonTransfer";
import type { TimetableDropTarget } from "../services/timetableDragDrop";
import GenerateDialog from "./GenerateDialog";
import TimetableConfigDialog from "./TimetableConfigDialog";
import {
  TimetableActionBarLoadingSkeleton,
  TimetableContentLoadingSkeleton,
  TimetableGridLoadingSkeleton,
} from "./TimetableLoadingSkeletons";
import { AccessDenied, Button } from "@/components/ui";
import { usePrint } from "@/components/print";
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
import {
  persistedEntriesClearedForDeletion,
  subjectOptionsForGradeAllocations,
} from "@/features/academics/timetable/services/timetableSlotEditing";
import { hasBlockingValidation } from "@/features/academics/timetable/services/timetableValidationSummary";
import { createTimetablePublishFingerprint } from "@/features/academics/timetable/services/timetablePublishFingerprint";
import { getTimetableConfigSourceName } from "@/features/academics/timetable/services/timetableConfigSource";
import {
  isTimetableUnpublishScopeSupported,
  resolveTimetableScopeSelection,
  timetableConfigScopeId,
} from "@/features/academics/timetable/services/timetableScope";
import {
  resolveTimetableCreationProgress,
  type TimetableCreationAction,
} from "@/features/academics/timetable/services/timetableCreationProgress";
import {
  getDefaultRoomSuggestion as getSuggestedDefaultRoom,
  getRoomSource as resolveRoomSource,
} from "@/features/academics/timetable/utils/roomRecommendations";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/use-auth";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import { useTimetableData } from "@/features/academics/timetable/hooks/useTimetableData";
import { useTimetableGeneration } from "@/features/academics/timetable/hooks/useTimetableGeneration";
import { useTimetableScheduling } from "@/features/academics/timetable/hooks/useTimetableScheduling";
import { useTimetableConfigurationScope } from "@/features/academics/timetable/hooks/useTimetableConfigurationScope";
import { generateTimetableConfig } from "@/features/academics/timetable/services/timetableApiAdapter";
import { classroomsForTimetableScope } from "@/features/academics/timetable/services/timetableDisplayScope";
import { presentTimetableGeneration } from "@/features/academics/timetable/services/timetableGenerationPresentation";
import {
  timetableBackendMessage,
  type PublicationReasonReferenceNames,
} from "@/features/academics/timetable/services/timetablePublicationReasons";
import {
  resolveTimetableConflictTargetEntry,
  type TimetableConflictDisplay,
} from "@/features/academics/timetable/services/timetableConflictNormalization";
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
  isDirty: boolean;
  onDirtyChange: (dirty: boolean) => void;
  academicYearId?: string;
  academicYearName: string;
  termName: string;
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
  isDirty,
  onDirtyChange,
  academicYearId = "",
  academicYearName,
  termName,
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
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const { guardedNavigate } = useNavigationGuard();
  const { profile: brandingProfile } = useBrandingProfile();
  const filteredScope = resolveTimetableScopeSelection({
    stageId: selectedStageId,
    gradeId: selectedGradeId,
    sectionId: selectedSectionId,
    classroomId: selectedClassroomId,
  });
  const canViewTimetable = hasPermission("academics.structure.view");
  const translateTimetableError = useCallback(
    (code: TimetableErrorCode) =>
      t(`errors.${code.replace("academics.timetable.", "")}`),
    [t],
  );
  const translateBackendMessage = useCallback(
    (code: string, fallback?: string) =>
      timetableBackendMessage(code, locale, fallback),
    [locale],
  );
  const timetableMessages = useMemo(
    () => ({
      loadFailed: t("errors.loadFailed"),
      saveFailed: t("errors.saveFailed"),
      saveReloadFailed: t("errors.saveReloadFailed"),
      partialSaveRefreshed: t("errors.partialSaveRefreshed"),
      partialSaveReloadFailed: t("errors.partialSaveReloadFailed"),
      publishFailed: t("errors.publishFailed"),
      unpublishFailed: t("errors.unpublishFailed"),
      unpublishUnsupportedScope: t("errors.unpublishUnsupportedScope"),
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

  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { focusMode, setFocusMode } = useTimetableFocusMode(workspaceRef);
  const [searchFocusRequest, setSearchFocusRequest] = useState(0);
  const [lessonQuery, setLessonQuery] = useState("");
  const [focusedSearchEntryId, setFocusedSearchEntryId] = useState<string | null>(null);
  const [gridDensity, setGridDensity] = useState<TimetableDensity>("comfortable");
  const [scopeFiltersExpanded, setScopeFiltersExpanded] = useState(false);
  const [creationProgressExpanded, setCreationProgressExpanded] =
    useState(false);
  const [timetableContextExpanded, setTimetableContextExpanded] =
    useState(false);
  const [selectedConflict, setSelectedConflict] =
    useState<TimetableConflictDisplay | null>(null);
  const [inspectionConflict, setInspectionConflict] =
    useState<TimetableConflictDisplay | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [periodsDialogOpen, setPeriodsDialogOpen] = useState(false);
  const {
    configurationScope,
    linkedConfigurationId,
    isTermDefaultConfiguration,
    configurationMode,
    customizeFilteredScope: selectCustomConfigurationScope,
    returnToTermDefault: selectTermDefaultConfiguration,
  } = useTimetableConfigurationScope(filteredScope, {
    userId: user?.id ?? null,
    schoolId,
    termId,
  });
  const [selectedSectionTabId, setSelectedSectionTabId] = useState<
    string | null
  >(null);
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
  const [lessonTransfer, setLessonTransfer] = useState<{ mode: LessonTransferMode; sourceId: string } | null>(null);
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
  const [deleteAllEntriesConfirmOpen, setDeleteAllEntriesConfirmOpen] =
    useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishWithErrors, setPublishWithErrors] = useState(false);
  const [publishFingerprint, setPublishFingerprint] = useState<string | null>(
    null,
  );

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
    timetableEntries,
    setTimetableEntries,
    allTermEntries,
    resolvedConfig,
    config,
    workspaceState,
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
    reloadGeneratedTimetable,
    refreshValidationReview,
    loadTimetable,
    loadConflicts,
    loadValidation,
    loadPublication,
    saveTimetable,
    checkDraftConflicts,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
  } = useTimetableData({
    schoolId,
    termId,
    academicYearId,
    enabled: canViewTimetable,
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    configurationScope,
    linkedConfigurationId,
    isScopeSelectionNormalized,
    showToast,
    translateErrorCode: translateTimetableError,
    translateBackendMessage,
    messages: timetableMessages,
  });

  const validationContextId = JSON.stringify([academicYearId, termId, workspaceState.displayConfigId, selectedGradeId, selectedClassroomId]);
  const validationFingerprint = JSON.stringify([validationContextId, config, periods, timetableEntries, subjectAllocations, teacherAllocations, rooms, teachers, subjects]);
  const validationReview = useTimetableValidationReview({contextId: validationContextId, fingerprint: validationFingerprint, refresh: refreshValidationReview});
  const {recheck: recheckValidation, isChecking: isValidating} = validationReview;

  const publicationReasonReferenceNames = useMemo(
    () =>
      buildPublicationReasonReferenceNames({
        config,
        classrooms,
        subjects,
        rooms,
        periods,
        teachers,
        teacherAllocations,
        entries: allTermEntries,
        locale,
      }),
    [
      allTermEntries,
      classrooms,
      config,
      locale,
      periods,
      rooms,
      subjects,
      teacherAllocations,
      teachers,
    ],
  );

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

  const linkedEntryId = searchParams.get("entry");
  useEffect(() => {
    const entry =
      linkedConfigurationId === workspaceState.displayConfigId
        ? timetableEntries.find((candidate) => candidate.id === linkedEntryId)
        : undefined;
    setSelectedConflict(
      entry
        ? {
            type: "UNKNOWN",
            message: "",
            severity: "blocking",
            dayOfWeek: null,
            entryIds: [entry.id],
            proposedIndexes: [],
          }
        : null,
    );
  }, [
    backendConflicts,
    linkedEntryId,
    linkedConfigurationId,
    timetableEntries,
    workspaceState.displayConfigId,
  ]);

  const configGuardEntries = useMemo(() => {
    const entriesById = new Map(
      allTermEntries.map((entry) => [entry.id, entry]),
    );
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
  const configIsDraft =
    !config || String(config.status).toLowerCase() === "draft";
  const canManageTimetable =
    canViewTimetable && hasPermission("academics.structure.manage");
  const canWriteTimetable =
    canManageTimetable && termStatus !== "closed" && !isReadOnly;
  const hasExactConfig = workspaceState.mode === "exact";
  const canCreateConfig = canWriteTimetable && !hasExactConfig;
  const canEditTimetable =
    canWriteTimetable && configIsDraft && workspaceState.canEdit;
  const filledTimetableEntryCount = timetableEntries.filter(
    (entry) => entry.subjectId,
  ).length;
  const canConfigureTimetable = hasExactConfig
    ? canEditTimetable
    : canCreateConfig;
  const sourceActionEnabled = isTermDefaultConfiguration
    ? filteredScope.scopeType !== "TERM"
    : canCreateConfig;

  const openTimetableSettings = () => {
    guardedNavigate(() => router.push("/academics/timetable/setup"));
  };

  const openConfigurationEditor = () => {
    if (isTermDefaultConfiguration) {
      openTimetableSettings();
      return;
    }
    setConfigDialogOpen(true);
  };

  const openValidationDestination = (path: string) => {
    guardedNavigate(() => {
      setValidationPanelOpen(false);
      router.push(path);
    });
  };

  const customizeFilteredScope = () => {
    guardedNavigate(() => {
      if (isTermDefaultConfiguration) {
        selectCustomConfigurationScope();
        return;
      }
      setConfigDialogOpen(true);
    });
  };

  const returnToTermDefault = () => {
    guardedNavigate(() => {
      setConfigDialogOpen(false);
      setPeriodsDialogOpen(false);
      selectTermDefaultConfiguration();
    });
  };
  const isUnpublishScopeSupported = Boolean(
    config && isTimetableUnpublishScopeSupported(config.scopeType),
  );
  const canUnpublishTimetable =
    canWriteTimetable &&
    hasExactConfig &&
    !isDirty &&
    Boolean(resolvedConfig) &&
    isUnpublishScopeSupported;
  const readOnlyBanner = readOnlyBannerMessage({
    configStatus: config?.status,
    termStatus,
    closedTermMessage: t("readOnly.closedTerm"),
    publishedLockedMessage: t("readOnly.publishedLocked"),
  });
  const {
    generateCurrentConfig,
    isGenerating,
    result: generationResponse,
    error: generationError,
    phase: generationPhase,
    refreshFailed: generationRefreshFailed,
    retryRefresh: retryGenerationRefresh,
    resetGeneration,
  } = useTimetableGeneration({
    configId: hasExactConfig ? (config?.id ?? null) : null,
    enabled: canEditTimetable && !isDirty,
    generate: generateTimetableConfig,
    reloadAuthoritativeState: reloadGeneratedTimetable,
  });

  const openGenerationDialog = () => {
    resetGeneration();
    setGenerateDialogOpen(true);
  };

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
    onDirtyChange(true);
    setEditDialogOpen(false);
  };

  const handleSave = async () => {
    if (!hasTimetableScope || !canEditTimetable) return;

    const saveResult = await saveTimetable(timetableEntries);
    if (saveResult.ok) {
      onDirtyChange(false);
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

  const confirmDeleteAllEntries = () => {
    if (!hasTimetableScope || !canEditTimetable) return;

    const entriesPendingDeletion =
      persistedEntriesClearedForDeletion(timetableEntries);
    setTimetableEntries(entriesPendingDeletion);
    onDirtyChange(entriesPendingDeletion.length > 0);
    setDeleteAllEntriesConfirmOpen(false);
    showToast(t("actions.deleteAllEntriesSuccess"), "success");
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
    reason: string | { code: string; message: string } | undefined,
  ): string | undefined =>
    typeof reason === "string"
      ? reason
      : reason
        ? translateBackendMessage(reason.code, reason.message)
        : undefined;

  const confirmPublish = async () => {
    if (!hasTimetableScope || !canWriteTimetable) return;

    if (
      !publishFingerprint ||
      publishFingerprint !== currentPublishFingerprint
    ) {
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
    if (!hasTimetableScope || !canUnpublishTimetable) return;

    setIsUnpublishing(true);
    try {
      const result = await unpublishCurrentTimetable();
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      showToast(t("unpublish.success"), "success");
    } catch (error) {
      console.error("Failed to unpublish timetable:", error);
      showToast(
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
      onDirtyChange(false);
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
  });
  const displayedClassrooms = useMemo(() => {
    return classroomsForTimetableScope({
      classrooms,
      grades,
      sections,
      scope: filteredScope,
    });
  }, [
    classrooms,
    filteredScope,
    grades,
    sections,
  ]);
  const switchableClassrooms = classroomsForTimetableScope({
    classrooms,
    grades,
    sections,
    scope: resolveTimetableScopeSelection({
      stageId: selectedStageId,
      gradeId: selectedGradeId,
      sectionId: selectedSectionId,
      classroomId: "",
    }),
  });
  const lessonMatches = useMemo(() => {
    const classroomOrder = new Map(
      displayedClassrooms.map((classroom, index) => [classroom.id, index]),
    );
    const dayOrder = new Map(
      resolvedConfig?.days
        .filter((day) => day.isActive)
        .map((day, index) => [day.key, index]),
    );
    const periods = new Set(
      resolvedConfig?.periods
        .filter((period) => period.isInstructional !== false)
        .map((period) => period.index),
    );
    return findTimetableLessons({
      query: lessonQuery,
      subjects,
      teachers,
      rooms,
      entries: timetableEntries.filter(
        (entry) =>
          classroomOrder.has(entry.classroomId ?? "") &&
          dayOrder.has(entry.dayKey) &&
          !isHolidayDay(entry.dayKey) &&
          periods.has(entry.periodIndex),
      ),
    }).sort(
      (left, right) =>
        classroomOrder.get(left.classroomId ?? "")! -
          classroomOrder.get(right.classroomId ?? "")! ||
        dayOrder.get(left.dayKey)! - dayOrder.get(right.dayKey)! ||
        left.periodIndex - right.periodIndex,
    );
  }, [
    displayedClassrooms,
    isHolidayDay,
    lessonQuery,
    resolvedConfig,
    rooms,
    subjects,
    teachers,
    timetableEntries,
  ]);
  const highlightedEntryIds = useMemo(
    () => new Set(lessonMatches.map((entry) => entry.id)),
    [lessonMatches],
  );
  const focusedSearchIndex = lessonMatches.findIndex(
    (entry) => entry.id === focusedSearchEntryId,
  );
  const stepThroughLessonMatches = (direction: -1 | 1) => {
    if (!lessonMatches.length) return;
    const nextIndex =
      focusedSearchIndex < 0
        ? direction === 1
          ? 0
          : lessonMatches.length - 1
        : (focusedSearchIndex + direction + lessonMatches.length) %
          lessonMatches.length;
    const match = lessonMatches[nextIndex];
    setSelectedConflict(null);
    setSelectedSectionTabId(match.sectionId);
    setFocusedSearchEntryId(match.id);
    setSearchFocusRequest((request) => request + 1);
  };
  const lessonTransferInput: Omit<
    LessonTransferInput,
    "target" | "createEntryId"
  > | null =
    lessonTransfer && resolvedConfig
      ? {
          ...lessonTransfer,
          entries: timetableEntries,
          allTermEntries,
          classrooms: displayedClassrooms,
          sections,
          teacherAllocations,
          subjectAllocations,
          rooms,
          config: resolvedConfig,
          readOnly: !canEditTimetable || isSaving || timetableLoading,
        }
      : null;
  const confirmLessonTransfer = (target: TimetableDropTarget) => {
    if (!lessonTransferInput) return;
    const transfer = previewLessonTransfer({
      ...lessonTransferInput,
      target,
      createEntryId: () => `temp-${crypto.randomUUID()}`,
    });
    if (transfer.status === "REJECTED") {
      showToast(t(`transfer.rejections.${transfer.reason}`), "error");
      return;
    }
    resetSchedulingInteraction();
    setTimetableEntries(transfer.entries);
    onDirtyChange(true);
    setSelectedConflict(null);
    setFocusedSearchEntryId(null);
    setLessonTransfer(null);
    showToast(
      t(
        lessonTransferInput.mode === "copy"
          ? "transfer.copySuccess"
          : "transfer.moveSuccess",
      ),
      "success",
    );
  };
  const displayedSections = sections.filter((section) =>
    displayedClassrooms.some((classroom) => classroom.sectionId === section.id),
  );
  const activeSectionTabId = displayedSections.some(
    (section) => section.id === selectedSectionTabId,
  )
    ? selectedSectionTabId
    : displayedSections[0]?.id;
  const {
    activeDragItem,
    canDropOnSlot,
    desktopLibraryOpen,
    dismissUndo,
    dragSensors,
    handleDragCancel,
    handleDragEnd,
    handleDragStart,
    libraryItems: schedulingLibraryItems,
    mobileLibraryOpen,
    placeItem: placeTimetableItem,
    resetInteraction: resetSchedulingInteraction,
    selectLibraryItem,
    selectedLibraryItem,
    setDesktopLibraryOpen,
    setMobileLibraryOpen,
    undo: handleUndoPlacement,
    undoEffect,
  } = useTimetableScheduling({
    termId,
    locale,
    gradeId: selectedGradeId,
    stageId: selectedStageId,
    sectionId: selectedSectionId,
    classroomId: selectedClassroomId,
    selectedClassroom,
    classrooms,
    subjects,
    subjectAllocations,
    teachers,
    teacherAllocations,
    rooms,
    timetableEntries,
    allTermEntries,
    periods: resolvedConfig?.periods ?? [],
    canEdit: canEditTimetable,
    isDirty,
    isHolidayDay,
    setTimetableEntries,
    onDirtyChange,
    showToast,
    translate: t,
  });
  const handleUndoAndRestoreFocus = useCallback(() => {
    handleUndoPlacement();
    window.requestAnimationFrame(() => gridRef.current?.focus());
  }, [handleUndoPlacement]);

  const focusConflictInCurrentTimetable = useCallback(
    (conflict: TimetableConflictDisplay) => {
      const proposedEntries = timetableEntries.filter(
        (entry) => entry.subjectId,
      );
      const entriesById = new Map(
        [...allTermEntries, ...timetableEntries].map((entry) => [
          entry.id,
          entry,
        ]),
      );
      const targetEntry = resolveTimetableConflictTargetEntry(
        conflict,
        [...entriesById.values()],
        proposedEntries,
      );
      const targetClassroom = classrooms.find(
        (classroom) =>
          classroom.id ===
          (targetEntry?.classroomId ??
            (conflict.type === "CLASSROOM" ? conflict.resourceId : undefined)),
      );
      const targetSectionId =
        targetEntry?.sectionId ?? targetClassroom?.sectionId;

      if (targetSectionId) {
        setSelectedSectionTabId(targetSectionId);
      }
      setSelectedConflict(conflict);
      setValidationPanelOpen(false);
    },
    [allTermEntries, classrooms, timetableEntries],
  );

  const handleValidationOpen = useCallback(() => {
    setValidationPanelOpen(true);
    void recheckValidation();
  }, [recheckValidation]);

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

  const configurationSource = resolvedConfig?.source ?? {
    scope: configurationScope.scopeType,
    id: timetableConfigScopeId(configurationScope),
  };
  const configSourceLabel = [
    t(`config.scope.${configurationSource.scope.toLowerCase()}`),
    getTimetableConfigSourceName(
      configurationSource,
      { stages, grades, sections, classrooms },
      locale,
    ),
  ]
    .filter((label): label is string => Boolean(label))
    .join(": ");
  const generationResult = useMemo(
    () =>
      generationResponse
        ? presentTimetableGeneration(generationResponse, {
            classroomNames: new Map(
              classrooms.map((classroom) => [
                classroom.id,
                getDisplayName(classroom),
              ]),
            ),
            subjectNames: new Map(
              subjects.map((subject) => [subject.id, getDisplayName(subject)]),
            ),
            unknownClassroomName: t("generate.unassignedClassroom"),
            unknownSubjectName: t("generate.unassignedSubject"),
          })
        : null,
    [classrooms, generationResponse, getDisplayName, subjects, t],
  );
  const generationClassroomCount = useMemo(() => {
    if (!config) return null;
    const scopeType = config.scopeType.toUpperCase();
    if (scopeType === "CLASSROOM") return config.classroomId ? 1 : null;
    if (scopeType === "SECTION")
      return classrooms.filter(
        (classroom) => classroom.sectionId === config.sectionId,
      ).length;
    if (scopeType === "GRADE")
      return classrooms.filter(
        (classroom) =>
          sections.find((section) => section.id === classroom.sectionId)
            ?.gradeId === config.gradeId,
      ).length;
    if (scopeType === "STAGE")
      return classrooms.filter((classroom) => {
        const section = sections.find(
          (candidate) => candidate.id === classroom.sectionId,
        );
        const grade = grades.find(
          (candidate) => candidate.id === section?.gradeId,
        );
        return grade?.stageId === config.stageId;
      }).length;
    return classrooms.length;
  }, [classrooms, config, grades, sections]);

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
        workspaceMode: workspaceState.mode,
        translateMessage: translateBackendMessage,
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
      translateBackendMessage,
      validationSummary,
      workspaceState.mode,
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
  const highlightedCreationStep = creationProgress.steps.find(
    (step) => step.status === "current" || step.status === "blocked",
  );
  const creationProgressSummary =
    creationProgress.state === "checking"
      ? creationProgressCopy.checking
      : highlightedCreationStep
        ? creationProgressCopy.steps[highlightedCreationStep.id]
        : creationProgressCopy.steps.publish;

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
    if (action === "scope") {
      setScopeFiltersExpanded(true);
      window.requestAnimationFrame(() => focusDestination(scopeRef.current));
      return;
    }
    if (action === "configuration") return openConfigurationEditor();
    if (action === "periods") {
      if (isTermDefaultConfiguration) return openTimetableSettings();
      return setPeriodsDialogOpen(true);
    }
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
    const exportTermName = termName || t("config.scopeOptions.term");
    const exportScopeName =
      getDisplayName(selectedClassroom) ||
      getDisplayName(selectedSection) ||
      getDisplayName(selectedGrade) ||
      getDisplayName(selectedStage) ||
      t("config.scopeOptions.term");

    const metadata: ExportMetadata = {
      yearName: academicYearName || undefined,
      stageName: getDisplayName(selectedStage) || undefined,
      termName: exportTermName,
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
        exportTermName,
        exportScopeName,
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
    return <TimetableContentLoadingSkeleton label={t("loadingLabel")} />;
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
    <div
      ref={workspaceRef}
      className={`flex min-h-0 flex-col overflow-hidden bg-gray-50 print:static print:h-auto print:max-h-none print:pe-0 ${focusMode ? "fixed inset-0 z-[1000] h-dvh max-h-dvh" : "relative h-[calc(100dvh-89px)] max-h-[calc(100dvh-89px)]"} ${
        canEditTimetable && selectedClassroom && desktopLibraryOpen
          ? "lg:pe-80"
          : ""
      }`}
    >
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
            align-items: center !important;
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
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
            max-width: 32px !important;
            max-height: 32px !important;
            flex: none !important;
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
      <div className={focusMode ? "hidden" : "contents"}>
      <TimetableWorkspacePanelBar
        label={t("title")}
        panels={[
          {
            id: "timetable-scope-filters",
            title: t("filters.selectScope"),
            summary:
              scopeChain.map((segment) => segment.name).join(" · ") ||
              t("config.scopeOptions.term"),
            expanded: scopeFiltersExpanded,
            onExpandedChange: setScopeFiltersExpanded,
          },
          {
            id: "timetable-creation-progress",
            title: creationProgressCopy.navigationLabel,
            summary: creationProgressSummary,
            expanded: creationProgressExpanded,
            onExpandedChange: setCreationProgressExpanded,
          },
          ...(hasTimetableScope
            ? [
                {
                  id: "timetable-context",
                  title: t("target.label"),
                  summary: configSourceLabel,
                  expanded: timetableContextExpanded,
                  onExpandedChange: setTimetableContextExpanded,
                },
              ]
            : []),
        ]}
      />

      {scopeFiltersExpanded && (
        <div
          id="timetable-scope-filters"
          ref={scopeRef}
          tabIndex={-1}
          className="shrink-0 print:hidden"
        >
          <FilterBar
            configurationMode={configurationMode}
            onConfigurationModeChange={(mode) => {
              if (mode === configurationMode) return;
              guardedNavigate(() => {
                resetSchedulingInteraction();
                setConfigDialogOpen(false);
                setPeriodsDialogOpen(false);
                if (mode === "term") selectTermDefaultConfiguration();
                else selectCustomConfigurationScope();
              });
            }}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedClassroomId={selectedClassroomId}
            onStageChange={(stageId) => {
              resetSchedulingInteraction();
              onStageChange(stageId);
            }}
            onGradeChange={(gradeId) => {
              resetSchedulingInteraction();
              onGradeChange(gradeId);
            }}
            onSectionChange={(sectionId) => {
              resetSchedulingInteraction();
              onSectionChange(sectionId);
            }}
            onClassroomChange={(classroomId) => {
              resetSchedulingInteraction();
              onClassroomChange(classroomId);
            }}
            locale={locale}
          />
        </div>
      )}

      {creationProgressExpanded && (
        <div id="timetable-creation-progress" className="shrink-0">
          <TimetableCreationStepper
            progress={creationProgress}
            copy={creationProgressCopy}
            onAction={openCreationStep}
          />
        </div>
      )}

      {hasTimetableScope && timetableContextExpanded && (
        <div id="timetable-context" className="shrink-0 print:hidden">
          <div className="bg-white px-4 py-3 lg:px-6">
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
            </div>
          </div>
          {!timetableLoading && (
            <TimetableSourceBanner
              workspaceState={workspaceState}
              sourceName={configSourceLabel}
              configurationScope={configurationScope}
              primaryActionEnabled={sourceActionEnabled}
              onCreateOverride={customizeFilteredScope}
              onReturnToTermDefault={returnToTermDefault}
              copy={{
                exactTitle: t("source.exactTitle"),
                exactDescription: t("source.exactDescription"),
                termDefaultTitle: t("source.termDefaultTitle"),
                termDefaultDescription: t("source.termDefaultDescription"),
                inheritedTitle: t("source.inheritedTitle"),
                inheritedDescription: t("source.inheritedDescription"),
                unconfiguredTitle: t("source.unconfiguredTitle"),
                unconfiguredDescription: t("source.unconfiguredDescription"),
                unconfiguredScopeDescription: t(
                  "source.unconfiguredScopeDescription",
                ),
                sourceLabel: t("source.sourceLabel"),
                lockedLabel: t("source.lockedLabel"),
                createOverride: t("source.createOverride"),
                customizeScope: t("source.customizeScope"),
                openSelectedScope: t("source.openSelectedScope"),
                returnToTermDefault: t("source.returnToTermDefault"),
                overrideUnavailable: t("source.overrideUnavailable"),
                publishedOverridesNote: t("source.publishedOverridesNote"),
              }}
            />
          )}
        </div>
      )}

      </div>

      {hasTimetableScope && !timetableLoading && readOnlyBanner && (
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
      {hasTimetableScope && timetableLoading && (
        <TimetableActionBarLoadingSkeleton />
      )}
      {hasTimetableScope && !timetableLoading && (
        <TimetableWorkspaceToolbar
          context={{
            selection: selectedClassroom
              ? getDisplayName(selectedClassroom)
              : (scopeChain.at(-1)?.name ??
                t("workspace.allClassrooms", { count: displayedClassrooms.length })),
            academicYear: academicYearName,
            term: termName,
            configuration:
              config?.name ??
              workspaceState.effectiveConfig?.name ??
              t("workspace.noConfiguration"),
            scope: configSourceLabel,
            status: !workspaceState.displayConfigId
              ? "unconfigured"
              : isPublished
                ? "published"
                : "draft",
            inherited: workspaceState.isInherited,
            readOnly: !canEditTimetable,
            dirty: isDirty,
          }}
          density={gridDensity}
          onDensityChange={setGridDensity}
          actions={{
            save: canManageTimetable
              ? {
                  label: isSaving ? t("actions.saving") : t("actions.save"),
                  onClick: handleSave,
                  disabled:
                    !isDirty || isSaving || !canEditTimetable || !resolvedConfig,
                  loading: isSaving,
                  icon: <Save className="h-4 w-4" aria-hidden="true" />,
                }
              : undefined,
            validate: {
              label: t("actions.validate"),
              onClick: handleValidationOpen,
              disabled: !resolvedConfig,
              loading: isValidating,
              icon: <CheckCircle className="h-4 w-4" aria-hidden="true" />,
            },
            generate: canManageTimetable
              ? {
                  label: t("actions.generate"),
                  onClick: openGenerationDialog,
                  disabled: !canEditTimetable || !resolvedConfig,
                  icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
                }
              : undefined,
            publication: canManageTimetable
              ? {
                  label: isPublished ? t("actions.unpublish") : t("actions.publish"),
                  onClick: isPublished ? handleUnpublish : handlePublish,
                  disabled: isPublished
                    ? !canUnpublishTimetable
                    : !canEditTimetable || isDirty || !resolvedConfig,
                  loading: isPublished ? isUnpublishing : isPublishing,
                  icon: isPublished ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  ),
                  hint:
                    isPublished && config && !isUnpublishScopeSupported
                      ? t("errors.unpublishUnsupportedScope")
                      : undefined,
                }
              : undefined,
            settings: !canManageTimetable
              ? []
              : isTermDefaultConfiguration
                ? [
                    {
                      value: "settings",
                      label: t("actions.settings"),
                      icon: <Settings className="h-4 w-4" aria-hidden="true" />,
                      onClick: openTimetableSettings,
                    },
                  ]
                : [
                    {
                      value: "configuration",
                      label: t("config.button"),
                      icon: <Settings className="h-4 w-4" aria-hidden="true" />,
                      onClick: openConfigurationEditor,
                      disabled: !canConfigureTimetable,
                    },
                    {
                      value: "periods",
                      label: t("config.periodsButton"),
                      icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
                      onClick: () => setPeriodsDialogOpen(true),
                      disabled: !canEditTimetable || !config,
                    },
                  ],
            more: [
              {
                value: "export",
                label: t("actions.export"),
                icon: <Download className="h-4 w-4" aria-hidden="true" />,
                onClick: () => setShowExportModal(true),
                disabled: !resolvedConfig,
              },
              {
                value: "print",
                label: t("actions.print"),
                icon: <Printer className="h-4 w-4" aria-hidden="true" />,
                onClick: printTimetable,
                disabled: !resolvedConfig,
              },
              ...(canManageTimetable
                ? [
                    {
                      value: "reset",
                      label: t("actions.reset"),
                      icon: <RotateCcw className="h-4 w-4" aria-hidden="true" />,
                      onClick: handleReset,
                      disabled: !isDirty || !canEditTimetable || !resolvedConfig,
                    },
                    {
                      value: "delete",
                      label: t("actions.deleteAllEntries"),
                      icon: (
                        <Trash2 className="h-4 w-4 text-red-700" aria-hidden="true" />
                      ),
                      onClick: () => setDeleteAllEntriesConfirmOpen(true),
                      disabled:
                        !canEditTimetable ||
                        filledTimetableEntryCount === 0 ||
                        isSaving,
                      tone: "danger" as const,
                    },
                  ]
                : []),
            ],
          }}
        />
      )}

      {hasTimetableScope && (
        <TimetableViewNavigation
          classrooms={switchableClassrooms.map((classroom) => ({
            value: classroom.id,
            label: getClassroomScopeChain(classroom),
            triggerLabel: getDisplayName(classroom),
          }))}
          classroomId={selectedClassroomId}
          onClassroomChange={(classroomId) => {
            resetSchedulingInteraction();
            setFocusedSearchEntryId(null);
            onClassroomChange(classroomId);
          }}
          query={lessonQuery}
          onQueryChange={(query) => {
            setLessonQuery(query);
            setFocusedSearchEntryId(null);
          }}
          matchCount={lessonMatches.length}
          matchPosition={focusedSearchIndex + 1}
          onMatchStep={stepThroughLessonMatches}
          focusMode={focusMode}
          onFocusModeChange={setFocusMode}
          disabled={timetableLoading}
        />
      )}

      {/* Grid */}
      <DndContext
        sensors={dragSensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1">
          {canEditTimetable && selectedClassroom && (
            <TimetableResourceLibrary
              items={schedulingLibraryItems}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              locale={locale}
              selectedItemId={selectedLibraryItem?.id ?? null}
              isOpen={desktopLibraryOpen}
              mobile={false}
              disabled={!canEditTimetable}
              onOpenChange={setDesktopLibraryOpen}
              onItemSelect={selectLibraryItem}
            />
          )}
          <div
            ref={gridRef}
            tabIndex={-1}
            className="h-full min-h-0 min-w-0 flex-1 overflow-auto p-3 lg:p-6 print:overflow-visible print:p-0"
          >
            {timetableLoading ? (
              <TimetableGridLoadingSkeleton label={t("loadingLabel")} />
            ) : !hasTimetableScope ? (
              <AcademicModuleEmptyState
                icon={AlertCircle}
                title={tEmpty("no_timetable_selection.title")}
                description={tEmpty("no_timetable_selection.description")}
                className="h-full"
              />
            ) : !resolvedConfig ? (
              <AcademicModuleEmptyState
                icon={Settings}
                title={tEmpty("no_timetable_config.title")}
                description={tEmpty("no_timetable_config.description")}
                ctaLabel={tEmpty("no_timetable_config.cta")}
                ctaDisabled={!canCreateConfig}
                onCtaClick={openConfigurationEditor}
                className="h-full"
              />
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
                  canManageTimetable
                    ? isTermDefaultConfiguration
                      ? openTimetableSettings
                      : () => setPeriodsDialogOpen(true)
                    : undefined
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
              <div className="space-y-3">
                {canEditTimetable && (
                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                    {selectedClassroom ? (
                      <>
                        {!desktopLibraryOpen && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="hidden lg:inline-flex"
                            onClick={() => setDesktopLibraryOpen(true)}
                            leftIcon={
                              <Library className="h-4 w-4" aria-hidden="true" />
                            }
                          >
                            {t("schedulingLibrary.open")}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="lg:hidden"
                          onClick={() => setMobileLibraryOpen(true)}
                          leftIcon={
                            <Library className="h-4 w-4" aria-hidden="true" />
                          }
                        >
                          {t("schedulingLibrary.open")}
                        </Button>
                        {selectedLibraryItem && (
                          <span className="text-sm text-primary-700">
                            {t("schedulingLibrary.clickSlotHint")}
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {t("schedulingLibrary.selectClassroomHint")}
                      </p>
                    )}
                  </div>
                )}
                {undoEffect && (
                  <TimetableUndoBanner
                    message={t(
                      `schedulingLibrary.effects.${undoEffect.toLowerCase()}`,
                    )}
                    undoLabel={t("schedulingLibrary.undo")}
                    dismissLabel={t("schedulingLibrary.dismissUndo")}
                    onUndo={handleUndoAndRestoreFocus}
                    onDismiss={dismissUndo}
                  />
                )}
                <div
                  ref={printMatrixRef}
                  className={`timetable-print-matrix ${
                    locale === "ar"
                      ? "timetable-print-rtl"
                      : "timetable-print-ltr"
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
                        <div className="mt-1 text-xs text-gray-500">
                          {t("title")}
                        </div>
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
                      <p className="sr-only" role="status" aria-live="polite">
                        {selectedConflict?.message ?? ""}
                      </p>
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
                                onClick={() =>
                                  setSelectedSectionTabId(section.id)
                                }
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
                        const classroomScopeChain =
                          getClassroomScopeChain(classroom);
                        const showClassroomHeader =
                          displayedClassrooms.length > 1;
                        const isActive =
                          classroom.sectionId === activeSectionTabId;

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
                              density={gridDensity}
                              searchFocusRequest={searchFocusRequest}
                              highlightedEntryIds={highlightedEntryIds}
                              focusedSearchEntryId={focusedSearchIndex >= 0 ? focusedSearchEntryId : null}
                              onSearchFocusDismiss={() => setFocusedSearchEntryId(null)}
                              classroomId={classroom.id}
                              sectionId={classroom.sectionId}
                              entries={classroomEntries}
                              proposalEntries={timetableEntries}
                              subjects={subjects}
                              teachers={teachers}
                              rooms={rooms}
                              conflicts={backendConflicts}
                              focusedConflict={selectedConflict}
                              onFocusedConflictDismiss={() =>
                                setSelectedConflict(null)
                              }
                              onSlotClick={(dayKey, periodIndex) =>
                                handleSlotClick(
                                  dayKey,
                                  periodIndex,
                                  classroom.id,
                                )
                              }
                              isHolidayDay={isHolidayDay}
                              locale={locale}
                              isReadOnly={!canEditTimetable}
                              resolvedConfig={resolvedConfig}
                              selectedLibraryItem={selectedLibraryItem}
                              activeDragItem={activeDragItem}
                              canDropOnSlot={canDropOnSlot}
                              onPlaceItem={placeTimetableItem}
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
              </div>
            )}
          </div>
        </div>
        {canEditTimetable && selectedClassroom && (
          <TimetableResourceLibrary
            items={schedulingLibraryItems}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            locale={locale}
            selectedItemId={selectedLibraryItem?.id ?? null}
            isOpen={mobileLibraryOpen}
            mobile
            disabled={!canEditTimetable}
            onOpenChange={setMobileLibraryOpen}
            onItemSelect={(item) => {
              selectLibraryItem(item);
            }}
          />
        )}
        <DragOverlay>
          {activeDragItem ? (
            <div className="max-w-64 rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-xl">
              {t("schedulingLibrary.dragging")}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Validation Drawer */}
      {hasTimetableScope && resolvedConfig && (
        <ValidationPanel
          open={validationPanelOpen}
          scopeName={configSourceLabel}
          review={{...validationReview, hasUnsavedChanges: isDirty}}
          reviewContext={{academicYearId, termId}}
          validationSummary={validationSummary}
          conflicts={backendConflicts}
          teachers={teachers}
          rooms={rooms}
          classrooms={classrooms}
          selectedConflict={selectedConflict}
          onConflictSelect={(conflict) => {
            setInspectionConflict(conflict);
            setValidationPanelOpen(false);
          }}
          requirementActions={{
            openDestination: openValidationDestination,
            focusSchedule: () => {
              setValidationPanelOpen(false);
              window.requestAnimationFrame(() =>
                focusDestination(gridRef.current),
              );
            },
          }}
          onClose={() => setValidationPanelOpen(false)}
          locale={locale}
          publicationReasons={publication?.blockingReasons}
          publicationReferenceNames={publicationReasonReferenceNames}
        />
      )}

      {inspectionConflict && (
        <TimetableConflictDialog
          key={JSON.stringify([termId, inspectionConflict])}
          conflict={inspectionConflict}
          academicYearId={academicYearId}
          termId={termId}
          hasUnsavedLessons={inspectionConflict.proposedIndexes.some(
            (index) => timetableEntries.filter((entry) => entry.subjectId)[index],
          )}
          onFocusCurrent={() => {
            setInspectionConflict(null);
            focusConflictInCurrentTimetable(inspectionConflict);
          }}
          onClose={() => setInspectionConflict(null)}
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
          onTransfer={editingSlot.entry?.subjectId && canEditTimetable && !isSaving ? (mode) => {
            setEditDialogOpen(false);
            setLessonTransfer({ mode, sourceId: editingSlot.entry!.id });
          } : undefined}
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
          selectedClassroomCapacity={editingClassroom?.capacity}
          locale={locale}
        />
      )}

      {lessonTransferInput && (
        <TimetableLessonTransferDialog
          key={`${termId}:${workspaceState.displayConfigId}:${lessonTransferInput.sourceId}:${lessonTransferInput.mode}`}
          input={lessonTransferInput}
          subjects={subjects}
          teachers={teachers}
          locale={locale}
          classroomName={getClassroomScopeChain}
          configurationName={config?.name ?? workspaceState.effectiveConfig?.name ?? t("workspace.noConfiguration")}
          scopeName={configSourceLabel}
          checkConflicts={checkDraftConflicts}
          onConfirm={confirmLessonTransfer}
          onClose={() => setLessonTransfer(null)}
        />
      )}

      {/* Generate Dialog */}
      {generateDialogOpen && (
        <GenerateDialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          onGenerate={generateCurrentConfig}
          configName={config?.name ?? ""}
          scopeName={configSourceLabel}
          classroomCount={generationClassroomCount}
          activeDayCount={config?.activeDays.length ?? 0}
          instructionalPeriodCount={periods.filter((period) => period.isInstructional).length}
          blockingReason={
            isDirty
              ? t("generate.unsavedChanges")
              : !periods.some((period) => period.isInstructional)
                ? t("generate.noInstructionalPeriods")
                : !config?.activeDays.length
                  ? t("generate.noActiveDays")
                  : null
          }
          isGenerating={isGenerating}
          phase={generationPhase}
          result={generationResult}
          error={generationError}
          refreshFailed={generationRefreshFailed}
          onRetryRefresh={retryGenerationRefresh}
          onOpenValidation={() => {
            setGenerateDialogOpen(false);
            setValidationPanelOpen(true);
          }}
        />
      )}

      {/* Config Dialog */}
      {configDialogOpen && !isTermDefaultConfiguration && (
        <TimetableConfigDialog
          mode="config"
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          onSaved={async () => {
            await reloadConfigs();
            showToast(t("config.saveSuccess"), "success");
          }}
          academicYearId={academicYearId}
          termId={termId}
          config={config}
          periods={periods}
          entries={configGuardEntries}
          selectedStageId={selectedStageId}
          selectedGradeId={selectedGradeId}
          selectedSectionId={selectedSectionId}
          selectedClassroomId={selectedClassroomId}
          readOnly={!canConfigureTimetable}
          locale={locale}
          allowScopeSelection={false}
          fixedScope={configurationScope}
        />
      )}

      {periodsDialogOpen && !isTermDefaultConfiguration && (
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
          selectedStageId={selectedStageId}
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

      <ConfirmDialog
        isOpen={deleteAllEntriesConfirmOpen}
        onClose={() => setDeleteAllEntriesConfirmOpen(false)}
        onConfirm={confirmDeleteAllEntries}
        title={t("actions.deleteAllEntriesConfirmTitle")}
        description={t("actions.deleteAllEntriesConfirmMessage", {
          count: filledTimetableEntryCount,
        })}
        confirmLabel={t("actions.deleteAllEntries")}
        cancelLabel={t("publish.cancel")}
        severity="danger"
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

type LocalizedReference = {
  id: string;
  nameAr: string;
  nameEn: string;
};

type PublicationReasonEntry = {
  id: string;
  classroomId?: string;
  subjectId: string | null;
  periodIndex: number;
};

type PublicationReasonAllocation = {
  id: string;
  teacherId: string | null;
  subjectId: string;
  classroomId?: string;
};

type PeriodReference = {
  id: string;
  index: number;
  label: string;
};

function buildPublicationReasonReferenceNames({
  config,
  classrooms,
  subjects,
  rooms,
  periods,
  teachers,
  teacherAllocations,
  entries,
  locale,
}: {
  config: { id: string; name: string } | null;
  classrooms: LocalizedReference[];
  subjects: LocalizedReference[];
  rooms: LocalizedReference[];
  periods: PeriodReference[];
  teachers: LocalizedReference[];
  teacherAllocations: PublicationReasonAllocation[];
  entries: PublicationReasonEntry[];
  locale: string;
}): PublicationReasonReferenceNames {
  const classroomNames = localizedReferenceNames(classrooms, locale);
  const subjectNames = localizedReferenceNames(subjects, locale);
  const roomNames = localizedReferenceNames(rooms, locale);
  const periodNames = Object.fromEntries(
    periods.map((period) => [period.id, period.label]),
  );
  const teacherNames = localizedReferenceNames(teachers, locale);

  return {
    ...(config ? { timetableConfigId: { [config.id]: config.name } } : {}),
    classroomId: classroomNames,
    subjectId: subjectNames,
    roomId: roomNames,
    periodId: periodNames,
    teacherSubjectAllocationId: allocationReferenceNames({
      allocations: teacherAllocations,
      teacherNames,
      subjectNames,
      classroomNames,
    }),
    entryId: entryReferenceNames({
      entries,
      subjectNames,
      classroomNames,
      periodNames: Object.fromEntries(
        periods.map((period) => [period.index, period.label]),
      ),
    }),
  };
}

function localizedReferenceNames(
  references: LocalizedReference[],
  locale: string,
): Record<string, string> {
  return Object.fromEntries(
    references.map((reference) => [
      reference.id,
      localizedReferenceName(reference, locale),
    ]),
  );
}

function localizedReferenceName(reference: LocalizedReference, locale: string) {
  return locale === "ar"
    ? reference.nameAr || reference.nameEn
    : reference.nameEn || reference.nameAr;
}

function allocationReferenceNames({
  allocations,
  teacherNames,
  subjectNames,
  classroomNames,
}: {
  allocations: PublicationReasonAllocation[];
  teacherNames: Record<string, string>;
  subjectNames: Record<string, string>;
  classroomNames: Record<string, string>;
}): Record<string, string> {
  return Object.fromEntries(
    allocations.flatMap((allocation) => {
      const name = referenceName([
        allocation.teacherId ? teacherNames[allocation.teacherId] : undefined,
        subjectNames[allocation.subjectId],
        allocation.classroomId
          ? classroomNames[allocation.classroomId]
          : undefined,
      ]);
      return name ? [[allocation.id, name]] : [];
    }),
  );
}

function entryReferenceNames({
  entries,
  subjectNames,
  classroomNames,
  periodNames,
}: {
  entries: PublicationReasonEntry[];
  subjectNames: Record<string, string>;
  classroomNames: Record<string, string>;
  periodNames: Record<number, string>;
}): Record<string, string> {
  return Object.fromEntries(
    entries.flatMap((entry) => {
      const name = referenceName([
        entry.subjectId ? subjectNames[entry.subjectId] : undefined,
        entry.classroomId ? classroomNames[entry.classroomId] : undefined,
        periodNames[entry.periodIndex],
      ]);
      return name ? [[entry.id, name]] : [];
    }),
  );
}

function referenceName(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ");
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

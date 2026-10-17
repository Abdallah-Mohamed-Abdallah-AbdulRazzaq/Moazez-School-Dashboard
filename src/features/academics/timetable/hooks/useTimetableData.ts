"use client";

import { withoutClearedEntryConflicts } from "../services/timetableConflictCheck";
import { timetableEntryFingerprint } from "../services/timetableEntryFingerprint";
import { deleteTimetableEntries } from "../services/timetableEntryDeletion";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Section,
  type Stage,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherDirectory,
  fetchTeacherAllocations,
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchRooms } from "@/features/academics/rooms/services/roomsService";
import {
  bulkSaveEntries,
  checkConflicts,
  getConfig,
  getConflicts,
  getDashboardTimetable,
  getPublication,
  listEntries,
  listPeriods,
  publish,
  unpublish,
  validate,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import {
  dashboardConfigScopeId,
  resolveEffectiveDashboardTimetable,
} from "@/features/academics/timetable/services/timetableDashboardContract";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  ListResponse,
  PublicationResponse,
  TimetableDashboardConfigSummaryDto,
  TimetableDashboardItemDto,
  TimetablePublishReason,
  TimetableScopeType,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  isTimetableUnpublishScopeSupported,
  timetableConfigScopeId,
  type TimetableScopeSelection,
} from "@/features/academics/timetable/services/timetableScope";
import {
  resolveTimetableWorkspaceState,
  type TimetableWorkspaceState,
} from "@/features/academics/timetable/services/timetableWorkspaceState";
import { mapBackendEntriesToUi } from "@/features/academics/timetable/services/timetableMappers";
import {
  assertBulkPayloadSize,
  buildBulkSaveTimetableRequest,
  TEACHER_ALLOCATION_MISSING_MESSAGE,
} from "@/features/academics/timetable/services/timetableSaveMapper";
import {
  emptyValidationSummary,
  hasBlockingValidation,
  normalizeConflictCheckResponse,
  normalizePersistedConflicts,
  type TimetableValidationSummary,
  validationSummaryFromResponse,
} from "@/features/academics/timetable/services/timetableValidationSummary";
import {
  conflictFromTimetableError,
  isTimetableConfigNotFound,
  timetableErrorMessage,
  publicationBlockingReason,
  type TimetableErrorTranslator,
} from "@/features/academics/timetable/services/timetableErrorHandling";
import {
  isPublicationActive,
  type TimetableBackendMessageTranslator,
} from "@/features/academics/timetable/services/timetablePublicationReasons";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";
import {
  type ResolvedTimetableConfig,
  type TimetableConfig,
  type TimetableDay,
  type TimetablePeriod,
} from "@/features/academics/timetable/types/timetableConfig";
import type {
  Room,
  TimetableEntry,
} from "@/features/academics/timetable/types/timetable";

interface UseTimetableDataParams {
  schoolId: string;
  termId: string;
  academicYearId: string;
  enabled?: boolean;
  selectedStageId: string;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  configurationScope?: TimetableScopeSelection;
  linkedConfigurationId?: string | null;
  isScopeSelectionNormalized: boolean;
  showToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
  translateErrorCode?: TimetableErrorTranslator;
  translateBackendMessage?: TimetableBackendMessageTranslator;
  messages?: {
    loadFailed: string;
    saveFailed: string;
    saveReloadFailed: string;
    staleTimetable: string;
    partialSaveRefreshed: string;
    partialSaveReloadFailed: string;
    publishFailed: string;
    publishReloadFailed: string;
    unpublishFailed: string;
    unpublishReloadFailed: string;
    unpublishUnsupportedScope: string;
    noConfigSelected: string;
    noFilledSlotsToSave: string;
    noFilledSlotsToPublish: string;
    resolveConflictsBeforeSaving: string;
    resolveConflictsBeforePublishing: string;
    missingTeacherAllocation: string;
  };
}

type SaveTimetableResult =
  | { ok: true }
  | {
      ok: false;
      error?: string;
      hasConflicts?: boolean;
      changesWereNotSaved?: boolean;
      partialMutation?: boolean;
      authoritativeReloaded?: boolean;
    };

type UnpublishTimetableResult =
  | { ok: true }
  | { ok: false; error: string };

type TimetableSaveProgress =
  | { phase: "deleting"; completed: number; total: number }
  | { phase: "saving" | "refreshing" };

const dayNames = [
  { key: "sun", nameAr: "\u0627\u0644\u0623\u062d\u062f", nameEn: "Sunday" },
  {
    key: "mon",
    nameAr: "\u0627\u0644\u0625\u062b\u0646\u064a\u0646",
    nameEn: "Monday",
  },
  {
    key: "tue",
    nameAr: "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621",
    nameEn: "Tuesday",
  },
  {
    key: "wed",
    nameAr: "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621",
    nameEn: "Wednesday",
  },
  {
    key: "thu",
    nameAr: "\u0627\u0644\u062e\u0645\u064a\u0633",
    nameEn: "Thursday",
  },
  {
    key: "fri",
    nameAr: "\u0627\u0644\u062c\u0645\u0639\u0629",
    nameEn: "Friday",
  },
  { key: "sat", nameAr: "\u0627\u0644\u0633\u0628\u062a", nameEn: "Saturday" },
] as const;

const listResponseItems = <T>(response: ListResponse<T> | T[]): T[] =>
  Array.isArray(response) ? response : response.items;

const configScope = (config: BackendTimetableConfigDto): TimetableScopeType =>
  config.scopeType.toUpperCase() as TimetableScopeType;

const periodDtosToUi = (
  backendPeriods: BackendTimetablePeriodDto[],
): TimetablePeriod[] =>
  backendPeriods.map((period) => ({
    id: period.id,
    index: period.index,
    nameAr: period.label,
    nameEn: period.label,
    startTime: period.startTime,
    endTime: period.endTime,
    type: period.type.toUpperCase() as TimetablePeriod["type"],
    isInstructional: period.isInstructional,
  }));

const configDtoToDays = (config: BackendTimetableConfigDto): TimetableDay[] =>
  mapActiveDays(config.activeDays);

const configDtoToUi = (
  config: BackendTimetableConfigDto,
  backendPeriods: BackendTimetablePeriodDto[],
): TimetableConfig => ({
  id: config.id,
  termId: config.termId,
  scopeType: configScope(config),
  scopeId: timetableConfigScopeId(config),
  days: configDtoToDays(config),
  periods: periodDtosToUi(backendPeriods),
  updatedAt: config.updatedAt,
});

const configDtoToResolvedConfig = (
  config: BackendTimetableConfigDto,
  backendPeriods: BackendTimetablePeriodDto[],
): ResolvedTimetableConfig => ({
  days: configDtoToDays(config),
  periods: periodDtosToUi(backendPeriods),
  source: {
    scope: configScope(config),
    id: timetableConfigScopeId(config),
  },
});

const dashboardConfigToResolvedConfig = (
  config: TimetableDashboardConfigSummaryDto,
  backendPeriods: BackendTimetablePeriodDto[],
): ResolvedTimetableConfig => ({
  days: mapActiveDays(config.activeDays),
  periods: periodDtosToUi(backendPeriods),
  source: {
    scope: config.scopeType.toUpperCase() as TimetableScopeType,
    id: dashboardConfigScopeId(config),
  },
});

const publishReadinessMessage = (
  publication: PublicationResponse,
  validation: TimetableValidationSummary,
  translateMessage?: TimetableBackendMessageTranslator,
): string =>
  [
    ...(publication.blockingReasons ?? []).map((reason) =>
      readinessReasonText(reason, translateMessage),
    ),
    ...validation.blockingReasons,
    ...validation.warnings,
  ][0] ?? "Backend publication readiness is not satisfied.";

const readinessReasonText = (
  reason: string | TimetablePublishReason,
  translateMessage?: TimetableBackendMessageTranslator,
): string =>
  typeof reason === "string"
    ? reason
    : (translateMessage?.(reason.code, reason.message) ?? reason.message);

const mapActiveDays = (activeDays: number[]): TimetableDay[] =>
  dayNames.map((dayName, index) => ({
    key: dayName.key,
    index,
    nameAr: dayName.nameAr,
    nameEn: dayName.nameEn,
    isActive: activeDays.includes(index),
  }));

async function exactTimetableConfig(
  params: Parameters<typeof getConfig>[0],
): Promise<BackendTimetableConfigDto | null> {
  try {
    return await getConfig(params);
  } catch (error) {
    if (isTimetableConfigNotFound(error)) return null;
    throw error;
  }
}

const selectedDashboardItem = (
  items: TimetableDashboardItemDto[],
  classroomId: string,
): TimetableDashboardItemDto | null =>
  items.find((dashboardItem) => dashboardItem.classroomId === classroomId) ??
  null;

function configurationScopeRequest(
  scopeType: TimetableScopeType,
  ids: Omit<TimetableScopeSelection, "scopeType">,
): TimetableScopeSelection {
  switch (scopeType) {
    case "STAGE":
      return { scopeType, stageId: ids.stageId };
    case "GRADE":
      return { scopeType, gradeId: ids.gradeId };
    case "SECTION":
      return { scopeType, sectionId: ids.sectionId };
    case "CLASSROOM":
      return { scopeType, classroomId: ids.classroomId };
    default:
      return { scopeType: "TERM" };
  }
}

export function useTimetableData({
  schoolId,
  termId,
  academicYearId = "",
  enabled = true,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  configurationScope,
  linkedConfigurationId,
  isScopeSelectionNormalized,
  showToast,
  translateErrorCode,
  translateBackendMessage,
  messages,
}: UseTimetableDataParams) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<
    SubjectAllocation[]
  >([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAllocations, setTeacherAllocations] = useState<
    TeacherAllocation[]
  >([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const savedEntryFingerprintRef = useRef<string | null>(null);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(
    [],
  );
  const [allTermEntries, setAllTermEntries] = useState<TimetableEntry[]>([]);
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [resolvedConfig, setResolvedConfig] =
    useState<ResolvedTimetableConfig | null>(null);
  const [config, setConfig] = useState<BackendTimetableConfigDto | null>(null);
  const [workspaceState, setWorkspaceState] = useState<TimetableWorkspaceState>(
    () =>
      resolveTimetableWorkspaceState({
        exactConfig: null,
        effectiveConfig: null,
      }),
  );
  const [periods, setPeriods] = useState<BackendTimetablePeriodDto[]>([]);
  const [publication, setPublication] = useState<PublicationResponse | null>(
    null,
  );
  const [conflicts, setConflicts] = useState<TimetableConflictDisplay[]>([]);
  const [validationSummary, setValidationSummary] =
    useState<TimetableValidationSummary>(emptyValidationSummary);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dependenciesLoading, setDependenciesLoading] = useState(true);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<TimetableSaveProgress | null>(null);

  const dependenciesRequestIdRef = useRef(0);
  const timetableRequestIdRef = useRef(0);
  const timetableSelectionRef = useRef<string | null>(null);
  const validationRequestIdRef = useRef(0);
  const dependenciesLoadedKeyRef = useRef<string | null>(null);
  const dependenciesInFlightKeyRef = useRef<string | null>(null);

  const messagesRef = useRef(messages);
  const translateErrorCodeRef = useRef(translateErrorCode);
  const showToastRef = useRef(showToast);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    translateErrorCodeRef.current = translateErrorCode;
  }, [translateErrorCode]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const isLoading = dependenciesLoading && stages.length === 0;

  const configurationScopeType = configurationScope?.scopeType ?? "TERM";
  const configurationStageId = configurationScope?.stageId;
  const configurationGradeId = configurationScope?.gradeId;
  const configurationSectionId = configurationScope?.sectionId;
  const configurationClassroomId = configurationScope?.classroomId;

  const clearTimetableState = useCallback(() => {
    setConfig(null);
    setWorkspaceState(
      resolveTimetableWorkspaceState({
        exactConfig: null,
        effectiveConfig: null,
      }),
    );
    setPeriods([]);
    setPublication(null);
    setConflicts([]);
    setValidationSummary(emptyValidationSummary());
    savedEntryFingerprintRef.current = null;
    setTimetableEntries([]);
    setAllTermEntries([]);
    setConfigs([]);
    setResolvedConfig(null);
  }, []);

  const loadAcademicDependencies = useCallback(async () => {
    const dependenciesKey = `${academicYearId}:${termId}:${schoolId}`;

    if (!enabled || !termId || !academicYearId) {
      ++dependenciesRequestIdRef.current;
      setStages([]);
      setGrades([]);
      setSections([]);
      setClassrooms([]);
      setSubjects([]);
      setSubjectAllocations([]);
      setTeachers([]);
      setTeacherAllocations([]);
      setRooms([]);
      setDependenciesLoading(false);
      dependenciesLoadedKeyRef.current = null;
      dependenciesInFlightKeyRef.current = null;
      return;
    }

    if (dependenciesInFlightKeyRef.current === dependenciesKey) {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "[Timetable] loadAcademicDependencies skipped (in-flight)",
          { dependenciesKey },
        );
      }
      return;
    }

    if (dependenciesLoadedKeyRef.current === dependenciesKey) {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "[Timetable] loadAcademicDependencies skipped (already loaded)",
          { dependenciesKey },
        );
      }
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.debug("[Timetable] loadAcademicDependencies", {
        dependenciesKey,
        reason: "start",
      });
    }

    const requestId = ++dependenciesRequestIdRef.current;
    dependenciesInFlightKeyRef.current = dependenciesKey;
    setDependenciesLoading(true);
    setApiError(null);

    try {
      if (requestId !== dependenciesRequestIdRef.current) return;

      const [
        structure,
        subjectsData,
        subjectAllocsData,
        teacherDirectory,
        teacherAllocsData,
        roomsData,
      ] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchSubjects(),
        fetchSubjectAllocations(termId),
        fetchTeacherDirectory(),
        fetchTeacherAllocations(termId),
        fetchRooms(schoolId),
      ]);

      if (requestId !== dependenciesRequestIdRef.current) return;

      setStages(structure.stages || []);
      setGrades(structure.grades || []);
      setSections(structure.sections || []);
      setClassrooms(structure.classrooms || []);
      setSubjects(subjectsData);
      setSubjectAllocations(subjectAllocsData);
      setTeachers(teacherDirectory.teachers);
      setTeacherAllocations(teacherAllocsData);
      setRooms(roomsData);

      dependenciesLoadedKeyRef.current = dependenciesKey;
    } catch (error) {
      if (requestId !== dependenciesRequestIdRef.current) return;

      const currentMessages = messagesRef.current;
      const currentTranslateErrorCode = translateErrorCodeRef.current;
      const currentShowToast = showToastRef.current;

      const message = timetableErrorMessage(
        error,
        currentMessages?.loadFailed ?? "Failed to load academic dependencies.",
        currentTranslateErrorCode,
      );
      setApiError(message);
      console.error("Failed to load academic dependencies:", error);
      currentShowToast(message, "error");
    } finally {
      if (dependenciesInFlightKeyRef.current === dependenciesKey) {
        dependenciesInFlightKeyRef.current = null;
      }
      if (requestId === dependenciesRequestIdRef.current) {
        setDependenciesLoading(false);
      }
    }
  }, [enabled, schoolId, termId, academicYearId]);

  const loadTimetableForScope = useCallback(async (): Promise<boolean> => {
    const requestId = ++timetableRequestIdRef.current;

    if (!enabled || !termId || !academicYearId || !isScopeSelectionNormalized) {
      timetableSelectionRef.current = null;
      clearTimetableState();
      setTimetableLoading(false);
      return true;
    }

    setTimetableLoading(true);
    setApiError(null);
    const selectionKey = JSON.stringify([
      schoolId,
      academicYearId,
      termId,
      configurationScopeType,
      configurationStageId,
      configurationGradeId,
      configurationSectionId,
      configurationClassroomId,
      selectedClassroomId,
      linkedConfigurationId,
    ]);
    if (timetableSelectionRef.current !== selectionKey) {
      clearTimetableState();
      timetableSelectionRef.current = selectionKey;
    }

    try {
      if (requestId !== timetableRequestIdRef.current) return false;

      const [nextConfig, dashboardResponse] = await Promise.all([
        exactTimetableConfig({
          academicYearId,
          termId,
          ...configurationScopeRequest(configurationScopeType, {
            stageId: configurationStageId,
            gradeId: configurationGradeId,
            sectionId: configurationSectionId,
            classroomId: configurationClassroomId,
          }),
        }),
        selectedClassroomId
          ? getDashboardTimetable({
              termId,
              classroomId: selectedClassroomId,
            })
          : Promise.resolve(null),
      ]);

      if (requestId !== timetableRequestIdRef.current) return false;

      if (linkedConfigurationId && nextConfig?.id !== linkedConfigurationId) {
        clearTimetableState();
        throw new Error(
          "The linked timetable configuration is no longer available.",
        );
      }

      const dashboardItem = dashboardResponse
        ? selectedDashboardItem(dashboardResponse.items, selectedClassroomId)
        : null;
      const nextWorkspaceState = resolveTimetableWorkspaceState({
        exactConfig: nextConfig,
        effectiveConfig: dashboardItem?.effectiveConfig ?? null,
      });

      if (!nextWorkspaceState.displayConfigId) {
        clearTimetableState();
        return true;
      }

      const inheritedTimetable = dashboardItem
        ? resolveEffectiveDashboardTimetable(dashboardItem)
        : null;
      if (nextWorkspaceState.isInherited && inheritedTimetable) {
        const publicationResponse = (await getPublication(
          nextWorkspaceState.displayConfigId,
        )) as PublicationResponse;
        if (requestId !== timetableRequestIdRef.current) return false;

        const mappedEntries = mapBackendEntriesToUi(
          inheritedTimetable.entries,
        );
        setConfig(null);
        setWorkspaceState(nextWorkspaceState);
        setPeriods(inheritedTimetable.periods);
        setPublication(publicationResponse);
        setConflicts([]);
        setValidationSummary(emptyValidationSummary());
        setTimetableEntries(mappedEntries.entries);
        setAllTermEntries(mappedEntries.entries);
        setConfigs([]);
        setResolvedConfig(
          dashboardConfigToResolvedConfig(
            inheritedTimetable.config,
            inheritedTimetable.periods,
          ),
        );
        return true;
      }

      if (!nextConfig) return false;

      const configId = nextConfig.id || nextConfig.timetableConfigId || "";
      const entriesRequest = listEntries({
        timetableConfigId: configId,
        classroomId: selectedClassroomId || undefined,
      });
      const allEntriesRequest = selectedClassroomId
        ? listEntries({ timetableConfigId: configId })
        : entriesRequest;
      const [
        periodsResponse,
        entriesResponse,
        allEntriesResponse,
        publicationResponse,
      ] = await Promise.all([
        listPeriods(configId),
        entriesRequest,
        allEntriesRequest,
        getPublication(configId) as Promise<PublicationResponse>,
      ]);

      if (requestId !== timetableRequestIdRef.current) return false;

      const nextPeriods =
        listResponseItems<BackendTimetablePeriodDto>(periodsResponse);
      const nextEntries =
        listResponseItems<BackendTimetableEntryDto>(entriesResponse);
      savedEntryFingerprintRef.current = timetableEntryFingerprint(nextEntries);
      const mappedEntries = mapBackendEntriesToUi(nextEntries);
      const allMappedEntries = mapBackendEntriesToUi(
        listResponseItems<BackendTimetableEntryDto>(allEntriesResponse),
      );
      const nextConfigModel = configDtoToUi(nextConfig, nextPeriods);

      setConfig(nextConfig);
      setWorkspaceState(nextWorkspaceState);
      setPeriods(nextPeriods);
      setPublication(publicationResponse);
      setConflicts([]);
      setValidationSummary(emptyValidationSummary());
      setTimetableEntries(mappedEntries.entries);
      setAllTermEntries(allMappedEntries.entries);
      setConfigs([nextConfigModel]);
      setResolvedConfig(configDtoToResolvedConfig(nextConfig, nextPeriods));
      return true;
    } catch (error) {
      if (requestId !== timetableRequestIdRef.current) return false;
      const message = timetableErrorMessage(
        error,
        messages?.loadFailed ?? "Failed to load timetable for scope.",
        translateErrorCode,
      );
      setApiError(message);
      console.error("Failed to load timetable for scope:", error);
      showToast(message, "error");
      return false;
    } finally {
      if (requestId === timetableRequestIdRef.current) {
        setTimetableLoading(false);
      }
    }
  }, [
    schoolId,
    enabled,
    termId,
    academicYearId,
    isScopeSelectionNormalized,
    linkedConfigurationId,
    configurationClassroomId,
    configurationGradeId,
    configurationScopeType,
    configurationSectionId,
    configurationStageId,
    selectedClassroomId,
    clearTimetableState,
    messages,
    translateErrorCode,
    showToast,
  ]);
  const reloadConfigs = useCallback(async () => {
    if (!(await loadTimetableForScope())) {
      throw new Error(messages?.loadFailed ?? "Failed to refresh timetable.");
    }
  }, [loadTimetableForScope, messages?.loadFailed]);

  const loadTimetable = useCallback(async () => {
    if (!(await loadTimetableForScope())) {
      throw new Error(messages?.loadFailed ?? "Failed to refresh timetable.");
    }
  }, [loadTimetableForScope, messages?.loadFailed]);

  const loadConflicts = useCallback(async (): Promise<
    TimetableConflictDisplay[]
  > => {
    if (!config) {
      setConflicts([]);
      return [];
    }
    const response = await getConflicts(config.id);
    const nextConflicts = normalizePersistedConflicts(response, periods, {
      entries: allTermEntries,
      translateMessage: translateBackendMessage,
    }).conflicts;
    setConflicts(nextConflicts);
    return nextConflicts;
  }, [allTermEntries, config, periods, translateBackendMessage]);

  const checkDraftConflicts = useCallback(
    async (entries: TimetableEntry[], destinationEntryId?: string) => {
      if (!config || timetableLoading)
        throw new Error("No editable timetable configuration selected.");
      const request = buildBulkSaveTimetableRequest({
        termId,
        entries,
        periods,
        teacherAllocations,
        selectedSectionId,
        selectedClassroomId: selectedClassroomId || undefined,
      });
      if (
        request.skippedSlots.some(
          ({ entry }) => !destinationEntryId || entry.id === destinationEntryId,
        )
      )
        throw new Error(
          messages?.missingTeacherAllocation ??
            TEACHER_ALLOCATION_MISSING_MESSAGE,
        );
      assertBulkPayloadSize(request.payload.items, "conflict-check");
      const skippedIds = new Set(
        request.skippedSlots.map(({ entry }) => entry.id),
      );
      const proposedEntries = entries.filter(
        (entry) => entry.subjectId && !skippedIds.has(entry.id),
      );
      const destinationIndex = proposedEntries.findIndex(
        (entry) => entry.id === destinationEntryId,
      );
      if (destinationEntryId && destinationIndex < 0)
        throw new Error(
          "Transfer destination is missing from the conflict check.",
        );
      const response = await checkConflicts(request.payload);
      const checkedResponse = withoutClearedEntryConflicts(response, entries);
      const relevantResponse = destinationEntryId
        ? {
            ...checkedResponse,
            conflicts: checkedResponse.conflicts.filter((conflict) =>
              conflict.proposedIndexes.includes(destinationIndex),
            ),
          }
        : checkedResponse;
      return normalizeConflictCheckResponse(relevantResponse, periods, {
        entries: allTermEntries,
        proposedEntries,
        translateMessage: translateBackendMessage,
      }).conflicts;
    },
    [
      config,
      timetableLoading,
      termId,
      periods,
      teacherAllocations,
      selectedSectionId,
      selectedClassroomId,
      messages?.missingTeacherAllocation,
      allTermEntries,
      translateBackendMessage,
    ],
  );
  const loadValidation =
    useCallback(async (): Promise<TimetableValidationSummary> => {
      const response = await validate({
        termId,
        gradeId: selectedGradeId || undefined,
        classroomId: selectedClassroomId || undefined,
      });
      const nextValidationSummary = validationSummaryFromResponse(
        response,
        translateBackendMessage,
      );
      setValidationSummary(nextValidationSummary);
      return nextValidationSummary;
    }, [
      selectedClassroomId,
      selectedGradeId,
      termId,
      translateBackendMessage,
    ]);

  const refreshValidationReview = useCallback(async () => {
    const configId = workspaceState.displayConfigId;
    if (!configId || timetableLoading || !isScopeSelectionNormalized) throw new Error("No timetable configuration selected.");
    const scopeRequest = timetableRequestIdRef.current;
    const validationRequest = ++validationRequestIdRef.current;
    const [validationResponse, conflictResponse, nextPublication] = await Promise.all([
      validate({termId, gradeId: selectedGradeId || undefined, classroomId: selectedClassroomId || undefined}),
      getConflicts(configId),
      getPublication(configId),
    ]);
    if (scopeRequest !== timetableRequestIdRef.current || validationRequest !== validationRequestIdRef.current) return null;
    const summary = validationSummaryFromResponse(validationResponse, translateBackendMessage);
    const nextConflicts = normalizePersistedConflicts(conflictResponse, periods, {entries: allTermEntries, translateMessage: translateBackendMessage}).conflicts;
    setValidationSummary(summary);
    setConflicts(nextConflicts);
    setPublication(nextPublication);
    return {summary, conflicts: nextConflicts, publication: nextPublication};
  }, [workspaceState.displayConfigId, timetableLoading, isScopeSelectionNormalized, termId, selectedGradeId, selectedClassroomId, periods, allTermEntries, translateBackendMessage]);

  const reloadGeneratedTimetable = useCallback(async () => {
    if (!(await loadTimetableForScope())) {
      throw new Error(messages?.loadFailed ?? "Failed to refresh timetable.");
    }
    await Promise.all([loadValidation(), loadConflicts()]);
  }, [loadTimetableForScope, loadValidation, loadConflicts, messages?.loadFailed]);

  const loadPublication =
    useCallback(async (): Promise<PublicationResponse | null> => {
      if (!config) {
        setPublication(null);
        return null;
      }
      const nextPublication = (await getPublication(
        config.id,
      )) as PublicationResponse;
      setPublication(nextPublication);
      return nextPublication;
    }, [config]);

  const saveTimetable = useCallback(
    async (entries: TimetableEntry[]): Promise<SaveTimetableResult> => {
      if (!config) {
        return { ok: false };
      }

      let deletionStarted = false;
      setIsSaving(true);
      try {
        // Identify cleared entries that need to be deleted from the backend.
        // A cleared entry has no subjectId but has a real backend ID (not temp-).
        const entriesToDelete = entries.filter(
          (entry) =>
            !entry.subjectId && entry.id && !entry.id.startsWith("temp-"),
        );

        const bulkSaveRequest = buildBulkSaveTimetableRequest({
          termId,
          entries,
          periods,
          teacherAllocations,
          selectedSectionId,
          selectedClassroomId: selectedClassroomId || undefined,
        });

        if (bulkSaveRequest.skippedSlots.length > 0) {
          const message =
            messages?.missingTeacherAllocation ??
            TEACHER_ALLOCATION_MISSING_MESSAGE;
          setApiError(message);
          return {
            ok: false,
            error: message,
            changesWereNotSaved: true,
          };
        }

        // If there are no items to bulk-save but we did delete entries, that's still a valid save.
        if (
          bulkSaveRequest.payload.items.length === 0 &&
          entriesToDelete.length === 0
        ) {
          const message =
            messages?.noFilledSlotsToSave ??
            "No filled timetable slots to save.";
          setApiError(message);
          return {
            ok: false,
            error: message,
            changesWereNotSaved: true,
          };
        }

        const currentEntries = await listEntries({
          timetableConfigId: config.id,
          classroomId: selectedClassroomId || undefined,
        });
        const currentFingerprint = timetableEntryFingerprint(
          listResponseItems<BackendTimetableEntryDto>(currentEntries),
        );
        if (currentFingerprint !== savedEntryFingerprintRef.current) {
          const message = messages?.staleTimetable ??
            "This timetable changed in another session. Your draft was kept. Reset to load the latest timetable before saving again.";
          setApiError(message);
          return { ok: false, error: message, changesWereNotSaved: true };
        }

        // Only run bulk save + conflict check if there are items to save
        if (bulkSaveRequest.payload.items.length > 0) {
          assertBulkPayloadSize(
            bulkSaveRequest.payload.items,
            "conflict-check",
          );
          const conflictResponse = await checkConflicts(
            bulkSaveRequest.payload,
          );
          const nextConflicts = normalizeConflictCheckResponse(
            withoutClearedEntryConflicts(conflictResponse, entries),
            periods,
            {
              entries: allTermEntries,
              proposedEntries: entries.filter((entry) => entry.subjectId),
              translateMessage: translateBackendMessage,
            },
          ).conflicts;
          setConflicts(nextConflicts);
          if (nextConflicts.length > 0) {
            return {
              ok: false,
              hasConflicts: true,
              changesWereNotSaved: true,
              error:
                messages?.resolveConflictsBeforeSaving ??
                "Resolve timetable conflicts before saving.",
            };
          }
        }

        if (entriesToDelete.length > 0) {
          deletionStarted = true;
          setSaveProgress({ phase: "deleting", completed: 0, total: entriesToDelete.length });
          await deleteTimetableEntries(
            entriesToDelete.map((entry) => entry.id),
            (completed) => setSaveProgress({ phase: "deleting", completed, total: entriesToDelete.length }),
          );
        }

        if (bulkSaveRequest.payload.items.length > 0) {
          setSaveProgress({ phase: "saving" });
          assertBulkPayloadSize(bulkSaveRequest.payload.items, "save");
          await bulkSaveEntries(bulkSaveRequest.payload);
        }
        setSaveProgress({ phase: "refreshing" });
        const reloadSucceeded = await loadTimetableForScope();
        if (!reloadSucceeded) {
          const message =
            messages?.saveReloadFailed ??
            "Timetable changes may have been saved, but the authoritative reload failed.";
          setApiError(message);
          return {
            ok: false,
            error: message,
            partialMutation: true,
          };
        }

        return { ok: true };
      } catch (error) {
        const conflict = conflictFromTimetableError(error, periods, {
          entries: allTermEntries,
          proposedEntries: entries.filter((entry) => entry.subjectId),
          translateMessage: translateBackendMessage,
        });
        if (conflict) {
          setConflicts([conflict]);
        }
        const baseMessage = timetableErrorMessage(
          error,
          messages?.saveFailed ?? "Failed to save timetable.",
          translateErrorCode,
        );
        if (deletionStarted) setSaveProgress({ phase: "refreshing" });
        const recoveryReloadSucceeded = deletionStarted
          ? await loadTimetableForScope()
          : false;
        const message = deletionStarted
          ? `${baseMessage} ${
              recoveryReloadSucceeded
                ? (messages?.partialSaveRefreshed ??
                  "Some deletions may already have been applied. The timetable was refreshed.")
                : (messages?.partialSaveReloadFailed ??
                  "Some deletions may already have been applied, and the authoritative reload failed.")
            }`
          : baseMessage;
        setApiError(message);
        console.error("Failed to save timetable:", error);
        return {
          ok: false,
          hasConflicts: !!conflict,
          error: message,
          partialMutation: deletionStarted,
          authoritativeReloaded: recoveryReloadSucceeded,
        };
      } finally {
        setIsSaving(false);
        setSaveProgress(null);
      }
    },
    [
      config,
      allTermEntries,
      periods,
      selectedClassroomId,
      selectedSectionId,
      teacherAllocations,
      termId,
      messages,
      translateErrorCode,
      translateBackendMessage,
      loadTimetableForScope,
    ],
  );

  const publishCurrentTimetable = useCallback(
    async (
      entries: TimetableEntry[],
      nextValidationSummary: TimetableValidationSummary,
    ) => {
      if (!config) {
        return {
          ok: false,
          error: messages?.noConfigSelected ?? "No timetable config selected.",
        };
      }

      try {
        const nextPublication = (await getPublication(
          config.id || config.timetableConfigId || "",
        )) as PublicationResponse;
        setPublication(nextPublication);

        if (nextPublication.canPublish !== true) {
          return {
            ok: false,
            error: publishReadinessMessage(
              nextPublication,
              nextValidationSummary,
              translateBackendMessage,
            ),
          };
        }
        if (hasBlockingValidation(nextValidationSummary)) {
          return {
            ok: false,
            error: publishReadinessMessage(
              nextPublication,
              nextValidationSummary,
              translateBackendMessage,
            ),
          };
        }

        const bulkSaveRequest = buildBulkSaveTimetableRequest({
          termId,
          entries,
          periods,
          teacherAllocations,
          selectedSectionId,
          selectedClassroomId: selectedClassroomId || undefined,
        });
        if (bulkSaveRequest.skippedSlots.length > 0) {
          const message =
            messages?.missingTeacherAllocation ??
            TEACHER_ALLOCATION_MISSING_MESSAGE;
          return {
            ok: false,
            error: message,
          };
        }
        if (bulkSaveRequest.payload.items.length === 0) {
          return {
            ok: false,
            error:
              messages?.noFilledSlotsToPublish ??
              "No filled timetable slots to publish.",
          };
        }
        assertBulkPayloadSize(bulkSaveRequest.payload.items, "conflict-check");
        const conflictResponse = await checkConflicts(bulkSaveRequest.payload);
        const nextConflicts = normalizeConflictCheckResponse(
          conflictResponse,
          periods,
          {
            entries: allTermEntries,
            proposedEntries: entries.filter((entry) => entry.subjectId),
            translateMessage: translateBackendMessage,
          },
        ).conflicts;
        setConflicts(nextConflicts);
        if (nextConflicts.length > 0) {
          return {
            ok: false,
            hasConflicts: true,
            error:
              messages?.resolveConflictsBeforePublishing ??
              "Resolve timetable conflicts before publishing.",
          };
        }

        const published = await publish(config.id || config.timetableConfigId || "");
        setPublication(published);
        if (!(await loadTimetableForScope())) {
          const message = messages?.publishReloadFailed ??
            "The timetable was published, but its view could not be refreshed. Reload the page to load the latest data.";
          setApiError(message);
          return { ok: false, error: message };
        }
        return { ok: true };
      } catch (error) {
        const conflict = conflictFromTimetableError(error, periods, {
          entries: allTermEntries,
          proposedEntries: entries.filter((entry) => entry.subjectId),
          translateMessage: translateBackendMessage,
        });
        if (conflict) {
          setConflicts([conflict]);
        }
        const message =
          publicationBlockingReason(error, translateBackendMessage) ??
          timetableErrorMessage(
            error,
            messages?.publishFailed ?? "Failed to publish timetable.",
            translateErrorCode,
          );
        setApiError(message);
        console.error("Failed to publish timetable:", error);
        return { ok: false, hasConflicts: !!conflict, error: message };
      }
    },
    [
      config,
      allTermEntries,
      messages,
      periods,
      selectedClassroomId,
      selectedSectionId,
      teacherAllocations,
      termId,
      translateErrorCode,
      translateBackendMessage,
      loadTimetableForScope,
    ],
  );

  const unpublishCurrentTimetable = useCallback(
    async (): Promise<UnpublishTimetableResult> => {
      if (!config) {
        const message =
          messages?.noConfigSelected ?? "No timetable config selected.";
        setApiError(message);
        return { ok: false, error: message };
      }
      const scope = configScope(config);
      if (!isTimetableUnpublishScopeSupported(scope)) {
        const message =
          messages?.unpublishUnsupportedScope ??
          "Unpublish is unavailable for stage and section timetables.";
        setApiError(message);
        return { ok: false, error: message };
      }

      try {
        const scope = configScope(config);
        await unpublish({
          termId,
          gradeId: scope === "GRADE" ? config.gradeId ?? undefined : undefined,
          classroomId:
            scope === "CLASSROOM"
              ? config.classroomId ?? undefined
              : undefined,
        });
        if (!(await loadTimetableForScope())) {
          const message = messages?.unpublishReloadFailed ??
            "The timetable was unpublished, but its view could not be refreshed. Reload the page before editing.";
          setApiError(message);
          return { ok: false, error: message };
        }
        return { ok: true };
      } catch (error) {
        const message = timetableErrorMessage(
          error,
          messages?.unpublishFailed ?? "Failed to unpublish timetable.",
          translateErrorCode,
        );
        setApiError(message);
        console.error("Failed to unpublish timetable:", error);
        return { ok: false, error: message };
      }
    },
    [
      config,
      messages,
      termId,
      translateErrorCode,
      loadTimetableForScope,
    ],
  );

  useEffect(() => {
    void Promise.resolve().then(loadAcademicDependencies);
  }, [loadAcademicDependencies]);

  useEffect(() => {
    void Promise.resolve().then(loadTimetableForScope);
  }, [loadTimetableForScope]);

  return {
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
    setAllTermEntries,
    configs,
    resolvedConfig,
    config,
    workspaceState,
    periods,
    publication,
    conflicts,
    validationSummary,
    apiError,
    isLoading,
    dependenciesLoading,
    timetableLoading,
    isSaving,
    saveProgress,
    isPublished: isPublicationActive(publication),
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
  };
}

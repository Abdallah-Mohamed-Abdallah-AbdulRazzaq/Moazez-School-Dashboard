"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  fetchTeachers,
  fetchTeacherAllocations,
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  fetchRooms,
  type RoomDefaultAssignment,
} from "@/features/academics/rooms/services/roomsService";
import {
  bulkSaveEntries,
  checkConflicts,
  deleteEntry,
  getConfig,
  getConflicts,
  getPublication,
  listEntries,
  listPeriods,
  publish,
  unpublish,
  validate,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import type {
  BackendTimetableConfigDto,
  BackendTimetableEntryDto,
  BackendTimetablePeriodDto,
  ListResponse,
  PublicationResponse,
  TimetablePublishReason,
  TimetableScopeType,
} from "@/features/academics/timetable/services/timetableApiTypes";
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
  type ResolvedTimetableConfig,
  type TimetableConfig,
  type TimetableDay,
  type TimetablePeriod,
} from "@/features/academics/timetable/types/timetableConfig";
import type {
  Room,
  TimetableConflict,
  TimetableEntry,
} from "@/features/academics/timetable/types/timetable";

interface UseTimetableDataParams {
  schoolId: string;
  termId: string;
  academicYearId: string;
  enabled?: boolean;
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
  isScopeSelectionNormalized: boolean;
  showToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
  translateErrorCode?: TimetableErrorTranslator;
  messages?: {
    loadFailed: string;
    saveFailed: string;
    publishFailed: string;
    unpublishFailed: string;
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
    };

type ScopeSelection = {
  scopeType: TimetableScopeType;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
};

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

const scopeId = (config: BackendTimetableConfigDto): string | undefined =>
  config.classroomId ?? config.sectionId ?? config.gradeId ?? undefined;

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
  dayNames.map((dayName, index) => ({
    key: dayName.key,
    index,
    nameAr: dayName.nameAr,
    nameEn: dayName.nameEn,
    isActive: config.activeDays.includes(index),
  }));

const configDtoToUi = (
  config: BackendTimetableConfigDto,
  backendPeriods: BackendTimetablePeriodDto[],
): TimetableConfig => ({
  id: config.id,
  termId: config.termId,
  scopeType: configScope(config),
  scopeId: scopeId(config),
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
    id: scopeId(config),
  },
});

const isPublicationActive = (
  publication: PublicationResponse | null,
): boolean =>
  publication?.isPublished === true ||
  publication?.status === "published" ||
  publication?.status === "active" ||
  publication?.status === "PUBLISHED" ||
  publication?.status === "ACTIVE";

const withConfigStatus = (
  config: BackendTimetableConfigDto,
  status: "draft" | "active",
): BackendTimetableConfigDto => ({
  ...config,
  status,
});

const publishReadinessMessage = (
  publication: PublicationResponse,
  validation: TimetableValidationSummary,
): string =>
  [
    ...(publication.blockingReasons ?? []).map(readinessReasonText),
    ...validation.blockingReasons,
    ...validation.warnings,
  ][0] ?? "Backend publication readiness is not satisfied.";

const readinessReasonText = (
  reason: string | TimetablePublishReason,
): string => (typeof reason === "string" ? reason : reason.message);

function resolveScopeSelection(params: {
  selectedGradeId: string;
  selectedSectionId: string;
  selectedClassroomId: string;
}): ScopeSelection {
  if (params.selectedClassroomId) {
    return {
      scopeType: "CLASSROOM",
      classroomId: params.selectedClassroomId,
    };
  }
  if (params.selectedSectionId) {
    return {
      scopeType: "SECTION",
      sectionId: params.selectedSectionId,
    };
  }
  if (params.selectedGradeId) {
    return {
      scopeType: "GRADE",
      gradeId: params.selectedGradeId,
    };
  }
  return { scopeType: "TERM" };
}

export function useTimetableData({
  schoolId,
  termId,
  academicYearId = "",
  enabled = true,
  selectedGradeId,
  selectedSectionId,
  selectedClassroomId,
  isScopeSelectionNormalized,
  showToast,
  translateErrorCode,
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
  const [roomDefaults, setRoomDefaults] = useState<RoomDefaultAssignment[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(
    [],
  );
  const [allTermEntries, setAllTermEntries] = useState<TimetableEntry[]>([]);
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [resolvedConfig, setResolvedConfig] =
    useState<ResolvedTimetableConfig | null>(null);
  const [config, setConfig] = useState<BackendTimetableConfigDto | null>(null);
  const [periods, setPeriods] = useState<BackendTimetablePeriodDto[]>([]);
  const [publication, setPublication] = useState<PublicationResponse | null>(
    null,
  );
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [validationSummary, setValidationSummary] =
    useState<TimetableValidationSummary>(emptyValidationSummary);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dependenciesLoading, setDependenciesLoading] = useState(true);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const dependenciesRequestIdRef = useRef(0);
  const timetableRequestIdRef = useRef(0);
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

  const scopeSelection = useMemo(
    () =>
      resolveScopeSelection({
        selectedGradeId,
        selectedSectionId,
        selectedClassroomId,
      }),
    [selectedClassroomId, selectedGradeId, selectedSectionId],
  );

  const clearTimetableState = useCallback(() => {
    setConfig(null);
    setPeriods([]);
    setPublication(null);
    setConflicts([]);
    setValidationSummary(emptyValidationSummary());
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
      setRoomDefaults([]);
      setDependenciesLoading(false);
      dependenciesLoadedKeyRef.current = null;
      dependenciesInFlightKeyRef.current = null;
      return;
    }

    if (dependenciesInFlightKeyRef.current === dependenciesKey) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Timetable] loadAcademicDependencies skipped (in-flight)", { dependenciesKey });
      }
      return;
    }

    if (dependenciesLoadedKeyRef.current === dependenciesKey) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Timetable] loadAcademicDependencies skipped (already loaded)", { dependenciesKey });
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
        teachersData,
        teacherAllocsData,
        roomsData,
      ] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchSubjects(),
        fetchSubjectAllocations(termId),
        fetchTeachers(),
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
      setTeachers(teachersData);
      setTeacherAllocations(teacherAllocsData);
      setRooms(roomsData.filter((room) => room.isActive));
      setRoomDefaults([]);
      
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

  const loadTimetableForScope = useCallback(async () => {
    const requestId = ++timetableRequestIdRef.current;

    if (!enabled || !termId || !academicYearId || !isScopeSelectionNormalized) {
      clearTimetableState();
      setTimetableLoading(false);
      return;
    }

    setTimetableLoading(true);
    setApiError(null);

    try {
      if (requestId !== timetableRequestIdRef.current) return;

      const nextConfig = await getConfig({
        academicYearId,
        termId,
        scopeType: scopeSelection.scopeType,
        gradeId: scopeSelection.gradeId,
        sectionId: scopeSelection.sectionId,
        classroomId: scopeSelection.classroomId,
      });

      if (requestId !== timetableRequestIdRef.current) return;

      const configId = nextConfig.id || nextConfig.timetableConfigId || "";
      const [periodsResponse, entriesResponse, allEntriesResponse, publicationResponse] =
        await Promise.all([
          listPeriods(configId),
          listEntries({
            timetableConfigId: configId,
            classroomId: selectedClassroomId || undefined,
          }),
          listEntries({ timetableConfigId: configId }),
          getPublication(configId) as Promise<PublicationResponse>,
        ]);

      if (requestId !== timetableRequestIdRef.current) return;

      const nextPeriods =
        listResponseItems<BackendTimetablePeriodDto>(periodsResponse);
      const nextEntries =
        listResponseItems<BackendTimetableEntryDto>(entriesResponse);
      const mappedEntries = mapBackendEntriesToUi(nextEntries);
      const allMappedEntries = mapBackendEntriesToUi(
        listResponseItems<BackendTimetableEntryDto>(allEntriesResponse),
      );
      const nextConfigModel = configDtoToUi(nextConfig, nextPeriods);

      setConfig(nextConfig);
      setPeriods(nextPeriods);
      setPublication(publicationResponse);
      setConflicts([]);
      setValidationSummary(emptyValidationSummary());
      setTimetableEntries(mappedEntries.entries);
      setAllTermEntries(allMappedEntries.entries);
      setConfigs([nextConfigModel]);
      setResolvedConfig(configDtoToResolvedConfig(nextConfig, nextPeriods));
    } catch (error) {
      if (requestId !== timetableRequestIdRef.current) return;
      if (isTimetableConfigNotFound(error)) {
        clearTimetableState();
        return;
      }
      const message = timetableErrorMessage(
        error,
        messages?.loadFailed ?? "Failed to load timetable for scope.",
        translateErrorCode,
      );
      setApiError(message);
      console.error("Failed to load timetable for scope:", error);
      showToast(message, "error");
    } finally {
      if (requestId === timetableRequestIdRef.current) {
        setTimetableLoading(false);
      }
    }
  }, [
    enabled,
    termId,
    academicYearId,
    isScopeSelectionNormalized,
    scopeSelection,
    selectedClassroomId,
    clearTimetableState,
    messages,
    translateErrorCode,
    showToast,
  ]);
  const reloadConfigs = useCallback(async () => {
    await loadTimetableForScope();
    return configs;
  }, [configs, loadTimetableForScope]);

  const loadTimetable = useCallback(async () => {
    await loadTimetableForScope();
  }, [loadTimetableForScope]);

  const loadConflicts = useCallback(async (): Promise<TimetableConflict[]> => {
    if (!config) {
      setConflicts([]);
      return [];
    }
    const response = await getConflicts(config.id);
    const nextConflicts = normalizePersistedConflicts(response).conflicts;
    setConflicts(nextConflicts);
    return nextConflicts;
  }, [config]);

  const loadValidation =
    useCallback(async (): Promise<TimetableValidationSummary> => {
      const response = await validate({
        termId,
        gradeId: selectedGradeId || undefined,
        classroomId: selectedClassroomId || undefined,
      });
      const nextValidationSummary = validationSummaryFromResponse(response);
      setValidationSummary(nextValidationSummary);
      return nextValidationSummary;
    }, [selectedClassroomId, selectedGradeId, termId]);

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
            !entry.subjectId &&
            entry.id &&
            !entry.id.startsWith("temp-"),
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
        if (bulkSaveRequest.payload.items.length === 0 && entriesToDelete.length === 0) {
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

        // Only run bulk save + conflict check if there are items to save
        if (bulkSaveRequest.payload.items.length > 0) {
          assertBulkPayloadSize(bulkSaveRequest.payload.items, "conflict-check");
          const conflictResponse = await checkConflicts(bulkSaveRequest.payload);
          const nextConflicts = normalizeConflictCheckResponse(conflictResponse).conflicts;
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
          for (const entry of entriesToDelete) {
            await deleteEntry(entry.id);
            deletionStarted = true;
          }
        }

        if (bulkSaveRequest.payload.items.length > 0) {
          assertBulkPayloadSize(bulkSaveRequest.payload.items, "save");
          const savedEntriesResponse = await bulkSaveEntries(
            bulkSaveRequest.payload,
          );
          const mappedEntries = mapBackendEntriesToUi(
            listResponseItems(savedEntriesResponse),
          );
          setTimetableEntries(mappedEntries.entries);
          setAllTermEntries(mappedEntries.entries);
        } else {
          // All entries were cleared — remove deleted entries from local state
          const deletedIds = new Set(entriesToDelete.map((e) => e.id));
          const remainingEntries = entries.filter((e) => !deletedIds.has(e.id));
          setTimetableEntries(remainingEntries);
          setAllTermEntries(remainingEntries);
        }

        return { ok: true };
      } catch (error) {
        const conflict = conflictFromTimetableError(error);
        if (conflict) {
          setConflicts([conflict]);
        }
        const baseMessage = timetableErrorMessage(
          error,
          messages?.saveFailed ?? "Failed to save timetable.",
          translateErrorCode,
        );
        if (deletionStarted) {
          await loadTimetableForScope();
        }
        const message = deletionStarted
          ? `${baseMessage} Some deletions may already have been applied. The timetable was refreshed.`
          : baseMessage;
        setApiError(message);
        console.error("Failed to save timetable:", error);
        return {
          ok: false,
          hasConflicts: !!conflict,
          error: message,
          partialMutation: deletionStarted,
        };
      } finally {
        setIsSaving(false);
      }
    },
    [
      config,
      periods,
      selectedClassroomId,
      selectedSectionId,
      teacherAllocations,
      termId,
      messages,
      translateErrorCode,
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
            ),
          };
        }
        if (hasBlockingValidation(nextValidationSummary)) {
          return {
            ok: false,
            error: publishReadinessMessage(
              nextPublication,
              nextValidationSummary,
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
        const nextConflicts = normalizeConflictCheckResponse(conflictResponse).conflicts;
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

        await publish(config.id || config.timetableConfigId || "");
        const publishedPublication = (await getPublication(
          config.id || config.timetableConfigId || "",
        )) as PublicationResponse;
        setPublication(publishedPublication);
        setConfig((currentConfig) =>
          currentConfig
            ? withConfigStatus(currentConfig, "active")
            : currentConfig,
        );
        return { ok: true };
      } catch (error) {
        const conflict = conflictFromTimetableError(error);
        if (conflict) {
          setConflicts([conflict]);
        }
        const message =
          publicationBlockingReason(error) ??
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
      messages,
      periods,
      selectedClassroomId,
      selectedSectionId,
      teacherAllocations,
      termId,
      translateErrorCode,
    ],
  );

  const unpublishCurrentTimetable = useCallback(async () => {
    if (!config) {
      return false;
    }
    if (configScope(config) === "SECTION") {
      setApiError("Unpublish is unavailable for section timetables.");
      return false;
    }

    try {
      await unpublish({
        termId,
        gradeId: selectedGradeId || undefined,
        classroomId: selectedClassroomId || undefined,
      });
      const nextPublication = (await getPublication(
        config.id || config.timetableConfigId || "",
      )) as PublicationResponse;
      setPublication(nextPublication);
      setConfig((currentConfig) =>
        currentConfig
          ? withConfigStatus(currentConfig, "draft")
          : currentConfig,
      );
      return true;
    } catch (error) {
      const message = timetableErrorMessage(
        error,
        messages?.unpublishFailed ?? "Failed to unpublish timetable.",
        translateErrorCode,
      );
      setApiError(message);
      console.error("Failed to unpublish timetable:", error);
      return false;
    }
  }, [
    config,
    messages,
    selectedClassroomId,
    selectedGradeId,
    termId,
    translateErrorCode,
  ]);

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
    roomDefaults,
    timetableEntries,
    setTimetableEntries,
    allTermEntries,
    setAllTermEntries,
    configs,
    resolvedConfig,
    config,
    periods,
    publication,
    conflicts,
    validationSummary,
    apiError,
    isLoading,
    dependenciesLoading,
    timetableLoading,
    isSaving,
    isPublished: isPublicationActive(publication),
    reloadConfigs,
    loadTimetable,
    loadConflicts,
    loadValidation,
    loadPublication,
    saveTimetable,
    publishCurrentTimetable,
    unpublishCurrentTimetable,
  };
}

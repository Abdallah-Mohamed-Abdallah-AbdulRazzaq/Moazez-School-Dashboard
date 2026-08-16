"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  AlertCircle,
  Archive,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  GraduationCap,
  RotateCcw,
  Search,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Drawer, IconButton, useMediaQuery, useTheme } from "@mui/material";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import {
  fetchStructureTree,
  Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjectAllocations,
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  archiveCurriculum,
  activateCurriculum,
  deleteCurriculum,
  fetchCurriculumForScope,
  getCurriculum,
  listCurricula,
  type Curriculum,
  type CurriculumListFilters,
  type Lesson,
  type Unit,
  calculateTermWeeks,
} from "@/features/academics/curriculum/services/curriculumService";
import { curriculumUiError } from "@/features/academics/curriculum/services/curriculumErrors";
import CurriculumOutline from "../components/CurriculumOutline";
import CurriculumEditor from "../components/CurriculumEditor";
import CurriculumRightPanel, {
  curriculumStatusLabelKey,
} from "@/features/academics/curriculum/components/CurriculumRightPanel";
import CurriculumActionsMenu from "../components/CurriculumActionsMenu";
import CreateCurriculumDialog from "../components/CreateCurriculumDialog";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useGuardedAcademicContextChange } from "@/features/academics/hooks/useGuardedAcademicContextChange";
import { usePermissions } from "@/hooks/usePermissions";
import {
  canSyncCurriculumFilters,
  curriculumOptionsContextKey,
  curriculumPageVisibility,
} from "./curriculumFilterState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import AcademicModuleEmptyState from "@/features/academics/components/shared/AcademicModuleEmptyState";
import {
  curriculumConfirmation,
  type CurriculumConfirmationAction,
} from "./curriculumConfirmation";

const isDraftNode = (node: { id: string } | null) =>
  node?.id === "new" || !!node?.id.startsWith("new-");

const preserveEmptyArray = <T,>(previous: T[]) =>
  previous.length === 0 ? previous : [];

const subjectFromAllocation = (
  allocation: SubjectAllocation,
): Subject | null => {
  if (!allocation.subject) {
    return null;
  }

  return {
    id: allocation.subject.id,
    name: allocation.subject.nameEn || allocation.subject.nameAr,
    nameAr: allocation.subject.nameAr,
    nameEn: allocation.subject.nameEn,
    code: allocation.subject.code,
    color: allocation.subject.color,
    isActive: true,
  };
};

const subjectsForGrade = (
  allocations: SubjectAllocation[],
  gradeId: string,
): Subject[] => {
  const subjectsById = new Map<string, Subject>();

  allocations
    .filter((allocation) => allocation.gradeId === gradeId)
    .forEach((allocation) => {
      const subject = subjectFromAllocation(allocation);
      if (subject) {
        subjectsById.set(subject.id, subject);
      }
    });

  return Array.from(subjectsById.values());
};

const curriculumScopeKey = (gradeId: string, subjectId: string) =>
  `${gradeId}:${subjectId}`;

const overviewStatusValues = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
type OverviewStatusFilter = (typeof overviewStatusValues)[number];

const isOverviewStatusFilter = (
  status: string | null,
): status is OverviewStatusFilter =>
  overviewStatusValues.includes(status as OverviewStatusFilter);

const LEFT_PANEL_WIDTH = 280;
const RIGHT_PANEL_WIDTH = 320;

interface CurriculumOverviewRow {
  key: string;
  grade: Grade;
  subject: Subject;
  allocation: SubjectAllocation;
  curriculum: Curriculum | null;
}

interface CurriculumPageContentProps {
  view?: "overview" | "detail";
  curriculumId?: string;
}

export default function CurriculumPageContent({
  view = "overview",
  curriculumId,
}: CurriculumPageContentProps) {
  const t = useTranslations("academics.curriculum");
  const tCommon = useTranslations("common");
  const tExport = useTranslations("academics.export");
  const tEmpty = useTranslations("academics.module_empty_states");
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isRTL = locale === "ar";
  const { hasPermission } = usePermissions();
  const canViewCurriculum = hasPermission("academics.curriculum.view");
  const canManageCurriculum = hasPermission("academics.curriculum.manage");

  const { academicYearId, termId, termStatus, selectedTerm, isInitializing } =
    useAcademicYearTermLayoutContext();

  const queryState = useMemo(
    () => ({
      gradeId: searchParams.get("grade"),
      subjectId: searchParams.get("subject"),
      overviewGradeId: searchParams.get("filterGrade"),
      overviewSubjectId: searchParams.get("filterSubject"),
      overviewStatus: (() => {
        const status = searchParams.get("status");
        return isOverviewStatusFilter(status) ? status : "";
      })(),
      unitId: searchParams.get("unit"),
      lessonId: searchParams.get("lesson"),
      searchQuery: searchParams.get("search") || "",
      filtersCollapsed: searchParams.get("filters") === "collapsed",
      leftDrawerOpen: searchParams.get("leftDrawer") === "1",
      rightDrawerOpen: searchParams.get("rightDrawer") === "1",
    }),
    [searchParams],
  );

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<
    SubjectAllocation[]
  >([]);
  const [termCurricula, setTermCurricula] = useState<Curriculum[]>([]);
  const [loadedOptionsContextKey, setLoadedOptionsContextKey] = useState<
    string | null
  >(null);

  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [createDialogScope, setCreateDialogScope] = useState<{
    gradeId: string;
    subjectId: string;
  } | null>(null);

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [termWeeks, setTermWeeks] = useState(0);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false);
  const [hasCheckedCurriculum, setHasCheckedCurriculum] = useState(false);
  const [contextError, setContextError] = useState("");
  const [curriculumError, setCurriculumError] = useState("");
  const [searchInputValue, setSearchInputValue] = useState(
    queryState.searchQuery,
  );

  const [selectedNode, setSelectedNode] = useState<{
    type: "unit" | "lesson";
    id: string;
  } | null>(null);
  const [, setLearningContentLessonId] = useState<
    string | null
  >(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [confirmationAction, setConfirmationAction] =
    useState<CurriculumConfirmationAction | null>(null);
  const [confirmationCurriculum, setConfirmationCurriculum] =
    useState<Curriculum | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const optionsRequestIdRef = useRef(0);
  const curriculumRequestIdRef = useRef(0);
  const termCurriculaRequestIdRef = useRef(0);
  const hasRestoredSelectedNodeFromUrlRef = useRef(false);
  const discardDecisionRef = useRef<((confirmed: boolean) => void) | null>(
    null,
  );

  const isArchived = curriculum?.status === "archived";
  const isClosedTerm = termStatus === "closed";
  const isCurriculumOverview = view === "overview";
  const isReadOnly = !canManageCurriculum || isArchived || isClosedTerm;
  const canMutateTermCurricula =
    canViewCurriculum && canManageCurriculum && !isClosedTerm;
  const canMutate = canViewCurriculum && !isReadOnly;
  const canActivate =
    canMutate &&
    curriculum?.status === "draft" &&
    (curriculum?.unitCount || 0) > 0 &&
    (curriculum?.lessonCount || 0) > 0;
  const canArchive = canMutate && curriculum != null;
  const hasScope =
    view === "detail"
      ? Boolean(curriculumId)
      : !!academicYearId &&
        !!termId &&
        !!selectedGradeId &&
        !!selectedSubjectId;
  const { isPageLoading, canShowCreateCurriculum, canShowCurriculumError } =
    curriculumPageVisibility({
      isInitializing,
      isOptionsLoading,
      isCurriculumLoading,
      hasScope,
      hasCheckedCurriculum,
      hasCurriculum: curriculum != null,
      hasCurriculumError: Boolean(curriculumError),
    });
  const confirmation = confirmationAction
    ? curriculumConfirmation(confirmationAction)
    : null;
  const overviewSearchQuery = queryState.searchQuery.trim().slice(0, 120);
  const overviewListFilters = useMemo<CurriculumListFilters>(
    () => ({
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
      gradeId: queryState.overviewGradeId || undefined,
      subjectId: queryState.overviewSubjectId || undefined,
      status: queryState.overviewStatus
        ? (queryState.overviewStatus as OverviewStatusFilter)
        : undefined,
      search: overviewSearchQuery || undefined,
    }),
    [
      academicYearId,
      overviewSearchQuery,
      queryState.overviewGradeId,
      queryState.overviewStatus,
      queryState.overviewSubjectId,
      termId,
    ],
  );
  const curriculumResetKey = isCurriculumOverview
    ? `overview:${academicYearId}:${termId}`
    : `detail:${curriculumId ?? ""}`;

  const confirmDiscardChanges = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        discardDecisionRef.current?.(false);
        discardDecisionRef.current = resolve;
        setShowDiscardDialog(true);
      }),
    [],
  );

  const settleDiscardConfirmation = useCallback((confirmed: boolean) => {
    const resolve = discardDecisionRef.current;
    discardDecisionRef.current = null;
    setShowDiscardDialog(false);
    resolve?.(confirmed);
  }, []);

  useGuardedAcademicContextChange({
    hasUnsavedChanges,
    confirmDiscard: confirmDiscardChanges,
    onDiscard: () => setHasUnsavedChanges(false),
  });

  useEffect(
    () => () => {
      discardDecisionRef.current?.(false);
      discardDecisionRef.current = null;
    },
    [],
  );

  useEffect(() => {
    void Promise.resolve().then(() => setSearchInputValue(queryState.searchQuery));
  }, [queryState.searchQuery]);

  useEffect(() => {
    curriculumRequestIdRef.current += 1;
    void Promise.resolve().then(() => {
      setHasCheckedCurriculum(false);
      setIsCurriculumLoading(false);
      setCurriculum(null);
      setUnits([]);
      setLessons([]);
      setSelectedNode(null);
    });
    hasRestoredSelectedNodeFromUrlRef.current = false;
  }, [curriculumResetKey]);

  useEffect(() => {
    if (!selectedTerm) {
      void Promise.resolve().then(() => setTermWeeks(0));
      return;
    }

    void Promise.resolve().then(() => {
      setTermWeeks(
        calculateTermWeeks(selectedTerm.startDate, selectedTerm.endDate),
      );
    });
  }, [selectedTerm]);

  const updateURL = useCallback(
    (
      nextState: {
        yearId: string;
        termId: string;
        gradeId?: string | null;
        subjectId?: string | null;
        overviewGradeId?: string | null;
        overviewSubjectId?: string | null;
        overviewStatus?: string | null;
        unitId?: string | null;
        lessonId?: string | null;
        searchQuery?: string;
        filtersCollapsed?: boolean;
        leftDrawerOpen?: boolean;
        rightDrawerOpen?: boolean;
      },
      historyMode: "push" | "replace" | "silent-replace" = "replace",
    ) => {
      const params = new URLSearchParams();
      params.set("year", nextState.yearId);
      params.set("term", nextState.termId);
      if (view !== "detail" && nextState.gradeId) {
        params.set("grade", nextState.gradeId);
      }
      if (view !== "detail" && nextState.subjectId) {
        params.set("subject", nextState.subjectId);
      }
      if (nextState.overviewGradeId) {
        params.set("filterGrade", nextState.overviewGradeId);
      }
      if (nextState.overviewSubjectId) {
        params.set("filterSubject", nextState.overviewSubjectId);
      }
      if (nextState.overviewStatus) {
        params.set("status", nextState.overviewStatus);
      }
      if (nextState.unitId) params.set("unit", nextState.unitId);
      if (nextState.lessonId) params.set("lesson", nextState.lessonId);
      if (nextState.searchQuery) params.set("search", nextState.searchQuery);
      if (nextState.filtersCollapsed) params.set("filters", "collapsed");
      if (nextState.leftDrawerOpen) params.set("leftDrawer", "1");
      if (nextState.rightDrawerOpen) params.set("rightDrawer", "1");

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "silent-replace") {
        window.history.replaceState(null, "", nextUrl);
        return;
      }
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParams, view],
  );
  const syncSearchQueryParam = useDebouncedCallback((value: string) => {
    if (!academicYearId || !termId) {
      setLoadedOptionsContextKey(null);
      return;
    }

    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId: isCurriculumOverview ? null : selectedGradeId,
        subjectId: isCurriculumOverview ? null : selectedSubjectId,
        overviewGradeId: isCurriculumOverview
          ? queryState.overviewGradeId
          : null,
        overviewSubjectId: isCurriculumOverview
          ? queryState.overviewSubjectId
          : null,
        overviewStatus: isCurriculumOverview ? queryState.overviewStatus : null,
        unitId: isCurriculumOverview ? null : queryState.unitId,
        lessonId: isCurriculumOverview ? null : queryState.lessonId,
        searchQuery: value,
        filtersCollapsed: isCurriculumOverview
          ? false
          : queryState.filtersCollapsed,
        leftDrawerOpen: isCurriculumOverview
          ? false
          : queryState.leftDrawerOpen,
        rightDrawerOpen: isCurriculumOverview
          ? false
          : queryState.rightDrawerOpen,
      },
      "replace",
    );
  }, 250);

  useEffect(
    () => () => {
      syncSearchQueryParam.cancel();
    },
    [syncSearchQueryParam],
  );

  const loadOptionsData = useCallback(async () => {
    if (isInitializing) {
      return;
    }
    if (!academicYearId || !termId) {
      setGrades(preserveEmptyArray);
      setSubjects(preserveEmptyArray);
      setSubjectAllocations(preserveEmptyArray);
      setTermCurricula(preserveEmptyArray);
      setSelectedGradeId("");
      setSelectedSubjectId("");
      setContextError("");
      setIsOptionsLoading(false);
      return;
    }

    const currentContextKey = curriculumOptionsContextKey(
      academicYearId,
      termId,
    );

    if (loadedOptionsContextKey === currentContextKey) {
      const nextGradeId =
        queryState.gradeId &&
        grades.some((grade) => grade.id === queryState.gradeId)
          ? queryState.gradeId
          : selectedGradeId &&
              !isCurriculumOverview &&
              grades.some((grade) => grade.id === selectedGradeId)
            ? selectedGradeId
            : "";
      const nextSubjects = nextGradeId
        ? subjectsForGrade(subjectAllocations, nextGradeId)
        : [];

      setSelectedGradeId((previous) => {
        return previous === nextGradeId ? previous : nextGradeId;
      });
      setSubjects(nextSubjects);

      setSelectedSubjectId((previous) => {
        if (
          queryState.subjectId &&
          nextSubjects.some((subject) => subject.id === queryState.subjectId)
        ) {
          return queryState.subjectId;
        }

        if (
          previous &&
          !isCurriculumOverview &&
          nextSubjects.some((subject) => subject.id === previous)
        ) {
          return previous;
        }

        return nextSubjects[0]?.id ?? "";
      });

      return;
    }

    const requestId = ++optionsRequestIdRef.current;
    setIsOptionsLoading(true);
    try {
      setContextError("");
      const [structureData, allocationsData] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchSubjectAllocations(termId),
      ]);
      if (requestId !== optionsRequestIdRef.current) return;

      const nextGradeId =
        queryState.gradeId &&
        structureData.grades.some((grade) => grade.id === queryState.gradeId)
          ? queryState.gradeId
          : selectedGradeId &&
              !isCurriculumOverview &&
              structureData.grades.some((grade) => grade.id === selectedGradeId)
            ? selectedGradeId
            : "";
      const nextSubjects = nextGradeId
        ? subjectsForGrade(allocationsData, nextGradeId)
        : [];

      setGrades(structureData.grades);
      setSubjectAllocations(allocationsData);
      setSubjects(nextSubjects);
      setLoadedOptionsContextKey(currentContextKey);

      setSelectedGradeId((previous) => {
        return previous === nextGradeId ? previous : nextGradeId;
      });

      setSelectedSubjectId((previous) => {
        if (
          queryState.subjectId &&
          nextSubjects.some((subject) => subject.id === queryState.subjectId)
        ) {
          return queryState.subjectId;
        }

        if (
          previous &&
          !isCurriculumOverview &&
          nextSubjects.some((subject) => subject.id === previous)
        ) {
          return previous;
        }

        return nextSubjects[0]?.id ?? "";
      });
    } catch (error) {
      if (requestId !== optionsRequestIdRef.current) return;
      console.error("Failed to load data:", error);
      setGrades(preserveEmptyArray);
      setSubjects(preserveEmptyArray);
      setSubjectAllocations(preserveEmptyArray);
      setTermCurricula(preserveEmptyArray);
      setSelectedGradeId("");
      setSelectedSubjectId("");
      setContextError(tCommon("error"));
    } finally {
      if (requestId === optionsRequestIdRef.current) {
        setIsOptionsLoading(false);
      }
    }
  }, [
    academicYearId,
    grades,
    isInitializing,
    isCurriculumOverview,
    loadedOptionsContextKey,
    queryState.gradeId,
    queryState.subjectId,
    selectedGradeId,
    subjectAllocations,
    tCommon,
    termId,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadOptionsData);
  }, [loadOptionsData]);

  useEffect(() => {
    const requestId = ++termCurriculaRequestIdRef.current;

    if (!academicYearId || !termId) {
      void Promise.resolve().then(() => setTermCurricula(preserveEmptyArray));
      return;
    }

    listCurricula(overviewListFilters)
      .then((curriculaData) => {
        if (requestId !== termCurriculaRequestIdRef.current) return;
        setTermCurricula(curriculaData);
      })
      .catch((error) => {
        if (requestId !== termCurriculaRequestIdRef.current) return;
        console.error("Failed to load curricula:", error);
        setTermCurricula(preserveEmptyArray);
      });
  }, [academicYearId, overviewListFilters, termId]);

  useEffect(() => {
    if (isCurriculumOverview || view === "detail") {
      return;
    }

    if (
      !academicYearId ||
      !termId ||
      !canSyncCurriculumFilters(loadedOptionsContextKey, academicYearId, termId)
    ) {
      return;
    }

    const normalizedGradeId =
      selectedGradeId && grades.some((grade) => grade.id === selectedGradeId)
        ? selectedGradeId
        : "";
    const normalizedSubjectId =
      selectedSubjectId &&
      subjects.some((subject) => subject.id === selectedSubjectId)
        ? selectedSubjectId
        : "";

    if (
      normalizedGradeId === queryState.gradeId &&
      normalizedSubjectId === queryState.subjectId
    ) {
      return;
    }

    updateURL({
      yearId: academicYearId,
      termId,
      gradeId: normalizedGradeId || null,
      subjectId: normalizedSubjectId || null,
      searchQuery: queryState.searchQuery,
      filtersCollapsed: queryState.filtersCollapsed,
      leftDrawerOpen: queryState.leftDrawerOpen,
      rightDrawerOpen: queryState.rightDrawerOpen,
    });
  }, [
    academicYearId,
    grades,
    loadedOptionsContextKey,
    queryState.filtersCollapsed,
    queryState.gradeId,
    queryState.leftDrawerOpen,
    queryState.rightDrawerOpen,
    queryState.searchQuery,
    queryState.subjectId,
    selectedGradeId,
    selectedSubjectId,
    subjects,
    termId,
    updateURL,
    isCurriculumOverview,
    view,
  ]);

  useEffect(() => {
    if (
      isCurriculumOverview ||
      !selectedGradeId ||
      subjectAllocations.length === 0
    ) {
      return;
    }

    void Promise.resolve().then(() => {
      setSubjects(subjectsForGrade(subjectAllocations, selectedGradeId));
    });
  }, [isCurriculumOverview, selectedGradeId, subjectAllocations]);

  const curriculumLoadAcademicYearId = isCurriculumOverview
    ? academicYearId
    : "";
  const curriculumLoadTermId = isCurriculumOverview ? termId : "";
  const curriculumLoadGradeId = isCurriculumOverview ? selectedGradeId : "";
  const curriculumLoadSubjectId = isCurriculumOverview ? selectedSubjectId : "";
  const curriculumLoadOptionsContextKey = isCurriculumOverview
    ? loadedOptionsContextKey
    : null;
  const detailLoadCurriculumId = isCurriculumOverview
    ? undefined
    : curriculumId;

  const loadCurriculumData = useCallback(async () => {
    const requestId = ++curriculumRequestIdRef.current;
    if (!isCurriculumOverview) {
      if (!detailLoadCurriculumId) {
        setCurriculum(null);
        setUnits([]);
        setLessons([]);
        setHasCheckedCurriculum(false);
        return;
      }

      setIsCurriculumLoading(true);
      setHasCheckedCurriculum(false);
      setCurriculumError("");
      try {
        const curriculumData = await getCurriculum(detailLoadCurriculumId);
        if (requestId !== curriculumRequestIdRef.current) return;

        setCurriculum(curriculumData);
        setSelectedGradeId(curriculumData.gradeId);
        setSelectedSubjectId(curriculumData.subjectId);
        const nextUnits = curriculumData.units ?? [];
        setUnits(nextUnits);
        setLessons(nextUnits.flatMap((unit) => unit.lessons));
        setHasCheckedCurriculum(true);
      } catch (error) {
        if (requestId !== curriculumRequestIdRef.current) return;
        const mapped = curriculumUiError(error, tCommon("error"));
        setCurriculumError(
          mapped.traceId
            ? `${mapped.message} (${mapped.traceId})`
            : mapped.message,
        );
        setCurriculum(null);
        setUnits([]);
        setLessons([]);
        setSelectedNode(null);
        setHasCheckedCurriculum(true);
      } finally {
        if (requestId === curriculumRequestIdRef.current) {
          setIsCurriculumLoading(false);
        }
      }
      return;
    }

    if (
      !curriculumLoadAcademicYearId ||
      !curriculumLoadTermId ||
      !curriculumLoadGradeId ||
      !curriculumLoadSubjectId ||
      !canSyncCurriculumFilters(
        curriculumLoadOptionsContextKey,
        curriculumLoadAcademicYearId,
        curriculumLoadTermId,
      )
    ) {
      setCurriculum(null);
      setUnits([]);
      setLessons([]);
      setHasCheckedCurriculum(false);
      return;
    }

    setIsCurriculumLoading(true);
    setHasCheckedCurriculum(false);
    setCurriculumError("");
    try {
      const curriculumData = await fetchCurriculumForScope({
        academicYearId: curriculumLoadAcademicYearId,
        termId: curriculumLoadTermId,
        gradeId: curriculumLoadGradeId,
        subjectId: curriculumLoadSubjectId,
      });
      if (requestId !== curriculumRequestIdRef.current) return;

      setCurriculum(curriculumData);
      const nextUnits = curriculumData?.units ?? [];
      setUnits(nextUnits);
      setLessons(nextUnits.flatMap((unit) => unit.lessons));
      setHasCheckedCurriculum(true);

      if (!curriculumData) {
        setSelectedNode(null);
      }
    } catch (error) {
      if (requestId !== curriculumRequestIdRef.current) return;
      const mapped = curriculumUiError(error, tCommon("error"));
      setCurriculumError(
        mapped.traceId
          ? `${mapped.message} (${mapped.traceId})`
          : mapped.message,
      );
      setCurriculum(null);
      setUnits([]);
      setLessons([]);
      setSelectedNode(null);
      setHasCheckedCurriculum(true);
    } finally {
      if (requestId === curriculumRequestIdRef.current) {
        setIsCurriculumLoading(false);
      }
    }
  }, [
    curriculumLoadAcademicYearId,
    curriculumLoadGradeId,
    curriculumLoadOptionsContextKey,
    curriculumLoadSubjectId,
    curriculumLoadTermId,
    detailLoadCurriculumId,
    isCurriculumOverview,
    tCommon,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadCurriculumData);
  }, [loadCurriculumData]);

  useEffect(() => {
    if (
      isCurriculumOverview ||
      hasRestoredSelectedNodeFromUrlRef.current ||
      !academicYearId ||
      !termId ||
      !selectedGradeId ||
      !selectedSubjectId
    ) {
      return;
    }

    const normalizedLessonId =
      queryState.lessonId &&
      lessons.some((lesson) => lesson.id === queryState.lessonId)
        ? queryState.lessonId
        : null;
    const normalizedUnitId =
      !normalizedLessonId &&
      queryState.unitId &&
      units.some((unit) => unit.id === queryState.unitId)
        ? queryState.unitId
        : null;

    if (
      normalizedLessonId === queryState.lessonId &&
      normalizedUnitId === queryState.unitId
    ) {
      return;
    }

    updateURL({
      yearId: academicYearId,
      termId,
      gradeId: selectedGradeId,
      subjectId: selectedSubjectId,
      unitId: normalizedUnitId,
      lessonId: normalizedLessonId,
      searchQuery: queryState.searchQuery,
      filtersCollapsed: queryState.filtersCollapsed,
      leftDrawerOpen: queryState.leftDrawerOpen,
      rightDrawerOpen: queryState.rightDrawerOpen,
    });
  }, [
    academicYearId,
    isCurriculumOverview,
    lessons,
    queryState.filtersCollapsed,
    queryState.leftDrawerOpen,
    queryState.lessonId,
    queryState.rightDrawerOpen,
    queryState.searchQuery,
    queryState.unitId,
    selectedGradeId,
    selectedSubjectId,
    termId,
    units,
    updateURL,
  ]);

  useEffect(() => {
    if (!curriculum || hasRestoredSelectedNodeFromUrlRef.current) {
      return;
    }

    if (
      queryState.lessonId?.startsWith("new-") ||
      queryState.unitId === "new"
    ) {
      hasRestoredSelectedNodeFromUrlRef.current = true;
      return;
    }

    if (queryState.lessonId) {
      const lessonExists = lessons.some(
        (lesson) => lesson.id === queryState.lessonId,
      );
      void Promise.resolve().then(() => {
        setSelectedNode(
          lessonExists ? { type: "lesson", id: queryState.lessonId! } : null,
        );
      });
      hasRestoredSelectedNodeFromUrlRef.current = true;
      return;
    }

    if (queryState.unitId) {
      const unitExists = units.some((unit) => unit.id === queryState.unitId);
      void Promise.resolve().then(() => {
        setSelectedNode(
          unitExists ? { type: "unit", id: queryState.unitId! } : null,
        );
      });
      hasRestoredSelectedNodeFromUrlRef.current = true;
      return;
    }

    void Promise.resolve().then(() => {
      setSelectedNode((previous) => (isDraftNode(previous) ? previous : null));
    });
    hasRestoredSelectedNodeFromUrlRef.current = true;
  }, [curriculum, lessons, queryState.lessonId, queryState.unitId, units]);

  const handleGradeChange = async (gradeId: string) => {
    if (hasUnsavedChanges) {
      if (!(await confirmDiscardChanges())) return;
      setHasUnsavedChanges(false);
    }
    setSelectedGradeId(gradeId);
    setSelectedNode(null);
    const nextSubjects = subjectsForGrade(subjectAllocations, gradeId);
    const nextSubjectId = nextSubjects[0]?.id ?? "";
    setSubjects(nextSubjects);
    setSelectedSubjectId(nextSubjectId);

    if (!isCurriculumOverview) {
      await navigateToCurriculumScope(gradeId, nextSubjectId);
      return;
    }

    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId,
        subjectId: nextSubjectId,
        searchQuery: queryState.searchQuery,
        filtersCollapsed: queryState.filtersCollapsed,
      },
      "push",
    );
  };

  const handleSubjectChange = async (subjectId: string) => {
    if (hasUnsavedChanges) {
      if (!(await confirmDiscardChanges())) return;
      setHasUnsavedChanges(false);
    }
    setSelectedSubjectId(subjectId);
    setSelectedNode(null);

    if (!isCurriculumOverview) {
      await navigateToCurriculumScope(selectedGradeId, subjectId);
      return;
    }

    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId: selectedGradeId,
        subjectId,
        searchQuery: queryState.searchQuery,
        filtersCollapsed: queryState.filtersCollapsed,
      },
      "push",
    );
  };

  const refreshCurriculum = async () => {
    if (!termId || !selectedGradeId || !selectedSubjectId) return;

    await loadCurriculumData();
  };

  const refreshTermCurricula = useCallback(async () => {
    if (!academicYearId || !termId) return;

    setTermCurricula(await listCurricula(overviewListFilters));
  }, [academicYearId, overviewListFilters, termId]);

  const navigateToCurriculumScope = useCallback(
    async (gradeId: string, subjectId: string) => {
      if (!academicYearId || !termId || !gradeId) {
        return;
      }

      setSelectedNode(null);
      const params = new URLSearchParams();
      params.set("year", academicYearId);
      params.set("term", termId);

      if (!subjectId) {
        params.set("filterGrade", gradeId);
        router.push(`/${locale}/academics/curriculum?${params.toString()}`, {
          scroll: false,
        });
        return;
      }

      const [targetCurriculum] = await listCurricula({
        academicYearId,
        termId,
        gradeId,
        subjectId,
      });

      if (targetCurriculum) {
        router.push(
          `/${locale}/academics/curriculum/${targetCurriculum.id}?${params.toString()}`,
          { scroll: false },
        );
        return;
      }

      params.set("filterGrade", gradeId);
      params.set("filterSubject", subjectId);
      router.push(`/${locale}/academics/curriculum?${params.toString()}`, {
        scroll: false,
      });
    },
    [academicYearId, locale, router, termId],
  );

  const openCurriculumScope = useCallback(
    (targetCurriculumId: string) => {
      setSelectedNode(null);
      const params = new URLSearchParams();
      if (academicYearId) params.set("year", academicYearId);
      if (termId) params.set("term", termId);
      router.push(
        `/${locale}/academics/curriculum/${targetCurriculumId}?${params.toString()}`,
        { scroll: false },
      );
    },
    [academicYearId, locale, router, termId],
  );

  const openCreateCurriculumForScope = useCallback(
    (gradeId: string, subjectId: string) => {
      setCreateDialogScope({ gradeId, subjectId });
      setSelectedGradeId(gradeId);
      setSubjects(subjectsForGrade(subjectAllocations, gradeId));
      setSelectedSubjectId(subjectId);
      setShowCreateDialog(true);
    },
    [subjectAllocations],
  );

  const openCreateCurriculumForSelectedScope = useCallback(() => {
    setCreateDialogScope({
      gradeId: selectedGradeId,
      subjectId: selectedSubjectId,
    });
    setShowCreateDialog(true);
  }, [selectedGradeId, selectedSubjectId]);

  const updateOverviewFilters = useCallback(
    (nextFilters: {
      gradeId?: string | null;
      subjectId?: string | null;
      status?: string | null;
      searchQuery?: string;
    }) => {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          overviewGradeId:
            nextFilters.gradeId === undefined
              ? queryState.overviewGradeId
              : nextFilters.gradeId,
          overviewSubjectId:
            nextFilters.subjectId === undefined
              ? queryState.overviewSubjectId
              : nextFilters.subjectId,
          overviewStatus:
            nextFilters.status === undefined
              ? queryState.overviewStatus
              : nextFilters.status,
          searchQuery:
            nextFilters.searchQuery === undefined
              ? queryState.searchQuery
              : nextFilters.searchQuery,
        },
        "replace",
      );
    },
    [
      academicYearId,
      queryState.overviewGradeId,
      queryState.overviewStatus,
      queryState.overviewSubjectId,
      queryState.searchQuery,
      termId,
      updateURL,
    ],
  );

  const handleOverviewGradeChange = useCallback(
    (gradeId: string) => {
      const currentSubjectStillAvailable =
        queryState.overviewSubjectId &&
        (!gradeId ||
          subjectsForGrade(subjectAllocations, gradeId).some(
            (subject) => subject.id === queryState.overviewSubjectId,
          ));

      updateOverviewFilters({
        gradeId,
        subjectId: currentSubjectStillAvailable
          ? queryState.overviewSubjectId
          : null,
      });
    },
    [queryState.overviewSubjectId, subjectAllocations, updateOverviewFilters],
  );

  const handleClearOverviewFilters = useCallback(() => {
    setSearchInputValue("");
    updateOverviewFilters({
      gradeId: null,
      subjectId: null,
      status: null,
      searchQuery: "",
    });
  }, [updateOverviewFilters]);

  const handleSelectNode = (
    node: { type: "unit" | "lesson"; id: string } | null,
  ) => {
    setSelectedNode(node);
    setLearningContentLessonId(
      node?.type === "lesson" && !isDraftNode(node) ? node.id : null,
    );

    if (isDraftNode(node)) {
      return;
    }

    if (node) {
      if (node.type === "lesson") {
        updateURL(
          {
            yearId: academicYearId,
            termId,
            gradeId: selectedGradeId,
            subjectId: selectedSubjectId,
            lessonId: node.id,
            searchQuery: queryState.searchQuery,
            filtersCollapsed: queryState.filtersCollapsed,
            rightDrawerOpen: queryState.rightDrawerOpen,
          },
          "silent-replace",
        );
      } else if (node.type === "unit") {
        updateURL(
          {
            yearId: academicYearId,
            termId,
            gradeId: selectedGradeId,
            subjectId: selectedSubjectId,
            unitId: node.id,
            searchQuery: queryState.searchQuery,
            filtersCollapsed: queryState.filtersCollapsed,
            rightDrawerOpen: queryState.rightDrawerOpen,
          },
          "silent-replace",
        );
      }
    } else {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
          searchQuery: queryState.searchQuery,
          filtersCollapsed: queryState.filtersCollapsed,
          rightDrawerOpen: queryState.rightDrawerOpen,
        },
        "silent-replace",
      );
    }
  };

  const handleToggleFilters = useCallback(() => {
    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId: selectedGradeId,
        subjectId: selectedSubjectId,
        unitId: queryState.unitId,
        lessonId: queryState.lessonId,
        searchQuery: queryState.searchQuery,
        filtersCollapsed: !queryState.filtersCollapsed,
        leftDrawerOpen: queryState.leftDrawerOpen,
        rightDrawerOpen: queryState.rightDrawerOpen,
      },
      "push",
    );
  }, [
    academicYearId,
    queryState.filtersCollapsed,
    queryState.leftDrawerOpen,
    queryState.lessonId,
    queryState.rightDrawerOpen,
    queryState.searchQuery,
    queryState.unitId,
    selectedGradeId,
    selectedSubjectId,
    termId,
    updateURL,
  ]);

  const handleSetLeftDrawerOpen = useCallback(
    (isOpen: boolean) => {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
          unitId: queryState.unitId,
          lessonId: queryState.lessonId,
          searchQuery: queryState.searchQuery,
          filtersCollapsed: queryState.filtersCollapsed,
          leftDrawerOpen: isOpen,
          rightDrawerOpen: queryState.rightDrawerOpen,
        },
        isOpen ? "push" : "replace",
      );
    },
    [
      academicYearId,
      queryState.filtersCollapsed,
      queryState.lessonId,
      queryState.rightDrawerOpen,
      queryState.searchQuery,
      queryState.unitId,
      selectedGradeId,
      selectedSubjectId,
      termId,
      updateURL,
    ],
  );

  const handleSetRightDrawerOpen = useCallback(
    (isOpen: boolean) => {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
          unitId: queryState.unitId,
          lessonId: queryState.lessonId,
          searchQuery: queryState.searchQuery,
          filtersCollapsed: queryState.filtersCollapsed,
          leftDrawerOpen: queryState.leftDrawerOpen,
          rightDrawerOpen: isOpen,
        },
        isOpen ? "push" : "replace",
      );
    },
    [
      academicYearId,
      queryState.filtersCollapsed,
      queryState.leftDrawerOpen,
      queryState.lessonId,
      queryState.searchQuery,
      queryState.unitId,
      selectedGradeId,
      selectedSubjectId,
      termId,
      updateURL,
    ],
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      const nextValue = isCurriculumOverview ? value.slice(0, 120) : value;
      setSearchInputValue(nextValue);
      syncSearchQueryParam(nextValue);
    },
    [isCurriculumOverview, syncSearchQueryParam],
  );

  const handleCreateSuccess = async () => {
    await refreshCurriculum();
    await refreshTermCurricula();
    setShowCreateDialog(false);
    setCreateDialogScope(null);
  };

  const handleActivateCurriculum = async (targetCurriculum = curriculum) => {
    const canMutateTarget =
      canViewCurriculum &&
      canManageCurriculum &&
      !isClosedTerm &&
      targetCurriculum?.status !== "archived";
    if (
      !targetCurriculum ||
      !canMutateTarget ||
      targetCurriculum.status !== "draft" ||
      targetCurriculum.unitCount <= 0 ||
      targetCurriculum.lessonCount <= 0
    ) {
      return;
    }
    try {
      const updated = await activateCurriculum(targetCurriculum.id);
      setTermCurricula((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (curriculum?.id === updated.id) {
        await refreshCurriculum();
      }
    } catch (error) {
      const mapped = curriculumUiError(error, tCommon("error"));
      setCurriculumError(mapped.message);
    }
  };

  const handleArchiveCurriculum = async (targetCurriculum = curriculum) => {
    if (
      !targetCurriculum ||
      !canMutateTermCurricula ||
      targetCurriculum.status === "archived"
    ) {
      return false;
    }
    try {
      const updated = await archiveCurriculum(targetCurriculum.id);
      setTermCurricula((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (curriculum?.id === updated.id) {
        await refreshCurriculum();
      }
      return true;
    } catch (error) {
      const mapped = curriculumUiError(error, tCommon("error"));
      setCurriculumError(mapped.message);
      return false;
    }
  };

  const handleDeleteCurriculum = async (targetCurriculum = curriculum) => {
    if (
      !targetCurriculum ||
      !canMutateTermCurricula ||
      targetCurriculum.status === "archived"
    ) {
      return false;
    }

    try {
      await deleteCurriculum(targetCurriculum.id);
      setTermCurricula((previous) =>
        previous.filter((item) => item.id !== targetCurriculum.id),
      );
      if (curriculum?.id === targetCurriculum.id) {
        setSelectedNode(null);
        setCurriculum(null);
        setUnits([]);
        setLessons([]);
        await refreshCurriculum();
      }
      return true;
    } catch (error) {
      const mapped = curriculumUiError(error, tCommon("error"));
      setCurriculumError(mapped.message);
      return false;
    }
  };

  const handleConfirmCurriculumAction = async () => {
    if (!confirmationAction) return;
    setIsConfirmingAction(true);
    const targetCurriculum = confirmationCurriculum ?? curriculum;
    const succeeded =
      confirmationAction === "archive"
        ? await handleArchiveCurriculum(targetCurriculum)
        : await handleDeleteCurriculum(targetCurriculum);
    setIsConfirmingAction(false);
    if (succeeded) {
      setConfirmationAction(null);
      setConfirmationCurriculum(null);
    }
  };

  const gradeOptions = grades.map((g) => ({
    value: g.id,
    label: locale === "ar" ? g.nameAr : g.nameEn,
  }));
  const subjectOptions = subjects.map((s) => ({
    value: s.id,
    label: locale === "ar" ? s.nameAr : s.nameEn,
  }));
  const overviewGradeOptions = [
    { value: "", label: locale === "ar" ? "كل الصفوف" : "All grades" },
    ...gradeOptions,
  ];
  const overviewSubjectOptions = useMemo(() => {
    const overviewSubjects = queryState.overviewGradeId
      ? subjectsForGrade(subjectAllocations, queryState.overviewGradeId)
      : Array.from(
          subjectAllocations.reduce((subjectsById, allocation) => {
            const subject = subjectFromAllocation(allocation);
            if (subject) subjectsById.set(subject.id, subject);
            return subjectsById;
          }, new Map<string, Subject>()),
        ).map(([, subject]) => subject);

    return [
      { value: "", label: locale === "ar" ? "كل المواد" : "All subjects" },
      ...overviewSubjects.map((subject) => ({
        value: subject.id,
        label: locale === "ar" ? subject.nameAr : subject.nameEn,
      })),
    ];
  }, [locale, queryState.overviewGradeId, subjectAllocations]);
  const overviewStatusOptions = [
    { value: "", label: locale === "ar" ? "كل الحالات" : "All statuses" },
    { value: "DRAFT", label: t("status.draft") },
    { value: "ACTIVE", label: t("status.active") },
    { value: "ARCHIVED", label: t("status.archived") },
  ];
  const canShowMissingOverviewRows =
    !queryState.overviewStatus && !overviewSearchQuery;
  const hasOverviewFilters =
    Boolean(queryState.overviewGradeId) ||
    Boolean(queryState.overviewSubjectId) ||
    Boolean(queryState.overviewStatus) ||
    Boolean(overviewSearchQuery);

  const curriculaByScope = useMemo(() => {
    return new Map(
      termCurricula.map((item) => [
        curriculumScopeKey(item.gradeId, item.subjectId),
        item,
      ]),
    );
  }, [termCurricula]);

  const curriculumOverviewRows = useMemo<CurriculumOverviewRow[]>(() => {
    const rowsByScope = new Map<string, CurriculumOverviewRow>();

    subjectAllocations.forEach((allocation) => {
      if (
        queryState.overviewGradeId &&
        allocation.gradeId !== queryState.overviewGradeId
      ) {
        return;
      }
      if (
        queryState.overviewSubjectId &&
        allocation.subjectId !== queryState.overviewSubjectId
      ) {
        return;
      }

      const subject = subjectFromAllocation(allocation);
      const grade =
        grades.find((item) => item.id === allocation.gradeId) ??
        (allocation.grade
          ? {
              id: allocation.grade.id,
              name: allocation.grade.nameEn || allocation.grade.nameAr,
              nameAr: allocation.grade.nameAr,
              nameEn: allocation.grade.nameEn,
              stageId: "",
              capacity: 0,
              order: 0,
            }
          : null);

      if (!grade || !subject) {
        return;
      }

      const key = curriculumScopeKey(allocation.gradeId, allocation.subjectId);
      if (rowsByScope.has(key)) {
        return;
      }
      const curriculumForScope = curriculaByScope.get(key) ?? null;
      if (!curriculumForScope && !canShowMissingOverviewRows) {
        return;
      }

      rowsByScope.set(key, {
        key,
        grade,
        subject,
        allocation,
        curriculum: curriculumForScope,
      });
    });

    termCurricula.forEach((curriculumItem) => {
      const key = curriculumScopeKey(
        curriculumItem.gradeId,
        curriculumItem.subjectId,
      );
      if (rowsByScope.has(key)) {
        return;
      }

      rowsByScope.set(key, {
        key,
        grade: {
          id: curriculumItem.gradeId,
          name: curriculumItem.grade.name,
          nameAr: curriculumItem.grade.nameAr ?? curriculumItem.grade.name,
          nameEn: curriculumItem.grade.nameEn ?? curriculumItem.grade.name,
          stageId: "",
          capacity: 0,
          order: 0,
        },
        subject: {
          id: curriculumItem.subjectId,
          name: curriculumItem.subject.name,
          nameAr: curriculumItem.subject.nameAr ?? curriculumItem.subject.name,
          nameEn: curriculumItem.subject.nameEn ?? curriculumItem.subject.name,
          code: curriculumItem.subject.code,
          color: curriculumItem.subject.color,
          isActive: true,
        },
        allocation: {
          gradeId: curriculumItem.gradeId,
          subjectId: curriculumItem.subjectId,
          weeklyHours: 0,
        },
        curriculum: curriculumItem,
      });
    });

    return Array.from(rowsByScope.values());
  }, [
    canShowMissingOverviewRows,
    curriculaByScope,
    grades,
    queryState.overviewGradeId,
    queryState.overviewSubjectId,
    subjectAllocations,
    termCurricula,
  ]);

  const overviewStats = useMemo(
    () => ({
      total: curriculumOverviewRows.length,
      created: curriculumOverviewRows.filter((row) => row.curriculum).length,
      missing: curriculumOverviewRows.filter((row) => !row.curriculum).length,
    }),
    [curriculumOverviewRows],
  );

  const hasCurriculum = !!curriculum;
  const hasGrades = grades.length > 0;
  const hasSubjects = isCurriculumOverview
    ? subjectAllocations.length > 0
    : subjects.length > 0;
  const curriculumExportRows = useMemo(() => {
    return units.flatMap((unit) =>
      unit.lessons.map((lesson) => ({
        unit: unit.title,
        lesson: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes || "",
      })),
    );
  }, [units]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: termId || undefined,
      gradeName: selectedGradeId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columns: ExportColumn[] = [
      { key: "unit", label: locale === "ar" ? "الوحدة" : "Unit" },
      { key: "lesson", label: locale === "ar" ? "الدرس" : "Lesson" },
      {
        key: "estimatedMinutes",
        label: locale === "ar" ? "المدة (دقائق)" : "Duration (minutes)",
      },
    ];

    exportAcademicsData({
      title: t("outline.title"),
      metadata,
      filename: generateExportFilename(
        "curriculum",
        termId,
        selectedSubjectId || selectedGradeId || undefined,
      ),
      format,
      columns,
      rows: curriculumExportRows,
      locale,
      jsonData: {
        title: "Curriculum",
        metadata,
        curriculum,
        units,
        lessons,
      },
    });
  };

  const createDialogGradeId = createDialogScope?.gradeId ?? selectedGradeId;
  const createDialogSubjectId =
    createDialogScope?.subjectId ?? selectedSubjectId;
  const createDialogGradeName =
    grades.find((grade) => grade.id === createDialogGradeId)?.name || "";
  const createDialogSubjectAllocation = subjectAllocations.find(
    (allocation) => allocation.subjectId === createDialogSubjectId,
  );
  const createDialogSubjectName =
    subjects.find((subject) => subject.id === createDialogSubjectId)?.name ||
    (createDialogSubjectAllocation
      ? subjectFromAllocation(createDialogSubjectAllocation)?.name
      : "") ||
    "";

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setCreateDialogScope(null);
  };

  const curriculumOutlineProps = {
    curriculum: curriculum!,
    units,
    lessons,
    searchQuery: searchInputValue,
    onSearchQueryChange: handleSearchQueryChange,
    selectedNode,
    onSelectNode: handleSelectNode,
    onRefresh: refreshCurriculum,
    isReadOnly,
  };
  const curriculumEditorProps = {
    curriculum: curriculum!,
    units,
    lessons,
    selectedNode,
    termWeeks,
    onRefresh: refreshCurriculum,
    onDirtyChange: setHasUnsavedChanges,
    isReadOnly,
    onSelectNode: handleSelectNode,
  };
  const curriculumRightPanelProps = {
    details: {
      curriculum: curriculum!,
      exportRowCount: curriculumExportRows.length,
      availability: {
        canActivate,
        canArchive,
        canDelete: canMutate,
      },
      actions: {
        openExport: () => setShowExportModal(true),
        activate: () => void handleActivateCurriculum(),
        requestArchive: () => setConfirmationAction("archive"),
        requestDelete: () => setConfirmationAction("delete"),
      },
    },
  };

  return (
    <div className="flex h-screen flex-col">
      {isClosedTerm && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("readonly_banner.message")}
          </span>
        </div>
      )}

      {!isCurriculumOverview && (
        <div className="bg-white border-b border-border">
          <button
            type="button"
            onClick={handleToggleFilters}
            className="w-full px-6 py-3 flex items-center justify-between border-b border-border hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <h3 className="text-sm font-semibold text-gray-900">
              {t("filters.title")}
            </h3>
            <div className="text-gray-600">
              {queryState.filtersCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </div>
          </button>

          {!queryState.filtersCollapsed && (
            <div className="px-6 py-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (academicYearId) params.set("year", academicYearId);
                  if (termId) params.set("term", termId);
                  if (queryState.searchQuery) {
                    params.set("search", queryState.searchQuery);
                  }
                  router.push(
                    `/${locale}/academics/curriculum?${params.toString()}`,
                    { scroll: false },
                  );
                }}
                leftIcon={<ArrowRight className="h-4 w-4" />}
                className="mb-4"
              >
                {locale === "ar" ? "كل المناهج" : "All curricula"}
              </Button>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 min-w-[200px] w-full">
                  <Select
                    label={t("filters.grade")}
                    required
                    value={selectedGradeId}
                    onChange={handleGradeChange}
                    options={gradeOptions}
                    selectSize="md"
                    disabled={!hasGrades}
                  />
                </div>

                <div className="flex-1 min-w-[200px] w-full">
                  <Select
                    label={t("filters.subject")}
                    required
                    value={selectedSubjectId}
                    onChange={handleSubjectChange}
                    options={subjectOptions}
                    selectSize="md"
                    disabled={!hasSubjects}
                  />
                </div>

                <div className="flex gap-2">
                  {canShowCreateCurriculum && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={openCreateCurriculumForSelectedScope}
                      disabled={isReadOnly}
                    >
                      {t("actions.create_curriculum")}
                    </Button>
                  )}
                  {hasCurriculum && (
                    <CurriculumActionsMenu
                      labels={{
                        menu: t("actions.menu"),
                        export: tExport("button"),
                        activate: t("actions.activate_curriculum"),
                        archive: t("actions.archive_curriculum"),
                        delete: t("actions.delete_curriculum"),
                      }}
                      onExport={() => setShowExportModal(true)}
                      onActivate={() => void handleActivateCurriculum()}
                      onArchive={() => setConfirmationAction("archive")}
                      onDelete={() => setConfirmationAction("delete")}
                      canExport={curriculumExportRows.length > 0}
                      canActivate={canActivate}
                      canArchive={canArchive}
                      canDelete={canMutate}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isInitializing && !isOptionsLoading && contextError && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tCommon("error")}
            </h3>
            <p className="text-gray-600 mb-6">{contextError}</p>
            <Button variant="primary" onClick={loadOptionsData}>
              {tCommon("retry")}
            </Button>
          </div>
        </div>
      )}

      {isCurriculumOverview &&
        !isInitializing &&
        !isOptionsLoading &&
        !contextError &&
        !hasGrades && (
          <AcademicModuleEmptyState
            icon={GraduationCap}
            title={tEmpty("no_grades.title")}
            description={tEmpty("no_grades.description")}
            ctaLabel={tEmpty("no_grades.cta")}
            onCtaClick={() => router.push(`/${locale}/academics/structure`)}
          />
        )}

      {isCurriculumOverview &&
        !isInitializing &&
        !isOptionsLoading &&
        !contextError &&
        hasGrades &&
        !hasSubjects && (
          <AcademicModuleEmptyState
            icon={BookOpen}
            title={tEmpty("no_subjects.title")}
            description={tEmpty("no_subjects.description")}
            ctaLabel={tEmpty("no_subjects.cta")}
            onCtaClick={() => router.push(`/${locale}/academics/subjects`)}
          />
        )}

      {isCurriculumOverview &&
        !isInitializing &&
        !isOptionsLoading &&
        !contextError &&
        hasGrades &&
        hasSubjects && (
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {locale === "ar" ? "مناهج الترم" : "Term curricula"}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ar"
                      ? "كل المواد الموزعة على الصفوف داخل الترم الحالي."
                      : "All allocated grade-subject curricula for the selected term."}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {overviewStats.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {locale === "ar" ? "الإجمالي" : "Total"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="text-lg font-semibold text-emerald-700">
                      {overviewStats.created}
                    </div>
                    <div className="text-xs text-gray-500">
                      {locale === "ar" ? "موجود" : "Created"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="text-lg font-semibold text-amber-700">
                      {overviewStats.missing}
                    </div>
                    <div className="text-xs text-gray-500">
                      {locale === "ar" ? "ناقص" : "Missing"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_minmax(220px,1.2fr)_auto] lg:items-end">
                <Select
                  label={locale === "ar" ? "الصف" : "Grade"}
                  value={queryState.overviewGradeId || ""}
                  onChange={handleOverviewGradeChange}
                  options={overviewGradeOptions}
                  selectSize="md"
                  searchable
                />
                <Select
                  label={locale === "ar" ? "المادة" : "Subject"}
                  value={queryState.overviewSubjectId || ""}
                  onChange={(subjectId) => updateOverviewFilters({ subjectId })}
                  options={overviewSubjectOptions}
                  selectSize="md"
                  searchable
                />
                <Select
                  label={locale === "ar" ? "الحالة" : "Status"}
                  value={queryState.overviewStatus || ""}
                  onChange={(status) => updateOverviewFilters({ status })}
                  options={overviewStatusOptions}
                  selectSize="md"
                />
                <Input
                  label={locale === "ar" ? "بحث" : "Search"}
                  value={searchInputValue}
                  onChange={(event) =>
                    handleSearchQueryChange(event.target.value)
                  }
                  placeholder={
                    locale === "ar" ? "ابحث في المناهج" : "Search curricula"
                  }
                  leftIcon={<Search className="h-4 w-4" />}
                  inputSize="md"
                />
                <Button
                  variant="secondary"
                  size="md"
                  disabled={!hasOverviewFilters}
                  onClick={handleClearOverviewFilters}
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                >
                  {locale === "ar" ? "مسح" : "Clear"}
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {curriculumOverviewRows.map((row) => {
                  const rowCurriculum = row.curriculum;
                  const canActivateRow =
                    canMutateTermCurricula &&
                    rowCurriculum?.status === "draft" &&
                    rowCurriculum.unitCount > 0 &&
                    rowCurriculum.lessonCount > 0;
                  const canMutateRow =
                    canMutateTermCurricula &&
                    rowCurriculum?.status !== "archived";

                  return (
                    <div
                      key={row.key}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase text-gray-500">
                            {locale === "ar"
                              ? row.grade.nameAr
                              : row.grade.nameEn}
                          </div>
                          <h2 className="mt-1 truncate text-base font-semibold text-gray-900">
                            {locale === "ar"
                              ? row.subject.nameAr
                              : row.subject.nameEn}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            {row.subject.code && (
                              <span className="rounded bg-gray-100 px-2 py-1">
                                {row.subject.code}
                              </span>
                            )}
                            {row.allocation.weeklyHours > 0 && (
                              <span className="rounded bg-gray-100 px-2 py-1">
                                {row.allocation.weeklyHours}h/week
                              </span>
                            )}
                          </div>
                        </div>

                        {rowCurriculum && (
                          <div className="flex shrink-0 items-center gap-1">
                            <IconButton
                              aria-label={t("actions.activate_curriculum")}
                              disabled={!canActivateRow}
                              onClick={() =>
                                void handleActivateCurriculum(rowCurriculum)
                              }
                              size="small"
                            >
                              <CircleCheck className="h-4 w-4" />
                            </IconButton>
                            <IconButton
                              aria-label={t("actions.archive_curriculum")}
                              disabled={!canMutateRow}
                              onClick={() => {
                                setConfirmationCurriculum(rowCurriculum);
                                setConfirmationAction("archive");
                              }}
                              size="small"
                            >
                              <Archive className="h-4 w-4" />
                            </IconButton>
                            <IconButton
                              aria-label={t("actions.delete_curriculum")}
                              disabled={!canMutateRow}
                              onClick={() => {
                                setConfirmationCurriculum(rowCurriculum);
                                setConfirmationAction("delete");
                              }}
                              size="small"
                              sx={{ color: "error.main" }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </div>
                        )}
                      </div>

                      {rowCurriculum?.title && (
                        <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
                          <h3 className="break-words text-sm font-semibold text-gray-900">
                            {rowCurriculum.title}
                          </h3>
                          {rowCurriculum.description && (
                            <p className="break-words text-sm leading-6 text-gray-600">
                              {rowCurriculum.description}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">
                            {t("details.status")}
                          </div>
                          <div className="font-medium text-gray-900">
                            {rowCurriculum
                              ? t(
                                  curriculumStatusLabelKey(
                                    rowCurriculum.status,
                                  ),
                                )
                              : locale === "ar"
                                ? "غير منشأ"
                                : "Not created"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            {t("details.units")}
                          </div>
                          <div className="font-medium text-gray-900">
                            {rowCurriculum?.unitCount ?? 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            {t("details.lessons")}
                          </div>
                          <div className="font-medium text-gray-900">
                            {rowCurriculum?.lessonCount ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        {rowCurriculum ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              openCurriculumScope(rowCurriculum.id)
                            }
                          >
                            {locale === "ar" ? "فتح" : "Open"}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!canMutateTermCurricula}
                            onClick={() =>
                              openCreateCurriculumForScope(
                                row.grade.id,
                                row.subject.id,
                              )
                            }
                          >
                            {t("actions.create_curriculum")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      {isPageLoading && (hasScope || isCurriculumOverview) && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <PartialLoader />
        </div>
      )}

      {(canShowCreateCurriculum || canShowCurriculumError) && (
        <AcademicModuleEmptyState
          icon={BookOpen}
          title={curriculumError || tEmpty("no_curriculum.title")}
          description={curriculumError || tEmpty("no_curriculum.description")}
          ctaLabel={
            canShowCurriculumError
              ? tCommon("retry")
              : t("actions.create_curriculum")
          }
          ctaDisabled={!canShowCurriculumError && isReadOnly}
          onCtaClick={
            canShowCurriculumError
              ? loadCurriculumData
              : openCreateCurriculumForSelectedScope
          }
        />
      )}

      {!isPageLoading && hasCurriculum && (
        <>
          {!isMobile && (
            <div className="hidden lg:flex flex-1 overflow-hidden">
              <div
                className="border-r border-l border-border bg-white shrink-0 transition-all duration-300 overflow-hidden"
                style={{ width: LEFT_PANEL_WIDTH }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <CurriculumOutline {...curriculumOutlineProps} />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-gray-50 min-w-0 overflow-auto">
                <CurriculumEditor {...curriculumEditorProps} />
              </div>

              <div
                className="border-l border-r border-border bg-white min-w-[400px] transition-all duration-300 overflow-hidden"
                style={{ width: RIGHT_PANEL_WIDTH }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <CurriculumRightPanel {...curriculumRightPanelProps} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetLeftDrawerOpen(true)}
                >
                  {tCommon("lessons")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetRightDrawerOpen(true)}
                >
                  {tCommon("details")}
                </Button>
              </div>

              <div className="flex-1 overflow-auto bg-gray-50">
                <CurriculumEditor {...curriculumEditorProps} />
              </div>

              <Drawer
                anchor={isRTL ? "right" : "left"}
                open={queryState.leftDrawerOpen}
                onClose={() => handleSetLeftDrawerOpen(false)}
                slotProps={{
                  paper: {
                    sx: { width: "80%", maxWidth: 360 },
                  },
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{tCommon("lessons")}</h3>
                    <IconButton
                      size="small"
                      onClick={() => handleSetLeftDrawerOpen(false)}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </IconButton>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <CurriculumOutline
                      {...curriculumOutlineProps}
                      onSelectNode={(node) => {
                        handleSelectNode(node);
                        handleSetLeftDrawerOpen(false);
                      }}
                    />
                  </div>
                </div>
              </Drawer>

              <Drawer
                anchor={isRTL ? "left" : "right"}
                open={queryState.rightDrawerOpen}
                onClose={() => handleSetRightDrawerOpen(false)}
                slotProps={{
                  paper: {
                    sx: { width: "80%", maxWidth: 400 },
                  },
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{tCommon("details")}</h3>
                    <IconButton
                      size="small"
                      onClick={() => handleSetRightDrawerOpen(false)}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </IconButton>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <CurriculumRightPanel {...curriculumRightPanelProps} />
                  </div>
                </div>
              </Drawer>
            </div>
          )}
        </>
      )}

      <CreateCurriculumDialog
        isOpen={showCreateDialog}
        onClose={closeCreateDialog}
        onSuccess={handleCreateSuccess}
        academicYearId={academicYearId!}
        termId={termId!}
        gradeId={createDialogGradeId}
        subjectId={createDialogSubjectId}
        gradeName={createDialogGradeName}
        subjectName={createDialogSubjectName}
      />

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("outline.title")}
        datasetCount={curriculumExportRows.length}
      />

      {confirmation && (
        <ConfirmDialog
          isOpen
          onClose={() => {
            if (!isConfirmingAction) {
              setConfirmationAction(null);
              setConfirmationCurriculum(null);
            }
          }}
          onConfirm={() => void handleConfirmCurriculumAction()}
          title={t(confirmation.titleKey)}
          description={t(confirmation.descriptionKey)}
          confirmLabel={t(confirmation.confirmLabelKey)}
          cancelLabel={tCommon("cancel")}
          loading={isConfirmingAction}
          severity={confirmation.severity}
        />
      )}

      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => settleDiscardConfirmation(false)}
        onConfirm={() => settleDiscardConfirmation(true)}
        title={t("unsaved_changes.title")}
        description={t("unsaved_changes.message")}
        confirmLabel={t("unsaved_changes.discard")}
        cancelLabel={t("unsaved_changes.cancel")}
        severity="warning"
      />
    </div>
  );
}

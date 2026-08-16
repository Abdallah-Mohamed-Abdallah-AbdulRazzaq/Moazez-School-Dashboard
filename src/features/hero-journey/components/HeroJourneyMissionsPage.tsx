"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Archive,
  Eye,
  ListChecks,
  MoreVertical,
  PencilLine,
  Plus,
  Power,
  RefreshCw,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Button,
  DataTable,
  FilterPanel,
  Input,
  KPICardV2,
  Modal,
  Select,
} from "@/components/ui";
import type { Column } from "@/components/ui/data-table";
import { DropdownMenu } from "@/components/ui/dropdown";
import type { SelectOption } from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchCurriculumForScope } from "@/features/academics/curriculum/services/curriculumService";
import { useAcademicYearTermContext } from "@/features/academics/hooks/useAcademicYearTermContext";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import { fetchAssessments } from "@/features/grades/overview/services/gradesOverviewService";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { usePermissions } from "@/hooks/usePermissions";
import { isApiError } from "@/lib/api-error";
import { heroJourneySectionBanners } from "../config/heroJourneySectionBanners";
import useHeroJourneyOverlayMode from "../hooks/useHeroJourneyOverlayMode";
import { useHeroJourneyMissionSearch } from "../hooks/useHeroJourneyMissionSearch";
import {
  createHeroJourneyBadge,
  createHeroJourneyMission,
  deleteHeroJourneyBadge,
  deleteHeroJourneyMission,
  getHeroJourneyBadge,
  getHeroJourneyBadgeCatalog,
  getHeroJourneyMission,
  getHeroJourneyMissions,
  archiveHeroJourneyMission,
  publishHeroJourneyMission,
  updateHeroJourneyBadge,
  updateHeroJourneyMission,
} from "../services/heroJourneyService";
import type {
  HeroJourneyBadgePayload,
} from "../services/heroJourneyService";
import {
  HeroMissionContractError,
  isHeroMissionEditable,
} from "../services/heroJourneyMissionContract";
import type {
  CreateHeroMissionCandidate,
  HeroMissionEditableField,
  HeroMissionFormCandidate,
} from "../services/heroJourneyMissionContract";
import type {
  HeroJourneyBadge,
  HeroJourneyMission,
  HeroJourneyMissionFilters,
} from "../types";
import { formatHeroJourneyPercent } from "../utils/heroJourneyPresentation";
import HeroJourneyBadgeThumb from "./HeroJourneyBadgeThumb";
import HeroJourneyBadgeFormModal from "./HeroJourneyBadgeFormModal";
import HeroJourneyMobilePagination from "./HeroJourneyMobilePagination";
import HeroJourneyMissionActions from "./HeroJourneyMissionActions";
import HeroJourneyMissionDetailContent from "./HeroJourneyMissionDetailContent";
import HeroJourneyMissionFormModal from "./HeroJourneyMissionFormModal";
import HeroJourneyPageHeader from "./HeroJourneyPageHeader";
import HeroJourneyStatusPill from "./HeroJourneyStatusPill";

function getMissionCompletionRate(mission: HeroJourneyMission) {
  if (mission.studentsStarted === 0) {
    return 0;
  }

  return (mission.studentsCompleted / mission.studentsStarted) * 100;
}

function localizedOptionLabel(
  locale: string,
  nameEn?: string | null,
  nameAr?: string | null,
  fallback = "",
) {
  return locale === "ar"
    ? nameAr || nameEn || fallback
    : nameEn || nameAr || fallback;
}

function hasLinkedValue(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;

  return ![
    "linked lesson",
    "درس مرتبط",
    "not linked",
    "غير مرتبط",
    "linked assessment",
    "تقييم مرتبط",
    "no assessment linked",
    "لا يوجد تقييم مرتبط",
  ].includes(normalized);
}

type RelatedSelectOption = SelectOption & {
  stageId?: string;
  gradeId?: string;
  gradeIds?: string[];
  subjectId?: string;
  scopeType?: string;
  scopeId?: string;
};

export default function HeroJourneyMissionsPage() {
  const mobilePageSize = 5;
  const locale = useLocale();
  const t = useTranslations("heroJourney");
  const { showError, showSuccess } = useToast();
  const { hasPermission, isPermissionsReady } = usePermissions();
  const canViewHero =
    isPermissionsReady && hasPermission("reinforcement.hero.view");
  const canManageHero =
    isPermissionsReady && hasPermission("reinforcement.hero.manage");
  const canViewBadges =
    isPermissionsReady && hasPermission("reinforcement.hero.badges.view");
  const canManageBadges =
    isPermissionsReady && hasPermission("reinforcement.hero.badges.manage");
  const {
    academicYearId,
    termId,
    selectedAcademicYear,
    selectedTerm,
    isInitializing: isAcademicContextInitializing,
  } = useAcademicYearTermContext();
  const [showFilters, setShowFilters] = useState(true);
  const [missions, setMissions] = useState<HeroJourneyMission[]>([]);
  const [badges, setBadges] = useState<HeroJourneyBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null,
  );
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isMissionFormOpen, setIsMissionFormOpen] = useState(false);
  const [editingMission, setEditingMission] =
    useState<HeroJourneyMission | null>(null);
  const [isMissionSaving, setIsMissionSaving] = useState(false);
  const [isMissionOptionsLoading, setIsMissionOptionsLoading] = useState(false);
  const [missionOptionsReloadKey, setMissionOptionsReloadKey] = useState(0);
  const [missionOptionsError, setMissionOptionsError] = useState<string | null>(
    null,
  );
  const [stageOptions, setStageOptions] = useState<RelatedSelectOption[]>([]);
  const [gradeOptions, setGradeOptions] = useState<RelatedSelectOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<RelatedSelectOption[]>(
    [],
  );
  const [assessmentOptions, setAssessmentOptions] = useState<
    RelatedSelectOption[]
  >([]);
  const [lessonNameById, setLessonNameById] = useState<Record<string, string>>(
    {},
  );
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(
    null,
  );
  const [isBadgeManagerOpen, setIsBadgeManagerOpen] = useState(false);
  const [isBadgeFormOpen, setIsBadgeFormOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<HeroJourneyBadge | null>(
    null,
  );
  const [isBadgeSaving, setIsBadgeSaving] = useState(false);
  const [deletingBadgeId, setDeletingBadgeId] = useState<string | null>(null);
  const [missionTablePage, setMissionTablePage] = useState(1);
  const [missionTablePageSize, setMissionTablePageSize] = useState(8);
  const isOverlayMode = useHeroJourneyOverlayMode();
  const queryState = useUrlQueryState({
    defaults: {
      q: "",
      status: "all",
      includeArchived: "all",
      heroJourneyMissionsMobilePage: "1",
    },
    debouncedKeys: ["q"],
    modeByKey: {
      q: "replace",
      status: "replace",
    },
  });
  const {
    debouncedSearch,
    isDebouncing: isMissionSearchDebouncing,
  } = useHeroJourneyMissionSearch(queryState.values.q);
  const missionFilters: HeroJourneyMissionFilters = useMemo(
    () => ({
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
      search: debouncedSearch || undefined,
      status: queryState.values.status as HeroJourneyMissionFilters["status"],
      includeArchived:
        queryState.values.includeArchived === "true"
          ? true
          : queryState.values.includeArchived === "false"
            ? false
            : undefined,
      limit: missionTablePageSize,
      offset: (missionTablePage - 1) * missionTablePageSize,
    }),
    [
      academicYearId,
      debouncedSearch,
      missionTablePage,
      missionTablePageSize,
      queryState.values.includeArchived,
      queryState.values.status,
      termId,
    ],
  );

  useEffect(() => {
    if (!canViewBadges) {
      return;
    }

    let cancelled = false;

    void getHeroJourneyBadgeCatalog({})
      .then((result) => {
        if (!cancelled) {
          setBadges(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBadges([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canViewBadges]);

  useEffect(() => {
    if (!canViewHero || !academicYearId || !termId) {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => setIsMissionOptionsLoading(true));
    void Promise.resolve().then(() => setMissionOptionsError(null));

    void Promise.all([
      fetchStructureTree(academicYearId, termId),
      fetchSubjects(),
      fetchSubjectAllocations(termId),
      fetchAssessments(academicYearId, termId, { includeDrafts: true }),
    ])
      .then(([structure, subjects, allocations, assessments]) => {
        if (cancelled) return;

        const nextStageOptions = structure.stages.map((stage) => ({
          value: stage.id,
          label: localizedOptionLabel(
            locale,
            stage.nameEn,
            stage.nameAr,
            stage.name,
          ),
          searchText: `${stage.nameEn} ${stage.nameAr} ${stage.name}`,
        }));
        const nextGradeOptions = structure.grades.map((grade) => ({
          value: grade.id,
          label: localizedOptionLabel(
            locale,
            grade.nameEn,
            grade.nameAr,
            grade.name,
          ),
          searchText: `${grade.nameEn} ${grade.nameAr} ${grade.name}`,
          stageId: grade.stageId,
        }));
        const gradeIdsBySubject = new Map<string, string[]>();
        allocations.forEach((allocation) => {
          const current = gradeIdsBySubject.get(allocation.subjectId) || [];
          if (allocation.gradeId && !current.includes(allocation.gradeId)) {
            gradeIdsBySubject.set(allocation.subjectId, [
              ...current,
              allocation.gradeId,
            ]);
          }
        });
        const nextSubjectOptions = subjects.map((subject) => ({
          value: subject.id,
          label: localizedOptionLabel(
            locale,
            subject.nameEn,
            subject.nameAr,
            subject.name,
          ),
          searchText: `${subject.nameEn} ${subject.nameAr} ${subject.code || ""}`,
          gradeIds: gradeIdsBySubject.get(subject.id) || [],
        }));
        const nextAssessmentOptions = assessments.map((assessment) => ({
          value: assessment.id,
          label: localizedOptionLabel(
            locale,
            assessment.title,
            assessment.titleAr,
            assessment.id,
          ),
          searchText: `${assessment.title} ${assessment.titleAr} ${assessment.type}`,
          subjectId: assessment.subjectId,
          scopeType: assessment.scopeType,
          scopeId: assessment.scopeId,
        }));

        setStageOptions(nextStageOptions);
        setGradeOptions(nextGradeOptions);
        setSubjectOptions(nextSubjectOptions);
        setAssessmentOptions(nextAssessmentOptions);
      })
      .catch(() => {
        if (!cancelled) {
          setStageOptions([]);
          setGradeOptions([]);
          setSubjectOptions([]);
          setAssessmentOptions([]);
          setMissionOptionsError(t("messages.loadMissionOptionsFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsMissionOptionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [academicYearId, canViewHero, locale, missionOptionsReloadKey, t, termId]);

  const assessmentNameById = useMemo(
    () =>
      new Map(assessmentOptions.map((option) => [option.value, option.label])),
    [assessmentOptions],
  );

  useEffect(() => {
    if (!canViewHero || !academicYearId || !termId || missions.length === 0) {
      void Promise.resolve().then(() => setLessonNameById({}));
      return;
    }

    let cancelled = false;
    const curriculumCache = new Map<
      string,
      ReturnType<typeof fetchCurriculumForScope>
    >();

    const getCurriculum = (gradeId: string, subjectId: string) => {
      const cacheKey = `${gradeId}:${subjectId}`;
      const cached = curriculumCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const request = fetchCurriculumForScope({
        academicYearId,
        termId,
        gradeId,
        subjectId,
      });
      curriculumCache.set(cacheKey, request);
      return request;
    };

    void (async () => {
      const nextLessonNames: Record<string, string> = {};

      for (const mission of missions) {
        const lessonId = mission.linkedLessonRef || mission.linkedLessonId;
        if (!lessonId || !mission.subjectId) {
          continue;
        }

        const subjectOption = subjectOptions.find(
          (option) => option.value === mission.subjectId,
        );
        const subjectGradeIds = subjectOption?.gradeIds || [];
        const candidateGrades = gradeOptions.filter((option) => {
          if (
            mission.stageId &&
            option.stageId &&
            option.stageId !== mission.stageId
          ) {
            return false;
          }

          return (
            subjectGradeIds.length === 0 ||
            subjectGradeIds.includes(option.value)
          );
        });

        for (const gradeOption of candidateGrades) {
          const curriculum = await getCurriculum(
            gradeOption.value,
            mission.subjectId,
          );
          if (cancelled) return;

          const lesson = curriculum?.units
            .flatMap((unit) => unit.lessons)
            .find((item) => item.id === lessonId);

          if (lesson) {
            nextLessonNames[lessonId] = lesson.title;
            break;
          }
        }
      }

      if (!cancelled) {
        setLessonNameById(nextLessonNames);
      }
    })().catch(() => {
      if (!cancelled) {
        setLessonNameById({});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [academicYearId, canViewHero, gradeOptions, missions, subjectOptions, termId]);

  useEffect(() => {
    if (!canViewHero || !isPermissionsReady || isAcademicContextInitializing) {
      return;
    }

    if (!academicYearId || !termId) {
      void Promise.resolve().then(() => setMissions([]));
      void Promise.resolve().then(() => {
        setLoadError(t("messages.selectAcademicContext"));
      });
      void Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    if (isMissionSearchDebouncing) {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => setIsLoading(true));

    void getHeroJourneyMissions(missionFilters)
      .then((result) => {
        if (!cancelled) {
          setMissions(result);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMissions([]);
          setLoadError(t("messages.loadMissionsFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    academicYearId,
    canViewHero,
    debouncedSearch,
    isAcademicContextInitializing,
    isPermissionsReady,
    isMissionSearchDebouncing,
    missionFilters,
    t,
    termId,
  ]);

  const badgeMap = useMemo(
    () => new Map(badges.map((badge) => [badge.slug, badge])),
    [badges],
  );

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) || null,
    [missions, selectedMissionId],
  );
  const detailMission = selectedMission || missions[0] || null;
  const getResolvedLinkedLessonName = (mission: HeroJourneyMission | null) => {
    if (!mission) return undefined;
    const lessonId = mission.linkedLessonRef || mission.linkedLessonId;
    return lessonNameById[lessonId];
  };
  const getResolvedLinkedAssessmentName = (
    mission: HeroJourneyMission | null,
  ) => {
    if (!mission) return undefined;
    return assessmentNameById.get(
      mission.linkedAssessmentId || mission.linkedQuizId,
    );
  };
  const getResolvedStageName = (mission: HeroJourneyMission | null) => {
    if (!mission) return "";

    return (
      stageOptions.find((option) => option.value === mission.stageId)?.label ||
      (locale === "ar" ? mission.stageNameAr : mission.stageNameEn)
    );
  };
  const mobileCurrentPage = Math.max(
    1,
    Number.parseInt(
      queryState.values.heroJourneyMissionsMobilePage || "1",
      10,
    ) || 1,
  );
  const mobileTotalPages = Math.max(
    1,
    Math.ceil(missions.length / mobilePageSize),
  );
  const safeMobilePage = Math.min(mobileCurrentPage, mobileTotalPages);
  const mobileVisibleMissions = useMemo(() => {
    const startIndex = (safeMobilePage - 1) * mobilePageSize;
    return missions.slice(startIndex, startIndex + mobilePageSize);
  }, [missions, safeMobilePage]);

  const averageCompletion = useMemo(() => {
    if (missions.length === 0) {
      return 0;
    }

    return (
      missions.reduce(
        (sum, mission) => sum + getMissionCompletionRate(mission),
        0,
      ) / missions.length
    );
  }, [missions]);

  const summaryCards = useMemo(
    () => [
      {
        key: "total",
        title: t("missionsSummary.totalMissions"),
        value: missions.length,
        icon: ListChecks,
        iconColor: "#0369a1",
        iconBgColor: "#f0f9ff",
      },
      {
        key: "published",
        title: t("missionsSummary.publishedMissions"),
        value: missions.filter((mission) => mission.status === "published")
          .length,
        icon: Power,
        iconColor: "#047857",
        iconBgColor: "#ecfdf5",
      },
      {
        key: "average",
        title: t("missionsSummary.averageCompletion"),
        value: Number(averageCompletion.toFixed(1)),
        valueSuffix: "%",
        icon: Target,
        iconColor: "#b45309",
        iconBgColor: "#fffbeb",
      },
    ],
    [averageCompletion, missions, t],
  );

  const openMissionDetail = (missionId: string) => {
    setSelectedMissionId(missionId);

    if (isOverlayMode) {
      setIsMissionModalOpen(true);
    }
  };

  const refreshBadges = async () => {
    if (!canViewBadges) {
      return;
    }

    const refreshed = await getHeroJourneyBadgeCatalog({});
    setBadges(refreshed);
  };

  const refreshMissions = async () => {
    if (!canViewHero) {
      return;
    }

    const refreshed = await getHeroJourneyMissions(missionFilters);
    setMissions(refreshed);
  };

  const refreshMissionList = async () => {
    if (!canViewHero || !academicYearId || !termId) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([refreshMissions(), refreshBadges()]);
      setLoadError(null);
    } catch {
      setLoadError(t("messages.loadMissionsFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMissionFormOptions = () => {
    if (!canManageHero) {
      return;
    }

    setMissionOptionsReloadKey((value) => value + 1);
    void refreshBadges();
  };

  const loadCurriculumLessonOptions = async (
    gradeId: string,
    subjectId: string,
  ): Promise<RelatedSelectOption[]> => {
    if (!academicYearId || !termId || !gradeId || !subjectId) {
      return [];
    }

    const curriculum = await fetchCurriculumForScope({
      academicYearId,
      termId,
      gradeId,
      subjectId,
    });

    return (
      curriculum?.units.flatMap((unit) =>
        unit.lessons.map((lesson) => ({
          value: lesson.id,
          label: lesson.title,
          searchText: `${lesson.title} ${unit.title} ${curriculum.title}`,
          subjectId,
          gradeId: curriculum.gradeId || gradeId,
        })),
      ) || []
    );
  };

  const openCreateMission = () => {
    if (!canManageHero) {
      return;
    }

    if (!academicYearId || !termId) {
      showError(t("messages.selectAcademicContextBeforeCreate"));
      return;
    }

    setEditingMission(null);
    setIsMissionFormOpen(true);
  };

  const openEditMission = async (missionId: string) => {
    if (!canManageHero) {
      openMissionDetail(missionId);
      return;
    }

    try {
      const mission = await getHeroJourneyMission(missionId);
      if (!isHeroMissionEditable(mission.status)) {
        showError(t("missionForm.errors.missionArchived"));
        return;
      }

      setEditingMission(mission);
      setIsMissionModalOpen(false);
      setIsMissionFormOpen(true);
    } catch {
      showError("Unable to load mission detail.");
    }
  };

  const saveMission = async (
    payload: Omit<
      HeroMissionFormCandidate,
      "academicYearId" | "yearId" | "termId"
    >,
    dirtyFields: ReadonlySet<HeroMissionEditableField>,
  ) => {
    if (!canManageHero) {
      return;
    }

    if (!academicYearId || !termId) {
      showError(t("messages.selectAcademicContextBeforeSave"));
      return;
    }

    setIsMissionSaving(true);
    try {
      if (editingMission) {
        await updateHeroJourneyMission(editingMission.id, payload, {
          status: editingMission.status,
          original: editingMission,
          dirtyFields,
        });
        showSuccess("Mission updated.");
      } else {
        const scopedPayload: CreateHeroMissionCandidate = {
          ...payload,
          academicYearId,
          termId,
        };
        await createHeroJourneyMission(scopedPayload);
        showSuccess("Mission created.");
      }
      setIsMissionFormOpen(false);
      setEditingMission(null);
      await refreshMissions();
    } catch (error) {
      if (error instanceof HeroMissionContractError) {
        showError(t(`missionForm.errors.${error.code}`));
      } else if (isApiError(error) && error.message.trim()) {
        showError(error.message);
      } else {
        showError(t("messages.saveMissionFailed"));
      }
    } finally {
      setIsMissionSaving(false);
    }
  };

  const removeMission = async (missionId: string) => {
    if (!canManageHero) {
      return;
    }

    if (!window.confirm(t("messages.confirmDeleteMission"))) {
      return;
    }

    setDeletingMissionId(missionId);
    try {
      await deleteHeroJourneyMission(missionId);
      showSuccess("Mission deleted.");
      if (selectedMissionId === missionId) {
        setSelectedMissionId(null);
      }
      await refreshMissions();
    } catch {
      showError("Unable to delete mission.");
    } finally {
      setDeletingMissionId(null);
    }
  };

  const publishMission = async (missionId: string) => {
    if (!canManageHero) {
      return;
    }

    setIsPublishing(missionId);
    try {
      await publishHeroJourneyMission(missionId);
      await refreshMissions();
      showSuccess(t("messages.publishStateUpdated"));
    } finally {
      setIsPublishing(null);
    }
  };

  const archiveMission = async (missionId: string) => {
    if (!canManageHero) {
      return;
    }

    setIsPublishing(missionId);
    try {
      await archiveHeroJourneyMission(missionId);
      await refreshMissions();
      showSuccess(t("messages.publishStateUpdated"));
    } finally {
      setIsPublishing(null);
    }
  };

  const openCreateBadge = () => {
    if (!canManageBadges) {
      return;
    }

    setEditingBadge(null);
    setIsBadgeFormOpen(true);
  };

  const openEditBadge = async (badgeId: string) => {
    if (!canManageBadges) {
      return;
    }

    try {
      setEditingBadge(await getHeroJourneyBadge(badgeId));
      setIsBadgeFormOpen(true);
    } catch {
      showError("Unable to load badge detail.");
    }
  };

  const saveBadge = async (payload: HeroJourneyBadgePayload) => {
    if (!canManageBadges) {
      return;
    }

    setIsBadgeSaving(true);
    try {
      if (editingBadge) {
        await updateHeroJourneyBadge(editingBadge.id, payload);
        showSuccess("Badge updated.");
      } else {
        await createHeroJourneyBadge(payload);
        showSuccess("Badge created.");
      }
      setIsBadgeFormOpen(false);
      setEditingBadge(null);
      await refreshBadges();
    } catch {
      showError("Unable to save badge.");
    } finally {
      setIsBadgeSaving(false);
    }
  };

  const removeBadge = async (badgeId: string) => {
    if (!canManageBadges) {
      return;
    }

    if (!window.confirm(t("messages.confirmDeleteBadge"))) {
      return;
    }

    setDeletingBadgeId(badgeId);
    try {
      await deleteHeroJourneyBadge(badgeId);
      showSuccess("Badge deleted.");
      await refreshBadges();
    } catch {
      showError("Unable to delete badge.");
    } finally {
      setDeletingBadgeId(null);
    }
  };

  if (!isPermissionsReady) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (!canViewHero) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
      >
        {t("accessDenied")}
      </div>
    );
  }

  const columns: Column<HeroJourneyMission>[] = [
    {
      key: "titleEn",
      label: t("table.title"),
      searchable: true,
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.titleAr : row.titleEn}
          </div>
          <div className="truncate text-xs text-gray-500">
            {getResolvedStageName(row)}
          </div>
        </div>
      ),
    },
    { key: "requiredLevel", label: t("table.requiredLevel") },
    {
      key: "linkedLessonTitleEn",
      label: t("table.linkedLesson"),
      searchable: true,
      render: (_value, row) => {
        const lessonId = row.linkedLessonRef || row.linkedLessonId;
        if (!hasLinkedValue(lessonId)) {
          return t("detail.noLinkedLesson");
        }

        const fallbackLessonName =
          locale === "ar" ? row.linkedLessonTitleAr : row.linkedLessonTitleEn;
        return (
          lessonNameById[lessonId] ||
          (hasLinkedValue(fallbackLessonName)
            ? fallbackLessonName
            : t("detail.noLinkedLesson"))
        );
      },
    },
    {
      key: "linkedQuizTitleEn",
      label: t("table.linkedQuiz"),
      searchable: true,
      render: (_value, row) => {
        const assessmentId = row.linkedAssessmentId || row.linkedQuizId;
        if (!hasLinkedValue(assessmentId)) {
          return t("detail.noLinkedAssessment");
        }

        const fallbackAssessmentName =
          locale === "ar" ? row.linkedQuizTitleAr : row.linkedQuizTitleEn;
        return (
          assessmentNameById.get(assessmentId) ||
          (hasLinkedValue(fallbackAssessmentName)
            ? fallbackAssessmentName
            : t("detail.noLinkedAssessment"))
        );
      },
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value) => (
        <HeroJourneyStatusPill
          kind="mission"
          value={value as HeroJourneyMission["status"]}
        />
      ),
    },
    {
      key: "rewardXp",
      label: t("table.rewardXp"),
      render: (value) => (
        <span className="font-semibold text-gray-900">{String(value)} XP</span>
      ),
    },
    {
      key: "badgeRewardSlug",
      label: t("table.badgeReward"),
      sortable: false,
      render: (value) => (
        <HeroJourneyBadgeThumb
          badge={badgeMap.get(String(value || ""))}
          showLabel
        />
      ),
    },
    { key: "studentsStarted", label: t("table.studentsStarted") },
    { key: "studentsCompleted", label: t("table.studentsCompleted") },
    {
      key: "completionRate",
      label: t("table.completionRate"),
      sortable: false,
      render: (_value, row) => (
        <span className="font-medium text-gray-700">
          {formatHeroJourneyPercent(getMissionCompletionRate(row))}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_value, row) => (
        <div
          className="flex items-center justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu
            width="w-52"
            trigger={
              <button
                type="button"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-primary/30 hover:bg-gray-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                title={t("actions.more")}
                aria-label={t("actions.more")}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            items={[
              {
                value: "view",
                label: t("actions.view"),
                icon: <Eye className="h-4 w-4" />,
                onClick: () => openMissionDetail(row.id),
              },
              ...(canManageHero
                ? [
                    ...(isHeroMissionEditable(row.status)
                      ? [
                          {
                            value: "edit",
                            label: t("actions.edit"),
                            icon: <PencilLine className="h-4 w-4" />,
                            onClick: () => void openEditMission(row.id),
                          },
                        ]
                      : []),
                    {
                      value: "publish",
                      label: t("actions.publish"),
                      icon: <Power className="h-4 w-4" />,
                      disabled:
                        row.status === "published" ||
                        row.status === "archived" ||
                        isPublishing === row.id,
                      onClick: () => void publishMission(row.id),
                    },
                    {
                      value: "archive",
                      label: t("actions.archive"),
                      icon: <Archive className="h-4 w-4" />,
                      disabled:
                        isPublishing === row.id || row.status === "archived",
                      onClick: () => void archiveMission(row.id),
                    },
                    {
                      value: "delete",
                      label: t("actions.delete"),
                      icon: <Trash2 className="h-4 w-4" />,
                      disabled: deletingMissionId === row.id,
                      onClick: () => void removeMission(row.id),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-gray-50">
      <HeroJourneyPageHeader
        title={t("missions")}
        description={t("missionsDescription")}
        bannerImageSrc={heroJourneySectionBanners.missions}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void refreshMissionList()}
              loading={isLoading}
            >
              {t("overviewState.refresh")}
            </Button>
            {canViewBadges ? (
              <Button
                variant="secondary"
                leftIcon={<Award className="h-4 w-4" />}
                onClick={() => setIsBadgeManagerOpen(true)}
              >
                {t("actions.manageBadges")}
              </Button>
            ) : null}
            {canManageHero ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openCreateMission}
              >
                {t("actions.createMission")}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <KPICardV2
            key={card.key}
            title={card.title}
            value={card.value}
            valueSuffix={card.valueSuffix}
            icon={card.icon}
            iconColor={card.iconColor}
            iconBgColor={card.iconBgColor}
            showChart={false}
            className="bg-white"
          />
        ))}
      </div>

      <FilterPanel
        title={t("filters.title")}
        subtitle={t("filters.missionsSubtitle")}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        searchSlot={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={queryState.values.q}
              onChange={(event) =>
                queryState.setValues({
                  q: event.target.value,
                  heroJourneyMissionsMobilePage: "1",
                })
              }
              className="pl-10"
              placeholder={t("filters.searchMissionsPlaceholder")}
            />
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              value={queryState.values.status}
              options={[
                { value: "all", label: t("filters.allStatuses") },
                { value: "draft", label: t("status.draft") },
                { value: "published", label: t("status.published") },
                { value: "archived", label: t("status.archived") },
              ]}
              onChange={(value) =>
                queryState.setValues({
                  status: value,
                  heroJourneyMissionsMobilePage: "1",
                })
              }
            />
            <Select
              value={queryState.values.includeArchived}
              options={[
                { value: "all", label: t("filters.archivedDefault") },
                { value: "true", label: t("filters.includeArchived") },
                { value: "false", label: t("filters.excludeArchived") },
              ]}
              onChange={(value) =>
                queryState.setValues({
                  includeArchived: value,
                  heroJourneyMissionsMobilePage: "1",
                })
              }
            />
          </div>
        }
      />

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {loadError}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="h-16 animate-pulse rounded-xl bg-slate-50" />
                        <div className="h-16 animate-pulse rounded-xl bg-slate-50" />
                      </div>
                    </div>
                  ))
                : mobileVisibleMissions.map((mission) => (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => openMissionDetail(mission.id)}
                      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-gray-900">
                            {locale === "ar"
                              ? mission.titleAr
                              : mission.titleEn}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {getResolvedStageName(mission)}
                          </p>
                        </div>
                        <HeroJourneyStatusPill
                          kind="mission"
                          value={mission.status}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">
                            {t("table.rewardXp")}
                          </p>
                          <p className="mt-1 font-semibold text-gray-900">
                            {mission.rewardXp} XP
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">
                            {t("table.completionRate")}
                          </p>
                          <p className="mt-1 font-semibold text-gray-900">
                            {formatHeroJourneyPercent(
                              getMissionCompletionRate(mission),
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-gray-600">
                          {getResolvedStageName(mission)}
                        </p>
                        <HeroJourneyBadgeThumb
                          badge={badgeMap.get(mission.badgeRewardSlug || "")}
                          showLabel
                        />
                      </div>
                    </button>
                  ))}
            </div>

            {!isLoading ? (
              <HeroJourneyMobilePagination
                currentPage={safeMobilePage}
                totalItems={missions.length}
                pageSize={mobilePageSize}
                onPageChange={(page) =>
                  queryState.setValue(
                    "heroJourneyMissionsMobilePage",
                    String(page),
                    "replace",
                  )
                }
              />
            ) : null}

            <div className="hidden md:block">
              <DataTable
                columns={
                  columns as unknown as Column<{ [key: string]: unknown }>[]
                }
                data={missions as unknown as Array<{ [key: string]: unknown }>}
                getRowKey={(row) => String(row.id)}
                onRowClick={(row) =>
                  openMissionDetail((row as unknown as HeroJourneyMission).id)
                }
                searchQuery={queryState.values.q}
                itemsPerPage={8}
                showPagination={true}
                isLoading={isLoading}
                skeletonRows={missionTablePageSize}
                serverPagination={{
                  enabled: true,
                  currentPage: missionTablePage,
                  pageSize: missionTablePageSize,
                  totalItems: missions.length,
                  onPageChange: setMissionTablePage,
                  onPageSizeChange: (pageSize) => {
                    setMissionTablePage(1);
                    setMissionTablePageSize(Math.min(pageSize, 100));
                  },
                }}
                urlState={{
                  keyPrefix: "heroJourneyMissionsTable",
                  syncSorting: true,
                }}
              />
            </div>
          </div>

          <div className="hidden rounded-xl bg-white p-5 shadow-sm xl:block">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                </div>
                <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
                <HeroJourneyMissionDetailContent
                  mission={detailMission}
                  badgeMap={badgeMap}
                  actions={
                    detailMission && canManageHero ? (
                      <HeroJourneyMissionActions
                        mission={detailMission}
                        canManage={canManageHero}
                        isPublishing={isPublishing === detailMission.id}
                        deletingMissionId={deletingMissionId}
                        onEdit={(missionId) => void openEditMission(missionId)}
                        onDelete={(missionId) => void removeMission(missionId)}
                        onPublish={(missionId) => void publishMission(missionId)}
                        onArchive={(missionId) => void archiveMission(missionId)}
                        iconOnly
                      />
                    ) : undefined
                  }
                  linkedLessonName={getResolvedLinkedLessonName(detailMission)}
                  linkedAssessmentName={getResolvedLinkedAssessmentName(
                    detailMission,
                  )}
                />
              </>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={isOverlayMode && isMissionModalOpen && Boolean(selectedMission)}
        onClose={() => setIsMissionModalOpen(false)}
        size="full"
        title={
          selectedMission
            ? locale === "ar"
              ? selectedMission.titleAr
              : selectedMission.titleEn
            : ""
        }
        description={
          selectedMission ? getResolvedStageName(selectedMission) : undefined
        }
        footer={
          selectedMission && canManageHero ? (
            <>
              {isHeroMissionEditable(selectedMission.status) ? (
                <Button
                  variant="secondary"
                  onClick={() => void openEditMission(selectedMission.id)}
                >
                  {t("actions.edit")}
                </Button>
              ) : null}
              <Button
                variant="danger"
                onClick={() =>
                  selectedMission && void removeMission(selectedMission.id)
                }
                disabled={deletingMissionId === selectedMission.id}
              >
                {t("actions.delete")}
              </Button>
              <Button
                onClick={() =>
                  selectedMission && void publishMission(selectedMission.id)
                }
                disabled={
                  isPublishing === selectedMission.id ||
                  selectedMission.status === "published" ||
                  selectedMission.status === "archived"
                }
              >
                {t("actions.publish")}
              </Button>
              <Button
                onClick={() =>
                  selectedMission && void archiveMission(selectedMission.id)
                }
                disabled={
                  isPublishing === selectedMission.id ||
                  selectedMission.status !== "published"
                }
              >
                {t("actions.archive")}
              </Button>
            </>
          ) : undefined
        }
      >
        <HeroJourneyMissionDetailContent
          mission={selectedMission}
          badgeMap={badgeMap}
          linkedLessonName={getResolvedLinkedLessonName(selectedMission)}
          linkedAssessmentName={getResolvedLinkedAssessmentName(
            selectedMission,
          )}
        />
      </Modal>

      {isMissionFormOpen ? (
        <HeroJourneyMissionFormModal
          isOpen={isMissionFormOpen}
          mission={editingMission}
          badges={badges}
          academicYearLabel={localizedOptionLabel(
            locale,
            selectedAcademicYear?.nameEn,
            selectedAcademicYear?.nameAr,
            selectedAcademicYear?.name || academicYearId,
          )}
          termLabel={localizedOptionLabel(
            locale,
            selectedTerm?.nameEn,
            selectedTerm?.nameAr,
            selectedTerm?.name || termId,
          )}
          stageOptions={stageOptions}
          gradeOptions={gradeOptions}
          subjectOptions={subjectOptions}
          assessmentOptions={assessmentOptions}
          optionsLoading={isMissionOptionsLoading}
          optionsError={missionOptionsError}
          onLoadLessons={loadCurriculumLessonOptions}
          onRefreshOptions={refreshMissionFormOptions}
          loading={isMissionSaving}
          onClose={() => {
            setIsMissionFormOpen(false);
            setEditingMission(null);
          }}
          onSubmit={saveMission}
        />
      ) : null}

      <Modal
        isOpen={isBadgeManagerOpen}
        onClose={() => setIsBadgeManagerOpen(false)}
        title={t("badgeManager.title")}
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsBadgeManagerOpen(false)}
            >
              {t("actions.close")}
            </Button>
            {canManageBadges ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openCreateBadge}
              >
                {t("actions.createBadge")}
              </Button>
            ) : null}
          </>
        }
      >
        <div className="space-y-3">
          {badges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t("badgeManager.emptyTitle")}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("badgeManager.emptyDescription")}
                  </p>
                </div>
                {canManageBadges ? (
                  <Button
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={openCreateBadge}
                  >
                    {t("actions.createBadge")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <HeroJourneyBadgeThumb badge={badge} showLabel />
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {badge.slug}
                  </p>
                </div>
                {canManageBadges ? (
                  <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void openEditBadge(badge.id)}
                    className="cursor-pointer rounded p-1.5 text-primary-600 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    title={t("actions.editBadge")}
                    aria-label={t("actions.editBadge")}
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeBadge(badge.id)}
                    disabled={deletingBadgeId === badge.id}
                    className="cursor-pointer rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    title={t("actions.deleteBadge")}
                    aria-label={t("actions.deleteBadge")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Modal>

      {isBadgeFormOpen ? (
        <HeroJourneyBadgeFormModal
          isOpen={isBadgeFormOpen}
          badge={editingBadge}
          loading={isBadgeSaving}
          onClose={() => {
            setIsBadgeFormOpen(false);
            setEditingBadge(null);
          }}
          onSubmit={saveBadge}
        />
      ) : null}
    </div>
  );
}

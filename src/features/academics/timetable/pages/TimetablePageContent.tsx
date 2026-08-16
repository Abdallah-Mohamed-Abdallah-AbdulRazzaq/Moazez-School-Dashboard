"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, Tab } from "@mui/material";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import TimetableView from "../components/TimetableView";
import RoomsView from "../../rooms/components/RoomsView";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { DEFAULT_SCHOOL_ID } from "@/features/academics/constants/school";
import { usePermissions } from "@/hooks/usePermissions";

export default function TimetablePageContent() {
  const t = useTranslations("academics.timetable");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("timetable");
  const { academicYearId, termId, termStatus, isInitializing } =
    useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const canManageStructure = hasPermission("academics.structure.manage");

  const queryState = useMemo(
    () => ({
      activeTab: searchParams.get("tab") === "rooms" ? "rooms" : "timetable",
      stageId: searchParams.get("stage") || "",
      gradeId: searchParams.get("grade") || "",
      sectionId: searchParams.get("section") || "",
      classroomId: searchParams.get("classroom") || "",
    }),
    [searchParams],
  );

  const isTermClosed = termStatus === "closed";
  const isReadOnly = isTermClosed || !canManageStructure;
  const schoolId = DEFAULT_SCHOOL_ID;

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        activeTab: "timetable" | "rooms";
        stageId: string;
        gradeId: string;
        sectionId: string;
        classroomId: string;
      }>,
      historyMode: "push" | "replace" = "push",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const mergedState = {
        activeTab: nextState.activeTab ?? queryState.activeTab,
        stageId: nextState.stageId ?? queryState.stageId,
        gradeId: nextState.gradeId ?? queryState.gradeId,
        sectionId: nextState.sectionId ?? queryState.sectionId,
        classroomId: nextState.classroomId ?? queryState.classroomId,
      };

      if (mergedState.activeTab === "rooms") {
        params.set("tab", "rooms");
      } else {
        params.delete("tab");
      }

      const entries: Array<[string, string]> = [
        ["stage", mergedState.stageId],
        ["grade", mergedState.gradeId],
        ["section", mergedState.sectionId],
        ["classroom", mergedState.classroomId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [
      queryState.activeTab,
      queryState.classroomId,
      queryState.gradeId,
      queryState.sectionId,
      queryState.stageId,
      router,
      searchParams,
    ],
  );

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: "timetable" | "rooms",
  ) => {
    if (isDirty) {
      const confirmed = window.confirm(t("unsavedChanges.message"));
      if (!confirmed) return;
      clearDirty();
    }
    syncQueryParams({ activeTab: newValue }, "push");
  };

  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      if (dirty) markDirty();
      else clearDirty();
    },
    [markDirty, clearDirty],
  );

  const handleStageChange = useCallback(
    (stageId: string) => {
      syncQueryParams(
        {
          stageId,
          gradeId: "",
          sectionId: "",
          classroomId: "",
        },
        "push",
      );
    },
    [syncQueryParams],
  );

  const handleGradeChange = useCallback(
    (gradeId: string) => {
      syncQueryParams(
        {
          stageId: queryState.stageId,
          gradeId,
          sectionId: "",
          classroomId: "",
        },
        "push",
      );
    },
    [queryState.stageId, syncQueryParams],
  );

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      syncQueryParams(
        {
          stageId: queryState.stageId,
          gradeId: queryState.gradeId,
          sectionId,
          classroomId: "",
        },
        "push",
      );
    },
    [queryState.gradeId, queryState.stageId, syncQueryParams],
  );

  const handleClassroomChange = useCallback(
    (classroomId: string) => {
      syncQueryParams(
        {
          stageId: queryState.stageId,
          gradeId: queryState.gradeId,
          sectionId: queryState.sectionId,
          classroomId,
        },
        "push",
      );
    },
    [
      queryState.gradeId,
      queryState.sectionId,
      queryState.stageId,
      syncQueryParams,
    ],
  );

  const handleNormalizeSelection = useCallback(
    (selection: {
      stageId: string;
      gradeId: string;
      sectionId: string;
      classroomId: string;
    }) => {
      syncQueryParams(selection, "replace");
    },
    [syncQueryParams],
  );

  if (isInitializing) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  if (!academicYearId || !termId) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="text-gray-500">{t("emptyState.noAcademicContext")}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      {/* Read-only Banner */}
      {isTermClosed && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <p className="text-sm text-yellow-800">{t("readOnlyBanner")}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <Tabs
          value={queryState.activeTab}
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              minHeight: "48px",
            },
          }}
        >
          <Tab label={t("tabs.timetable")} value="timetable" />
          <Tab label={t("tabs.rooms")} value="rooms" />
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {queryState.activeTab === "timetable" && (
          <TimetableView
            schoolId={schoolId}
            academicYearId={academicYearId}
            termId={termId}
            termStatus={termStatus}
            isReadOnly={isReadOnly}
            onDirtyChange={handleDirtyChange}
            selectedStageId={queryState.stageId}
            selectedGradeId={queryState.gradeId}
            selectedSectionId={queryState.sectionId}
            selectedClassroomId={queryState.classroomId}
            onStageChange={handleStageChange}
            onGradeChange={handleGradeChange}
            onSectionChange={handleSectionChange}
            onClassroomChange={handleClassroomChange}
            onNormalizeSelection={handleNormalizeSelection}
          />
        )}
        {queryState.activeTab === "rooms" && (
          <RoomsView
            schoolId={schoolId}
            academicYearId={academicYearId}
            termId={termId}
            isReadOnly={isTermClosed}
          />
        )}
      </div>
    </div>
  );
}

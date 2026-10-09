"use client";

import { useEffect, useState } from "react";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../services/academicContentSelectors";

interface UseAcademicContentBrowseOptionsInput {
  includeTeachers?: boolean;
}

export interface AcademicContentBrowseOptionsState {
  targetOptions: AcademicTargetOptions | null;
  teachers: TeacherDirectoryListItem[];
  isLoadingTargets: boolean;
  isLoadingTeachers: boolean;
  targetOptionsUnavailable: boolean;
  teachersUnavailable: boolean;
}

export function useAcademicContentBrowseOptions({
  includeTeachers = true,
}: UseAcademicContentBrowseOptionsInput = {}): AcademicContentBrowseOptionsState {
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const [targetOptions, setTargetOptions] =
    useState<AcademicTargetOptions | null>(null);
  const [teachers, setTeachers] = useState<TeacherDirectoryListItem[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(
    Boolean(academicYearId && termId),
  );
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(includeTeachers);
  const [targetOptionsUnavailable, setTargetOptionsUnavailable] =
    useState(false);
  const [teachersUnavailable, setTeachersUnavailable] = useState(false);

  useEffect(() => {
    let isCurrentRequest = true;

    if (!academicYearId || !termId) {
      queueMicrotask(() => {
        if (!isCurrentRequest) return;
        setTargetOptions(null);
        setIsLoadingTargets(false);
        setTargetOptionsUnavailable(false);
      });
      return () => {
        isCurrentRequest = false;
      };
    }

    queueMicrotask(() => {
      if (!isCurrentRequest) return;
      setTargetOptions(null);
      setIsLoadingTargets(true);
      setTargetOptionsUnavailable(false);
    });

    void loadAcademicTargetOptions({ academicYearId, termId })
      .then((options) => {
        if (isCurrentRequest) setTargetOptions(options);
      })
      .catch(() => {
        if (isCurrentRequest) setTargetOptionsUnavailable(true);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingTargets(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [academicYearId, termId]);

  useEffect(() => {
    let isCurrentRequest = true;

    if (!includeTeachers) {
      queueMicrotask(() => {
        if (!isCurrentRequest) return;
        setTeachers([]);
        setIsLoadingTeachers(false);
        setTeachersUnavailable(false);
      });
      return () => {
        isCurrentRequest = false;
      };
    }

    queueMicrotask(() => {
      if (!isCurrentRequest) return;
      setTeachers([]);
      setIsLoadingTeachers(true);
      setTeachersUnavailable(false);
    });

    void teacherApi
      .list({ page: 1, limit: 100 })
      .then((response) => {
        if (isCurrentRequest) setTeachers(response.items);
      })
      .catch(() => {
        if (isCurrentRequest) setTeachersUnavailable(true);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingTeachers(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [includeTeachers]);

  return {
    targetOptions,
    teachers,
    isLoadingTargets,
    isLoadingTeachers,
    targetOptionsUnavailable,
    teachersUnavailable,
  };
}

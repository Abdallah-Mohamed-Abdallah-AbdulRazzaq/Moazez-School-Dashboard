"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { TeacherDirectoryDetail } from "@/features/teachers/types/index";

export function useTeacherDetail(teacherId: string | undefined, enabled = true) {
  const [teacher, setTeacher] = useState<TeacherDirectoryDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(Boolean(teacherId && enabled));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestSequence = useRef(0);
  const teacherRef = useRef<TeacherDirectoryDetail | null>(null);

  const refresh = useCallback(async () => {
    if (!teacherId || !enabled) return;
    const sequence = ++requestSequence.current;
    const keepsCurrentTeacher = Boolean(teacherRef.current);
    setIsLoading(!keepsCurrentTeacher);
    setIsRefreshing(keepsCurrentTeacher);
    setError(null);

    try {
      const nextTeacher = await teacherApi.get(teacherId);
      if (sequence === requestSequence.current) {
        teacherRef.current = nextTeacher;
        setTeacher(nextTeacher);
      }
    } catch (requestError) {
      if (sequence === requestSequence.current) setError(requestError);
    } finally {
      if (sequence === requestSequence.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [enabled, teacherId]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  const replaceTeacher = useCallback((nextTeacher: TeacherDirectoryDetail) => {
    teacherRef.current = nextTeacher;
    setTeacher(nextTeacher);
  }, []);

  return { teacher, error, isLoading, isRefreshing, refresh, replaceTeacher };
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Assignment,
  AssignmentQuestion,
  AssignmentAttachment,
  createAssignment,
  fetchAssignmentById,
  fetchAssignmentQuestions,
  fetchAssignmentAttachments,
} from "@/features/academics/curriculum/services/curriculumService";

interface UseAssignmentDataProps {
  lessonId: string;
  assignmentId?: string;
}

interface UseAssignmentDataReturn {
  assignment: Assignment | null;
  questions: AssignmentQuestion[];
  attachments: AssignmentAttachment[];
  loading: boolean;
  creatingDraft: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createDraft: () => Promise<void>;
  setAssignment: (assignment: Assignment | null) => void;
  setQuestions: (questions: AssignmentQuestion[]) => void;
  setAttachments: React.Dispatch<React.SetStateAction<AssignmentAttachment[]>>;
}

export function useAssignmentData({
  lessonId,
  assignmentId,
}: UseAssignmentDataProps): UseAssignmentDataReturn {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const router = useRouter();
  const locale = useLocale();
  const hasCreatedDraft = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!assignmentId) {
        setAssignment(null);
        setQuestions([]);
        setAttachments([]);
        hasCreatedDraft.current = false;
        return;
      }

      const found = await fetchAssignmentById(lessonId, assignmentId);
      if (found) {
        setAssignment(found);

        const [loadedQuestions, loadedAttachments] = await Promise.all([
          fetchAssignmentQuestions(assignmentId),
          fetchAssignmentAttachments(assignmentId),
        ]);

        setQuestions(loadedQuestions);
        setAttachments(loadedAttachments);
        return;
      }

      setAssignment(null);
      setQuestions([]);
      setAttachments([]);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to load assignment:", err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, lessonId]);

  const createDraft = useCallback(async () => {
    if (assignmentId || creatingDraft || hasCreatedDraft.current) {
      return;
    }

    try {
      setCreatingDraft(true);
      setError(null);
      hasCreatedDraft.current = true;

      const draft = await createAssignment(lessonId, {
        titleAr: "\u0648\u0627\u062c\u0628 \u062c\u062f\u064a\u062f",
        titleEn: "New Assignment",
        isPublished: false,
      });

      setAssignment(draft);

      const params = new URLSearchParams(window.location.search);
      const query = params.toString();
      const nextUrl = `/${locale}/academics/curriculum/lessons/${lessonId}/assignments/${draft.id}${query ? `?${query}` : ""}`;
      router.replace(nextUrl);
    } catch (err) {
      hasCreatedDraft.current = false;
      setError(err as Error);
      console.error("Failed to create assignment draft:", err);
    } finally {
      setCreatingDraft(false);
    }
  }, [assignmentId, creatingDraft, lessonId, locale, router]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  return {
    assignment,
    questions,
    attachments,
    loading,
    creatingDraft,
    error,
    refetch: fetchData,
    createDraft,
    setAssignment,
    setQuestions,
    setAttachments,
  };
}

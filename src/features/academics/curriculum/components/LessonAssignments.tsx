"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, FileText, Calendar, Award } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { usePathname, useSearchParams } from "next/navigation";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import dayjs from "dayjs";
import {
  Assignment,
  fetchLessonAssignments,
} from "@/features/academics/curriculum/services/curriculumService";

interface LessonAssignmentsProps {
  lessonId: string;
  isReadOnly: boolean;
  gradeId?: string; // For scope-aware holiday checking
}

export default function LessonAssignments({
  lessonId,
  isReadOnly,
}: LessonAssignmentsProps) {
  const t = useTranslations("academics.curriculum.assignments");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guardedRouter = useGuardedRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    if (!lessonId) return;
    fetchLessonAssignments(lessonId)
      .then(setAssignments)
      .catch((error) => console.error("Failed to load assignments:", error));
  }, [lessonId]);

  const handleAddAssignment = () => {
    const params = new URLSearchParams(searchParams.toString());
    const curriculumId = pathname.match(
      /\/academics\/curriculum\/([^/]+)/,
    )?.[1];
    if (curriculumId && curriculumId !== "lessons") {
      params.set("curriculumId", curriculumId);
    }
    const url = `/${locale}/academics/curriculum/lessons/${lessonId}/assignments/new?${params.toString()}`;
    guardedRouter.push(url);
  };

  const handleEditAssignment = (assignmentId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const curriculumId = pathname.match(
      /\/academics\/curriculum\/([^/]+)/,
    )?.[1];
    if (curriculumId && curriculumId !== "lessons") {
      params.set("curriculumId", curriculumId);
    }
    const url = `/${locale}/academics/curriculum/lessons/${lessonId}/assignments/${assignmentId}?${params.toString()}`;
    guardedRouter.push(url);
  };

  const getDisplayTitle = (assignment: Assignment) => {
    return locale === "ar"
      ? assignment.titleAr || assignment.titleEn
      : assignment.titleEn || assignment.titleAr;
  };

  const getDisplayDescription = (assignment: Assignment) => {
    return locale === "ar"
      ? assignment.descriptionAr || assignment.descriptionEn
      : assignment.descriptionEn || assignment.descriptionAr;
  };

  // Show message if no lesson selected
  if (!lessonId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t("no_lesson_selected")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {!isReadOnly && (
          <Button
            onClick={handleAddAssignment}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("add_assignment")}
          </Button>
        )}
      </div>

      {isReadOnly && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          {t("readonly_message")}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t("no_assignments")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => {
            return (
              <div
                key={assignment.id}
                className="border border-border rounded-lg hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleEditAssignment(assignment.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {getDisplayTitle(assignment)}
                        </h4>
                        {assignment.isPublished && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            {t("published")}
                          </span>
                        )}
                      </div>

                      {getDisplayDescription(assignment) && (
                        <p className="text-sm text-gray-600 mb-2">
                          {getDisplayDescription(assignment)}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {assignment.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {dayjs(assignment.dueDate).format("MMM D, YYYY")}
                          </div>
                        )}
                        {assignment.maxScore !== undefined && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {assignment.maxScore} {t("max_score")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

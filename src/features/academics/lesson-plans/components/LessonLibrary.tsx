"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { Clock3, GripVertical, Plus, Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import {
  Lesson,
  Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan } from "@/features/academics/lesson-plans/services/lessonPlansService";

interface LessonLibraryProps {
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  searchQuery: string;
  selectedUnitId: string;
  onSearchQueryChange: (value: string) => void;
  onSelectedUnitIdChange: (value: string) => void;
  onDragStart: (lesson: Lesson) => void;
  onDragEnd: () => void;
  onSelectLesson?: (lesson: Lesson) => void;
  isReadOnly: boolean;
}

export default function LessonLibrary({
  lessons,
  units,
  plans,
  searchQuery,
  selectedUnitId,
  onSearchQueryChange,
  onSelectedUnitIdChange,
  onDragStart,
  onDragEnd,
  onSelectLesson,
  isReadOnly,
}: LessonLibraryProps) {
  const t = useTranslations("academics.lessonPlans.library");
  // Get planned lesson IDs - recalculate whenever plans change
  const plannedLessonIds = useMemo(() => {
    const ids = new Set<string>();
    plans.forEach((plan) => {
      plan.items.forEach((item) => {
        ids.add(item.lessonId);
      });
    });
    return ids;
  }, [plans]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // Filter by unit
      if (selectedUnitId && lesson.unitId !== selectedUnitId) {
        return false;
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = lesson.title?.toLowerCase() || "";
        return title.includes(query);
      }

      return true;
    });
  }, [lessons, selectedUnitId, searchQuery]);

  const lessonsByUnit = useMemo(() => {
    const grouped = new Map<string, Lesson[]>();
    filteredLessons.forEach((lesson) => {
      const key = lesson.unitId || "unassigned";
      grouped.set(key, [...(grouped.get(key) ?? []), lesson]);
    });
    return grouped;
  }, [filteredLessons]);

  const getUnitTitle = (unitId: string) => {
    if (unitId === "unassigned") return t("unassignedUnit");
    return units.find((unit) => unit.id === unitId)?.title ?? t("unassignedUnit");
  };

  return (
    <div className="flex max-h-[calc(100vh-9rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("title")}
        </h3>

        {/* Search */}
        <div className="mb-3">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            inputSize="sm"
          />
        </div>

        {/* Unit Filter */}
        <Select
          label={t("filterByUnit")}
          value={selectedUnitId}
          onChange={onSelectedUnitIdChange}
          options={[
            { value: "", label: t("allUnits") },
            ...units.map((unit) => ({
              value: unit.id,
              label: unit.title,
            })),
          ]}
          selectSize="sm"
        />
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-gray-700">
              {lessons.length === 0 ? t("noLessons") : t("noFilteredLessons")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {lessons.length === 0 ? t("curriculumGuidance") : t("adjustFilters")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...lessonsByUnit.entries()].map(([unitId, unitLessons]) => (
              <section key={unitId} className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {getUnitTitle(unitId)}
                </h4>
                {unitLessons.map((lesson) => {
                  const isPlanned = plannedLessonIds.has(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      draggable={!isReadOnly && !isPlanned}
                      onDragStart={() => onDragStart(lesson)}
                      onDragEnd={onDragEnd}
                      className={`
                  p-3 rounded-lg border transition-all
                  ${
                    isPlanned
                      ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                      : isReadOnly
                        ? "bg-white border-gray-200 cursor-default"
                        : "bg-white border-gray-200 hover:border-primary hover:shadow-sm cursor-grab active:cursor-grabbing"
                  }
                `}
                    >
                      <div className="flex items-start gap-2">
                        {!isReadOnly && !isPlanned && (
                          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {lesson.title}
                          </p>
                          {lesson.estimatedMinutes != null && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                              <Clock3 className="h-3 w-3" aria-hidden="true" />
                              {t("estimatedMinutes", {
                                count: lesson.estimatedMinutes,
                              })}
                            </p>
                          )}
                          {isPlanned && (
                            <span className="mt-2 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                              {t("planned")}
                            </span>
                          )}
                        </div>
                        {!isReadOnly && !isPlanned && onSelectLesson && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            leftIcon={<Plus className="h-3 w-3" />}
                            onClick={() => onSelectLesson(lesson)}
                          >
                            {t("add")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!isReadOnly && filteredLessons.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">{t("dragToAdd")}</p>
        </div>
      )}
    </div>
  );
}

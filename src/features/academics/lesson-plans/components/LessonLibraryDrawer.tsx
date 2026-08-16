"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import { X, Search } from "lucide-react";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import {
  Lesson,
  Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlan } from "@/features/academics/lesson-plans/services/lessonPlansService";

interface LessonLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  units: Unit[];
  plans: LessonPlan[];
  searchQuery: string;
  selectedUnitId: string;
  onSearchQueryChange: (value: string) => void;
  onSelectedUnitIdChange: (value: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  isReadOnly: boolean;
}

export default function LessonLibraryDrawer({
  isOpen,
  onClose,
  lessons,
  units,
  plans,
  searchQuery,
  selectedUnitId,
  onSearchQueryChange,
  onSelectedUnitIdChange,
  onSelectLesson,
  isReadOnly,
}: LessonLibraryDrawerProps) {
  const t = useTranslations("academics.lessonPlans.library");
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Get planned lesson IDs
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

  const handleLessonClick = (lesson: Lesson) => {
    if (isReadOnly || plannedLessonIds.has(lesson.id)) return;
    onSelectLesson(lesson);
  };

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: "85%", maxWidth: 400 },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 space-y-3 border-b border-gray-200">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            inputSize="sm"
          />

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
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">{t("noLessons")}</p>
            </div>
          ) : (
            filteredLessons.map((lesson) => {
              const isPlanned = plannedLessonIds.has(lesson.id);
              const unit = units.find((u) => u.id === lesson.unitId);

              return (
                <button
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson)}
                  disabled={isPlanned || isReadOnly}
                  className={`
                    w-full p-3 rounded-lg border text-left transition-all
                    ${
                      isPlanned
                        ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                        : isReadOnly
                          ? "bg-white border-gray-200 cursor-default"
                          : "bg-white border-gray-200 hover:border-primary hover:shadow-sm active:scale-[0.98]"
                    }
                  `}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lesson.title}
                  </p>
                  {unit && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {unit.title}
                    </p>
                  )}
                  {isPlanned && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                      {t("planned")}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        {!isReadOnly && filteredLessons.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">{t("tapToAdd")}</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

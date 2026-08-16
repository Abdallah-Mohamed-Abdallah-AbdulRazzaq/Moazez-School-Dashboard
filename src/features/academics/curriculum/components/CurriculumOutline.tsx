"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, ChevronRight, ChevronDown } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { Curriculum, Unit, Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { normalizeSearchText, getHighlightedParts } from "@/utils/text/normalizeSearch";

// Helper component to render highlighted text
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts = getHighlightedParts(text, query);

  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-medium rounded px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

interface CurriculumOutlineProps {
  curriculum: Curriculum;
  units: Unit[];
  lessons: Lesson[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedNode: { type: "unit" | "lesson"; id: string } | null;
  onSelectNode: (node: { type: "unit" | "lesson"; id: string } | null) => void;
  onRefresh: () => Promise<void>;
  isReadOnly: boolean;
}

export default function CurriculumOutline({
  units,
  lessons,
  searchQuery,
  onSearchQueryChange,
  selectedNode,
  onSelectNode,
  isReadOnly,
}: CurriculumOutlineProps) {
  const t = useTranslations("academics.curriculum.outline");
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    new Set(units.map((u) => u.id))
  );

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const getLessonsForUnit = (unitId: string) => {
    return lessons.filter((l) => l.unitId === unitId);
  };

  // Filter units and lessons based on search query
  const filteredUnits = units.filter((unit) => {
    if (!searchQuery.trim()) return true;
    
    const normalizedQuery = normalizeSearchText(searchQuery);
    const unitSearchText = normalizeSearchText(unit.title);
    
    // Check if unit matches
    if (unitSearchText.includes(normalizedQuery)) {
      return true;
    }
    
    // Check if any lesson in this unit matches
    const unitLessons = getLessonsForUnit(unit.id);
    return unitLessons.some((lesson) => {
      const lessonSearchText = normalizeSearchText(lesson.title);
      return lessonSearchText.includes(normalizedQuery);
    });
  });

  const getFilteredLessonsForUnit = (unitId: string) => {
    const unitLessons = getLessonsForUnit(unitId);
    if (!searchQuery.trim()) return unitLessons;
    
    const normalizedQuery = normalizeSearchText(searchQuery);
    return unitLessons.filter((lesson) => {
      const lessonSearchText = normalizeSearchText(lesson.title);
      return lessonSearchText.includes(normalizedQuery);
    });
  };

  // Auto-expand units when searching
  const shouldExpandUnit = (unitId: string) => {
    if (!searchQuery.trim()) {
      return expandedUnits.has(unitId);
    }
    // Expand all units when searching to show results
    return true;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b  border-border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("title")}</h2>
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("search_placeholder")}
          leftIcon={<Search className="w-4 h-4" />}
          inputSize="md"
        />
      </div>

      <div className="p-4 border-b">
        <Button
          type="button"
          onClick={() => onSelectNode({ type: "unit", id: "new" })}
          variant="primary"
          fullWidth
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={isReadOnly}
        >
          {t("add_unit")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredUnits.length === 0 && searchQuery.trim() && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("no_results")}</p>
          </div>
        )}
        
        {filteredUnits.map((unit) => {
          const isExpanded = shouldExpandUnit(unit.id);
          const unitLessons = getFilteredLessonsForUnit(unit.id);
          const isSelected = selectedNode?.type === "unit" && selectedNode.id === unit.id;
          const unitTitle = unit.title;

          return (
            <div key={unit.id} className="space-y-1">
              <div
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 border border-primary"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onSelectNode({ type: "unit", id: unit.id })}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUnit(unit.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 font-medium">
                  <HighlightedText text={unitTitle} query={searchQuery} />
                </div>
                <span className="text-xs text-gray-500">
                  {t("lessons_count", { count: unitLessons.length })}
                </span>
              </div>

              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {unitLessons.map((lesson) => {
                    const isLessonSelected =
                      selectedNode?.type === "lesson" && selectedNode.id === lesson.id;
                    const lessonTitle = lesson.title;

                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isLessonSelected
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => onSelectNode({ type: "lesson", id: lesson.id })}
                      >
                        <div className="flex-1 text-sm text-gray-700">
                          <HighlightedText text={lessonTitle} query={searchQuery} />
                        </div>
                      </div>
                    );
                  })}
                  {!searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => onSelectNode({ type: "lesson", id: `new-${unit.id}` })}
                      className="w-full text-left p-2 text-sm text-primary hover:bg-primary/5 rounded-lg disabled:opacity-50"
                      disabled={isReadOnly}
                    >
                      + {t("add_lesson")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

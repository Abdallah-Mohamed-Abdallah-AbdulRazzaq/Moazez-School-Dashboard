"use client";

import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Stage, Grade, Section, Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import { getAttendanceScopePath } from "@/features/attendance/shared/attendanceScopePresentation";

interface ScopeBreadcrumbProps {
  scopeType: AttendanceScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms?: Classroom[];
}

/**
 * Displays the current scope as a breadcrumb trail.
 * Example: School > Primary > Grade 1 > Section A
 */
export default function ScopeBreadcrumb({
  scopeType,
  scopeIds,
  stages,
  grades,
  sections,
  classrooms = [],
}: ScopeBreadcrumbProps) {
  const locale = useLocale();

  const items = getAttendanceScopePath({
    scopeType,
    scopeIds,
    stages,
    grades,
    sections,
    classrooms,
    locale,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 rounded-lg text-sm"
      style={{
        backgroundColor: "var(--background-secondary)",
        color: "var(--text-secondary)",
      }}
    >
      {items.map((item, index) => (
        <div key={`${item.level}-${index}`} className="flex items-center gap-2">
          {index > 0 && (
            locale === "ar" ? (
              <ChevronLeft
                className="w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
              />
            ) : (
              <ChevronRight
                className="w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
              />
            )
          )}
          <span
            className={index === items.length - 1 ? "font-medium" : ""}
            style={{
              color:
                index === items.length - 1
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

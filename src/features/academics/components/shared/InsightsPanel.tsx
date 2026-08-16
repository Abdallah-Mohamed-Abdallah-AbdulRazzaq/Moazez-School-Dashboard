"use client";

import { useTranslations } from "next-intl";
import { Stage, Grade, Section, Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import { AlertCircle, Layers, BookOpen, Users, DoorOpen } from "lucide-react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface InsightsPanelProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isLoading?: boolean;
}

export default function InsightsPanel({ stages, grades, sections, classrooms, isLoading }: InsightsPanelProps) {
  const t = useTranslations("academics.structure.insights");

  const sectionsWithoutCapacity = sections.filter((section) => !section.capacity || section.capacity === 0).length;
  const classroomsWithoutCapacity = classrooms.filter((classroom) => !classroom.capacity || classroom.capacity === 0).length;
  const gradesWithoutSections = grades.filter((grade) => !sections.some((section) => section.gradeId === grade.id)).length;
  const sectionsWithoutClassrooms = sections.filter((section) => !classrooms.some((classroom) => classroom.sectionId === section.id)).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center p-6">
        <PartialLoader />
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg border border-border p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">{t("empty_state")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("total_stages")}</p>
            <p className="text-2xl font-bold text-gray-900">{stages.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("total_grades")}</p>
            <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("total_sections")}</p>
            <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <DoorOpen className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("total_classrooms")}</p>
            <p className="text-2xl font-bold text-gray-900">{classrooms.length}</p>
          </div>
        </div>
      </div>

      {sectionsWithoutCapacity > 0 && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-800">{t("sections_missing_capacity")}</p>
              <p className="text-2xl font-bold text-amber-900">{sectionsWithoutCapacity}</p>
            </div>
          </div>
        </div>
      )}

      {classroomsWithoutCapacity > 0 && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-800">{t("classrooms_missing_capacity")}</p>
              <p className="text-2xl font-bold text-amber-900">{classroomsWithoutCapacity}</p>
            </div>
          </div>
        </div>
      )}

      {gradesWithoutSections > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-800">{t("grades_without_sections")}</p>
              <p className="text-2xl font-bold text-red-900">{gradesWithoutSections}</p>
            </div>
          </div>
        </div>
      )}

      {sectionsWithoutClassrooms > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-800">{t("sections_without_classrooms")}</p>
              <p className="text-2xl font-bold text-red-900">{sectionsWithoutClassrooms}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

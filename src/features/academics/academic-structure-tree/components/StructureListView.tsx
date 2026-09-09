"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  Edit2,
  Info,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import type {
  Classroom,
  Grade,
  Section,
  Stage,
} from "../services/structureService";

type StructureNodeType = "stage" | "grade" | "section" | "classroom";

interface StructureNodeRef {
  type: StructureNodeType;
  id: string;
}

interface StructureListViewProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  selectedNode: StructureNodeRef | null;
  onSelectNode: (node: StructureNodeRef) => void;
  onClearSelection: () => void;
  onAddGrade: (stageId: string) => void;
  onAddSection: (gradeId: string) => void;
  onAddClassroom: (sectionId: string) => void;
  onEdit: (type: StructureNodeType, id: string) => void;
  onDelete: (type: StructureNodeType, id: string) => void;
  isReadOnly: boolean;
}

interface DrilldownRow {
  id: string;
  type: StructureNodeType;
  name: string;
  childCount?: number;
  addChild?: () => void;
  addChildLabel?: string;
  validationMessage?: string;
}

interface DrilldownLevel {
  type: StructureNodeType;
  title: string;
  hint: string;
  parentName: string;
  rows: DrilldownRow[];
  backNode: StructureNodeRef | null;
  addCurrent?: () => void;
  addCurrentLabel?: string;
  validationSummary?: string;
}

const localizedName = (
  node: { name: string; nameAr: string; nameEn: string },
  locale: string,
) =>
  locale === "ar"
    ? node.nameAr || node.nameEn || node.name
    : node.nameEn || node.nameAr || node.name;

const orderedByPosition = <Node extends { order: number }>(nodes: Node[]) =>
  nodes.slice().sort((first, second) => first.order - second.order);

export default function StructureListView({
  stages,
  grades,
  sections,
  classrooms,
  selectedNode,
  onSelectNode,
  onClearSelection,
  onAddGrade,
  onAddSection,
  onAddClassroom,
  onEdit,
  onDelete,
  isReadOnly,
}: StructureListViewProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();

  const drilldownLevel = useMemo<DrilldownLevel>(() => {
    const selectedClassroom =
      selectedNode?.type === "classroom"
        ? classrooms.find((classroom) => classroom.id === selectedNode.id)
        : undefined;
    const selectedSection =
      selectedNode?.type === "section"
        ? sections.find((section) => section.id === selectedNode.id)
        : sections.find(
            (section) => section.id === selectedClassroom?.sectionId,
          );
    const selectedGrade =
      selectedNode?.type === "grade"
        ? grades.find((grade) => grade.id === selectedNode.id)
        : grades.find((grade) => grade.id === selectedSection?.gradeId);
    const selectedStage =
      selectedNode?.type === "stage"
        ? stages.find((stage) => stage.id === selectedNode.id)
        : stages.find((stage) => stage.id === selectedGrade?.stageId);

    if (selectedSection) {
      return {
        type: "classroom",
        title: t("tree.views.levels.classrooms"),
        hint: t("tree.views.hints.classrooms"),
        parentName: localizedName(selectedSection, locale),
        rows: orderedByPosition(
          classrooms.filter(
            (classroom) => classroom.sectionId === selectedSection.id,
          ),
        ).map((classroom) => ({
          id: classroom.id,
          type: "classroom",
          name: localizedName(classroom, locale),
        })),
        backNode: selectedGrade
          ? { type: "grade", id: selectedGrade.id }
          : null,
        addCurrent: () => onAddClassroom(selectedSection.id),
        addCurrentLabel: t("tree.add_classroom"),
      };
    }

    if (selectedGrade) {
      const gradeSections = orderedByPosition(
        sections.filter((section) => section.gradeId === selectedGrade.id),
      );
      const classroomCountBySection = new Map(
        gradeSections.map((section) => [
          section.id,
          classrooms.filter(
            (classroom) => classroom.sectionId === section.id,
          ).length,
        ]),
      );
      const hasSectionsWithoutClassrooms = gradeSections.some(
        (section) => classroomCountBySection.get(section.id) === 0,
      );

      return {
        type: "section",
        title: t("tree.views.levels.sections"),
        hint: t("tree.views.hints.sections"),
        parentName: localizedName(selectedGrade, locale),
        rows: gradeSections.map((section) => ({
          id: section.id,
          type: "section",
          name: localizedName(section, locale),
          childCount: classroomCountBySection.get(section.id) || 0,
          addChild: () => onAddClassroom(section.id),
          addChildLabel: t("tree.add_classroom"),
          validationMessage:
            classroomCountBySection.get(section.id) === 0
              ? t("tree.views.validation.no_classrooms")
              : undefined,
        })),
        backNode: selectedStage
          ? { type: "stage", id: selectedStage.id }
          : null,
        addCurrent: () => onAddSection(selectedGrade.id),
        addCurrentLabel: t("tree.add_section"),
        validationSummary: hasSectionsWithoutClassrooms
          ? t("tree.views.validation.sections_without_classrooms")
          : undefined,
      };
    }

    if (selectedStage) {
      return {
        type: "grade",
        title: t("tree.views.levels.grades"),
        hint: t("tree.views.hints.grades"),
        parentName: localizedName(selectedStage, locale),
        rows: orderedByPosition(
          grades.filter((grade) => grade.stageId === selectedStage.id),
        ).map((grade) => ({
          id: grade.id,
          type: "grade",
          name: localizedName(grade, locale),
          childCount: sections.filter(
            (section) => section.gradeId === grade.id,
          ).length,
          addChild: () => onAddSection(grade.id),
          addChildLabel: t("tree.add_section"),
        })),
        backNode: null,
        addCurrent: () => onAddGrade(selectedStage.id),
        addCurrentLabel: t("tree.add_grade"),
      };
    }

    return {
      type: "stage",
      title: t("tree.views.levels.stages"),
      hint: t("tree.views.hints.stages"),
      parentName: "",
      rows: orderedByPosition(stages).map((stage) => ({
        id: stage.id,
        type: "stage",
        name: localizedName(stage, locale),
        childCount: grades.filter((grade) => grade.stageId === stage.id).length,
        addChild: () => onAddGrade(stage.id),
        addChildLabel: t("tree.add_grade"),
      })),
      backNode: null,
    };
  }, [
    classrooms,
    grades,
    locale,
    onAddClassroom,
    onAddGrade,
    onAddSection,
    sections,
    selectedNode,
    stages,
    t,
  ]);

  const returnToParent = () => {
    if (drilldownLevel.backNode) {
      onSelectNode(drilldownLevel.backNode);
      return;
    }
    onClearSelection();
  };

  return (
    <div className="p-2">
      <div className="mb-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center gap-2">
          {drilldownLevel.type !== "stage" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 px-2"
              onClick={returnToParent}
              aria-label={t("tree.views.back")}
              title={t("tree.views.back")}
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              <span className="sr-only">{t("tree.views.back")}</span>
            </Button>
          ) : null}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {drilldownLevel.title}
            </h3>
            {drilldownLevel.parentName ? (
              <p className="truncate text-xs text-gray-600">
                {drilldownLevel.parentName}
              </p>
            ) : null}
          </div>

          {!isReadOnly && drilldownLevel.addCurrent ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shrink-0 px-2"
              onClick={drilldownLevel.addCurrent}
              aria-label={drilldownLevel.addCurrentLabel}
              title={drilldownLevel.addCurrentLabel}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">
                {drilldownLevel.addCurrentLabel}
              </span>
            </Button>
          ) : null}
        </div>

        <p className="mt-2 flex items-start gap-1.5 border-t border-gray-200 pt-2 text-xs leading-5 text-gray-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span>{drilldownLevel.hint}</span>
        </p>

        {drilldownLevel.validationSummary ? (
          <div
            role="status"
            className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-800"
          >
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{drilldownLevel.validationSummary}</span>
          </div>
        ) : null}
      </div>

      {drilldownLevel.rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-600">
          {t("tree.views.empty_level")}
        </p>
      ) : (
        <div className="space-y-1">
          {drilldownLevel.rows.map((row) => {
            const isSelected =
              selectedNode?.type === row.type && selectedNode.id === row.id;

            return (
              <div
                key={row.id}
                className={`flex items-center gap-1 rounded-lg border px-1.5 py-2 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectNode({ type: row.type, id: row.id })}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">
                      {row.name}
                    </span>
                    {row.validationMessage ? (
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
                        <AlertTriangle
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{row.validationMessage}</span>
                      </span>
                    ) : null}
                  </span>
                  {row.childCount !== undefined ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {row.childCount}
                    </span>
                  ) : null}
                  {row.type !== "classroom" ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 rtl:rotate-180" />
                  ) : null}
                </button>

                {!isReadOnly && row.addChild ? (
                  <button
                    type="button"
                    onClick={row.addChild}
                    className="cursor-pointer rounded p-1 text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title={row.addChildLabel}
                    aria-label={row.addChildLabel}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                ) : null}

                {!isReadOnly ? (
                  <DropdownMenu
                    trigger={
                      <button
                        type="button"
                        className="cursor-pointer rounded p-1 text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={t("tree.actions")}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    }
                    items={[
                      {
                        label: t("tree.edit"),
                        value: "edit",
                        icon: <Edit2 className="h-4 w-4" />,
                        onClick: () => onEdit(row.type, row.id),
                      },
                      {
                        label: t("tree.delete"),
                        value: "delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => onDelete(row.type, row.id),
                      },
                    ]}
                    width="w-32"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

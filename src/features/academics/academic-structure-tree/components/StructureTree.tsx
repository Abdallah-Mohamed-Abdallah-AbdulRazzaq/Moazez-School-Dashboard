"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stage, Grade, Section, Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";

const normalizeSearchText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, " ");

const matchesSearch = (query: string, ...values: Array<string | undefined>) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return values.some((value) => normalizeSearchText(value || "").includes(normalizedQuery));
};

interface TreeNodeRef {
  type: "stage" | "grade" | "section" | "classroom";
  id: string;
}

interface StructureTreeProps {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  expandedStages: Set<string>;
  expandedGrades: Set<string>;
  expandedSections: Set<string>;
  onExpandedStagesChange: (value: Set<string>) => void;
  onExpandedGradesChange: (value: Set<string>) => void;
  onExpandedSectionsChange: (value: Set<string>) => void;
  selectedNode: TreeNodeRef | null;
  onSelectNode: (node: TreeNodeRef) => void;
  onAddStage: () => void;
  onAddGrade: (stageId: string) => void;
  onAddSection: (gradeId: string) => void;
  onAddClassroom: (sectionId: string) => void;
  onEdit: (type: TreeNodeRef["type"], id: string) => void;
  onDelete: (type: TreeNodeRef["type"], id: string) => void;
  onReorderStage: (stageId: string, direction: "up" | "down") => void;
  onReorderGrade: (gradeId: string, direction: "up" | "down") => void;
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
  onReorderClassroom: (classroomId: string, direction: "up" | "down") => void;
  onDragReorder: (oldIndex: number, newIndex: number) => Promise<void>;
  onDragReorderGrade: (stageId: string, oldIndex: number, newIndex: number) => Promise<void>;
  onDragReorderSection: (gradeId: string, oldIndex: number, newIndex: number) => Promise<void>;
  onDragReorderClassroom: (sectionId: string, oldIndex: number, newIndex: number) => Promise<void>;
  isReadOnly?: boolean;
}

interface SortableStageItemProps {
  stage: Stage;
  index: number;
  totalStages: number;
  isSelected: boolean;
  isExpanded: boolean;
  stageGrades: Grade[];
  expandedGrades: Set<string>;
  expandedSections: Set<string>;
  sections: Section[];
  classrooms: Classroom[];
  selectedNode: TreeNodeRef | null;
  activeGradeId: string | null;
  onSelectNode: (node: TreeNodeRef) => void;
  onToggleStage: (stageId: string) => void;
  onToggleGrade: (gradeId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onAddGrade: (stageId: string) => void;
  onAddSection: (gradeId: string) => void;
  onAddClassroom: (sectionId: string) => void;
  onEdit: (type: TreeNodeRef["type"], id: string) => void;
  onDelete: (type: TreeNodeRef["type"], id: string) => void;
  onReorderStage: (stageId: string, direction: "up" | "down") => void;
  onReorderGrade: (gradeId: string, direction: "up" | "down") => void;
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
  onReorderClassroom: (classroomId: string, direction: "up" | "down") => void;
  onDragReorderGrade: (stageId: string, oldIndex: number, newIndex: number) => Promise<void>;
  onDragReorderSection: (gradeId: string, oldIndex: number, newIndex: number) => Promise<void>;
  onDragReorderClassroom: (sectionId: string, oldIndex: number, newIndex: number) => Promise<void>;
}

interface SortableGradeItemProps {
  grade: Grade;
  index: number;
  totalGrades: number;
  isSelected: boolean;
  isExpanded: boolean;
  expandedSections: Set<string>;
  sections: Section[];
  classrooms: Classroom[];
  selectedNode: TreeNodeRef | null;
  onSelectNode: (node: TreeNodeRef) => void;
  onToggleGrade: (gradeId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onReorderGrade: (gradeId: string, direction: "up" | "down") => void;
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
  onAddSection: (gradeId: string) => void;
  onAddClassroom: (sectionId: string) => void;
  onEdit: (type: TreeNodeRef["type"], id: string) => void;
  onDelete: (type: TreeNodeRef["type"], id: string) => void;
  onReorderClassroom: (classroomId: string, direction: "up" | "down") => void;
  onDragReorderSection: (gradeId: string, oldIndex: number, newIndex: number) => Promise<void>;
  onDragReorderClassroom: (sectionId: string, oldIndex: number, newIndex: number) => Promise<void>;
  isDragging: boolean;
}

interface SortableSectionItemProps {
  section: Section;
  index: number;
  totalSections: number;
  isSelected: boolean;
  isExpanded: boolean;
  classrooms: Classroom[];
  selectedNode: TreeNodeRef | null;
  onSelectNode: (node: TreeNodeRef) => void;
  onToggleSection: (sectionId: string) => void;
  onAddClassroom: (sectionId: string) => void;
  onEdit: (type: TreeNodeRef["type"], id: string) => void;
  onDelete: (type: TreeNodeRef["type"], id: string) => void;
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
  onReorderClassroom: (classroomId: string, direction: "up" | "down") => void;
  onDragReorderClassroom: (sectionId: string, oldIndex: number, newIndex: number) => Promise<void>;
}

interface SortableClassroomItemProps {
  classroom: Classroom;
  index: number;
  totalClassrooms: number;
  isSelected: boolean;
  onSelectNode: (node: TreeNodeRef) => void;
  onEdit: (type: TreeNodeRef["type"], id: string) => void;
  onDelete: (type: TreeNodeRef["type"], id: string) => void;
  onReorderClassroom: (classroomId: string, direction: "up" | "down") => void;
}

function SortableClassroomItem({
  classroom,
  index,
  totalClassrooms,
  isSelected,
  onSelectNode,
  onEdit,
  onDelete,
  onReorderClassroom,
}: SortableClassroomItemProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: classroom.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors touch-manipulation ${
        isSelected ? "bg-primary/10 border border-primary" : "hover:bg-gray-50"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing touch-none"
        title={t("tree.drag_to_reorder")}
        aria-label={t("tree.drag_to_reorder")}
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </button>
      <div className="flex-1 text-sm text-gray-500 truncate touch-manipulation" onClick={() => onSelectNode({ type: "classroom", id: classroom.id })}>
        {locale === "ar"
          ? (classroom.nameAr || classroom.nameEn || classroom.name)
          : (classroom.nameEn || classroom.nameAr || classroom.name)}
      </div>
      <button
        onClick={() => onReorderClassroom(classroom.id, "up")}
        disabled={index === 0}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
        title={t("tree.move_up")}
        aria-label={t("tree.move_up")}
      >
        <ArrowUp className="w-3 h-3" />
      </button>
      <button
        onClick={() => onReorderClassroom(classroom.id, "down")}
        disabled={index === totalClassrooms - 1}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
        title={t("tree.move_down")}
        aria-label={t("tree.move_down")}
      >
        <ArrowDown className="w-3 h-3" />
      </button>
      <DropdownMenu
        trigger={
          <button className="p-1 hover:bg-gray-200 rounded touch-manipulation">
            <MoreVertical className="w-3 h-3" />
          </button>
        }
        items={[
          {
            label: t("tree.edit"),
            value: "edit",
            icon: <Edit2 className="w-4 h-4" />,
            onClick: () => onEdit("classroom", classroom.id),
          },
          {
            label: t("tree.delete"),
            value: "delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => onDelete("classroom", classroom.id),
          },
        ]}
        width="w-32"
      />
    </div>
  );
}

function SortableSectionItem({
  section,
  index,
  totalSections,
  isSelected,
  isExpanded,
  classrooms,
  selectedNode,
  onSelectNode,
  onToggleSection,
  onAddClassroom,
  onEdit,
  onDelete,
  onReorderSection,
  onReorderClassroom,
  onDragReorderClassroom,
}: SortableSectionItemProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const classroomSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors touch-manipulation ${
          isSelected ? "bg-primary/10 border border-primary" : "hover:bg-gray-50"
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing touch-none"
          title={t("tree.drag_to_reorder")}
          aria-label={t("tree.drag_to_reorder")}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </button>
        <button
          onClick={() => onToggleSection(section.id)}
          className="p-1 hover:bg-gray-200 rounded touch-manipulation"
          aria-label={t("tree.toggle_section")}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 text-sm text-gray-600 truncate touch-manipulation" onClick={() => onSelectNode({ type: "section", id: section.id })}>
          {locale === "ar" ? (section.nameAr || section.nameEn || section.name) : (section.nameEn || section.nameAr || section.name)}
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
          {classrooms.length}
        </span>
        <button
          onClick={() => onReorderSection(section.id, "up")}
          disabled={index === 0}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_up")}
          aria-label={t("tree.move_up")}
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onReorderSection(section.id, "down")}
          disabled={index === totalSections - 1}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_down")}
          aria-label={t("tree.move_down")}
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => onAddClassroom(section.id)}
          className="p-1 hover:bg-gray-200 rounded"
          title={t("tree.add_classroom")}
        >
          <Plus className="w-3 h-3" />
        </button>
        <DropdownMenu
          trigger={
            <button className="p-1 hover:bg-gray-200 rounded touch-manipulation">
              <MoreVertical className="w-3 h-3" />
            </button>
          }
          items={[
            {
              label: t("tree.edit"),
              value: "edit",
              icon: <Edit2 className="w-4 h-4" />,
              onClick: () => onEdit("section", section.id),
            },
            {
              label: t("tree.delete"),
              value: "delete",
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => onDelete("section", section.id),
            },
          ]}
          width="w-32"
        />
      </div>

      {isExpanded && classrooms.length > 0 && (
        <div className={`${isRTL ? "mr-6" : "ml-6"} space-y-1`}>
          <DndContext
            sensors={classroomSensors}
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;

              const oldIndex = classrooms.findIndex((item) => item.id === active.id);
              const newIndex = classrooms.findIndex((item) => item.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                await onDragReorderClassroom(section.id, oldIndex, newIndex);
              }
            }}
          >
            <SortableContext
              items={classrooms.map((classroom) => classroom.id)}
              strategy={verticalListSortingStrategy}
            >
              {classrooms.map((classroom, classroomIndex) => (
                <SortableClassroomItem
                  key={classroom.id}
                  classroom={classroom}
                  index={classroomIndex}
                  totalClassrooms={classrooms.length}
                  isSelected={selectedNode?.type === "classroom" && selectedNode.id === classroom.id}
                  onSelectNode={onSelectNode}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReorderClassroom={onReorderClassroom}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function SortableGradeItem({
  grade,
  index,
  totalGrades,
  isSelected,
  isExpanded,
  expandedSections,
  sections,
  classrooms,
  selectedNode,
  onSelectNode,
  onToggleGrade,
  onToggleSection,
  onReorderGrade,
  onReorderSection,
  onAddSection,
  onAddClassroom,
  onEdit,
  onDelete,
  onReorderClassroom,
  onDragReorderSection,
  onDragReorderClassroom,
  isDragging,
}: SortableGradeItemProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const sectionSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: grade.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
          isSelected ? "bg-primary/10 border border-primary" : "hover:bg-gray-50"
        } ${isSortableDragging ? "shadow-lg z-50" : ""}`}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing touch-none"
          title={t("tree.drag_to_reorder")}
          aria-label={t("tree.drag_to_reorder")}
          disabled={isDragging}
        >
          <GripVertical className={`w-4 h-4 ${isDragging ? "text-gray-300" : "text-gray-400"}`} />
        </button>

        <button
          onClick={() => onToggleGrade(grade.id)}
          className="p-1 hover:bg-gray-200 rounded touch-manipulation"
          aria-label={t("tree.toggle_grade")}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div
          onClick={() => onSelectNode({ type: "grade", id: grade.id })}
          className="flex-1 text-sm cursor-pointer py-1 touch-manipulation truncate"
        >
          {locale === "ar" ? (grade.nameAr || grade.nameEn || grade.name) : (grade.nameEn || grade.nameAr || grade.name)}
        </div>

        <button
          onClick={() => onReorderGrade(grade.id, "up")}
          disabled={index === 0}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_up")}
          aria-label={t("tree.move_up")}
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onReorderGrade(grade.id, "down")}
          disabled={index === totalGrades - 1}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_down")}
          aria-label={t("tree.move_down")}
        >
          <ArrowDown className="w-3 h-3" />
        </button>

        <button
          onClick={() => onAddSection(grade.id)}
          className="p-1 hover:bg-gray-200 rounded"
          title={t("tree.add_section")}
        >
          <Plus className="w-3 h-3" />
        </button>
        <DropdownMenu
          trigger={
            <button className="p-1 hover:bg-gray-200 rounded">
              <MoreVertical className="w-3 h-3" />
            </button>
          }
          items={[
            {
              label: t("tree.edit"),
              value: "edit",
              icon: <Edit2 className="w-4 h-4" />,
              onClick: () => onEdit("grade", grade.id),
            },
            {
              label: t("tree.delete"),
              value: "delete",
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => onDelete("grade", grade.id),
            },
          ]}
          width="w-32"
        />
      </div>

      {isExpanded && (
        <div className={`${isRTL ? "mr-6" : "ml-6"} space-y-1`}>
          <DndContext
            sensors={sectionSensors}
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;

              const oldIndex = sections.findIndex((item) => item.id === active.id);
              const newIndex = sections.findIndex((item) => item.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                await onDragReorderSection(grade.id, oldIndex, newIndex);
              }
            }}
          >
            <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section, sectionIndex) => {
                const sectionClassrooms = classrooms
                  .filter((classroom) => classroom.sectionId === section.id)
                  .sort((a, b) => a.order - b.order);

                return (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    index={sectionIndex}
                    totalSections={sections.length}
                    isSelected={selectedNode?.type === "section" && selectedNode.id === section.id}
                    isExpanded={expandedSections.has(section.id)}
                    classrooms={sectionClassrooms}
                    selectedNode={selectedNode}
                    onSelectNode={onSelectNode}
                    onToggleSection={onToggleSection}
                    onAddClassroom={onAddClassroom}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReorderSection={onReorderSection}
                    onReorderClassroom={onReorderClassroom}
                    onDragReorderClassroom={onDragReorderClassroom}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function SortableStageItem({
  stage,
  index,
  totalStages,
  isSelected,
  isExpanded,
  stageGrades,
  expandedGrades,
  expandedSections,
  sections,
  classrooms,
  selectedNode,
  activeGradeId,
  onSelectNode,
  onToggleStage,
  onToggleGrade,
  onToggleSection,
  onAddGrade,
  onAddSection,
  onAddClassroom,
  onEdit,
  onDelete,
  onReorderStage,
  onReorderGrade,
  onReorderSection,
  onReorderClassroom,
  onDragReorderGrade,
  onDragReorderSection,
  onDragReorderClassroom,
}: SortableStageItemProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const gradeSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const activeGrade = activeGradeId
    ? stageGrades.find((grade) => grade.id === activeGradeId) || null
    : null;

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
          isSelected ? "bg-primary/10 border border-primary" : "hover:bg-gray-50"
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing touch-none"
          title={t("tree.drag_to_reorder")}
          aria-label={t("tree.drag_to_reorder")}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={() => onToggleStage(stage.id)}
          className="p-1 hover:bg-gray-200 rounded touch-manipulation"
          aria-label={t("tree.toggle_stage")}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div
          onClick={() => onSelectNode({ type: "stage", id: stage.id })}
          className="flex-1 font-medium cursor-pointer py-1 touch-manipulation truncate"
        >
          {locale === "ar"
            ? stage.nameAr || stage.nameEn || stage.name
            : stage.nameEn || stage.nameAr || stage.name}
        </div>
        <button
          onClick={() => onReorderStage(stage.id, "up")}
          disabled={index === 0}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_up")}
          aria-label={t("tree.move_up")}
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onReorderStage(stage.id, "down")}
          disabled={index === totalStages - 1}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          title={t("tree.move_down")}
          aria-label={t("tree.move_down")}
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => onAddGrade(stage.id)}
          className="p-1 hover:bg-gray-200 rounded touch-manipulation"
          title={t("tree.add_grade")}
        >
          <Plus className="w-4 h-4" />
        </button>
        <DropdownMenu
          trigger={
            <button className="p-1 hover:bg-gray-200 rounded touch-manipulation">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            {
              label: t("tree.edit"),
              value: "edit",
              icon: <Edit2 className="w-4 h-4" />,
              onClick: () => onEdit("stage", stage.id),
            },
            {
              label: t("tree.delete"),
              value: "delete",
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => onDelete("stage", stage.id),
            },
          ]}
          width="w-32"
        />
      </div>

      {isExpanded && stageGrades.length > 0 && (
        <div className={`${isRTL ? "mr-6" : "ml-6"}`}>
          <DndContext
            sensors={gradeSensors}
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;

              const oldIndex = stageGrades.findIndex((item) => item.id === active.id);
              const newIndex = stageGrades.findIndex((item) => item.id === over.id);

              if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                await onDragReorderGrade(stage.id, oldIndex, newIndex);
              }
            }}
          >
            <SortableContext
              items={stageGrades.map((grade) => grade.id)}
              strategy={verticalListSortingStrategy}
            >
              {stageGrades.map((grade, gradeIndex) => (
                <SortableGradeItem
                  key={grade.id}
                  grade={grade}
                  index={gradeIndex}
                  totalGrades={stageGrades.length}
                  isSelected={selectedNode?.type === "grade" && selectedNode.id === grade.id}
                  isExpanded={expandedGrades.has(grade.id)}
                  expandedSections={expandedSections}
                  sections={sections.filter((section) => section.gradeId === grade.id)}
                  classrooms={classrooms}
                  selectedNode={selectedNode}
                  onSelectNode={onSelectNode}
                  onToggleGrade={onToggleGrade}
                  onToggleSection={onToggleSection}
                  onReorderGrade={onReorderGrade}
                  onReorderSection={onReorderSection}
                  onAddSection={onAddSection}
                  onAddClassroom={onAddClassroom}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReorderClassroom={onReorderClassroom}
                  onDragReorderSection={onDragReorderSection}
                  onDragReorderClassroom={onDragReorderClassroom}
                  isDragging={activeGradeId === grade.id}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeGrade ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-primary shadow-lg">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <ChevronRight className="w-4 h-4" />
                  <div className="flex-1 text-sm font-medium">
                    {locale === "ar"
                      ? activeGrade.nameAr || activeGrade.nameEn || activeGrade.name
                      : activeGrade.nameEn || activeGrade.nameAr || activeGrade.name}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default function StructureTree({
  stages,
  grades,
  sections,
  classrooms,
  searchQuery,
  onSearchQueryChange,
  expandedStages,
  expandedGrades,
  expandedSections,
  onExpandedStagesChange,
  onExpandedGradesChange,
  onExpandedSectionsChange,
  selectedNode,
  onSelectNode,
  onAddStage,
  onAddGrade,
  onAddSection,
  onAddClassroom,
  onEdit,
  onDelete,
  onReorderStage,
  onReorderGrade,
  onReorderSection,
  onReorderClassroom,
  onDragReorder,
  onDragReorderGrade,
  onDragReorderSection,
  onDragReorderClassroom,
  isReadOnly = false,
}: StructureTreeProps) {
  const t = useTranslations("academics.structure");
  const locale = useLocale();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredData = useMemo(() => {
    const uniqueStages = Array.from(new Map(stages.map((stage) => [stage.id, stage])).values());
    const uniqueGrades = Array.from(new Map(grades.map((grade) => [grade.id, grade])).values());
    const uniqueSections = Array.from(new Map(sections.map((section) => [section.id, section])).values());
    const uniqueClassrooms = Array.from(new Map(classrooms.map((classroom) => [classroom.id, classroom])).values());

    if (!searchQuery.trim()) {
      return { stages: uniqueStages, grades: uniqueGrades, sections: uniqueSections, classrooms: uniqueClassrooms };
    }

    const gradeById = new Map(uniqueGrades.map((grade) => [grade.id, grade]));
    const sectionById = new Map(uniqueSections.map((section) => [section.id, section]));
    const gradesByStageId = new Map<string, Grade[]>();
    const sectionsByGradeId = new Map<string, Section[]>();
    const classroomsBySectionId = new Map<string, Classroom[]>();

    uniqueGrades.forEach((grade) => {
      const existing = gradesByStageId.get(grade.stageId) || [];
      existing.push(grade);
      gradesByStageId.set(grade.stageId, existing);
    });

    uniqueSections.forEach((section) => {
      const existing = sectionsByGradeId.get(section.gradeId) || [];
      existing.push(section);
      sectionsByGradeId.set(section.gradeId, existing);
    });

    uniqueClassrooms.forEach((classroom) => {
      const existing = classroomsBySectionId.get(classroom.sectionId) || [];
      existing.push(classroom);
      classroomsBySectionId.set(classroom.sectionId, existing);
    });

    const directlyMatchedStageIds = new Set(
      uniqueStages
        .filter((stage) => matchesSearch(searchQuery, stage.name, stage.nameAr, stage.nameEn))
        .map((stage) => stage.id)
    );
    const directlyMatchedGradeIds = new Set(
      uniqueGrades
        .filter((grade) => matchesSearch(searchQuery, grade.name, grade.nameAr, grade.nameEn))
        .map((grade) => grade.id)
    );
    const directlyMatchedSectionIds = new Set(
      uniqueSections
        .filter((section) => matchesSearch(searchQuery, section.name, section.nameAr, section.nameEn))
        .map((section) => section.id)
    );
    const directlyMatchedClassroomIds = new Set(
      uniqueClassrooms
        .filter((classroom) => matchesSearch(searchQuery, classroom.name, classroom.nameAr, classroom.nameEn))
        .map((classroom) => classroom.id)
    );

    const includedStageIds = new Set<string>();
    const includedGradeIds = new Set<string>();
    const includedSectionIds = new Set<string>();
    const includedClassroomIds = new Set<string>();

    const includeSectionBranch = (sectionId: string) => {
      const section = sectionById.get(sectionId);
      if (!section) return;

      includedSectionIds.add(section.id);
      includedGradeIds.add(section.gradeId);

      const parentGrade = gradeById.get(section.gradeId);
      if (parentGrade) {
        includedStageIds.add(parentGrade.stageId);
      }

      (classroomsBySectionId.get(section.id) || []).forEach((classroom) => {
        includedClassroomIds.add(classroom.id);
      });
    };

    const includeGradeBranch = (gradeId: string) => {
      const grade = gradeById.get(gradeId);
      if (!grade) return;

      includedGradeIds.add(grade.id);
      includedStageIds.add(grade.stageId);

      (sectionsByGradeId.get(grade.id) || []).forEach((section) => {
        includeSectionBranch(section.id);
      });
    };

    const includeStageBranch = (stageId: string) => {
      includedStageIds.add(stageId);
      (gradesByStageId.get(stageId) || []).forEach((grade) => {
        includeGradeBranch(grade.id);
      });
    };

    directlyMatchedStageIds.forEach((stageId) => {
      includeStageBranch(stageId);
    });

    directlyMatchedGradeIds.forEach((gradeId) => {
      includeGradeBranch(gradeId);
    });

    directlyMatchedSectionIds.forEach((sectionId) => {
      includeSectionBranch(sectionId);
    });

    directlyMatchedClassroomIds.forEach((classroomId) => {
      includedClassroomIds.add(classroomId);
      const classroom = uniqueClassrooms.find((item) => item.id === classroomId);
      if (!classroom) return;
      includeSectionBranch(classroom.sectionId);
    });

    const matchedClassrooms = uniqueClassrooms.filter((classroom) =>
      includedClassroomIds.has(classroom.id)
    );
    const matchedSections = uniqueSections.filter((section) =>
      includedSectionIds.has(section.id)
    );
    const matchedGrades = uniqueGrades.filter((grade) => includedGradeIds.has(grade.id));
    const matchedStages = uniqueStages.filter((stage) => includedStageIds.has(stage.id));

    return {
      stages: matchedStages,
      grades: matchedGrades,
      sections: matchedSections,
      classrooms: matchedClassrooms,
    };
  }, [searchQuery, stages, grades, sections, classrooms]);

  const toggleStage = (stageId: string) => {
    const next = new Set(expandedStages);
    if (next.has(stageId)) next.delete(stageId);
    else next.add(stageId);
    onExpandedStagesChange(next);
  };

  const toggleGrade = (gradeId: string) => {
    const next = new Set(expandedGrades);
    if (next.has(gradeId)) next.delete(gradeId);
    else next.add(gradeId);
    onExpandedGradesChange(next);
  };

  const toggleSection = (sectionId: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    onExpandedSectionsChange(next);
  };

  const getGradesByStage = (stageId: string) => {
    return filteredData.grades
      .filter((grade) => grade.stageId === stageId)
      .sort((a, b) => a.order - b.order);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    onExpandedStagesChange(new Set(filteredData.stages.map((stage) => stage.id)));
    onExpandedGradesChange(new Set(filteredData.grades.map((grade) => grade.id)));
    onExpandedSectionsChange(new Set(filteredData.sections.map((section) => section.id)));
  }, [
    filteredData.grades,
    filteredData.sections,
    filteredData.stages,
    onExpandedGradesChange,
    onExpandedSectionsChange,
    onExpandedStagesChange,
    searchQuery,
  ]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const stageItems = filteredData.stages.sort((a, b) => a.order - b.order);
    const oldIndex = stageItems.findIndex((stage) => stage.id === active.id);
    const newIndex = stageItems.findIndex((stage) => stage.id === over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      setActiveId(null);
      return;
    }

    await onDragReorder(oldIndex, newIndex);

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeStage = activeId ? stages.find((stage) => stage.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t("tree.search_placeholder")}
          leftIcon={<Search className="w-4 h-4" />}
          inputSize="md"
        />
      </div>

      <div className="p-4 border-b border-border">
        <Button
          onClick={onAddStage}
          variant="primary"
          fullWidth
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={isReadOnly}
        >
          {t("tree.add_stage")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={filteredData.stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage) => stage.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredData.stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage, stageIndex) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  index={stageIndex}
                  totalStages={filteredData.stages.length}
                  isSelected={selectedNode?.type === "stage" && selectedNode.id === stage.id}
                  isExpanded={expandedStages.has(stage.id)}
                  stageGrades={getGradesByStage(stage.id)}
                  expandedGrades={expandedGrades}
                  expandedSections={expandedSections}
                  sections={filteredData.sections}
                  classrooms={filteredData.classrooms}
                  selectedNode={selectedNode}
                  activeGradeId={activeId && grades.some((grade) => grade.id === activeId) ? activeId : null}
                  onSelectNode={onSelectNode}
                  onToggleStage={toggleStage}
                  onToggleGrade={toggleGrade}
                  onToggleSection={toggleSection}
                  onAddGrade={onAddGrade}
                  onAddSection={onAddSection}
                  onAddClassroom={onAddClassroom}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReorderStage={onReorderStage}
                  onReorderGrade={onReorderGrade}
                  onReorderSection={onReorderSection}
                  onReorderClassroom={onReorderClassroom}
                  onDragReorderGrade={onDragReorderGrade}
                  onDragReorderSection={onDragReorderSection}
                  onDragReorderClassroom={onDragReorderClassroom}
                />
              ))}
          </SortableContext>

          <DragOverlay>
            {activeStage ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-primary shadow-lg">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <ChevronRight className="w-4 h-4" />
                <div className="flex-1 text-sm font-medium">
                  {locale === "ar"
                    ? activeStage.nameAr || activeStage.nameEn || activeStage.name
                    : activeStage.nameEn || activeStage.nameAr || activeStage.name}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

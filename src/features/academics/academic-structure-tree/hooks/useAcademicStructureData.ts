"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchStructureTree,
  deleteStage,
  deleteGrade,
  deleteSection,
  deleteClassroom,
  updateStage,
  updateGrade,
  updateSection,
  updateClassroom,
  reorderStages,
  reorderGrades,
  reorderSections,
  reorderClassrooms,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { useToast } from "@/components/ui/toast/Toast";

type StructureItemType = "stage" | "grade" | "section" | "classroom";



interface UseAcademicStructureDataParams {
  academicYearId: string;
  termId: string;
  isReadOnly: boolean;
}

export function useAcademicStructureData({
  academicYearId,
  termId,
  isReadOnly,
}: UseAcademicStructureDataParams) {
  const t = useTranslations("academics.structure");
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const loadRequestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;

    if (!academicYearId || !termId) {
      if (requestId === loadRequestIdRef.current) {
        setStages([]);
        setGrades([]);
        setSections([]);
        setClassrooms([]);
        setError(null);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchStructureTree(academicYearId, termId);
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      setStages(data.stages);
      setGrades(data.grades);
      setSections(data.sections);
      setClassrooms(data.classrooms);
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      setError("Failed to load data");
      console.error(err);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [academicYearId, termId]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const saveItem = useCallback(
    async (
      type: StructureItemType,
      id: string | null,
      data: Partial<Stage | Grade | Section | Classroom>
    ) => {
      if (isReadOnly || !id) {
        return;
      }

      if (type === "stage") {
        await updateStage(academicYearId, termId, id, data as Partial<Stage>);
      } else if (type === "grade") {
        await updateGrade(academicYearId, termId, id, data as Partial<Grade>);
      } else if (type === "section") {
        await updateSection(
          academicYearId,
          termId,
          id,
          data as Partial<Section>
        );
      } else {
        await updateClassroom(
          academicYearId,
          termId,
          id,
          data as Partial<Classroom>
        );
      }

      await loadData();
    },
    [academicYearId, isReadOnly, loadData, termId]
  );

  const deleteItem = useCallback(
    async (type: StructureItemType, id: string) => {
      if (isReadOnly || !confirm(t("confirm_delete"))) {
        return false;
      }

      try {
        if (type === "stage") {
          await deleteStage(academicYearId, termId, id);
        } else if (type === "grade") {
          await deleteGrade(academicYearId, termId, id);
        } else if (type === "section") {
          await deleteSection(academicYearId, termId, id);
        } else {
          await deleteClassroom(academicYearId, termId, id);
        }

        await loadData();
        return true;
      } catch (err) {
        console.error("Failed to delete:", err);
        throw err;
      }
    },
    [academicYearId, isReadOnly, loadData, t, termId]
  );

  const reorderStage = useCallback(
    async (stageId: string, direction: "up" | "down") => {
      if (isReadOnly) return;
      const previousStages = stages;
      const currentIndex = previousStages.findIndex((item) => item.id === stageId);
      if (currentIndex === -1) return;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= previousStages.length) return;

      const nextStages = [...previousStages];
      [nextStages[currentIndex], nextStages[targetIndex]] = [
        nextStages[targetIndex],
        nextStages[currentIndex],
      ];
      const orderedIds = nextStages.map((item) => item.id);
      setStages(nextStages.map((item, index) => ({ ...item, order: index + 1 })));

      try {
        await reorderStages(academicYearId, termId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setStages(previousStages);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, isReadOnly, stages, t, termId, showSuccess, showError]
  );

  const dragReorderStage = useCallback(
    async (oldIndex: number, newIndex: number) => {
      if (isReadOnly || oldIndex === newIndex) return;
      const previousStages = stages;
      const nextStages = [...previousStages];
      const [moved] = nextStages.splice(oldIndex, 1);
      nextStages.splice(newIndex, 0, moved);
      const orderedIds = nextStages.map((item) => item.id);
      setStages(nextStages.map((item, index) => ({ ...item, order: index + 1 })));

      try {
        await reorderStages(academicYearId, termId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setStages(previousStages);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, isReadOnly, stages, t, termId, showSuccess, showError]
  );

  const reorderGrade = useCallback(
    async (gradeId: string, direction: "up" | "down") => {
      if (isReadOnly) return;
      const grade = grades.find((item) => item.id === gradeId);
      if (!grade) return;
      const siblingGrades = grades
        .filter((item) => item.stageId === grade.stageId)
        .sort((a, b) => a.order - b.order);
      const currentIndex = siblingGrades.findIndex((item) => item.id === gradeId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= siblingGrades.length) {
        return;
      }

      const reorderedSiblings = [...siblingGrades];
      [reorderedSiblings[currentIndex], reorderedSiblings[targetIndex]] = [
        reorderedSiblings[targetIndex],
        reorderedSiblings[currentIndex],
      ];
      const orderedIds = reorderedSiblings.map((item) => item.id);
      const previousGrades = grades;
      setGrades(
        grades
          .map((item) => ({
            ...item,
            order:
              item.stageId === grade.stageId
                ? (orderedIds.indexOf(item.id) >= 0
                    ? orderedIds.indexOf(item.id) + 1
                    : item.order)
                : item.order,
          }))
          .sort((a, b) => a.order - b.order)
      );

      try {
        await reorderGrades(academicYearId, termId, grade.stageId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setGrades(previousGrades);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, grades, isReadOnly, t, termId, showSuccess, showError]
  );

  const dragReorderGrade = useCallback(
    async (stageId: string, oldIndex: number, newIndex: number) => {
      if (isReadOnly || oldIndex === newIndex) return;
      const siblingGrades = grades
        .filter((item) => item.stageId === stageId)
        .sort((a, b) => a.order - b.order);
      const previousGrades = grades;
      const reorderedSiblings = [...siblingGrades];
      const [moved] = reorderedSiblings.splice(oldIndex, 1);
      reorderedSiblings.splice(newIndex, 0, moved);
      const orderedIds = reorderedSiblings.map((item) => item.id);
      setGrades(
        grades
          .map((item) => ({
            ...item,
            order:
              item.stageId === stageId
                ? (orderedIds.indexOf(item.id) >= 0
                    ? orderedIds.indexOf(item.id) + 1
                    : item.order)
                : item.order,
          }))
          .sort((a, b) => a.order - b.order)
      );

      try {
        await reorderGrades(academicYearId, termId, stageId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setGrades(previousGrades);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, grades, isReadOnly, t, termId, showSuccess, showError]
  );

  const reorderSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      if (isReadOnly) return;
      const section = sections.find((item) => item.id === sectionId);
      if (!section) return;
      const siblingSections = sections
        .filter((item) => item.gradeId === section.gradeId)
        .sort((a, b) => a.order - b.order);
      const currentIndex = siblingSections.findIndex((item) => item.id === sectionId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= siblingSections.length) {
        return;
      }

      const reorderedSiblings = [...siblingSections];
      [reorderedSiblings[currentIndex], reorderedSiblings[targetIndex]] = [
        reorderedSiblings[targetIndex],
        reorderedSiblings[currentIndex],
      ];
      const orderedIds = reorderedSiblings.map((item) => item.id);
      const previousSections = sections;
      setSections(
        sections
          .map((item) => ({
            ...item,
            order:
              item.gradeId === section.gradeId
                ? (orderedIds.indexOf(item.id) >= 0
                    ? orderedIds.indexOf(item.id) + 1
                    : item.order)
                : item.order,
          }))
          .sort((a, b) => a.order - b.order)
      );

      try {
        await reorderSections(academicYearId, termId, section.gradeId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setSections(previousSections);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, isReadOnly, sections, t, termId, showSuccess, showError]
  );

  const dragReorderSection = useCallback(
    async (gradeId: string, oldIndex: number, newIndex: number) => {
      if (isReadOnly || oldIndex === newIndex) return;
      const siblingSections = sections
        .filter((item) => item.gradeId === gradeId)
        .sort((a, b) => a.order - b.order);
      const previousSections = sections;
      const reorderedSiblings = [...siblingSections];
      const [moved] = reorderedSiblings.splice(oldIndex, 1);
      reorderedSiblings.splice(newIndex, 0, moved);
      const orderedIds = reorderedSiblings.map((item) => item.id);
      setSections(
        sections
          .map((item) => ({
            ...item,
            order:
              item.gradeId === gradeId
                ? (orderedIds.indexOf(item.id) >= 0
                    ? orderedIds.indexOf(item.id) + 1
                    : item.order)
                : item.order,
          }))
          .sort((a, b) => a.order - b.order)
      );

      try {
        await reorderSections(academicYearId, termId, gradeId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setSections(previousSections);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, isReadOnly, sections, t, termId, showSuccess, showError]
  );

  const reorderClassroom = useCallback(
    async (classroomId: string, direction: "up" | "down") => {
      if (isReadOnly) return;
      const classroom = classrooms.find((item) => item.id === classroomId);
      if (!classroom) return;
      const siblingClassrooms = classrooms
        .filter((item) => item.sectionId === classroom.sectionId)
        .sort((a, b) => a.order - b.order);
      const currentIndex = siblingClassrooms.findIndex(
        (item) => item.id === classroomId
      );
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (
        currentIndex === -1 ||
        targetIndex < 0 ||
        targetIndex >= siblingClassrooms.length
      ) {
        return;
      }

      const reorderedSiblings = [...siblingClassrooms];
      [reorderedSiblings[currentIndex], reorderedSiblings[targetIndex]] = [
        reorderedSiblings[targetIndex],
        reorderedSiblings[currentIndex],
      ];
      const orderedIds = reorderedSiblings.map((item) => item.id);
      const previousClassrooms = classrooms;
      setClassrooms(
        classrooms
          .map((item) => ({
            ...item,
            order:
              item.sectionId === classroom.sectionId
                ? (orderedIds.indexOf(item.id) >= 0
                    ? orderedIds.indexOf(item.id) + 1
                    : item.order)
                : item.order,
          }))
          .sort((a, b) => a.order - b.order)
      );

      try {
        await reorderClassrooms(
          academicYearId,
          termId,
          classroom.sectionId,
          orderedIds
        );
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setClassrooms(previousClassrooms);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, classrooms, isReadOnly, t, termId, showSuccess, showError]
  );

  const dragReorderClassroom = useCallback(
    async (sectionId: string, oldIndex: number, newIndex: number) => {
      if (isReadOnly || oldIndex === newIndex) return;
      const siblingClassrooms = classrooms
        .filter((item) => item.sectionId === sectionId)
        .sort((a, b) => a.order - b.order);
      const previousClassrooms = classrooms;
      const reorderedSiblings = [...siblingClassrooms];
      const [moved] = reorderedSiblings.splice(oldIndex, 1);
      reorderedSiblings.splice(newIndex, 0, moved);
      const orderedIds = reorderedSiblings.map((item) => item.id);
      setClassrooms(
        classrooms
          .map((item) => ({
            ...item,
            order:
              item.sectionId === sectionId
                ? (orderedIds.indexOf(item.id) >= 0
                    ? orderedIds.indexOf(item.id) + 1
                    : item.order)
                : item.order,
          }))
          .sort((a, b) => a.order - b.order)
      );

      try {
        await reorderClassrooms(academicYearId, termId, sectionId, orderedIds);
        showSuccess(t("reorder_saved"));
      } catch (err) {
        setClassrooms(previousClassrooms);
        showError(t("reorder_failed"));
        throw err;
      }
    },
    [academicYearId, classrooms, isReadOnly, t, termId, showSuccess, showError]
  );

  const carryOver = useCallback(async () => {
    showError(t("carry_over_dialog.error"));
    return false;
  }, [t, showError]);

  return {
    stages,
    grades,
    sections,
    classrooms,
    isLoading,
    error,
    hasNoStructure:
      stages.length === 0 &&
      grades.length === 0 &&
      sections.length === 0 &&
      classrooms.length === 0,
    loadData,
    saveItem,
    deleteItem,
    reorderStage,
    dragReorderStage,
    reorderGrade,
    dragReorderGrade,
    reorderSection,
    dragReorderSection,
    reorderClassroom,
    dragReorderClassroom,
    carryOver,
  };
}

"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createStage,
  createGrade,
  createSection,
  createClassroom,
  isStageNameUnique,
  isGradeNameUnique,
  isSectionNameUnique,
  isClassroomNameUnique,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { getClassroomNameWhitespaceErrors } from "@/features/academics/academic-structure-tree/utils/classroomNameValidation";

type CreateItemType = "stage" | "grade" | "section" | "classroom";

interface UseStructureCreateFlowParams {
  academicYearId: string;
  termId: string;
  isReadOnly: boolean;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  reload: () => Promise<void>;
}

export function useStructureCreateFlow({
  academicYearId,
  termId,
  isReadOnly,
  stages,
  grades,
  sections,
  classrooms,
  reload,
}: UseStructureCreateFlowParams) {
  const t = useTranslations("academics.structure");
  const tValidation = useTranslations("validation");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<CreateItemType>("stage");
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const [newItemNameAr, setNewItemNameAr] = useState("");
  const [newItemNameEn, setNewItemNameEn] = useState("");
  const [newItemCapacity, setNewItemCapacity] = useState(30);
  const [newItemOrder, setNewItemOrder] = useState(1);
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [addModalErrors, setAddModalErrors] = useState<{
    ar?: string;
    en?: string;
    capacity?: string;
    order?: string;
  }>({});

  const resetForm = useCallback(() => {
    setNewItemNameAr("");
    setNewItemNameEn("");
    setNewItemCapacity(30);
    setNewItemOrder(1);
    setNewItemNotes("");
    setNewItemDescription("");
    setAddModalErrors({});
  }, []);

  const openAddStage = useCallback(() => {
    if (isReadOnly) return;
    setAddModalType("stage");
    setAddModalParentId(null);
    resetForm();
    setShowAddModal(true);
  }, [isReadOnly, resetForm]);

  const openAddGrade = useCallback(
    (stageId: string) => {
      if (isReadOnly) return;
      setAddModalType("grade");
      setAddModalParentId(stageId);
      resetForm();
      setShowAddModal(true);
    },
    [isReadOnly, resetForm]
  );

  const openAddSection = useCallback(
    (gradeId: string) => {
      if (isReadOnly) return;
      setAddModalType("section");
      setAddModalParentId(gradeId);
      resetForm();
      setShowAddModal(true);
    },
    [isReadOnly, resetForm]
  );

  const openAddClassroom = useCallback(
    (sectionId: string) => {
      if (isReadOnly) return;
      setAddModalType("classroom");
      setAddModalParentId(sectionId);
      setNewItemNameAr("");
      setNewItemNameEn("");
      setNewItemCapacity(30);
      const maxOrder = classrooms
        .filter((item) => item.sectionId === sectionId)
        .reduce((max, item) => Math.max(max, item.order), 0);
      setNewItemOrder(maxOrder + 1);
      setAddModalErrors({});
      setShowAddModal(true);
    },
    [classrooms, isReadOnly]
  );

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const createItem = useCallback(async () => {
    if (isReadOnly) return;

    const nextErrors: { ar?: string; en?: string; capacity?: string; order?: string } = {};

    if (!newItemNameAr.trim()) nextErrors.ar = tValidation("required_ar");
    if (!newItemNameEn.trim()) nextErrors.en = tValidation("required_en");
    const whitespaceErrors = getClassroomNameWhitespaceErrors(
      addModalType,
      newItemNameAr,
      newItemNameEn,
      tValidation("classroom_name_no_whitespace"),
    );
    if (!nextErrors.ar && whitespaceErrors.ar) nextErrors.ar = whitespaceErrors.ar;
    if (!nextErrors.en && whitespaceErrors.en) nextErrors.en = whitespaceErrors.en;
    if ((addModalType === "grade" || addModalType === "section" || addModalType === "classroom") && newItemCapacity <= 0) {
      nextErrors.capacity = t("details.validation.capacity_required");
    }
    if (addModalType === "classroom" && newItemOrder <= 0) {
      nextErrors.order = tValidation("required");
    }

    if (
      newItemNameAr.trim() &&
      newItemNameEn.trim() &&
      !nextErrors.ar &&
      !nextErrors.en
    ) {
      const arEnErrors = validateArEnDifferent(newItemNameAr, newItemNameEn);
      if (arEnErrors.arError) nextErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) nextErrors.en = tValidation("arEnMustDiffer");
    }

    if (newItemNameAr.trim() && newItemNameEn.trim() && Object.keys(nextErrors).length === 0) {
      if (addModalType === "stage") {
        const uniqueness = isStageNameUnique(academicYearId, termId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_stage");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_stage");
      } else if (addModalType === "grade" && addModalParentId) {
        const uniqueness = isGradeNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_grade");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_grade");
      } else if (addModalType === "section" && addModalParentId) {
        const uniqueness = isSectionNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_section");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_section");
      } else if (addModalType === "classroom" && addModalParentId) {
        const uniqueness = isClassroomNameUnique(academicYearId, termId, addModalParentId, newItemNameAr, newItemNameEn);
        if (!uniqueness.uniqueAr) nextErrors.ar = tValidation("unique_name_ar_classroom");
        if (!uniqueness.uniqueEn) nextErrors.en = tValidation("unique_name_en_classroom");
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setAddModalErrors(nextErrors);
      return;
    }

    try {
      if (addModalType === "stage") {
        const maxStageOrder = stages.reduce(
          (max, item) => Math.max(max, item.order),
          0
        );
        await createStage(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          order: maxStageOrder + 1,
          description: newItemDescription,
        });
      } else if (addModalType === "grade" && addModalParentId) {
        const maxOrder = grades
          .filter((item) => item.stageId === addModalParentId)
          .reduce((max, item) => Math.max(max, item.order), 0);
        await createGrade(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          stageId: addModalParentId,
          capacity: newItemCapacity,
          order: maxOrder + 1,
          notes: newItemNotes,
        });
      } else if (addModalType === "section" && addModalParentId) {
        const maxOrder = sections
          .filter((item) => item.gradeId === addModalParentId)
          .reduce((max, item) => Math.max(max, item.order), 0);
        await createSection(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          gradeId: addModalParentId,
          capacity: newItemCapacity,
          order: maxOrder + 1,
        });
      } else if (addModalType === "classroom" && addModalParentId) {
        await createClassroom(academicYearId, termId, {
          nameAr: newItemNameAr,
          nameEn: newItemNameEn,
          name: newItemNameEn || newItemNameAr,
          sectionId: addModalParentId,
          capacity: newItemCapacity,
          order: newItemOrder,
        });
      }

      await reload();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create item:", err);
    }
  }, [
    academicYearId,
    addModalParentId,
    addModalType,
    grades,
    isReadOnly,
    newItemCapacity,
    newItemNameAr,
    newItemNameEn,
    newItemNotes,
    newItemDescription,
    newItemOrder,
    reload,
    resetForm,
    stages,
    sections,
    t,
    tValidation,
    termId,
  ]);

  return {
    showAddModal,
    addModalType,
    newItemNameAr,
    newItemNameEn,
    newItemCapacity,
    newItemOrder,
    newItemNotes,
    newItemDescription,
    addModalErrors,
    setNewItemNameAr,
    setNewItemNameEn,
    setNewItemCapacity,
    setNewItemOrder,
    setNewItemNotes,
    setNewItemDescription,
    setAddModalErrors,
    closeAddModal,
    openAddStage,
    openAddGrade,
    openAddSection,
    openAddClassroom,
    createItem,
  };
}

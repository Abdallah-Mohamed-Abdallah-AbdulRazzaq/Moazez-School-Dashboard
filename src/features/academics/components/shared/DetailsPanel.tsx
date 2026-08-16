"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Stage,
  Grade,
  Section,
  Classroom,
  isStageNameUnique,
  isGradeNameUnique,
  isSectionNameUnique,
  isClassroomNameUnique,
} from "@/features/academics/academic-structure-tree/services/structureService";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Button from "@/components/ui/button/Button";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { getClassroomNameWhitespaceErrors } from "@/features/academics/academic-structure-tree/utils/classroomNameValidation";

type NodeType = "stage" | "grade" | "section" | "classroom";
type NodeRef = { type: NodeType; id: string } | null;

type SaveData = Partial<Stage | Grade | Section | Classroom>;

interface DetailsPanelProps {
  selectedNode: NodeRef;
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  onSave: (type: NodeType, id: string | null, data: SaveData) => Promise<void>;
  onDelete: (type: NodeType, id: string) => Promise<void>;
  isReadOnly?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  academicYearId: string;
  termId: string;
}

export default function DetailsPanel({
  selectedNode,
  stages,
  grades,
  sections,
  classrooms,
  onSave,
  onDelete,
  isReadOnly = false,
  onDirtyChange,
  academicYearId,
  termId,
}: DetailsPanelProps) {
  const t = useTranslations("academics.structure.details");
  const tValidation = useTranslations("validation");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bilingualErrors, setBilingualErrors] = useState<{ ar?: string; en?: string }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNode, setPendingNode] = useState<NodeRef>(null);

  const lastNodeKeyRef = useRef<string | null>(null);
  const selectedKey = selectedNode ? `${selectedNode.type}:${selectedNode.id}` : null;

  const loadNodeData = useCallback(
    (node: NodeRef) => {
      if (!node) return;

      let data: Record<string, unknown> = {};
      if (node.type === "stage") {
        const stage = stages.find((item) => item.id === node.id);
        data = stage ? { ...stage } : {};
      } else if (node.type === "grade") {
        const grade = grades.find((item) => item.id === node.id);
        data = grade ? { ...grade } : {};
      } else if (node.type === "section") {
        const section = sections.find((item) => item.id === node.id);
        data = section ? { ...section } : {};
      } else if (node.type === "classroom") {
        const classroom = classrooms.find((item) => item.id === node.id);
        data = classroom ? { ...classroom } : {};
      }

      setFormData(data);
      setIsDirty(false);
      setErrors({});
      setBilingualErrors({});
    },
    [stages, grades, sections, classrooms]
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedNode) {
      setFormData({});
      setIsDirty(false);
      setShowDiscardDialog(false);
      setPendingNode(null);
      lastNodeKeyRef.current = null;
      return;
    }

    if (lastNodeKeyRef.current === selectedKey) {
      return;
    }

    if (isDirty) {
      setPendingNode(selectedNode);
      setShowDiscardDialog(true);
      return;
    }

    loadNodeData(selectedNode);
    lastNodeKeyRef.current = selectedKey;
    setShowDiscardDialog(false);
    setPendingNode(null);

    return () => {
      setShowDiscardDialog(false);
      setPendingNode(null);
    };
  }, [selectedKey, selectedNode, isDirty, loadNodeData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "nameAr" || field === "nameEn") {
      setBilingualErrors({});
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const nextBilingualErrors: { ar?: string; en?: string } = {};

    const nameAr = formData.nameAr as string | undefined;
    const nameEn = formData.nameEn as string | undefined;

    if (!nameAr?.trim()) {
      nextBilingualErrors.ar = tValidation("required_ar");
    }
    if (!nameEn?.trim()) {
      nextBilingualErrors.en = tValidation("required_en");
    }

    const whitespaceErrors = getClassroomNameWhitespaceErrors(
      selectedNode?.type ?? "stage",
      nameAr,
      nameEn,
      tValidation("classroom_name_no_whitespace"),
    );
    if (!nextBilingualErrors.ar && whitespaceErrors.ar) nextBilingualErrors.ar = whitespaceErrors.ar;
    if (!nextBilingualErrors.en && whitespaceErrors.en) nextBilingualErrors.en = whitespaceErrors.en;

    if (
      nameAr?.trim() &&
      nameEn?.trim() &&
      Object.keys(nextBilingualErrors).length === 0
    ) {
      const arEnErrors = validateArEnDifferent(nameAr, nameEn);
      if (arEnErrors.arError) nextBilingualErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) nextBilingualErrors.en = tValidation("arEnMustDiffer");
    }

    if (nameAr?.trim() && nameEn?.trim() && selectedNode && Object.keys(nextBilingualErrors).length === 0) {
      if (selectedNode.type === "stage") {
        const uniqueness = isStageNameUnique(academicYearId, termId, nameAr, nameEn, selectedNode.id);
        if (!uniqueness.uniqueAr) nextBilingualErrors.ar = tValidation("unique_name_ar_stage");
        if (!uniqueness.uniqueEn) nextBilingualErrors.en = tValidation("unique_name_en_stage");
      } else if (selectedNode.type === "grade") {
        const stageId = formData.stageId as string;
        if (stageId) {
          const uniqueness = isGradeNameUnique(academicYearId, termId, stageId, nameAr, nameEn, selectedNode.id);
          if (!uniqueness.uniqueAr) nextBilingualErrors.ar = tValidation("unique_name_ar_grade");
          if (!uniqueness.uniqueEn) nextBilingualErrors.en = tValidation("unique_name_en_grade");
        }
      } else if (selectedNode.type === "section") {
        const gradeId = formData.gradeId as string;
        if (gradeId) {
          const uniqueness = isSectionNameUnique(academicYearId, termId, gradeId, nameAr, nameEn, selectedNode.id);
          if (!uniqueness.uniqueAr) nextBilingualErrors.ar = tValidation("unique_name_ar_section");
          if (!uniqueness.uniqueEn) nextBilingualErrors.en = tValidation("unique_name_en_section");
        }
      } else if (selectedNode.type === "classroom") {
        const sectionId = formData.sectionId as string;
        if (sectionId) {
          const uniqueness = isClassroomNameUnique(academicYearId, termId, sectionId, nameAr, nameEn, selectedNode.id);
          if (!uniqueness.uniqueAr) nextBilingualErrors.ar = tValidation("unique_name_ar_classroom");
          if (!uniqueness.uniqueEn) nextBilingualErrors.en = tValidation("unique_name_en_classroom");
        }
      }
    }

    if (selectedNode?.type === "grade" || selectedNode?.type === "section" || selectedNode?.type === "classroom") {
      const capacityValue = formData.capacity as number | undefined;
      if (!capacityValue || capacityValue <= 0) {
        nextErrors.capacity = t("validation.capacity_required");
      }
    }

    setErrors(nextErrors);
    setBilingualErrors(nextBilingualErrors);
    return Object.keys(nextErrors).length === 0 && Object.keys(nextBilingualErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !selectedNode || isReadOnly) return;

    try {
      await onSave(selectedNode.type, selectedNode.id, formData);
      setIsDirty(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleCancel = () => {
    if (selectedNode) {
      loadNodeData(selectedNode);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode || isReadOnly) return;
    try {
      await onDelete(selectedNode.type, selectedNode.id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardDialog(false);
    setIsDirty(false);
    if (pendingNode) {
      loadNodeData(pendingNode);
      lastNodeKeyRef.current = `${pendingNode.type}:${pendingNode.id}`;
      setPendingNode(null);
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>{t("no_selection")}</p>
      </div>
    );
  }

  const selectedStageName = stages.find((stage) => stage.id === (formData.stageId as string))?.name || "";
  const selectedSection = sections.find((section) => section.id === (formData.sectionId as string));
  const selectedGrade = grades.find((grade) => grade.id === (formData.gradeId as string));

  return (
    <>
      <div className="p-6 h-full overflow-y-auto">
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedNode.type === "stage" && t("stage_form")}
            {selectedNode.type === "grade" && t("grade_form")}
            {selectedNode.type === "section" && t("section_form")}
            {selectedNode.type === "classroom" && t("classroom_form")}
          </h3>

          {selectedNode.type === "stage" && (
            <>
              <BilingualTextField
                label={t("name")}
                value={{
                  ar: (formData.nameAr as string) || "",
                  en: (formData.nameEn as string) || "",
                }}
                onChange={(value) => {
                  handleChange("nameAr", value.ar);
                  handleChange("nameEn", value.en);
                  handleChange("name", value.en || value.ar);
                }}
                requiredAr
                requiredEn
                errors={bilingualErrors}
                disabled={isReadOnly}
              />
              <TextArea
                label={t("description")}
                value={(formData.description as string) || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          {selectedNode.type === "grade" && (
            <>
              <BilingualTextField
                label={t("name")}
                value={{
                  ar: (formData.nameAr as string) || "",
                  en: (formData.nameEn as string) || "",
                }}
                onChange={(value) => {
                  handleChange("nameAr", value.ar);
                  handleChange("nameEn", value.en);
                  handleChange("name", value.en || value.ar);
                }}
                requiredAr
                requiredEn
                errors={bilingualErrors}
                disabled={isReadOnly}
              />
              <Input label={t("stage")} value={selectedStageName} disabled />
              <Input
                label={t("capacity")}
                required
                type="number"
                min="1"
                value={(formData.capacity as number) || ""}
                onChange={(e) => handleChange("capacity", parseInt(e.target.value, 10) || 0)}
                error={errors.capacity}
                disabled={isReadOnly}
              />
              <Input label={t("order")} type="number" value={(formData.order as number) || ""} disabled />
              <TextArea
                label={t("notes")}
                value={(formData.notes as string) || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          {selectedNode.type === "section" && (
            <>
              <BilingualTextField
                label={t("name")}
                value={{
                  ar: (formData.nameAr as string) || "",
                  en: (formData.nameEn as string) || "",
                }}
                onChange={(value) => {
                  handleChange("nameAr", value.ar);
                  handleChange("nameEn", value.en);
                  handleChange("name", value.en || value.ar);
                }}
                requiredAr
                requiredEn
                errors={bilingualErrors}
                disabled={isReadOnly}
              />
              <Input
                label={t("capacity")}
                required
                type="number"
                min="1"
                value={(formData.capacity as number) || ""}
                onChange={(e) => handleChange("capacity", parseInt(e.target.value, 10) || 0)}
                error={errors.capacity}
                disabled={isReadOnly}
              />
              <Input label={t("order")} type="number" value={(formData.order as number) || ""} disabled />
              <TextArea
                label={t("notes")}
                value={(formData.notes as string) || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          {selectedNode.type === "classroom" && (
            <>
              <BilingualTextField
                label={t("name")}
                value={{
                  ar: (formData.nameAr as string) || "",
                  en: (formData.nameEn as string) || "",
                }}
                onChange={(value) => {
                  handleChange("nameAr", value.ar);
                  handleChange("nameEn", value.en);
                  handleChange("name", value.en || value.ar);
                }}
                requiredAr
                requiredEn
                errors={bilingualErrors}
                disabled={isReadOnly}
              />
              <Input
                label={t("section")}
                value={selectedSection?.name || ""}
                disabled
              />
              <Input
                label={t("grade")}
                value={selectedGrade?.name || grades.find((grade) => grade.id === selectedSection?.gradeId)?.name || ""}
                disabled
              />
              <Input
                label={t("capacity")}
                required
                type="number"
                min="1"
                value={(formData.capacity as number) || ""}
                onChange={(e) => handleChange("capacity", parseInt(e.target.value, 10) || 0)}
                error={errors.capacity}
                disabled={isReadOnly}
              />
              <Input label={t("order")} type="number" value={(formData.order as number) || ""} disabled />
              <TextArea
                label={t("notes")}
                value={(formData.notes as string) || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                disabled={isReadOnly}
              />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={!isDirty || isReadOnly} variant="primary">
              {t("save")}
            </Button>
            <Button onClick={handleCancel} disabled={!isDirty || isReadOnly} variant="secondary">
              {t("cancel")}
            </Button>
            <Button onClick={handleDelete} variant="danger" className="ml-auto" disabled={isReadOnly}>
              {t("delete")}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        title={t("discard_dialog.title")}
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowDiscardDialog(false)} variant="secondary">
              {t("discard_dialog.stay")}
            </Button>
            <Button onClick={handleDiscardChanges} variant="danger">
              {t("discard_dialog.discard")}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">{t("discard_dialog.message")}</p>
      </Modal>
    </>
  );
}

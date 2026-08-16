"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, AlertCircle, Download } from "lucide-react";
import StructureTree from "../components/StructureTree";
import DetailsPanel from "../../components/shared/DetailsPanel";
import InsightsPanel from "../../components/shared/InsightsPanel";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import Button from "@/components/ui/button/Button";
import {
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";
import { useAcademicStructureData } from "../hooks/useAcademicStructureData";
import { useStructureCreateFlow } from "../hooks/useStructureCreateFlow";
import { useStructureCarryOverFlow } from "../hooks/useStructureCarryOverFlow";
import { useGuardedAcademicContextChange } from "@/features/academics/hooks/useGuardedAcademicContextChange";
import { useDebouncedCallback } from "use-debounce";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useResizablePanels } from "@/hooks/useResizablePanels";
import PanelResizeHandle from "@/components/ui/panel/PanelResizeHandle";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";

type TreeNodeRef = {
  type: "stage" | "grade" | "section" | "classroom";
  id: string;
};

export default function AcademicStructurePage() {
  const t = useTranslations("academics.structure");
  const tExport = useTranslations("academics.export");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { academicYearId, termId, termStatus, academicYears } =
    useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const canManageStructure = hasPermission("academics.structure.manage");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTreeDrawer, setShowTreeDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const {
    state: panelState,
    containerRef,
    handleResizeStart,
    resizeLeftBy,
  } = useResizablePanels({
    defaultLeftWidth: 400,
    defaultRightWidth: 0,
    constraints: {
      leftMin: 280,
      leftMax: 640,
      rightMin: 0,
      rightMax: 0,
      centerMin: 480,
    },
    storageKey: "academic-structure-panel-widths",
    isRTL,
  });
  const confirmDiscardChanges = useCallback(
    () => confirm(t("details.discard_dialog.message")),
    [t],
  );

  const isTermClosed = termStatus === "closed";
  const isReadOnly = isTermClosed || !canManageStructure;
  const supportsEditAndReorder = true;
  const supportsCarryOver = false;
  const {
    stages,
    grades,
    sections,
    classrooms,
    isLoading,
    error,
    hasNoStructure,
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
  } = useAcademicStructureData({
    academicYearId,
    termId,
    isReadOnly,
  });
  const {
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
  } = useStructureCreateFlow({
    academicYearId,
    termId,
    isReadOnly,
    stages,
    grades,
    sections,
    classrooms,
    reload: loadData,
  });
  const {
    showCarryOverDialog,
    carryOverSourceYearId,
    carryOverSourceTermId,
    carryOverSourceTerms,
    copyCapacities,
    copyOrdering,
    isCarryingOver,
    setCarryOverSourceTermId,
    setCopyCapacities,
    setCopyOrdering,
    openCarryOverDialog,
    closeCarryOverDialog,
    handleCarryOverSourceYearChange,
    submitCarryOver,
  } = useStructureCarryOverFlow({
    academicYearId,
    onCarryOver: carryOver,
  });

  const querySelectedNode = useMemo<TreeNodeRef | null>(() => {
    const nodeType = searchParams.get("nodeType");
    const nodeId = searchParams.get("nodeId");

    if (
      nodeId &&
      (nodeType === "stage" ||
        nodeType === "grade" ||
        nodeType === "section" ||
        nodeType === "classroom")
    ) {
      return {
        type: nodeType,
        id: nodeId,
      };
    }

    return null;
  }, [searchParams]);

  const searchQuery = useMemo(
    () => searchParams.get("search") || "",
    [searchParams],
  );
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);
  const expandedStages = useMemo(() => {
    const value = searchParams.get("expandedStages");
    return new Set((value || "").split(",").filter(Boolean));
  }, [searchParams]);
  const expandedGrades = useMemo(() => {
    const value = searchParams.get("expandedGrades");
    return new Set((value || "").split(",").filter(Boolean));
  }, [searchParams]);
  const expandedSections = useMemo(() => {
    const value = searchParams.get("expandedSections");
    return new Set((value || "").split(",").filter(Boolean));
  }, [searchParams]);

  const syncSelectedNodeUrl = useCallback(
    (node: TreeNodeRef | null, historyMode: "push" | "replace" = "replace") => {
      const params = new URLSearchParams(searchParams.toString());
      if (node) {
        params.set("nodeType", node.type);
        params.set("nodeId", node.id);
      } else {
        params.delete("nodeType");
        params.delete("nodeId");
      }
      const nextUrl = `?${params.toString()}`;
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParams],
  );

  const syncSearchQueryUrl = useCallback(
    (value: string, historyMode: "push" | "replace" = "replace") => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      const nextUrl = `?${params.toString()}`;
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParams],
  );

  const syncExpandedUrl = useCallback(
    (
      key: "expandedStages" | "expandedGrades" | "expandedSections",
      value: Set<string>,
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const serialized = Array.from(value).join(",");
      if (serialized) {
        params.set(key, serialized);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const effectiveSelectedNode = useMemo<TreeNodeRef | null>(() => {
    if (!querySelectedNode) {
      return null;
    }

    const exists =
      (querySelectedNode.type === "stage" &&
        stages.some((item) => item.id === querySelectedNode.id)) ||
      (querySelectedNode.type === "grade" &&
        grades.some((item) => item.id === querySelectedNode.id)) ||
      (querySelectedNode.type === "section" &&
        sections.some((item) => item.id === querySelectedNode.id)) ||
      (querySelectedNode.type === "classroom" &&
        classrooms.some((item) => item.id === querySelectedNode.id));

    return exists ? querySelectedNode : null;
  }, [classrooms, grades, querySelectedNode, sections, stages]);

  useEffect(() => {
    if (!isLoading && querySelectedNode && !effectiveSelectedNode) {
      syncSelectedNodeUrl(null);
    }
  }, [
    effectiveSelectedNode,
    isLoading,
    querySelectedNode,
    syncSelectedNodeUrl,
  ]);

  useEffect(() => {
    void Promise.resolve().then(() => setSearchInputValue(searchQuery));
  }, [searchQuery]);

  useGuardedAcademicContextChange({
    hasUnsavedChanges,
    confirmDiscard: confirmDiscardChanges,
    onDiscard: () => setHasUnsavedChanges(false),
  });

  const contextBarActions = useMemo(
    () => ({
      onPromoteCarryOver: supportsCarryOver ? openCarryOverDialog : undefined,
      showPromoteCarryOver: true,
      disablePromoteCarryOver: isReadOnly || !supportsCarryOver,
      disableYearTermEditing: false,
    }),
    [isReadOnly, openCarryOverDialog, supportsCarryOver],
  );

  useAcademicContextBarActions(contextBarActions);

  const handleSelectNode = (node: TreeNodeRef) => {
    if (hasUnsavedChanges) {
      if (!confirmDiscardChanges()) return;
      setHasUnsavedChanges(false);
    }
    syncSelectedNodeUrl(node, "push");
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchInputValue(value);
    debouncedSyncSearchQueryUrl(value);
  };

  const debouncedSyncSearchQueryUrl = useDebouncedCallback((value: string) => {
    syncSearchQueryUrl(value, "replace");
  }, 250);

  const handleExpandedStagesChange = useCallback(
    (value: Set<string>) => {
      syncExpandedUrl("expandedStages", value);
    },
    [syncExpandedUrl],
  );

  const handleExpandedGradesChange = useCallback(
    (value: Set<string>) => {
      syncExpandedUrl("expandedGrades", value);
    },
    [syncExpandedUrl],
  );

  const handleExpandedSectionsChange = useCallback(
    (value: Set<string>) => {
      syncExpandedUrl("expandedSections", value);
    },
    [syncExpandedUrl],
  );

  const { showError } = useToast();

  const handleSave = async (
    type: "stage" | "grade" | "section" | "classroom",
    id: string | null,
    data: Partial<Stage | Grade | Section | Classroom>,
  ) => {
    try {
      await saveItem(type, id, data);
      setHasUnsavedChanges(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : t("details.save_failed"));
      throw err;
    }
  };

  const handleDelete = async (
    type: "stage" | "grade" | "section" | "classroom",
    id: string,
  ) => {
    try {
      const deleted = await deleteItem(type, id);
      if (deleted) {
        syncSelectedNodeUrl(null);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : t("details.delete_failed"));
      throw err;
    }
  };

  const structureExportRows = useMemo(() => {
    const rows: Record<string, unknown>[] = [];
    stages.forEach((stage) => {
      rows.push({
        level: locale === "ar" ? "مرحلة" : "Stage",
        name: locale === "ar" ? stage.nameAr : stage.nameEn,
        parent: "",
        capacity: "",
        order: "",
      });
    });
    grades.forEach((grade) => {
      const stage = stages.find((item) => item.id === grade.stageId);
      rows.push({
        level: locale === "ar" ? "صف" : "Grade",
        name: locale === "ar" ? grade.nameAr : grade.nameEn,
        parent: stage ? (locale === "ar" ? stage.nameAr : stage.nameEn) : "",
        capacity: "",
        order: grade.order,
      });
    });
    sections.forEach((section) => {
      const grade = grades.find((item) => item.id === section.gradeId);
      rows.push({
        level: locale === "ar" ? "شعبة" : "Section",
        name: locale === "ar" ? section.nameAr : section.nameEn,
        parent: grade ? (locale === "ar" ? grade.nameAr : grade.nameEn) : "",
        capacity: section.capacity,
        order: section.order,
      });
    });
    classrooms.forEach((classroom) => {
      const section = sections.find((item) => item.id === classroom.sectionId);
      rows.push({
        level: locale === "ar" ? "فصل" : "Classroom",
        name: locale === "ar" ? classroom.nameAr : classroom.nameEn,
        parent: section
          ? locale === "ar"
            ? section.nameAr
            : section.nameEn
          : "",
        capacity: classroom.capacity,
        order: classroom.order,
      });
    });
    return rows;
  }, [classrooms, grades, locale, sections, stages]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: termId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columns: ExportColumn[] = [
      { key: "level", label: locale === "ar" ? "المستوى" : "Level" },
      { key: "name", label: locale === "ar" ? "الاسم" : "Name" },
      { key: "parent", label: locale === "ar" ? "العنصر الأب" : "Parent" },
      { key: "capacity", label: locale === "ar" ? "السعة" : "Capacity" },
      { key: "order", label: locale === "ar" ? "الترتيب" : "Order" },
    ];

    exportAcademicsData({
      title: t("context_bar.title"),
      metadata,
      filename: generateExportFilename("academic-structure", termId),
      format,
      columns,
      rows: structureExportRows,
      locale,
      jsonData: {
        title: "Academic Structure",
        metadata,
        stages,
        grades,
        sections,
        classrooms,
      },
    });
  };

  return (
    <div className="flex h-screen flex-col">
      {isTermClosed && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("readonly_banner.message")}
          </span>
        </div>
      )}

      {!isLoading && hasNoStructure && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.title")}
            </h3>
            <p className="text-gray-600 mb-6">{t("empty_state.message")}</p>
            <div className="flex gap-3 justify-center">
              {!isReadOnly && (
                <Button variant="primary" onClick={openAddStage}>
                  {t("empty_state.add_stage")}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={supportsCarryOver ? openCarryOverDialog : undefined}
                disabled={isReadOnly || !supportsCarryOver}
              >
                {t("empty_state.carry_over")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasNoStructure && (
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          <div className="lg:hidden fixed bottom-4 left-4 z-50">
            <button
              onClick={() => setShowTreeDrawer(true)}
              className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-hover"
              aria-label={t("tree.open_tree")}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div
            className="hidden lg:block flex-none border-r border-l border-border bg-white overflow-hidden"
            style={{ width: panelState.leftWidth }}
          >
            <StructureTree
              stages={stages}
              grades={grades}
              sections={sections}
              classrooms={classrooms}
              searchQuery={searchInputValue}
              onSearchQueryChange={handleSearchQueryChange}
              expandedStages={expandedStages}
              expandedGrades={expandedGrades}
              expandedSections={expandedSections}
              onExpandedStagesChange={handleExpandedStagesChange}
              onExpandedGradesChange={handleExpandedGradesChange}
              onExpandedSectionsChange={handleExpandedSectionsChange}
              selectedNode={effectiveSelectedNode}
              onSelectNode={handleSelectNode}
              onAddStage={openAddStage}
              onAddGrade={openAddGrade}
              onAddSection={openAddSection}
              onAddClassroom={openAddClassroom}
              onEdit={(type, id) => handleSelectNode({ type, id })}
              onDelete={handleDelete}
              onReorderStage={
                supportsEditAndReorder ? reorderStage : () => undefined
              }
              onReorderGrade={
                supportsEditAndReorder ? reorderGrade : () => undefined
              }
              onReorderSection={
                supportsEditAndReorder ? reorderSection : () => undefined
              }
              onReorderClassroom={
                supportsEditAndReorder ? reorderClassroom : () => undefined
              }
              onDragReorder={
                supportsEditAndReorder ? dragReorderStage : async () => {}
              }
              onDragReorderGrade={
                supportsEditAndReorder ? dragReorderGrade : async () => {}
              }
              onDragReorderSection={
                supportsEditAndReorder ? dragReorderSection : async () => {}
              }
              onDragReorderClassroom={
                supportsEditAndReorder ? dragReorderClassroom : async () => {}
              }
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="hidden lg:flex">
            <PanelResizeHandle
              ariaLabel={tCommon("resizePanel")}
              isRTL={isRTL}
              onResizeStart={() => handleResizeStart("left")}
              onResizeBy={resizeLeftBy}
            />
          </div>

          {showTreeDrawer && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowTreeDrawer(false)}
              />
              <div
                className="absolute left-0 top-0 bottom-0 w-full bg-white shadow-xl overflow-hidden flex flex-col"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {t("tree.search_placeholder")}
                  </h3>
                  <button
                    onClick={() => setShowTreeDrawer(false)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    aria-label={t("tree.close_tree")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <StructureTree
                    stages={stages}
                    grades={grades}
                    sections={sections}
                    classrooms={classrooms}
                    searchQuery={searchInputValue}
                    onSearchQueryChange={handleSearchQueryChange}
                    expandedStages={expandedStages}
                    expandedGrades={expandedGrades}
                    expandedSections={expandedSections}
                    onExpandedStagesChange={handleExpandedStagesChange}
                    onExpandedGradesChange={handleExpandedGradesChange}
                    onExpandedSectionsChange={handleExpandedSectionsChange}
                    selectedNode={effectiveSelectedNode}
                    onSelectNode={(node) => {
                      handleSelectNode(node);
                      setTimeout(() => setShowTreeDrawer(false), 300);
                    }}
                    onAddStage={openAddStage}
                    onAddGrade={openAddGrade}
                    onAddSection={openAddSection}
                    onAddClassroom={openAddClassroom}
                    onEdit={(type, id) => handleSelectNode({ type, id })}
                    onDelete={handleDelete}
                    onReorderStage={
                      supportsEditAndReorder ? reorderStage : () => undefined
                    }
                    onReorderGrade={
                      supportsEditAndReorder ? reorderGrade : () => undefined
                    }
                    onReorderSection={
                      supportsEditAndReorder ? reorderSection : () => undefined
                    }
                    onReorderClassroom={
                      supportsEditAndReorder
                        ? reorderClassroom
                        : () => undefined
                    }
                    onDragReorder={
                      supportsEditAndReorder ? dragReorderStage : async () => {}
                    }
                    onDragReorderGrade={
                      supportsEditAndReorder
                        ? dragReorderGrade
                        : async () => {}
                    }
                    onDragReorderSection={
                      supportsEditAndReorder
                        ? dragReorderSection
                        : async () => {}
                    }
                    onDragReorderClassroom={
                      supportsEditAndReorder
                        ? dragReorderClassroom
                        : async () => {}
                    }
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden bg-gray-50">
            <DetailsPanel
              selectedNode={effectiveSelectedNode}
              stages={stages}
              grades={grades}
              sections={sections}
              classrooms={classrooms}
              onSave={handleSave}
              onDelete={handleDelete}
              isReadOnly={isReadOnly || !supportsEditAndReorder}
              onDirtyChange={setHasUnsavedChanges}
              academicYearId={academicYearId}
              termId={termId}
            />
          </div>

          <div className="hidden xl:block w-80 border-l border-border bg-gray-50 overflow-hidden">
            <div className=" bg-white px-6 pt-6">
              <div className="flex items-center justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowExportModal(true)}
                  leftIcon={<Download className="w-4 h-4" />}
                  disabled={structureExportRows.length === 0}
                >
                  {tExport("button")}
                </Button>
              </div>
            </div>
            <InsightsPanel
              stages={stages}
              grades={grades}
              sections={sections}
              classrooms={classrooms}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={
          addModalType === "stage"
            ? t("modals.add_stage")
            : addModalType === "grade"
              ? t("modals.add_grade")
              : addModalType === "section"
                ? t("modals.add_section")
                : t("modals.add_classroom")
        }
        size="sm"
        footer={
          <>
            <Button onClick={closeAddModal} variant="secondary">
              {t("modals.cancel")}
            </Button>
            <Button
              onClick={createItem}
              disabled={
                !newItemNameAr.trim() ||
                !newItemNameEn.trim() ||
                ((addModalType === "grade" || addModalType === "section" || addModalType === "classroom") &&
                  newItemCapacity <= 0) ||
                (addModalType === "classroom" && newItemOrder <= 0)
              }
              variant="primary"
            >
              {t("modals.create")}
            </Button>
          </>
        }
      >
        <BilingualTextField
          label={t("modals.name")}
          value={{ ar: newItemNameAr, en: newItemNameEn }}
          onChange={(value) => {
            setNewItemNameAr(value.ar);
            setNewItemNameEn(value.en);
            setAddModalErrors({});
          }}
          requiredAr
          requiredEn
          errors={addModalErrors}
        />
        {addModalType === "stage" && (
          <div className="mt-4">
            <TextArea
              label={t("details.description")}
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={3}
            />
          </div>
        )}
        {(addModalType === "grade" || addModalType === "section" || addModalType === "classroom") && (
          <div className="mt-4">
            <Input
              label={t("details.capacity")}
              type="number"
              min="1"
              value={newItemCapacity}
              onChange={(e) => {
                setNewItemCapacity(parseInt(e.target.value, 10) || 0);
                setAddModalErrors((prev) => ({ ...prev, capacity: undefined }));
              }}
              error={addModalErrors.capacity}
            />
          </div>
        )}
        {addModalType === "grade" && (
          <div className="mt-4">
            <TextArea
              label={t("details.notes")}
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
        {addModalType === "classroom" && (
          <div className="mt-4">
            <Input
              label={t("details.order")}
              type="number"
              min="1"
              value={newItemOrder}
              onChange={(e) => {
                setNewItemOrder(parseInt(e.target.value, 10) || 0);
                setAddModalErrors((prev) => ({ ...prev, order: undefined }));
              }}
              error={addModalErrors.order}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCarryOverDialog}
        onClose={closeCarryOverDialog}
        title={t("carry_over_dialog.title")}
        size="md"
        footer={
          <>
            <Button onClick={closeCarryOverDialog} variant="secondary">
              {t("carry_over_dialog.cancel")}
            </Button>
            <Button
              onClick={submitCarryOver}
              disabled={
                !carryOverSourceYearId ||
                !carryOverSourceTermId ||
                isCarryingOver
              }
              variant="primary"
            >
              {t("carry_over_dialog.carry_over")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("carry_over_dialog.description")}
          </p>

          <Select
            label={t("carry_over_dialog.source_year")}
            required
            value={carryOverSourceYearId}
            onChange={handleCarryOverSourceYearChange}
            options={academicYears.map((year) => ({
              value: year.id,
              label: year.name,
            }))}
            selectSize="md"
          />

          <Select
            label={t("carry_over_dialog.source_term")}
            required
            value={carryOverSourceTermId}
            onChange={setCarryOverSourceTermId}
            options={carryOverSourceTerms.map((term) => ({
              value: term.id,
              label: term.name,
            }))}
            selectSize="md"
            disabled={!carryOverSourceYearId}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("carry_over_dialog.options")}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={copyCapacities}
                  onChange={(e) => setCopyCapacities(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-gray-700">
                  {t("carry_over_dialog.copy_capacities")}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={copyOrdering}
                  onChange={(e) => setCopyOrdering(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-gray-700">
                  {t("carry_over_dialog.copy_ordering")}
                </span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("context_bar.title")}
        datasetCount={structureExportRows.length}
      />
    </div>
  );
}

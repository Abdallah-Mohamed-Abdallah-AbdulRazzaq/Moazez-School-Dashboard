"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Plus, Edit2, ChevronUp, ChevronDown } from "lucide-react";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { YearDialog, TermDialog } from "../dialogs/YearTermDialogs";
import { usePermissions } from "@/hooks/usePermissions";

interface ContextBarProps {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  academicYears: AcademicYear[];
  terms: Term[];
  isLoadingYears?: boolean;
  isLoadingTerms?: boolean;
  onAcademicYearChange: (yearId: string) => void;
  onTermChange: (termId: string) => void;
  onPromoteCarryOver?: () => void;
  onRefreshAcademicYears?: () => Promise<AcademicYear[]>;
  onRefreshTerms?: () => Promise<Term[]>;
  isReadOnly: boolean;
  showPromoteCarryOver?: boolean;
  disablePromoteCarryOver?: boolean;
  disableYearTermEditing?: boolean;
}

export default function ContextBar({
  academicYearId,
  termId,
  termStatus,
  academicYears,
  terms,
  isLoadingYears = false,
  isLoadingTerms = false,
  onAcademicYearChange,
  onTermChange,
  onPromoteCarryOver,
  onRefreshAcademicYears,
  onRefreshTerms,
  isReadOnly,
  showPromoteCarryOver = true,
  disablePromoteCarryOver = false,
  disableYearTermEditing = false,
}: ContextBarProps) {
  const t = useTranslations("academics.structure.context_bar");
  const locale = useLocale();

  const [isCollapsed, setIsCollapsed] = useState(true);

  // Dialog states
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [showTermDialog, setShowTermDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  const { hasPermission } = usePermissions();
  const canManageAcademicContext = hasPermission("academics.structure.manage");

  const handleYearSuccess = async () => {
    await onRefreshAcademicYears?.();
  };

  const handleTermSuccess = async () => {
    await onRefreshTerms?.();
  };

  const handleEditYear = () => {
    if (!canManageAcademicContext || disableYearTermEditing) return;

    const year = academicYears.find((y) => y.id === academicYearId);
    if (year) {
      setEditingYear(year);
      setShowYearDialog(true);
    }
  };

  const handleEditTerm = () => {
    if (!canManageAcademicContext || disableYearTermEditing) return;

    const term = terms.find((t) => t.id === termId);
    if (term) {
      setEditingTerm(term);
      setShowTermDialog(true);
    }
  };

  const handleCreateYear = () => {
    if (!canManageAcademicContext || isReadOnly) return;

    setEditingYear(null);
    setShowYearDialog(true);
  };

  const handleCreateTerm = () => {
    if (!canManageAcademicContext || isReadOnly || !academicYearId) return;

    setEditingTerm(null);
    setShowTermDialog(true);
  };

  const academicYearOptions = academicYears.map((year) => ({
    value: year.id,
    label:
      locale === "ar"
        ? year.nameAr || year.name
        : year.nameEn || year.name,
  }));

  const termOptions = terms.map((term) => ({
    value: term.id,
    label:
      locale === "ar"
        ? term.nameAr || term.name
        : term.nameEn || term.name,
  }));

  const selectedYear = academicYears.find((y) => y.id === academicYearId);
  const selectedTerm = terms.find((t) => t.id === termId);

  return (
    <>
      <div className="bg-white border-b border-border ">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-6 py-3 flex items-center justify-between border-b border-border bg-linear-to-l from-primary to-hover hover:from-hover hover:to-primary transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">{t("title")}</h3>

            {isCollapsed && selectedYear && selectedTerm && (
              <div className="flex items-center gap-2 text-sm text-white">
                <span>
                  {locale === "ar"
                    ? selectedYear.nameAr || selectedYear.name
                    : selectedYear.nameEn || selectedYear.name}
                </span>
                <span className="text-gray-400">•</span>
                <span>
                  {locale === "ar"
                    ? selectedTerm.nameAr || selectedTerm.name
                    : selectedTerm.nameEn || selectedTerm.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    termStatus === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {termStatus === "open" ? t("status_open") : t("status_closed")}
                </span>
              </div>
            )}
          </div>

          <div className="text-white">
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </button>

        {/* Content */}
        {!isCollapsed && (
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Academic Year */}
                <div className="flex-1 min-w-[200px] flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      label={t("academic_year")}
                      required
                      value={academicYearId}
                      onChange={onAcademicYearChange}
                      options={academicYearOptions}
                      selectSize="md"
                      disabled={isLoadingYears}
                    />
                  </div>

                  {academicYearId && (
                    <button
                      onClick={handleEditYear}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors mb-0.5"
                      title={t("edit_year")}
                      disabled={
                        !canManageAcademicContext || disableYearTermEditing
                      }
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Term */}
                <div className="flex-1 min-w-[200px] flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      label={t("term")}
                      required
                      value={termId}
                      onChange={onTermChange}
                      options={termOptions}
                      selectSize="md"
                      disabled={isLoadingTerms || !academicYearId}
                    />
                  </div>

                  {termId && (
                    <button
                      onClick={handleEditTerm}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors mb-0.5"
                      title={t("edit_term")}
                      disabled={
                        !canManageAcademicContext || disableYearTermEditing
                      }
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Term Status */}
                <div className="flex items-end">
                  <span
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      termStatus === "open"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {termStatus === "open" ? t("status_open") : t("status_closed")}
                  </span>
                </div>
              </div>

              {/* Actions - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateYear}
                  disabled={!canManageAcademicContext || isReadOnly}
                >
                  {t("create_year")}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateTerm}
                  disabled={
                    !canManageAcademicContext || !academicYearId || isReadOnly
                  }
                >
                  {t("create_term")}
                </Button>

                {showPromoteCarryOver && onPromoteCarryOver && (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={onPromoteCarryOver}
                    disabled={isReadOnly || disablePromoteCarryOver}
                    title={isReadOnly ? t("status_closed") : ""}
                  >
                    {t("promote_carry_over")}
                  </Button>
                )}
              </div>

              {/* Actions - Mobile */}
              <div className="lg:hidden flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleCreateYear}
                    disabled={!canManageAcademicContext || isReadOnly}
                  >
                    {t("create_year")}
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleCreateTerm}
                    disabled={
                      !canManageAcademicContext || !academicYearId || isReadOnly
                    }
                  >
                    {t("create_term")}
                  </Button>
                </div>

                {showPromoteCarryOver && onPromoteCarryOver && (
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={onPromoteCarryOver}
                    disabled={isReadOnly || disablePromoteCarryOver}
                  >
                    {t("promote_carry_over")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <YearDialog
        isOpen={showYearDialog}
        onClose={() => {
          setShowYearDialog(false);
          setEditingYear(null);
        }}
        onSuccess={handleYearSuccess}
        existingYears={academicYears}
        editYear={editingYear}
      />

      {selectedYear && (
        <TermDialog
          isOpen={showTermDialog}
          onClose={() => {
            setShowTermDialog(false);
            setEditingTerm(null);
          }}
          onSuccess={handleTermSuccess}
          academicYear={selectedYear}
          existingTerms={terms}
          editTerm={editingTerm}
          isReadOnly={!canManageAcademicContext && !!editingTerm}
        />
      )}
    </>
  );
}

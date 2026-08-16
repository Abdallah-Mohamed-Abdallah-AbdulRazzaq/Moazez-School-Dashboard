"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import { YearDialog, TermDialog } from "@/features/academics/components/dialogs/YearTermDialogs";
import { SetupProgress } from "../SetupProgress";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { AcademicContextSetupData } from "../../types";

export interface AcademicContextSetupStepCopy {
  summary: string;
  yearsCount(count: number): string;
  termsCount(count: number): string;
  createdContexts: string;
  noTerms: string;
  progressLabel: string;
  progressText(completed: number, total: number): string;
  academicYear: string;
  term: string;
  done: string;
  remaining: string;
  manage: string;
  edit: string;
  createYear: string;
  createTerm: string;
}

interface AcademicContextSetupStepProps {
  copy: AcademicContextSetupStepCopy;
  data: AcademicContextSetupData;
  selectedYear: AcademicYear | null;
  refreshStep(stepId: "academicContext"): Promise<void> | void;
}

function countTerms(data: AcademicContextSetupData) {
  return Object.values(data.termsByYear).reduce((total, terms) => total + terms.length, 0);
}

export function AcademicContextSetupStep({
  copy,
  data,
  selectedYear,
  refreshStep,
}: AcademicContextSetupStepProps) {
  const locale = useLocale();
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const targetYear = selectedYear ?? data.years[0] ?? null;
  const targetTerms: Term[] = targetYear ? data.termsByYear[targetYear.id] ?? [] : [];
  const hasAcademicYear = data.years.length > 0;
  const hasTerm = data.years.some((year) =>
    (data.termsByYear[year.id] ?? []).some((term) => term.yearId === year.id),
  );
  const completedSteps = Number(hasAcademicYear) + Number(hasTerm);

  const handleSuccess = () => {
    void refreshStep("academicContext");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      <SetupProgress
        completed={completedSteps}
        done={copy.done}
        label={copy.progressLabel}
        progressText={copy.progressText(completedSteps, 2)}
        remaining={copy.remaining}
        steps={[
          { id: "academic-year", label: copy.academicYear, complete: hasAcademicYear },
          { id: "term", label: copy.term, complete: hasTerm },
        ]}
        total={2}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-sm font-medium text-gray-950">{copy.yearsCount(data.years.length)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-sm font-medium text-gray-950">{copy.termsCount(countTerms(data))}</p>
        </div>
      </div>
      {data.years.length > 0 ? (
        <ul
          aria-label={copy.createdContexts}
          className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          {data.years.map((year) => {
            const terms = data.termsByYear[year.id] ?? [];

            return (
              <li className="rounded-md bg-gray-50 p-3" key={year.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-950">{locale === "ar" ? year.nameAr || year.name : year.nameEn || year.name}</p>
                  <Button onClick={() => setEditingYear(year)} size="sm" type="button" variant="secondary">
                    {copy.edit} {copy.academicYear}
                  </Button>
                </div>
                {terms.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {terms.map((term) => (
                      <li
                        className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.03] px-2.5 py-1 text-xs font-medium text-gray-700"
                        key={term.id}
                      >
                        <span>{locale === "ar" ? term.nameAr || term.name : term.nameEn || term.name}</span>
                        <Button onClick={() => setEditingTerm(term)} size="sm" type="button" variant="secondary">
                          {copy.edit} {copy.term}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-gray-600">{copy.noTerms}</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      {targetYear ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsTermDialogOpen(true)} type="button">
            {copy.createTerm}
          </Button>
        </div>
      ) : (
        <Button onClick={() => setIsYearDialogOpen(true)} type="button">
          {copy.createYear}
        </Button>
      )}
      <YearDialog
        editYear={editingYear}
        existingYears={data.years}
        isOpen={isYearDialogOpen || Boolean(editingYear)}
        onClose={() => { setIsYearDialogOpen(false); setEditingYear(null); }}
        onSuccess={handleSuccess}
      />
      {targetYear ? (
        <TermDialog
          academicYear={targetYear}
          editTerm={editingTerm}
          existingTerms={targetTerms}
          isOpen={isTermDialogOpen || Boolean(editingTerm)}
          onClose={() => { setIsTermDialogOpen(false); setEditingTerm(null); }}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}

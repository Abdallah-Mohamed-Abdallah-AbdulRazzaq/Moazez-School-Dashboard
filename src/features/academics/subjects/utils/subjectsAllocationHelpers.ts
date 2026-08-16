// Utility functions for subjects allocation

import type { AcademicYear, Term } from "@/features/academics/academic-structure-tree/services/structureService";

export interface ContextInitResult {
  selectedYear: AcademicYear | null;
  selectedTerm: Term | null;
  yearTerms: Term[];
}

export function findSelectedYear(
  years: AcademicYear[],
  urlYear: string | null
): AcademicYear | null {
  if (urlYear) {
    const found = years.find((y) => y.id === urlYear);
    if (found) return found;
  }
  return years[0] || null;
}

export function findSelectedTerm(
  terms: Term[],
  urlTerm: string | null
): Term | null {
  if (urlTerm) {
    const found = terms.find((t) => t.id === urlTerm);
    if (found) return found;
  }
  // Default to open term or first term
  return terms.find((t) => t.status === "open") || terms[0] || null;
}

export function buildURLParams(yearId: string, termId: string): string {
  const params = new URLSearchParams();
  params.set("year", yearId);
  params.set("term", termId);
  return params.toString();
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface UseAdmissionsAcademicSelectionOptions {
  enabled?: boolean;
  initialYearId?: string | null;
  initialTermId?: string | null;
}

export interface AdmissionsAcademicSelection {
  academicYears: AcademicYear[];
  terms: Term[];
  yearId: string | null;
  termId: string | null;
  isLoading: boolean;
  error: string | null;
  setYearId: (yearId: string) => Promise<void>;
  setTermId: (termId: string) => void;
  setYearAndTerm: (yearId: string, termId: string | null) => Promise<void>;
  retry: () => Promise<void>;
}

const termsCache = new Map<string, Term[]>();

async function loadTerms(yearId: string): Promise<Term[]> {
  const cached = termsCache.get(yearId);
  if (cached) return cached;
  const terms = await fetchTermsByYear(yearId);
  termsCache.set(yearId, terms);
  return terms;
}

function preferredTerm(terms: Term[], termId?: string | null) {
  return (
    terms.find((term) => term.id === termId) ??
    terms.find((term) => term.status === "open") ??
    terms[0] ??
    null
  );
}

export function useAdmissionsAcademicSelection({
  enabled = true,
  initialYearId = null,
  initialTermId = null,
}: UseAdmissionsAcademicSelectionOptions = {}): AdmissionsAcademicSelection {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [yearId, setYearIdState] = useState<string | null>(initialYearId);
  const [termId, setTermIdState] = useState<string | null>(initialTermId);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const setYearAndTerm = useCallback(
    async (nextYearId: string, requestedTermId: string | null) => {
      const currentRequest = ++requestId.current;
      setIsLoading(true);
      setError(null);
      try {
        const nextTerms = await loadTerms(nextYearId);
        if (currentRequest !== requestId.current) return;
        setYearIdState(nextYearId);
        setTerms(nextTerms);
        setTermIdState(preferredTerm(nextTerms, requestedTermId)?.id ?? null);
      } catch (loadError) {
        if (currentRequest !== requestId.current) return;
        console.error("Failed to load admissions academic terms:", loadError);
        setTerms([]);
        setTermIdState(null);
        setError("failed_to_load_terms");
      } finally {
        if (currentRequest === requestId.current) setIsLoading(false);
      }
    },
    [],
  );

  const initialize = useCallback(async () => {
    if (!enabled) return;
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const years = await fetchAcademicYears();
      if (currentRequest !== requestId.current) return;
      setAcademicYears(years);
      const selectedYear =
        years.find((year) => year.id === initialYearId) ??
        years.find((year) => year.isActive) ??
        years[0] ??
        null;
      if (!selectedYear) {
        setYearIdState(null);
        setTermIdState(null);
        setTerms([]);
        return;
      }

      const nextTerms = await loadTerms(selectedYear.id);
      if (currentRequest !== requestId.current) return;
      setYearIdState(selectedYear.id);
      setTerms(nextTerms);
      setTermIdState(preferredTerm(nextTerms, initialTermId)?.id ?? null);
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      console.error("Failed to load admissions academic options:", loadError);
      setAcademicYears([]);
      setTerms([]);
      setYearIdState(null);
      setTermIdState(null);
      setError("failed_to_load_academic_options");
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [enabled, initialTermId, initialYearId]);

  useEffect(() => {
    if (!enabled) return;
    void Promise.resolve().then(initialize);
    return () => {
      requestId.current += 1;
    };
  }, [enabled, initialize]);

  const setYearId = useCallback(
    async (nextYearId: string) => {
      await setYearAndTerm(nextYearId, null);
    },
    [setYearAndTerm],
  );

  const setTermId = useCallback(
    (nextTermId: string) => {
      if (terms.some((term) => term.id === nextTermId)) {
        setTermIdState(nextTermId);
      }
    },
    [terms],
  );

  const retry = useCallback(async () => {
    termsCache.clear();
    await initialize();
  }, [initialize]);

  return {
    academicYears,
    terms,
    yearId,
    termId,
    isLoading,
    error,
    setYearId,
    setTermId,
    setYearAndTerm,
    retry,
  };
}

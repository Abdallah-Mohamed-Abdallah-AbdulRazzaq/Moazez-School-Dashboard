"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isApiError } from "@/lib/api-error";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

const ACADEMIC_CONTEXT_STORAGE_KEY = "sis-dashboard:academic-context";

interface PersistedAcademicContext {
  academicYearId: string;
  termId: string;
}

export function readPersistedAcademicContext(): PersistedAcademicContext | null {
  if (typeof window === "undefined") return null;

  try {
    const storedContext = window.localStorage.getItem(ACADEMIC_CONTEXT_STORAGE_KEY);
    if (!storedContext) return null;

    const parsedContext: unknown = JSON.parse(storedContext);
    if (
      typeof parsedContext === "object" &&
      parsedContext !== null &&
      "academicYearId" in parsedContext &&
      "termId" in parsedContext &&
      typeof parsedContext.academicYearId === "string" &&
      typeof parsedContext.termId === "string"
    ) {
      return parsedContext as PersistedAcademicContext;
    }
  } catch {
    // A malformed or unavailable browser storage entry should not block the context.
  }

  return null;
}

export function persistAcademicContext(academicYearId: string, termId: string) {
  if (typeof window === "undefined" || !academicYearId || !termId) return;

  try {
    window.localStorage.setItem(
      ACADEMIC_CONTEXT_STORAGE_KEY,
      JSON.stringify({ academicYearId, termId })
    );
  } catch {
    // Browsers may deny storage access; URL state remains the fallback.
  }
}

export interface UseAcademicYearTermContextOptions {
  preserveParams?: boolean;
  preferOpenTerm?: boolean;
  yearParamKey?: string;
  termParamKey?: string;
  termStatusParamKey?: string;
}

export interface UseAcademicYearTermContextResult {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  academicYears: AcademicYear[];
  terms: Term[];
  isInitializing: boolean;
  selectedAcademicYear: AcademicYear | null;
  selectedTerm: Term | null;
  changeAcademicYear: (yearId: string) => Promise<Term | null>;
  changeTerm: (termId: string) => Term | null;
  refreshAcademicYears: () => Promise<AcademicYear[]>;
  refreshTerms: (yearId?: string) => Promise<Term[]>;
}

export function useAcademicYearTermContext(
  options: UseAcademicYearTermContextOptions = {}
): UseAcademicYearTermContextResult {
  const {
    preserveParams = true,
    preferOpenTerm = true,
    yearParamKey = "year",
    termParamKey = "term",
    termStatusParamKey,
  } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParamsRef = useRef(searchParams.toString());
  const initialYearIdRef = useRef(searchParams.get(yearParamKey));
  const initialTermIdRef = useRef(searchParams.get(termParamKey));
  const yearChangeRequestIdRef = useRef(0);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [isInitializing, setIsInitializing] = useState(true);

  const buildSelectedTerm = useCallback(
    (availableTerms: Term[], requestedTermId: string | null): Term | null => {
      if (requestedTermId) {
        const matchingTerm = availableTerms.find((term) => term.id === requestedTermId);
        if (matchingTerm) {
          return matchingTerm;
        }
      }

      if (preferOpenTerm) {
        return availableTerms.find((term) => term.status === "open") || availableTerms[0] || null;
      }

      return availableTerms[0] || null;
    },
    [preferOpenTerm]
  );

  const syncUrl = useCallback(
    (yearId: string, selectedTermId: string, selectedTermStatus?: "open" | "closed") => {
      const params = preserveParams
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();
      params.set(yearParamKey, yearId);
      params.set(termParamKey, selectedTermId);
      if (termStatusParamKey && selectedTermStatus) {
        params.set(termStatusParamKey, selectedTermStatus);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [preserveParams, router, searchParams, termParamKey, termStatusParamKey, yearParamKey]
  );

  const refreshAcademicYears = useCallback(async () => {
    const years = await fetchAcademicYears();
    setAcademicYears(years);
    return years;
  }, []);

  const refreshTerms = useCallback(
    async (yearId = academicYearId) => {
      if (!yearId) {
        setTerms([]);
        return [];
      }

      try {
        const fetchedTerms = await fetchTermsByYear(yearId);
        setTerms(fetchedTerms);
        return fetchedTerms;
      } catch (error) {
        console.error("Failed to refresh terms:", error);
        if (isApiError(error) && error.status === 401) {
          setTerms([]);
          return [];
        }
        throw error;
      }
    },
    [academicYearId]
  );

  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      setIsInitializing(true);

      try {
        const years = await fetchAcademicYears();
        if (isCancelled) {
          return;
        }

        setAcademicYears(years);

        // A URL context is intentionally authoritative for deep links. When the
        // destination has no context params, restore the user's last selection
        // so moving between dashboard layouts does not reset it to the first year.
        const persistedContext = readPersistedAcademicContext();
        const requestedYearId =
          initialYearIdRef.current || persistedContext?.academicYearId || null;
        const requestedTermId =
          initialTermIdRef.current ||
          (!initialYearIdRef.current ? persistedContext?.termId ?? null : null);
        const selectedYear =
          years.find((year) => year.id === requestedYearId) || years[0] || null;

        if (!selectedYear) {
          setAcademicYearId("");
          setTermId("");
          setTerms([]);
          return;
        }

        const fetchedTerms = await fetchTermsByYear(selectedYear.id);
        if (isCancelled) {
          return;
        }

        setTerms(fetchedTerms);

        const selectedTerm = buildSelectedTerm(fetchedTerms, requestedTermId);

        setAcademicYearId(selectedYear.id);
        setTermId(selectedTerm?.id || "");
        setTermStatus(selectedTerm?.status || "open");

        if (selectedTerm) {
          persistAcademicContext(selectedYear.id, selectedTerm.id);
        }

        if (
          selectedTerm &&
          (requestedYearId !== selectedYear.id || requestedTermId !== selectedTerm.id)
        ) {
          const params = preserveParams
            ? new URLSearchParams(initialParamsRef.current)
            : new URLSearchParams();
          params.set(yearParamKey, selectedYear.id);
          params.set(termParamKey, selectedTerm.id);
          if (termStatusParamKey) {
            params.set(termStatusParamKey, selectedTerm.status);
          }
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to initialize academic year/term context:", error);
          setAcademicYears([]);
          setAcademicYearId("");
          setTermId("");
          setTerms([]);
          setTermStatus("open");
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isCancelled = true;
    };
  }, [buildSelectedTerm, preserveParams, router, termParamKey, termStatusParamKey, yearParamKey]);

  const changeAcademicYear = useCallback(
    async (yearId: string) => {
      const requestId = yearChangeRequestIdRef.current + 1;
      yearChangeRequestIdRef.current = requestId;

      setAcademicYearId(yearId);
      setTermId("");
      setTermStatus("open");
      setTerms([]);

      let fetchedTerms: Term[];
      try {
        fetchedTerms = await fetchTermsByYear(yearId);
      } catch (error) {
        console.error("Failed to change academic year:", error);
        if (isApiError(error) && error.status === 401) {
          setTerms([]);
          return null;
        }
        throw error;
      }
      if (yearChangeRequestIdRef.current !== requestId) {
        return null;
      }
      setTerms(fetchedTerms);

      const nextTerm = buildSelectedTerm(fetchedTerms, null);
      setTermId(nextTerm?.id || "");
      setTermStatus(nextTerm?.status || "open");

      if (nextTerm) {
        persistAcademicContext(yearId, nextTerm.id);
        syncUrl(yearId, nextTerm.id, nextTerm.status);
      }

      return nextTerm;
    },
    [buildSelectedTerm, syncUrl]
  );

  const changeTerm = useCallback(
    (nextTermId: string) => {
      const nextTerm = terms.find((term) => term.id === nextTermId) || null;
      if (!nextTerm) {
        return null;
      }

      setTermId(nextTermId);
      setTermStatus(nextTerm.status);
      persistAcademicContext(academicYearId, nextTermId);
      syncUrl(academicYearId, nextTermId, nextTerm.status);
      return nextTerm;
    },
    [academicYearId, syncUrl, terms]
  );

  const selectedAcademicYear = useMemo(
    () => academicYears.find((year) => year.id === academicYearId) || null,
    [academicYearId, academicYears]
  );

  const selectedTerm = useMemo(
    () => terms.find((term) => term.id === termId) || null,
    [termId, terms]
  );

  return {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    terms,
    isInitializing,
    selectedAcademicYear,
    selectedTerm,
    changeAcademicYear,
    changeTerm,
    refreshAcademicYears,
    refreshTerms,
  };
}

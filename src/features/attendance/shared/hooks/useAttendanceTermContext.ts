/**
 * Unified Year/Term Context Hook for Attendance Module
 * 
 * Provides consistent year/term selection, URL synchronization, and read-only state
 * across all attendance tabs (Policies, Roll Call, Absences, Late/Early, Excuses).
 * 
 * Features:
 * - Standardized URL params (?year=&term=)
 * - Automatic default selection (prefers open terms)
 * - In-memory caching to avoid redundant fetches
 * - Consistent read-only behavior for closed terms
 * - Error handling with retry capability
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  persistAcademicContext,
  readPersistedAcademicContext,
} from "@/features/academics/hooks/useAcademicYearTermContext";

export type AttendanceTermContext = {
  // Data
  academicYears: AcademicYear[];
  terms: Term[];
  yearId: string | null;
  termId: string | null;
  termStatus: "open" | "closed" | null;
  termRange: { startDate: string; endDate: string } | null;
  
  // Derived state
  isReadOnly: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setYearId: (id: string) => void;
  setTermId: (id: string) => void;
  setYearAndTerm: (yearId: string, termId: string) => void;
  refresh: () => Promise<void>;
};

// In-memory cache for terms by yearId
const termsCache = new Map<string, Term[]>();

export function useAttendanceTermContext(): AttendanceTermContext {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [yearId, setYearIdState] = useState<string | null>(null);
  const [termId, setTermIdState] = useState<string | null>(null);
  const [termStatus, setTermStatus] = useState<"open" | "closed" | null>(null);
  const [termRange, setTermRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if we've initialized to avoid duplicate fetches
  const hasInitialized = useRef(false);
  const isCancelled = useRef(false);

  // Derived state
  const isReadOnly = termStatus === "closed";

  // Update URL with new year/term
  const updateURL = useCallback(
    (newYearId: string, newTermId: string) => {
      // Only update if we're still on an attendance page
      if (!pathname.includes('/attendance')) return;

      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : searchParams.toString()
      );
      params.set("year", newYearId);
      params.set("term", newTermId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  // Load terms for a specific year (with caching)
  const loadTermsForYear = useCallback(async (targetYearId: string): Promise<Term[]> => {
    // Check cache first
    if (termsCache.has(targetYearId)) {
      return termsCache.get(targetYearId)!;
    }

    // Fetch and cache
    const fetchedTerms = await fetchTermsByYear(targetYearId);
    termsCache.set(targetYearId, fetchedTerms);
    return fetchedTerms;
  }, []);

  // Initialize: Load years and set defaults
  const initialize = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch academic years
      const years = await fetchAcademicYears();
      if (isCancelled.current) return;

      setAcademicYears(years);

      // Read URL params (support both year/term and yearId/termId for backward compatibility)
      const urlYear = searchParams.get("year") || searchParams.get("yearId");
      const urlTerm = searchParams.get("term") || searchParams.get("termId");
      const persistedContext = readPersistedAcademicContext();
      const requestedYearId = urlYear || persistedContext?.academicYearId;
      const requestedTermId =
        urlTerm || (!urlYear ? persistedContext?.termId : undefined);

      // Select year
      const selectedYear = years.find((y) => y.id === requestedYearId) || years[0];
      if (!selectedYear || isCancelled.current) return;

      // Load terms for selected year
      const yearTerms = await loadTermsForYear(selectedYear.id);
      if (isCancelled.current) return;

      setTerms(yearTerms);

      // Select term (prefer URL, then open term, then first term)
      let selectedTerm = yearTerms.find((t) => t.id === requestedTermId);
      if (!selectedTerm) {
        selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
      }

      if (selectedTerm && !isCancelled.current) {
        setYearIdState(selectedYear.id);
        setTermIdState(selectedTerm.id);
        setTermStatus(selectedTerm.status);
        persistAcademicContext(selectedYear.id, selectedTerm.id);
        setTermRange({
          startDate: selectedTerm.startDate,
          endDate: selectedTerm.endDate,
        });

        // Update URL if needed
        if (urlYear !== selectedYear.id || urlTerm !== selectedTerm.id) {
          updateURL(selectedYear.id, selectedTerm.id);
        }
      }
    } catch (err) {
      if (!isCancelled.current) {
        console.error("Failed to initialize attendance term context:", err);
        setError("attendance.common.termContext.failedToLoadYears");
      }
    } finally {
      if (!isCancelled.current) {
        setIsLoading(false);
      }
    }
  }, [searchParams, loadTermsForYear, updateURL]);

  // Initialize on mount
  useEffect(() => {
    isCancelled.current = false;
    void Promise.resolve().then(initialize);

    return () => {
      isCancelled.current = true;
    };
  }, [initialize]);

  // Set year (loads terms and picks default term)
  const setYearId = useCallback(
    async (newYearId: string) => {
      // Avoid redundant work
      if (newYearId === yearId) return;

      try {
        setIsLoading(true);
        setError(null);

        const yearTerms = await loadTermsForYear(newYearId);
        if (isCancelled.current) return;

        setTerms(yearTerms);

        // Pick default term (prefer open, then first)
        const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        if (defaultTerm && !isCancelled.current) {
          setYearIdState(newYearId);
          setTermIdState(defaultTerm.id);
          setTermStatus(defaultTerm.status);
          setTermRange({
            startDate: defaultTerm.startDate,
            endDate: defaultTerm.endDate,
          });
          persistAcademicContext(newYearId, defaultTerm.id);
          updateURL(newYearId, defaultTerm.id);
        }
      } catch (err) {
        if (!isCancelled.current) {
          console.error("Failed to load terms for year:", err);
          setError("attendance.common.termContext.failedToLoadTerms");
        }
      } finally {
        if (!isCancelled.current) {
          setIsLoading(false);
        }
      }
    },
    [yearId, loadTermsForYear, updateURL]
  );

  // Set term (within current year)
  const setTermId = useCallback(
    (newTermId: string) => {
      // Avoid redundant work
      if (newTermId === termId) return;

      const selectedTerm = terms.find((t) => t.id === newTermId);
      if (selectedTerm && yearId) {
        setTermIdState(newTermId);
        setTermStatus(selectedTerm.status);
        setTermRange({
          startDate: selectedTerm.startDate,
          endDate: selectedTerm.endDate,
        });
        persistAcademicContext(yearId, newTermId);
        updateURL(yearId, newTermId);
      }
    },
    [termId, terms, yearId, updateURL]
  );

  // Set both year and term atomically
  const setYearAndTerm = useCallback(
    async (newYearId: string, newTermId: string) => {
      // Avoid redundant work
      if (newYearId === yearId && newTermId === termId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load terms if needed
        let yearTerms = terms;
        if (newYearId !== yearId) {
          yearTerms = await loadTermsForYear(newYearId);
          if (isCancelled.current) return;
          setTerms(yearTerms);
        }

        const selectedTerm = yearTerms.find((t) => t.id === newTermId);
        if (selectedTerm && !isCancelled.current) {
          setYearIdState(newYearId);
          setTermIdState(newTermId);
          setTermStatus(selectedTerm.status);
          setTermRange({
            startDate: selectedTerm.startDate,
            endDate: selectedTerm.endDate,
          });
          persistAcademicContext(newYearId, newTermId);
          updateURL(newYearId, newTermId);
        }
      } catch (err) {
        if (!isCancelled.current) {
          console.error("Failed to set year and term:", err);
          setError("attendance.common.termContext.failedToLoadTerms");
        }
      } finally {
        if (!isCancelled.current) {
          setIsLoading(false);
        }
      }
    },
    [yearId, termId, terms, loadTermsForYear, updateURL]
  );

  // Refresh: Clear cache and reload
  const refresh = useCallback(async () => {
    termsCache.clear();
    hasInitialized.current = false;
    await initialize();
  }, [initialize]);

  return {
    academicYears,
    terms,
    yearId,
    termId,
    termStatus,
    termRange,
    isReadOnly,
    isLoading,
    error,
    setYearId,
    setTermId,
    setYearAndTerm,
    refresh,
  };
}

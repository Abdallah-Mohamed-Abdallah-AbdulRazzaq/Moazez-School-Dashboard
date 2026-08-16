"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  persistAcademicContext,
  readPersistedAcademicContext,
} from "@/features/academics/hooks/useAcademicYearTermContext";

export type StudentsGuardiansYearTermContext = {
  academicYears: Array<{ id: string; nameAr?: string; nameEn?: string; name: string }>;
  terms: Term[];
  yearId: string | null;
  termId: string | null;
  termStatus: "open" | "closed" | null;
  isReadOnly: boolean;
  isLoading: boolean;
  error: string | null;
  setYearId: (id: string) => void;
  setTermId: (id: string) => void;
  setYearAndTerm: (yearId: string, termId: string) => void;
  refresh: () => Promise<void>;
};

const StudentsGuardiansYearTermContextValue =
  createContext<StudentsGuardiansYearTermContext | null>(null);

const termsCache = new Map<string, Term[]>();

function useStudentsGuardiansYearTermContextState(): StudentsGuardiansYearTermContext {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [academicYears, setAcademicYears] = useState<
    Array<{ id: string; nameAr?: string; nameEn?: string; name: string }>
  >([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [yearId, setYearIdState] = useState<string | null>(null);
  const [termId, setTermIdState] = useState<string | null>(null);
  const [termStatus, setTermStatus] = useState<"open" | "closed" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasInitialized = useRef(false);
  const isCancelled = useRef(false);
  const requestSequence = useRef(0);
  const yearIdRef = useRef<string | null>(null);
  const termIdRef = useRef<string | null>(null);

  const isReadOnly = termStatus === "closed";

  const updateURL = useCallback(
    (newYearId: string, newTermId: string) => {
      if (
        !pathname.includes("/students-guardians") &&
        !pathname.includes("/nedaa")
      ) {
        return;
      }

      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : searchParams.toString(),
      );
      params.set("year", newYearId);
      params.set("term", newTermId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadTermsForYear = useCallback(async (targetYearId: string): Promise<Term[]> => {
    if (termsCache.has(targetYearId)) {
      return termsCache.get(targetYearId)!;
    }

    const nextTerms = await fetchTermsByYear(targetYearId);
    termsCache.set(targetYearId, nextTerms);
    return nextTerms;
  }, []);

  const startRequest = useCallback(() => {
    requestSequence.current += 1;
    return requestSequence.current;
  }, []);

  const isStaleRequest = useCallback(
    (requestId: number) => isCancelled.current || requestId !== requestSequence.current,
    [],
  );

  const initialize = useCallback(async () => {
    const requestId = startRequest();
    try {
      setIsLoading(true);
      setError(null);

      const years = await fetchAcademicYears();
      if (isStaleRequest(requestId)) return;
      setAcademicYears(years);

      const urlYear = searchParams.get("year") || searchParams.get("yearId");
      const urlTerm = searchParams.get("term") || searchParams.get("termId");
      const persistedContext = readPersistedAcademicContext();
      const requestedYearId = urlYear || persistedContext?.academicYearId;
      const requestedTermId =
        urlTerm || (!urlYear ? persistedContext?.termId : undefined);

      const selectedYear = years.find((year) => year.id === requestedYearId) || years[0];
      if (!selectedYear) {
        setIsLoading(false);
        return;
      }

      const yearTerms = await loadTermsForYear(selectedYear.id);
      if (isStaleRequest(requestId)) return;
      setTerms(yearTerms);

      let selectedTerm = yearTerms.find((term) => term.id === requestedTermId);
      if (!selectedTerm) {
        selectedTerm = yearTerms.find((term) => term.status === "open") || yearTerms[0];
      }

      if (selectedTerm && !isStaleRequest(requestId)) {
        setYearIdState(selectedYear.id);
        setTermIdState(selectedTerm.id);
        setTermStatus(selectedTerm.status);
        persistAcademicContext(selectedYear.id, selectedTerm.id);

        if (urlYear !== selectedYear.id || urlTerm !== selectedTerm.id) {
          updateURL(selectedYear.id, selectedTerm.id);
        }
      }
    } catch (err) {
      if (!isStaleRequest(requestId)) {
        console.error("Failed to initialize students-guardians year/term context:", err);
        setError("students_guardians.shared.year_term_context.errors.failed_to_load");
      }
    } finally {
      if (!isStaleRequest(requestId)) {
        setIsLoading(false);
      }
    }
  }, [isStaleRequest, loadTermsForYear, searchParams, startRequest, updateURL]);

  useEffect(() => {
    yearIdRef.current = yearId;
    termIdRef.current = termId;
  }, [termId, yearId]);

  useEffect(() => {
    isCancelled.current = false;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      void initialize();

      return () => {
        isCancelled.current = true;
      };
    }

    const urlYear = searchParams.get("year") || searchParams.get("yearId");
    const urlTerm = searchParams.get("term") || searchParams.get("termId");
    if (
      urlYear &&
      urlTerm &&
      (urlYear !== yearIdRef.current || urlTerm !== termIdRef.current)
    ) {
      void initialize();
    }

    return () => {
      isCancelled.current = true;
    };
  }, [initialize, searchParams]);

  const setYearId = useCallback(
    async (newYearId: string) => {
      if (newYearId === yearId) return;
      const requestId = startRequest();

      try {
        setIsLoading(true);
        setError(null);
        setYearIdState(newYearId);
        setTerms([]);
        setTermIdState(null);
        setTermStatus(null);

        const yearTerms = await loadTermsForYear(newYearId);
        if (isStaleRequest(requestId)) return;

        setTerms(yearTerms);

        const defaultTerm = yearTerms.find((term) => term.status === "open") || yearTerms[0];
        if (!defaultTerm) return;

        setYearIdState(newYearId);
        setTermIdState(defaultTerm.id);
        setTermStatus(defaultTerm.status);
        persistAcademicContext(newYearId, defaultTerm.id);
        updateURL(newYearId, defaultTerm.id);
      } catch (err) {
        if (!isStaleRequest(requestId)) {
          console.error("Failed to load students-guardians terms for year:", err);
          setError("students_guardians.shared.year_term_context.errors.failed_to_load_terms");
        }
      } finally {
        if (!isStaleRequest(requestId)) {
          setIsLoading(false);
        }
      }
    },
    [isStaleRequest, loadTermsForYear, startRequest, updateURL, yearId],
  );

  const setTermId = useCallback(
    (newTermId: string) => {
      if (newTermId === termId) return;

      const selectedTerm = terms.find((term) => term.id === newTermId);
      if (!selectedTerm || !yearId) return;

      setTermIdState(newTermId);
      setTermStatus(selectedTerm.status);
      persistAcademicContext(yearId, newTermId);
      updateURL(yearId, newTermId);
    },
    [termId, terms, updateURL, yearId],
  );

  const setYearAndTerm = useCallback(
    async (newYearId: string, newTermId: string) => {
      if (newYearId === yearId && newTermId === termId) return;
      const requestId = startRequest();

      try {
        setIsLoading(true);
        setError(null);
        setYearIdState(newYearId);
        if (newYearId !== yearId) {
          setTerms([]);
          setTermIdState(null);
          setTermStatus(null);
        }

        let yearTerms = terms;
        if (newYearId !== yearId) {
          yearTerms = await loadTermsForYear(newYearId);
          if (isStaleRequest(requestId)) return;
          setTerms(yearTerms);
        }

        const selectedTerm = yearTerms.find((term) => term.id === newTermId);
        if (!selectedTerm) return;

        setYearIdState(newYearId);
        setTermIdState(newTermId);
        setTermStatus(selectedTerm.status);
        persistAcademicContext(newYearId, newTermId);
        updateURL(newYearId, newTermId);
      } catch (err) {
        if (!isStaleRequest(requestId)) {
          console.error("Failed to set students-guardians year/term:", err);
          setError("students_guardians.shared.year_term_context.errors.failed_to_load_terms");
        }
      } finally {
        if (!isStaleRequest(requestId)) {
          setIsLoading(false);
        }
      }
    },
    [isStaleRequest, loadTermsForYear, startRequest, termId, terms, updateURL, yearId],
  );

  const refresh = useCallback(async () => {
    termsCache.clear();
    await initialize();
  }, [initialize]);

  return {
    academicYears,
    terms,
    yearId,
    termId,
    termStatus,
    isReadOnly,
    isLoading,
    error,
    setYearId,
    setTermId,
    setYearAndTerm,
    refresh,
  };
}

export function StudentsGuardiansYearTermProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useStudentsGuardiansYearTermContextState();

  return (
    <StudentsGuardiansYearTermContextValue.Provider value={value}>
      {children}
    </StudentsGuardiansYearTermContextValue.Provider>
  );
}

export function useStudentsGuardiansYearTermContext(): StudentsGuardiansYearTermContext {
  const context = useContext(StudentsGuardiansYearTermContextValue);

  if (!context) {
    throw new Error(
      "useStudentsGuardiansYearTermContext must be used within StudentsGuardiansYearTermProvider",
    );
  }

  return context;
}

export function useOptionalStudentsGuardiansYearTermContext(): StudentsGuardiansYearTermContext | null {
  return useContext(StudentsGuardiansYearTermContextValue);
}




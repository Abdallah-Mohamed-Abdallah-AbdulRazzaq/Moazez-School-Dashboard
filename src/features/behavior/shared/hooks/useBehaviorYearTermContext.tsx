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
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  persistAcademicContext,
  readPersistedAcademicContext,
} from "@/features/academics/hooks/useAcademicYearTermContext";

export type BehaviorYearTermContextValue = {
  academicYears: AcademicYear[];
  terms: Term[];
  yearId: string | null;
  termId: string | null;
  termStatus: "open" | "closed" | null;
  isReadOnly: boolean;
  isLoading: boolean;
  error: string | null;
  setYearId: (id: string) => void;
  setTermId: (id: string) => void;
  refresh: () => Promise<void>;
};

const BehaviorYearTermContext =
  createContext<BehaviorYearTermContextValue | null>(null);

const termsCache = new Map<string, Term[]>();

function useBehaviorYearTermContextState(): BehaviorYearTermContextValue {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
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
    (nextYearId: string, nextTermId: string) => {
      if (!pathname.includes("/behavior")) return;

      const params = new URLSearchParams(
        typeof window !== "undefined"
          ? window.location.search
          : searchParams.toString(),
      );
      params.set("year", nextYearId);
      params.set("term", nextTermId);

      const nextQuery = params.toString();
      const currentQuery =
        typeof window !== "undefined"
          ? window.location.search.replace(/^\?/, "")
          : searchParams.toString();

      if (nextQuery === currentQuery) return;

      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadTermsForYear = useCallback(async (targetYearId: string) => {
    if (termsCache.has(targetYearId)) {
      return termsCache.get(targetYearId) ?? [];
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
    (requestId: number) =>
      isCancelled.current || requestId !== requestSequence.current,
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

      const urlYear = searchParams.get("year");
      const urlTerm = searchParams.get("term");
      const persistedContext = readPersistedAcademicContext();
      const requestedYearId = urlYear || persistedContext?.academicYearId;
      const requestedTermId =
        urlTerm || (!urlYear ? persistedContext?.termId : undefined);
      const selectedYear = years.find((year) => year.id === requestedYearId) ?? years[0];

      if (!selectedYear) {
        setYearIdState(null);
        setTermIdState(null);
        setTermStatus(null);
        setTerms([]);
        return;
      }

      const nextTerms = await loadTermsForYear(selectedYear.id);
      if (isStaleRequest(requestId)) return;

      setTerms(nextTerms);

      const selectedTerm =
        nextTerms.find((term) => term.id === requestedTermId) ??
        nextTerms.find((term) => term.status === "open") ??
        nextTerms[0];

      if (!selectedTerm) {
        setYearIdState(selectedYear.id);
        setTermIdState(null);
        setTermStatus(null);
        return;
      }

      setYearIdState(selectedYear.id);
      setTermIdState(selectedTerm.id);
      setTermStatus(selectedTerm.status);
      persistAcademicContext(selectedYear.id, selectedTerm.id);

      if (urlYear !== selectedYear.id || urlTerm !== selectedTerm.id) {
        updateURL(selectedYear.id, selectedTerm.id);
      }
    } catch (err) {
      if (!isStaleRequest(requestId)) {
        console.error("Failed to initialize behavior year/term context:", err);
        setError("behavior.context_bar.errors.failed_to_load");
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

    const urlYear = searchParams.get("year");
    const urlTerm = searchParams.get("term");
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
    async (nextYearId: string) => {
      if (nextYearId === yearId) return;

      const requestId = startRequest();

      try {
        setIsLoading(true);
        setError(null);
        setYearIdState(nextYearId);
        setTerms([]);
        setTermIdState(null);
        setTermStatus(null);

        const nextTerms = await loadTermsForYear(nextYearId);
        if (isStaleRequest(requestId)) return;

        setTerms(nextTerms);

        const nextTerm =
          nextTerms.find((term) => term.status === "open") ?? nextTerms[0];

        if (!nextTerm) return;

        setYearIdState(nextYearId);
        setTermIdState(nextTerm.id);
        setTermStatus(nextTerm.status);
        persistAcademicContext(nextYearId, nextTerm.id);
        updateURL(nextYearId, nextTerm.id);
      } catch (err) {
        if (!isStaleRequest(requestId)) {
          console.error("Failed to load behavior terms for year:", err);
          setError("behavior.context_bar.errors.failed_to_load_terms");
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
    (nextTermId: string) => {
      if (nextTermId === termId || !yearId) return;

      const selectedTerm = terms.find((term) => term.id === nextTermId);
      if (!selectedTerm) return;

      setTermIdState(nextTermId);
      setTermStatus(selectedTerm.status);
      persistAcademicContext(yearId, nextTermId);
      updateURL(yearId, nextTermId);
    },
    [termId, terms, updateURL, yearId],
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
    refresh,
  };
}

export function BehaviorYearTermProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useBehaviorYearTermContextState();

  return (
    <BehaviorYearTermContext.Provider value={value}>
      {children}
    </BehaviorYearTermContext.Provider>
  );
}

export function useBehaviorYearTermContext(): BehaviorYearTermContextValue {
  const context = useContext(BehaviorYearTermContext);

  if (!context) {
    throw new Error(
      "useBehaviorYearTermContext must be used within BehaviorYearTermProvider",
    );
  }

  return context;
}

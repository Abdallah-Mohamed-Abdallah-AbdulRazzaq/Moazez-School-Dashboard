"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAcademicYears,
  fetchStructureTree,
  fetchTermsByYear,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchRooms } from "@/features/academics/rooms/services/roomsService";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import { fetchBrandingProfile } from "@/features/settings/services/brandingService";
import { useAuth } from "@/hooks/use-auth";
import type {
  AcademicContextSetupData,
  ResourceState,
  SetupSnapshot,
  SetupStepId,
  SubjectsSetupData,
} from "../types";
import { evaluateSetup } from "../utils/setupStatus";

const emptyAcademicContext: AcademicContextSetupData = {
  years: [],
  termsByYear: {},
};

const emptyStructure = {
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
};

const emptySubjects: SubjectsSetupData = {
  subjects: [],
  allocations: [],
};

function loading<T>(data?: T): ResourceState<T> {
  return data === undefined ? { status: "loading" } : { status: "loading", data };
}

function success<T>(data: T): ResourceState<T> {
  return { status: "success", data };
}

function error<T>(value: unknown, data?: T): ResourceState<T> {
  const message = value instanceof Error ? value.message : String(value);
  return data === undefined ? { status: "error", error: message } : { status: "error", error: message, data };
}

function createInitialSnapshot(): SetupSnapshot {
  return {
    organization: { status: "loading" },
    academicContext: { status: "loading", data: emptyAcademicContext },
    structure: { status: "loading", data: emptyStructure },
    subjects: { status: "loading", data: emptySubjects },
    rooms: { status: "loading", data: [] },
  };
}

function selectYear(years: AcademicYear[]) {
  return years.find((year) => year.isActive) ?? years[0] ?? null;
}

function selectTerm(terms: Term[]) {
  return terms.find((term) => term.status === "open") ?? terms[0] ?? null;
}

async function loadAcademicContext() {
  const years = await fetchAcademicYears();
  const termEntries = await Promise.all(
    years.map(async (year) => [year.id, await fetchTermsByYear(year.id)] as const),
  );
  const termsByYear = Object.fromEntries(termEntries);
  const selectedYear = selectYear(years);
  const selectedTerm = selectedYear ? selectTerm(termsByYear[selectedYear.id] ?? []) : null;

  return {
    data: { years, termsByYear },
    selectedYear,
    selectedTerm,
  };
}

export interface UseSetupStatusResult {
  snapshot: SetupSnapshot;
  evaluation: ReturnType<typeof evaluateSetup>;
  selectedYear: AcademicYear | null;
  selectedTerm: Term | null;
  schoolId: string;
  refreshStep(stepId: SetupStepId): Promise<void>;
  retryStep(stepId: SetupStepId): Promise<void>;
}

export function useSetupStatus(): UseSetupStatusResult {
  const { user, isLoading: authLoading } = useAuth();
  const schoolId = user?.activeMembership?.schoolId ?? "";
  const [snapshot, setSnapshot] = useState<SetupSnapshot>(() => createInitialSnapshot());
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const isMountedRef = useRef(true);

  const updateSnapshot = useCallback((updater: Parameters<typeof setSnapshot>[0]) => {
    if (isMountedRef.current) {
      setSnapshot(updater);
    }
  }, []);

  const updateSelectedContext = useCallback((year: AcademicYear | null, term: Term | null) => {
    if (!isMountedRef.current) {
      return;
    }

    setSelectedYear(year);
    setSelectedTerm(term);
  }, []);

  const loadOrganization = useCallback(async () => {
    updateSnapshot((current) => ({
      ...current,
      organization: loading(current.organization.data),
    }));

    try {
      const profile = await fetchBrandingProfile();
      updateSnapshot((current) => ({ ...current, organization: success(profile) }));
    } catch (caught) {
      updateSnapshot((current) => ({ ...current, organization: error(caught, current.organization.data) }));
    }
  }, [updateSnapshot]);

  const loadRooms = useCallback(async () => {
    updateSnapshot((current) => ({ ...current, rooms: loading(current.rooms.data ?? []) }));

    if (!schoolId) {
      updateSnapshot((current) => ({ ...current, rooms: error("No school selected", current.rooms.data ?? []) }));
      return;
    }

    try {
      const rooms = await fetchRooms(schoolId);
      updateSnapshot((current) => ({ ...current, rooms: success(rooms) }));
    } catch (caught) {
      updateSnapshot((current) => ({ ...current, rooms: error(caught, current.rooms.data ?? []) }));
    }
  }, [schoolId, updateSnapshot]);

  const loadStructure = useCallback(async (year: AcademicYear | null, term: Term | null) => {
    updateSnapshot((current) => ({ ...current, structure: loading(current.structure.data ?? emptyStructure) }));

    if (!year || !term) {
      updateSnapshot((current) => ({ ...current, structure: success(emptyStructure) }));
      return;
    }

    try {
      const structure = await fetchStructureTree(year.id, term.id);
      updateSnapshot((current) => ({ ...current, structure: success(structure) }));
    } catch (caught) {
      updateSnapshot((current) => ({ ...current, structure: error(caught, current.structure.data ?? emptyStructure) }));
    }
  }, [updateSnapshot]);

  const loadSubjects = useCallback(async (term: Term | null) => {
    updateSnapshot((current) => ({ ...current, subjects: loading(current.subjects.data ?? emptySubjects) }));

    if (!term) {
      updateSnapshot((current) => ({ ...current, subjects: success(emptySubjects) }));
      return;
    }

    try {
      const [subjects, allocations] = await Promise.all([
        fetchSubjects(),
        fetchSubjectAllocations(term.id),
      ]);
      updateSnapshot((current) => ({ ...current, subjects: success({ subjects, allocations }) }));
    } catch (caught) {
      updateSnapshot((current) => ({ ...current, subjects: error(caught, current.subjects.data ?? emptySubjects) }));
    }
  }, [updateSnapshot]);

  const loadAcademicAndDependents = useCallback(async () => {
    updateSnapshot((current) => ({
      ...current,
      academicContext: loading(current.academicContext.data ?? emptyAcademicContext),
      structure: loading(current.structure.data ?? emptyStructure),
      subjects: loading(current.subjects.data ?? emptySubjects),
    }));

    try {
      const context = await loadAcademicContext();
      updateSelectedContext(context.selectedYear, context.selectedTerm);
      updateSnapshot((current) => ({ ...current, academicContext: success(context.data) }));

      await Promise.all([
        loadStructure(context.selectedYear, context.selectedTerm),
        loadSubjects(context.selectedTerm),
      ]);
    } catch (caught) {
      updateSelectedContext(null, null);
      updateSnapshot((current) => ({
        ...current,
        academicContext: error(caught, current.academicContext.data ?? emptyAcademicContext),
        structure: success(emptyStructure),
        subjects: success(emptySubjects),
      }));
    }
  }, [loadStructure, loadSubjects, updateSelectedContext, updateSnapshot]);

  const refreshStep = useCallback(
    async (stepId: SetupStepId) => {
      switch (stepId) {
        case "organization":
          await loadOrganization();
          return;
        case "academicContext":
          await loadAcademicAndDependents();
          return;
        case "structure":
          await loadStructure(selectedYear, selectedTerm);
          return;
        case "subjects":
          await loadSubjects(selectedTerm);
          return;
        case "rooms":
          await loadRooms();
      }
    },
    [loadAcademicAndDependents, loadOrganization, loadRooms, loadStructure, loadSubjects, selectedTerm, selectedYear],
  );

  const retryStep = useCallback(
    async (stepId: SetupStepId) => {
      await refreshStep(stepId);
    },
    [refreshStep],
  );

  useEffect(() => {
    isMountedRef.current = true;
    if (authLoading) {
      return () => {
        isMountedRef.current = false;
      };
    }

    async function loadInitial() {
      await Promise.all([loadOrganization(), loadAcademicAndDependents(), loadRooms()]);
    }

    void loadInitial();

    return () => {
      isMountedRef.current = false;
    };
  }, [authLoading, loadAcademicAndDependents, loadOrganization, loadRooms]);

  const evaluation = useMemo(() => evaluateSetup(snapshot), [snapshot]);

  return {
    snapshot,
    evaluation,
    selectedYear,
    selectedTerm,
    schoolId,
    refreshStep,
    retryStep,
  };
}

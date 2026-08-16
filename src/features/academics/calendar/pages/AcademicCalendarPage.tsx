"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, Download } from "lucide-react";
import { Snackbar, Alert } from "@mui/material";
import { AccessDenied } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import CalendarToolbar from "../components/CalendarToolbar";
import MonthCalendar from "../components/MonthCalendar";
import WeekCalendar from "../components/WeekCalendar";
import AgendaView from "../components/AgendaView";
import EventDialog from "../components/EventDialog";
import MoveEventDialog from "../components/MoveEventDialog";
import type { CalendarScopeTargetOption } from "@/features/academics/calendar/types";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
import {
  fetchCalendarEvents,
  formatCalendarDate,
  updateEvent,
  AcademicEvent,
} from "@/features/academics/calendar/services/calendarService";
import { getCalendarErrorMessage } from "@/features/academics/calendar/services/calendarErrors";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";

function getCalendarViewRange(view: "month" | "week" | "agenda", date: Date) {
  const d = new Date(date);
  if (view === "month") {
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = firstDayOfMonth.getDay();
    const from = new Date(firstDayOfMonth);
    from.setDate(from.getDate() - startOffset);
    const endOffset = 6 - lastDayOfMonth.getDay();
    const to = new Date(lastDayOfMonth);
    to.setDate(to.getDate() + endOffset);
    return {
      from: formatCalendarDate(from),
      to: formatCalendarDate(to),
    };
  } else if (view === "week") {
    const from = new Date(d);
    from.setDate(d.getDate() - d.getDay());
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return {
      from: formatCalendarDate(from),
      to: formatCalendarDate(to),
    };
  } else {
    const from = new Date(d);
    const to = new Date(d);
    to.setDate(to.getDate() + 90);
    return {
      from: formatCalendarDate(from),
      to: formatCalendarDate(to),
    };
  }
}

export default function AcademicCalendarPage() {
  const t = useTranslations("academics.calendar");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    academicYearId,
    termId,
    termStatus,
    isInitializing,
    selectedTerm,
  } = useAcademicYearTermLayoutContext();

  const { hasPermission } = usePermissions();
  const canView = hasPermission("academics.calendar.view");
  const canManage = hasPermission("academics.calendar.manage");

  const [defaultDate] = useState(() => new Date());
  const eventsRequestIdRef = useRef(0);
  const structureRequestIdRef = useRef(0);

  const queryState = useMemo(() => {
    const rawDate = searchParams.get("date");
    const parsedDate =
      rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? new Date(`${rawDate}T00:00:00`)
        : null;
    const validDate =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : defaultDate;

    const rawTypes = (searchParams.get("types") || "")
      .split(",")
      .filter(Boolean) as AcademicEvent["type"][];
    const validTypes = rawTypes.filter((type) =>
      ["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"].includes(type)
    ) as AcademicEvent["type"][];

    const rawScope = searchParams.get("scope");
    const validScope =
      rawScope &&
      ["ALL", "SCHOOL", "STAGE", "GRADE", "SECTION"].includes(rawScope)
        ? (rawScope as "ALL" | AcademicEvent["scopeType"])
        : "ALL";

    const rawScopeId = searchParams.get("scopeId");

    const rawView = searchParams.get("view");
    const validView =
      rawView && ["month", "week", "agenda"].includes(rawView)
        ? (rawView as "month" | "week" | "agenda")
        : "month";

    const rawMode = searchParams.get("mode");
    const validMode =
      rawMode && ["compact", "comfortable", "minimal"].includes(rawMode)
        ? (rawMode as "compact" | "comfortable" | "minimal")
        : "compact";

    return {
      currentDate: validDate,
      typeFilters:
        validTypes.length > 0
          ? validTypes
          : (["HOLIDAY", "EXAM", "ACTIVITY", "OTHER"] as AcademicEvent["type"][]),
      scopeFilter: validScope,
      scopeIdFilter: rawScopeId || null,
      view: validView,
      displayMode: validMode,
    };
  }, [searchParams, defaultDate]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(queryState.currentDate);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AcademicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(canView);

  // Scope options
  const [stages, setStages] = useState<CalendarScopeTargetOption[]>([]);
  const [grades, setGrades] = useState<CalendarScopeTargetOption[]>([]);
  const [sections, setSections] = useState<CalendarScopeTargetOption[]>([]);

  // Load structure data for scope target filter
  useEffect(() => {
    if (!canView) {
      return;
    }

    const requestId = ++structureRequestIdRef.current;

    if (!academicYearId || !termId) {
      void Promise.resolve().then(() => {
        setStages([]);
        setGrades([]);
        setSections([]);
      });
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.debug("[Calendar] loadStructureTree", {
        academicYearId,
        termId,
      });
    }

    fetchStructureTree(academicYearId, termId)
      .then((structure) => {
        if (requestId !== structureRequestIdRef.current) return;
        setStages(
          structure.stages.map((s) => ({
            id: s.id,
            name: s.name,
            nameAr: s.nameAr,
            nameEn: s.nameEn,
          }))
        );
        setGrades(
          structure.grades.map((g) => ({
            id: g.id,
            name: g.name,
            nameAr: g.nameAr,
            nameEn: g.nameEn,
          }))
        );
        setSections(
          structure.sections.map((s) => ({
            id: s.id,
            name: s.name,
            nameAr: s.nameAr,
            nameEn: s.nameEn,
          }))
        );
      })
      .catch((error) => {
        if (requestId !== structureRequestIdRef.current) return;
        console.error("Failed to load structure:", error);
        setStages([]);
        setGrades([]);
        setSections([]);
      });
  }, [academicYearId, canView, termId]);

  // View and display mode state
  const [view, setView] = useState<"month" | "week" | "agenda">(queryState.view);
  const [displayMode, setDisplayMode] = useState<"compact" | "comfortable" | "minimal">(queryState.displayMode);

  // Filters
  const [typeFilters, setTypeFilters] = useState<AcademicEvent["type"][]>(queryState.typeFilters);
  const [scopeFilter, setScopeFilter] = useState<"ALL" | AcademicEvent["scopeType"]>(queryState.scopeFilter);
  const [scopeIdFilter, setScopeIdFilter] = useState<string | null>(queryState.scopeIdFilter);

  // Dialog state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  
  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingEvent, setMovingEvent] = useState<AcademicEvent | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const isTermClosed = termStatus === "closed";
  const isReadOnly = isTermClosed || !canManage;
  const term = selectedTerm;

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: term?.name || termId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columns: ExportColumn[] = [
      { key: "title", label: locale === "ar" ? "العنوان" : "Title" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "scope", label: locale === "ar" ? "النطاق" : "Scope" },
      { key: "allDay", label: locale === "ar" ? "طوال اليوم" : "All day" },
      {
        key: "startDate",
        label: locale === "ar" ? "تاريخ البداية" : "Start date",
      },
      { key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End date" },
      { key: "notes", label: locale === "ar" ? "ملاحظات" : "Notes" },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename("academic-calendar", termId),
      format,
      columns,
      rows: filteredEvents.map((event) => ({
        title: event.title,
        type: t(`event_types.${event.type.toLowerCase()}`),
        scope: t(`scopes.${event.scopeType.toLowerCase()}`),
        allDay: event.allDay ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No",
        startDate: event.startDate,
        endDate: event.endDate,
        notes: event.notes || "",
      })),
      locale: format === "json" ? "en" : undefined,
      jsonData: {
        title: "Academic Calendar",
        metadata,
        filters: {
          scope: scopeFilter,
          view,
          displayMode,
          typeFilters,
          currentDate: currentDate.toISOString(),
        },
        events: filteredEvents.map((event) => ({
          id: event.id,
          title: event.title,
          type: event.type,
          scopeType: event.scopeType,
          allDay: event.allDay,
          startDate: event.startDate,
          endDate: event.endDate,
          notes: event.notes || "",
        })),
      },
    });
  };

  useEffect(() => {
    const nextDateKey = formatCalendarDate(queryState.currentDate);
    const currentDateKey = formatCalendarDate(currentDate);
    if (nextDateKey !== currentDateKey) {
      void Promise.resolve().then(() => setCurrentDate(queryState.currentDate));
    }
  }, [queryState.currentDate, currentDate]);

  useEffect(() => {
    if (queryState.typeFilters.join(",") !== typeFilters.join(",")) {
      void Promise.resolve().then(() => setTypeFilters(queryState.typeFilters));
    }
  }, [queryState.typeFilters, typeFilters]);

  useEffect(() => {
    if (queryState.scopeFilter !== scopeFilter) {
      void Promise.resolve().then(() => setScopeFilter(queryState.scopeFilter));
    }
  }, [queryState.scopeFilter, scopeFilter]);

  useEffect(() => {
    if (queryState.scopeIdFilter !== scopeIdFilter) {
      void Promise.resolve().then(() => setScopeIdFilter(queryState.scopeIdFilter));
    }
  }, [queryState.scopeIdFilter, scopeIdFilter]);

  useEffect(() => {
    if (queryState.view !== view) {
      void Promise.resolve().then(() => setView(queryState.view));
    }
  }, [queryState.view, view]);

  useEffect(() => {
    if (queryState.displayMode !== displayMode) {
      void Promise.resolve().then(() => setDisplayMode(queryState.displayMode));
    }
  }, [queryState.displayMode, displayMode]);

  const filterEvents = useCallback(
    (sourceEvents: AcademicEvent[]) => {
      let filtered = sourceEvents.filter((event) =>
        typeFilters.includes(event.type)
      );

      if (scopeFilter !== "ALL") {
        filtered = filtered.filter((event) => event.scopeType === scopeFilter);
        if (scopeIdFilter) {
          filtered = filtered.filter((event) => event.scopeId === scopeIdFilter);
        }
      }

      return filtered;
    },
    [scopeFilter, scopeIdFilter, typeFilters]
  );

  const loadEvents = useCallback(async () => {
    const requestId = ++eventsRequestIdRef.current;

    if (!canView || !academicYearId || !termId) {
      setIsLoading(false);
      return;
    }

    try {
      const { from, to } = getCalendarViewRange(view, currentDate);

      if (process.env.NODE_ENV === "development") {
        console.debug("[Calendar] loadEvents", {
          academicYearId,
          termId,
          view,
          currentDate: formatCalendarDate(currentDate),
          from,
          to,
        });
      }

      const allEvents: AcademicEvent[] = [];
      let cursor: string | undefined;

      do {
        const res = await fetchCalendarEvents({
          academicYearId,
          termId,
          from,
          to,
          limit: 100,
          cursor,
        });

        if (requestId !== eventsRequestIdRef.current) return;

        allEvents.push(...res.items);
        cursor = res.nextCursor || undefined;
      } while (cursor);

      setEvents(allEvents);
    } catch (error) {
      if (requestId !== eventsRequestIdRef.current) return;
      console.error("Failed to load events:", error);
      setSnackbar({
        open: true,
        message: getCalendarErrorMessage(error, (key) => t(`errors.${key}`)),
        severity: "error",
      });
    } finally {
      if (requestId === eventsRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [academicYearId, canView, currentDate, t, termId, view]);

  // Load events when dependencies change
  useEffect(() => {
    if (!canView || isInitializing) {
      return;
    }

    void Promise.resolve().then(loadEvents);
  }, [canView, isInitializing, loadEvents]);

  // Apply filters when events or filters change
  useEffect(() => {
    if (!canView) {
      return;
    }
    void Promise.resolve().then(() => setFilteredEvents(filterEvents(events)));
  }, [canView, events, filterEvents]);

  const updateURL = useCallback(
    (
      yearId: string,
      tId: string,
      state: {
        currentDate?: Date;
        currentView?: "month" | "week" | "agenda";
        currentMode?: "compact" | "comfortable" | "minimal";
        currentTypeFilters?: AcademicEvent["type"][];
        currentScopeFilter?: "ALL" | AcademicEvent["scopeType"];
        currentScopeIdFilter?: string | null;
      },
      historyMode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
      const nextDate = state.currentDate ?? currentDate;
      const formattedDate = [
        nextDate.getFullYear(),
        String(nextDate.getMonth() + 1).padStart(2, "0"),
        String(nextDate.getDate()).padStart(2, "0"),
      ].join("-");
      params.set("date", formattedDate);

      const nextView = state.currentView ?? view;
      const nextMode = state.currentMode ?? displayMode;
      const nextTypes = state.currentTypeFilters ?? typeFilters;
      const nextScope = state.currentScopeFilter ?? scopeFilter;
      const nextScopeId =
        state.currentScopeIdFilter !== undefined
          ? state.currentScopeIdFilter
          : scopeIdFilter;
      const normalizedScopeId =
        nextScope === "STAGE" || nextScope === "GRADE" || nextScope === "SECTION"
          ? nextScopeId
          : null;

      params.set("view", nextView);
      params.set("mode", nextMode);

      if (nextTypes.length > 0 && nextTypes.length < 4) {
        params.set("types", nextTypes.join(","));
      }

      if (nextScope !== "ALL") {
        params.set("scope", nextScope);
      }
      if (normalizedScopeId) {
        params.set("scopeId", normalizedScopeId);
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = `?${nextQuery}`;
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [currentDate, displayMode, router, scopeFilter, scopeIdFilter, searchParams, typeFilters, view]
  );

  const handleViewChange = (newView: "month" | "week" | "agenda") => {
    updateURL(
      academicYearId,
      termId,
      {
        currentView: newView,
      },
      "push"
    );
  };

  const handleDisplayModeChange = (newMode: "compact" | "comfortable" | "minimal") => {
    updateURL(
      academicYearId,
      termId,
      {
        currentMode: newMode,
      },
      "push"
    );
  };

  const handleDateChange = useCallback(
    (date: Date) => {
      updateURL(
        academicYearId,
        termId,
        {
          currentDate: date,
        },
        "push"
      );
    },
    [academicYearId, termId, updateURL]
  );

  const handleTypeFiltersChange = useCallback(
    (filters: AcademicEvent["type"][]) => {
      updateURL(
        academicYearId,
        termId,
        {
          currentTypeFilters: filters,
        },
        "push"
      );
    },
    [academicYearId, termId, updateURL]
  );

  const handleScopeFilterChange = useCallback(
    (scope: "ALL" | AcademicEvent["scopeType"]) => {
      updateURL(
        academicYearId,
        termId,
        {
          currentScopeFilter: scope,
          currentScopeIdFilter: null,
        },
        "push"
      );
    },
    [academicYearId, termId, updateURL]
  );

  const handleAddEvent = (date?: Date) => {
    if (isReadOnly) return;
    setEditingEvent(null);
    setPrefilledDate(date || null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: AcademicEvent) => {
    setEditingEvent(event);
    setPrefilledDate(null);
    setShowEventDialog(true);
  };

  const handleEventSuccess = async () => {
    await loadEvents();
    setShowEventDialog(false);
    setEditingEvent(null);
    setPrefilledDate(null);
  };

  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setEditingEvent(null);
    setPrefilledDate(null);
  };

  const handleEventMove = async (
    eventId: string,
    newStartDate: string,
    newEndDate: string
  ) => {
    if (isReadOnly) return;

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Optimistic update
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, startDate: newStartDate, endDate: newEndDate } : e
    );
    setEvents(updatedEvents);
    setFilteredEvents(filterEvents(updatedEvents));

    try {
      await updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate,
      });

      setSnackbar({
        open: true,
        message: t("eventMoved"),
        severity: "success",
      });
    } catch (error) {
      // Rollback on failure
      await loadEvents();
      setSnackbar({
        open: true,
        message: getCalendarErrorMessage(error, (key) => t(`errors.${key}`)),
        severity: "error",
      });
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-gray-50">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  if (!isInitializing && (!academicYearId || !termId)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Term Selected
          </h2>
          <p className="text-gray-500">
            {t("select_term_first")}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Read-Only Banner */}
      {isTermClosed && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readonly_banner")}</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-4 md:p-6">
          <div className="mb-4 flex items-center justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {tExport("button")}
            </Button>
          </div>

          {/* Calendar Toolbar */}
          <CalendarToolbar
            currentDate={currentDate}
            onDateChange={handleDateChange}
            typeFilters={typeFilters}
            onTypeFiltersChange={handleTypeFiltersChange}
            scopeFilter={scopeFilter}
            onScopeFilterChange={handleScopeFilterChange}
            scopeIdFilter={scopeIdFilter}
            onScopeIdFilterChange={(id) => {
              updateURL(academicYearId!, termId!, { currentScopeIdFilter: id }, "push");
            }}
            onAddEvent={() => handleAddEvent()}
            onRefresh={loadEvents}
            isReadOnly={isReadOnly}
            view={view}
            onViewChange={handleViewChange}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
            academicYearId={academicYearId || undefined}
            termId={termId || undefined}
            stages={stages}
            grades={grades}
            sections={sections}
          />

          {/* Calendar Views */}
          {term && view === "month" && (
            <MonthCalendar
              currentDate={currentDate}
              events={filteredEvents}
              onDateClick={handleAddEvent}
              onEventClick={handleEditEvent}
              isReadOnly={isReadOnly}
              term={term}
              onEventMove={handleEventMove}
              onInvalidDrop={() => {
                setSnackbar({
                  open: true,
                  message: t("dropOutsideTerm"),
                  severity: "error",
                });
              }}
              displayMode={displayMode}
            />
          )}

          {term && view === "week" && (
            <WeekCalendar
              currentDate={currentDate}
              events={filteredEvents}
              onDateClick={handleAddEvent}
              onEventClick={handleEditEvent}
              isReadOnly={isReadOnly}
              term={term}
              onEventMove={handleEventMove}
              onInvalidDrop={() => {
                setSnackbar({
                  open: true,
                  message: t("dropOutsideTerm"),
                  severity: "error",
                });
              }}
              displayMode={displayMode}
            />
          )}

          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={handleEditEvent}
            />
          )}
        </div>
      </div>

      {/* Event Dialog */}
      {term && (
        <EventDialog
          isOpen={showEventDialog}
          onClose={handleCloseDialog}
          onSuccess={handleEventSuccess}
          event={editingEvent}
          academicYearId={academicYearId || ""}
          termId={termId || ""}
          prefilledDate={prefilledDate}
          isReadOnly={isReadOnly}
          stages={stages}
          grades={grades}
          sections={sections}
        />
      )}

      {/* Move Event Dialog (Mobile Fallback) */}
      {term && (
        <MoveEventDialog
          isOpen={moveDialogOpen}
          onClose={() => {
            setMoveDialogOpen(false);
            setMovingEvent(null);
          }}
          event={movingEvent}
          term={term}
          onMove={async (newStartDate, newEndDate) => {
            if (movingEvent) {
              await handleEventMove(movingEvent.id, newStartDate, newEndDate);
              setMoveDialogOpen(false);
              setMovingEvent(null);
            }
          }}
        />
      )}

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={filteredEvents.length}
      />
    </div>
  );
}

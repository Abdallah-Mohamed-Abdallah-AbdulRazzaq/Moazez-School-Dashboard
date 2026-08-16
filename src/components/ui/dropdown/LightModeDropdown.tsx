"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import Button from "../button/Button";
import Input from "../input/Input";
import Select, { SelectOption } from "../input/Select";
import TextArea from "../input/TextArea";
import {
  createDashboardTodo,
  deleteDashboardTodo,
  fetchDashboardWidgets,
  fetchLightModeDropdown,
  updateDashboardTodo,
  type DashboardLightModeDropdownResponse,
  type DashboardTodo,
} from "@/features/dashboard/services/dashboardApiService";
import type { DashboardCalendarWidget } from "@/features/dashboard/types/dashboardApi.types";

export type LightModeDropdownLocale = "en" | "ar";
export type TodoPriority = "low" | "medium" | "high";
export type WeatherTone =
  "amber" | "blue" | "green" | "purple" | "rose" | "sky";
export interface LightModeDropdownHint {
  label: string;
}
export interface LightModeDropdownMetric {
  label: string;
  value: string;
  subLabel: string;
}
export interface LightModeDropdownCity {
  city: string;
  country: string;
  temp: string;
  condition: string;
}
export interface LightModeDropdownForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
}
export interface LightModeDropdownCalendarDay {
  date: number;
}

export interface LightModeDropdownTodo {
  id?: string;
  date: string;
  title: string;
  description?: string;
  time: string;
  completed?: boolean;
  priority?: TodoPriority;
}

export interface LightModeDropdownPlannerData {
  date?: string;
  timezone: string;
  eventDates?: string[];
  todos: LightModeDropdownTodo[];
}

export interface LightModeDropdownData {
  planner: LightModeDropdownPlannerData;
}

export interface LightModeDropdownProps {
  canManageTodos: boolean;
  weatherData?: Partial<LightModeDropdownData>;
  locale?: LightModeDropdownLocale;
  className?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface LocalizedText {
  collapse: string;
  calendar: string;
  calendarUnavailable: string;
  previousDay: string;
  nextDay: string;
  today: string;
  agenda: string;
  todoTitle: string;
  done: string;
  addTitle: string;
  addDescription: string;
  add: string;
  priority: string;
  pending: string;
  markDone: string;
  markIncomplete: string;
  deleteTask: string;
  edit: string;
  save: string;
  cancel: string;
  updateFailed: string;
  priorities: Record<TodoPriority, string>;
}

const localeCode: Record<LightModeDropdownLocale, string> = {
  en: "en-US",
  ar: "ar-EG",
};

const priorityClasses: Record<TodoPriority, string> = {
  low: "border-emerald-100 bg-emerald-50 text-emerald-700",
  medium: "border-amber-100 bg-amber-50 text-amber-700",
  high: "border-rose-100 bg-rose-50 text-rose-700",
};

function localizedTextFromMessages(
  t: ReturnType<typeof useTranslations>,
): LocalizedText {
  return {
    collapse: t("collapse"),
    calendar: t("calendar"),
    calendarUnavailable: t("calendarUnavailable"),
    previousDay: t("previousDay"),
    nextDay: t("nextDay"),
    today: t("today"),
    agenda: t("agenda"),
    todoTitle: t("todoTitle"),
    done: t("done"),
    addTitle: t("addTitle"),
    addDescription: t("addDescription"),
    add: t("add"),
    priority: t("priority"),
    pending: t("pending"),
    markDone: t("markDone"),
    markIncomplete: t("markIncomplete"),
    deleteTask: t("deleteTask"),
    edit: t("edit"),
    save: t("save"),
    cancel: t("cancel"),
    updateFailed: t("updateFailed"),
    priorities: {
      low: t("priorities.low"),
      medium: t("priorities.medium"),
      high: t("priorities.high"),
    },
  };
}

function priorityOptions(text: LocalizedText): SelectOption[] {
  return (Object.keys(text.priorities) as TodoPriority[]).map((priority) => ({
    value: priority,
    label: text.priorities[priority],
  }));
}

function civilDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapPlannerResponse(
  response: DashboardLightModeDropdownResponse,
  locale: LightModeDropdownLocale,
): LightModeDropdownPlannerData {
  return {
    date: response.planner.date,
    timezone: response.location?.timezone ?? "",
    eventDates: response.planner.eventDates ?? [],
    todos: response.planner.todos.map((todo: DashboardTodo) => ({
      id: todo.todoId,
      date: todo.date,
      title: todo.title,
      description: todo.notes ?? "",
      time: todo.createdAt
        ? new Date(todo.createdAt).toLocaleTimeString(localeCode[locale], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      completed: todo.status === "completed",
      priority: todo.priority === "normal" ? "medium" : todo.priority,
    })),
  };
}

function emptyPlanner(weatherData?: Partial<LightModeDropdownData>) {
  return (
    weatherData?.planner ?? {
      date: civilDate(new Date()),
      timezone: "",
      eventDates: [],
      todos: [],
    }
  );
}

export default function LightModeDropdown({
  canManageTodos,
  weatherData,
  locale,
  className,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
}: LightModeDropdownProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLocale = useLocale();
  const t = useTranslations("lightModeDropdown");
  const activeLocale: LightModeDropdownLocale =
    locale ?? (currentLocale === "ar" ? "ar" : "en");
  const text = localizedTextFromMessages(t);
  const [planner, setPlanner] = useState<LightModeDropdownPlannerData>(() =>
    emptyPlanner(weatherData),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [todoDates, setTodoDates] = useState<string[]>([]);
  const [calendarDatesStatus, setCalendarDatesStatus] = useState<
    "loading" | "available" | "unavailable"
  >("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoPriority, setNewTodoPriority] =
    useState<TodoPriority>("medium");
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;
  const isRTL = activeLocale === "ar";
  const todos = useMemo(
    () => [...planner.todos].sort(compareTodos),
    [planner.todos],
  );
  const pendingCount = todos.filter((todo) => !todo.completed).length;

  useEffect(() => {
    let active = true;

    async function loadPlanner() {
      setIsLoading(true);
      try {
        const response = await fetchLightModeDropdown({
          locale: activeLocale,
          date: civilDate(selectedDate),
        });
        if (active) {
          setPlanner(mapPlannerResponse(response, activeLocale));
          setTodoDates((currentDates) =>
            mergePlannerTodoDates(currentDates, response.planner),
          );
        }
      } catch (error) {
        console.error("Failed to load planner data:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadPlanner();
    return () => {
      active = false;
    };
  }, [activeLocale, selectedDate]);

  useEffect(() => {
    let active = true;

    async function loadTodoDates() {
      try {
        const response = await fetchDashboardWidgets({
          type: "calendar-card",
          limit: 1,
        });
        const calendarWidget = response.widgets.find(
          (widget): widget is DashboardCalendarWidget =>
            widget.type === "calendar-card",
        );
        if (active && calendarWidget) {
          setTodoDates((currentDates) =>
            Array.from(
              new Set([
                ...currentDates,
                ...calendarWidget.data.events
                  .filter(isTodoCalendarEvent)
                  .map((event) => event.date),
              ]),
            ),
          );
        }
        if (active) setCalendarDatesStatus("available");
      } catch (error) {
        console.error("Failed to load todo calendar dates:", error);
        if (active) setCalendarDatesStatus("unavailable");
      }
    }

    void loadTodoDates();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isExpanded) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (!isControlled) setInternalExpanded(false);
        onExpandedChange?.(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isControlled) setInternalExpanded(false);
        onExpandedChange?.(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isControlled, isExpanded, onExpandedChange]);

  function setExpanded(nextExpanded: boolean) {
    if (!isControlled) setInternalExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  }

  function moveSelectedDate(dayOffset: number) {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + dayOffset);
    setSelectedDate(nextDate);
  }

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageTodos) return;
    const title = newTodoTitle.trim();
    const notes = newTodoDescription.trim();
    if (!title) return;

    const response = await createDashboardTodo({
      date: planner.date ?? civilDate(selectedDate),
      title,
      notes: notes || null,
      priority: newTodoPriority === "medium" ? "normal" : newTodoPriority,
    });
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      todos: [...currentPlanner.todos, mapTodo(response.todo, activeLocale)],
    }));
    setTodoDates((currentDates) =>
      updateTodoDate(currentDates, response.todo.date, true),
    );
    setNewTodoTitle("");
    setNewTodoDescription("");
  }

  async function toggleTodo(todoId: string) {
    if (!canManageTodos) return;
    const todo = planner.todos.find((currentTodo) => currentTodo.id === todoId);
    if (!todo) return;

    const nextCompleted = !todo.completed;
    setPlanner((currentPlanner) =>
      updatePlannerTodo(currentPlanner, todoId, {
        completed: nextCompleted,
      }),
    );
    try {
      await updateDashboardTodo(todoId, {
        status: nextCompleted ? "completed" : "pending",
      });
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      setPlanner((currentPlanner) =>
        updatePlannerTodo(currentPlanner, todoId, {
          completed: todo.completed,
        }),
      );
    }
  }

  async function editTodo(
    todoId: string,
    updates: { title: string; notes: string; priority: TodoPriority },
  ): Promise<boolean> {
    if (!canManageTodos) return false;
    const todo = planner.todos.find((currentTodo) => currentTodo.id === todoId);
    if (!todo) return false;

    const nextTodo = {
      title: updates.title,
      description: updates.notes,
      priority: updates.priority,
    };
    setPlanner((currentPlanner) =>
      updatePlannerTodo(currentPlanner, todoId, nextTodo),
    );
    try {
      const response = await updateDashboardTodo(todoId, {
        title: updates.title,
        notes: updates.notes || null,
        priority: updates.priority === "medium" ? "normal" : updates.priority,
      });
      setPlanner((currentPlanner) =>
        updatePlannerTodo(
          currentPlanner,
          todoId,
          mapTodo(response.todo, activeLocale),
        ),
      );
      return true;
    } catch (error) {
      console.error("Failed to update todo:", error);
      setPlanner((currentPlanner) =>
        updatePlannerTodo(currentPlanner, todoId, todo),
      );
      return false;
    }
  }

  async function removeTodo(todoId: string) {
    if (!canManageTodos) return;
    const todo = planner.todos.find((currentTodo) => currentTodo.id === todoId);
    if (!todo) return;

    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      todos: currentPlanner.todos.filter(
        (currentTodo) => currentTodo.id !== todoId,
      ),
    }));
    const removesTodoDate =
      todo.date === planner.date && planner.todos.length === 1;
    if (removesTodoDate) {
      setTodoDates((currentDates) =>
        updateTodoDate(currentDates, todo.date, false),
      );
    }
    try {
      await deleteDashboardTodo(todoId);
    } catch (error) {
      console.error("Failed to delete todo:", error);
      setPlanner((currentPlanner) => ({
        ...currentPlanner,
        todos: [...currentPlanner.todos, todo],
      }));
      if (removesTodoDate) {
        setTodoDates((currentDates) =>
          updateTodoDate(currentDates, todo.date, true),
        );
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className={`mb-4 w-full ${className ?? ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {isExpanded ? (
        <ExpandedPlanner
          panelId={panelId}
          text={text}
          locale={activeLocale}
          planner={planner}
          todos={todos}
          pendingCount={pendingCount}
          selectedDate={selectedDate}
          currentTime={currentTime}
          isLoading={isLoading}
          canManageTodos={canManageTodos}
          newTodoTitle={newTodoTitle}
          newTodoDescription={newTodoDescription}
          newTodoPriority={newTodoPriority}
          onCollapse={() => setExpanded(false)}
          onPreviousDay={() => moveSelectedDate(-1)}
          onNextDay={() => moveSelectedDate(1)}
          onToday={() => setSelectedDate(new Date())}
          onDateSelect={setSelectedDate}
          onNewTodoTitleChange={setNewTodoTitle}
          onNewTodoDescriptionChange={setNewTodoDescription}
          onNewTodoPriorityChange={setNewTodoPriority}
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onUpdateTodo={editTodo}
          onDeleteTodo={removeTodo}
          todoDates={todoDates}
          calendarDatesStatus={calendarDatesStatus}
        />
      ) : (
        <CollapsedPlanner
          panelId={panelId}
          text={text}
          locale={activeLocale}
          selectedDate={selectedDate}
          currentTime={currentTime}
          pendingCount={pendingCount}
          totalCount={todos.length}
          eventCount={planner.eventDates?.length ?? 0}
          onExpand={() => setExpanded(true)}
        />
      )}
    </div>
  );
}

function CollapsedPlanner({
  panelId,
  text,
  locale,
  selectedDate,
  currentTime,
  pendingCount,
  totalCount,
  eventCount,
  onExpand,
}: {
  panelId: string;
  text: LocalizedText;
  locale: LightModeDropdownLocale;
  selectedDate: Date;
  currentTime: Date;
  pendingCount: number;
  totalCount: number;
  eventCount: number;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={false}
      aria-controls={panelId}
      onClick={onExpand}
      className="group w-full cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-[linear-gradient(115deg,#ffffff,#f0fbfc)] px-5 py-4 shadow-[0_10px_30px_rgba(3,107,128,0.08)] transition-shadow duration-200 hover:shadow-[0_16px_36px_rgba(3,107,128,0.14)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <ListTodo size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-950">
              {text.agenda}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-gray-600">
              {selectedDate.toLocaleDateString(localeCode[locale], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveClock time={currentTime} locale={locale} compact />
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
            {pendingCount} {text.pending}
          </span>
          {eventCount ? (
            <span className="rounded-full border border-primary-100 bg-white px-3 py-1.5 text-xs font-bold text-primary-700">
              {eventCount} {text.agenda}
            </span>
          ) : null}
          <span className="hidden text-xs font-semibold text-gray-500 sm:inline">
            {totalCount} {text.todoTitle}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors group-hover:bg-primary-50 group-hover:text-primary">
            <ChevronDown size={17} />
          </span>
        </div>
      </div>
    </button>
  );
}

function ExpandedPlanner({
  panelId,
  text,
  locale,
  planner,
  todos,
  pendingCount,
  selectedDate,
  currentTime,
  isLoading,
  canManageTodos,
  newTodoTitle,
  newTodoDescription,
  newTodoPriority,
  onCollapse,
  onPreviousDay,
  onNextDay,
  onToday,
  onDateSelect,
  onNewTodoTitleChange,
  onNewTodoDescriptionChange,
  onNewTodoPriorityChange,
  onAddTodo,
  onToggleTodo,
  onUpdateTodo,
  onDeleteTodo,
  todoDates,
  calendarDatesStatus,
}: {
  panelId: string;
  text: LocalizedText;
  locale: LightModeDropdownLocale;
  planner: LightModeDropdownPlannerData;
  todos: LightModeDropdownTodo[];
  pendingCount: number;
  selectedDate: Date;
  currentTime: Date;
  isLoading: boolean;
  canManageTodos: boolean;
  newTodoTitle: string;
  newTodoDescription: string;
  newTodoPriority: TodoPriority;
  onCollapse: () => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
  onNewTodoTitleChange: (title: string) => void;
  onNewTodoDescriptionChange: (description: string) => void;
  onNewTodoPriorityChange: (priority: TodoPriority) => void;
  onAddTodo: (event: FormEvent<HTMLFormElement>) => void;
  onToggleTodo: (todoId: string) => void;
  onUpdateTodo: (
    todoId: string,
    updates: { title: string; notes: string; priority: TodoPriority },
  ) => Promise<boolean>;
  onDeleteTodo: (todoId: string) => void;
  todoDates: string[];
  calendarDatesStatus: "loading" | "available" | "unavailable";
}) {
  return (
    <section
      id={panelId}
      className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.09)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-[linear-gradient(115deg,#ffffff,#f0fbfc)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <ListTodo size={17} />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-gray-950">
              {text.agenda}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-gray-600">
              {pendingCount} {text.pending} · {planner.timezone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveClock time={currentTime} locale={locale} />
          <button
            type="button"
            onClick={onCollapse}
            aria-label={text.collapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
          >
            <ChevronUp size={17} />
          </button>
        </div>
      </header>

      <div className="border-b border-gray-100 px-5 py-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <button
            type="button"
            onClick={onPreviousDay}
            aria-label={text.previousDay}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="min-w-0 rounded-lg px-3 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
          >
            <span className="block truncate text-sm font-bold text-gray-950">
              {selectedDate.toLocaleDateString(localeCode[locale], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-primary">
              {text.today}
            </span>
          </button>
          <button
            type="button"
            onClick={onNextDay}
            aria-label={text.nextDay}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <TodoCalendar
        selectedDate={selectedDate}
        todoDates={todoDates}
        todoCount={todos.length}
        locale={locale}
        text={text}
        onSelectDate={onDateSelect}
        calendarDatesStatus={calendarDatesStatus}
      />

      <div className="space-y-4 p-5">
        <form
          onSubmit={onAddTodo}
          className="rounded-xl border border-gray-200 bg-gray-50/70 p-3"
        >
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Input
              value={newTodoTitle}
              onChange={(event) => onNewTodoTitleChange(event.target.value)}
              placeholder={text.addTitle}
              inputSize="sm"
              className="min-w-0 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-950 focus:bg-white"
            />
            <Select
              value={newTodoPriority}
              onChange={(value) =>
                onNewTodoPriorityChange(value as TodoPriority)
              }
              options={priorityOptions(text)}
              placeholder={text.priority}
              fullWidth={false}
              selectSize="sm"
              className="rounded-xl border-gray-200 bg-white text-xs font-semibold text-gray-700"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!canManageTodos}
              leftIcon={<Plus size={15} />}
              className="rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-hover"
            >
              {text.add}
            </Button>
          </div>
          <TextArea
            value={newTodoDescription}
            onChange={(event) => onNewTodoDescriptionChange(event.target.value)}
            placeholder={text.addDescription}
            rows={2}
            resize="none"
            className="mt-2 border-gray-200 bg-white text-sm font-medium text-gray-950"
          />
        </form>

        <div className="space-y-2" aria-live="polite">
          {isLoading ? (
            <PlannerLoading />
          ) : todos.length ? (
            todos.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                text={text}
                canManageTodos={canManageTodos}
                onToggleTodo={onToggleTodo}
                onUpdateTodo={onUpdateTodo}
                onDeleteTodo={onDeleteTodo}
              />
            ))
          ) : (
            <EmptyTasks text={text} />
          )}
        </div>
      </div>
    </section>
  );
}

function TodoCalendar({
  selectedDate,
  todoDates,
  todoCount,
  locale,
  text,
  onSelectDate,
  calendarDatesStatus,
}: {
  selectedDate: Date;
  todoDates: string[];
  todoCount: number;
  locale: LightModeDropdownLocale;
  text: LocalizedText;
  onSelectDate: (date: Date) => void;
  calendarDatesStatus: "loading" | "available" | "unavailable";
}) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const weekStart = locale === "ar" ? 6 : 0;
  const firstDay = (new Date(year, month, 1).getDay() - weekStart + 7) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todoDateSet = new Set(todoDates);
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Date(2024, 0, 7 + ((weekStart + index) % 7)).toLocaleDateString(
      localeCode[locale],
      { weekday: "narrow" },
    ),
  );

  return (
    <section
      aria-label={text.calendar}
      className="border-b border-gray-100 bg-slate-50/70 px-5 py-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-extrabold text-gray-950">
            {selectedDate.toLocaleDateString(localeCode[locale], {
              month: "long",
              year: "numeric",
            })}
          </h3>
        </div>
        <span className="text-[11px] font-bold text-primary-700">
          {todoCount} {text.todoTitle}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="py-1 text-[10px] font-extrabold uppercase text-gray-400"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: firstDay }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: totalDays }, (_, index) => {
          const day = index + 1;
          const date = new Date(year, month, day);
          const dateKey = civilDate(date);
          const hasTodos = todoDateSet.has(dateKey);
          const isSelected = civilDate(selectedDate) === dateKey;
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={date.toLocaleDateString(localeCode[locale], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              aria-pressed={isSelected}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${isSelected ? "bg-primary text-white shadow-sm" : "text-gray-700 hover:bg-primary-50"}`}
            >
              {day}
              {hasTodos ? (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-primary"}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {calendarDatesStatus === "unavailable" ? (
        <p
          className="mt-3 text-center text-[11px] font-medium text-amber-700"
          role="status"
        >
          {text.calendarUnavailable}
        </p>
      ) : null}
    </section>
  );
}

function TodoRow({
  todo,
  text,
  canManageTodos,
  onToggleTodo,
  onUpdateTodo,
  onDeleteTodo,
}: {
  todo: LightModeDropdownTodo;
  text: LocalizedText;
  canManageTodos: boolean;
  onToggleTodo: (todoId: string) => void;
  onUpdateTodo: (
    todoId: string,
    updates: { title: string; notes: string; priority: TodoPriority },
  ) => Promise<boolean>;
  onDeleteTodo: (todoId: string) => void;
}) {
  const priority = todo.priority ?? "medium";
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [draftNotes, setDraftNotes] = useState(todo.description ?? "");
  const [draftPriority, setDraftPriority] = useState(priority);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  function startEditing() {
    setDraftTitle(todo.title);
    setDraftNotes(todo.description ?? "");
    setDraftPriority(priority);
    setSaveError(false);
    setIsEditing(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!todo.id || !draftTitle.trim()) return;
    setIsSaving(true);
    const saved = await onUpdateTodo(todo.id, {
      title: draftTitle.trim(),
      notes: draftNotes.trim(),
      priority: draftPriority,
    });
    setIsSaving(false);
    if (saved) setIsEditing(false);
    else setSaveError(true);
  }

  if (isEditing) {
    return (
      <form
        onSubmit={save}
        className="rounded-xl border border-primary-200 bg-primary-50/30 p-3"
      >
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            aria-label={text.todoTitle}
            inputSize="sm"
            className="min-w-0 border-primary-100 bg-white text-sm font-bold text-gray-950"
          />
          <Select
            value={draftPriority}
            onChange={(value) => setDraftPriority(value as TodoPriority)}
            options={priorityOptions(text)}
            fullWidth={false}
            selectSize="sm"
            className="border-primary-100 bg-white text-xs font-semibold"
          />
        </div>
        <TextArea
          value={draftNotes}
          onChange={(event) => setDraftNotes(event.target.value)}
          aria-label={text.addDescription}
          rows={2}
          resize="none"
          className="mt-2 border-primary-100 bg-white text-sm"
        />
        {saveError ? (
          <p className="mt-2 text-xs font-semibold text-rose-700" role="alert">
            {text.updateFailed}
          </p>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(false)}
            leftIcon={<X size={14} />}
            className="rounded-lg text-xs"
          >
            {text.cancel}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canManageTodos || isSaving || !draftTitle.trim()}
            leftIcon={<Save size={14} />}
            className="rounded-lg bg-primary text-xs text-white hover:bg-hover"
          >
            {text.save}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <article className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition-colors duration-200 hover:border-primary-200 hover:bg-primary-50/20">
      <button
        type="button"
        onClick={() => todo.id && onToggleTodo(todo.id)}
        disabled={!canManageTodos || !todo.id}
        aria-label={todo.completed ? text.markIncomplete : text.markDone}
        className="mt-0.5 shrink-0 text-gray-300 transition-colors hover:text-emerald-600 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-full cursor-pointer"
      >
        {todo.completed ? (
          <CheckCircle2 size={19} className="text-emerald-500" />
        ) : (
          <Circle size={19} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-bold ${todo.completed ? "text-gray-400 line-through" : "text-gray-900"}`}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p
            className={`mt-1 line-clamp-2 text-xs leading-5 ${todo.completed ? "text-gray-400" : "text-gray-600"}`}
          >
            {todo.description}
          </p>
        ) : null}
        {todo.time ? (
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {todo.time}
          </p>
        ) : null}
      </div>
      <span
        className={`rounded-full border px-2 py-1 text-[10px] font-bold ${priorityClasses[priority]}`}
      >
        {text.priorities[priority]}
      </span>
      <button
        type="button"
        onClick={startEditing}
        disabled={!canManageTodos || !todo.id}
        aria-label={text.edit}
        className="mt-0.5 shrink-0 text-gray-300 transition-colors hover:text-primary disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded cursor-pointer"
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={() => todo.id && onDeleteTodo(todo.id)}
        disabled={!canManageTodos || !todo.id}
        aria-label={text.deleteTask}
        className="mt-0.5 shrink-0 text-gray-300 transition-colors hover:text-rose-600 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </article>
  );
}

function PlannerLoading() {
  return (
    <>
      <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
      <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
    </>
  );
}

function LiveClock({
  time,
  locale,
  compact = false,
}: {
  time: Date;
  locale: LightModeDropdownLocale;
  compact?: boolean;
}) {
  const formattedTime = time.toLocaleTimeString(localeCode[locale], {
    hour: "2-digit",
    minute: "2-digit",
    second: compact ? undefined : "2-digit",
  });

  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white py-1.5 font-bold text-primary-700 shadow-sm ${compact ? "pe-2 ps-1 text-xs" : "pe-3 ps-1.5 text-sm"}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm ${compact ? "h-6 w-6" : "h-7 w-7"}`}
      >
        <Clock3 size={compact ? 13 : 15} strokeWidth={2.5} />
      </span>
      {formattedTime}
    </span>
  );
}

function EmptyTasks({ text }: { text: LocalizedText }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
      <p className="mt-2 text-sm font-bold text-gray-800">0 {text.pending}</p>
      <p className="mt-1 text-xs text-gray-500">{text.todoTitle}</p>
    </div>
  );
}

function compareTodos(
  firstTodo: LightModeDropdownTodo,
  secondTodo: LightModeDropdownTodo,
) {
  if (firstTodo.completed !== secondTodo.completed)
    return firstTodo.completed ? 1 : -1;
  return priorityValue(secondTodo.priority) - priorityValue(firstTodo.priority);
}

function updateTodoDate(
  currentDates: string[],
  date: string,
  hasTodos: boolean,
) {
  const dates = new Set(currentDates);
  if (hasTodos) dates.add(date);
  else dates.delete(date);
  return Array.from(dates);
}

function mergePlannerTodoDates(
  currentDates: string[],
  planner: DashboardLightModeDropdownResponse["planner"],
) {
  const dates = new Set([...currentDates, ...planner.eventDates]);
  if (planner.todos.length) dates.add(planner.date);
  return Array.from(dates);
}

function isTodoCalendarEvent(
  event: DashboardCalendarWidget["data"]["events"][number],
) {
  return (
    event.source === "todos" || event.status !== null || event.priority !== null
  );
}

function priorityValue(priority: TodoPriority | undefined) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function mapTodo(
  todo: DashboardTodo,
  locale: LightModeDropdownLocale,
): LightModeDropdownTodo {
  return {
    id: todo.todoId,
    date: todo.date,
    title: todo.title,
    description: todo.notes ?? "",
    time: new Date(todo.createdAt).toLocaleTimeString(localeCode[locale], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    completed: todo.status === "completed",
    priority: todo.priority === "normal" ? "medium" : todo.priority,
  };
}

function updatePlannerTodo(
  planner: LightModeDropdownPlannerData,
  todoId: string,
  updates: Partial<LightModeDropdownTodo>,
) {
  return {
    ...planner,
    todos: planner.todos.map((todo) =>
      todo.id === todoId ? { ...todo, ...updates } : todo,
    ),
  };
}

export const defaultWeatherData: LightModeDropdownData = {
  planner: emptyPlanner(),
};

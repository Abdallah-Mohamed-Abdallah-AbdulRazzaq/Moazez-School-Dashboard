"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Drawer,
  Tab,
  Tabs,
  useMediaQuery,
} from "@mui/material";
import RtlProvider from "@mui/system/RtlProvider";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Lightbulb,
  ListChecks,
  DoorOpen,
  Search,
  School,
  Settings2,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import {
  validationIssueText,
  hasBlockingValidation,
  type TimetableValidationSummary,
} from "@/features/academics/timetable/services/timetableValidationSummary";
import type {
  TimetableValidationIssue,
  TimetableValidationItem,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableConflictDisplay } from "@/features/academics/timetable/services/timetableConflictNormalization";
import { formatTimetableTimeRange } from "@/features/academics/timetable/services/timetableTimeFormat";
import { Button, Input } from "@/components/ui";
import {
  classifyPublicationReasons,
  publicationReasonPresentation,
  type PublicationReasonCategory,
  type PublicationReasonReferenceNames,
} from "@/features/academics/timetable/services/timetablePublicationReasons";
import type { TimetablePublishReason } from "@/features/academics/timetable/services/timetableApiTypes";

import ValidationReviewStatus, {
  type ValidationReviewState,
} from "./ValidationReviewStatus";
import ValidationSubjectActions, {
  type ValidationReviewContext,
} from "./ValidationSubjectActions";
import ValidationConflictFilters, {
  conflictMatchesFilters,
  emptyConflictFilters,
} from "./ValidationConflictFilters";
import ValidationConflictGroupSummary from "./ValidationConflictGroupSummary";
import {
  groupValidationConflicts,
  type ValidationConflictGroup,
} from "../services/timetableValidationReview";

interface ValidationPanelProps {
  open: boolean;
  validationSummary: TimetableValidationSummary;
  conflicts: TimetableConflictDisplay[];
  teachers: NamedEntity[];
  rooms: NamedEntity[];
  classrooms: NamedEntity[];
  selectedConflict?: TimetableConflictDisplay | null;
  onConflictSelect: (conflict: TimetableConflictDisplay) => void;
  requirementActions: PublicationRequirementActions;
  onClose: () => void;
  locale: string;
  publicationReasons?: TimetablePublishReason[];
  publicationReferenceNames?: PublicationReasonReferenceNames;
  scopeName?: string;
  review?: ValidationReviewState;
  reviewContext?: ValidationReviewContext;
}

type NamedEntity = {
  id: string;
  nameAr: string;
  nameEn: string;
};

interface ValidationSection {
  title: string;
  issues: TimetableValidationIssue[];
  severity: "warning" | "error";
  tab: "conflicts" | "blockers";
  conflictType?: TimetableConflictDisplay["type"];
}

type ValidationNavigationTab =
  "overview" | "subjects" | "conflicts" | "blockers";

interface SubjectIssueGroup {
  title: string;
  items: TimetableValidationItem[];
}

type ValidationStatus = TimetableValidationItem["status"];
type SubjectStatusFilter = "all" | Exclude<ValidationStatus, "complete">;
type PublicationRequirementTarget =
  "configuration" | "schedule" | "subjects" | "teacherAllocation" | "rooms";

interface PublicationRequirementActions {
  openDestination: (path: string) => void;
  focusSchedule: () => void;
}

const INITIAL_VISIBLE_ISSUES = 20;

const STATUS_STYLES: Record<ValidationStatus, string> = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  under_scheduled: "border-amber-200 bg-amber-50 text-amber-700",
  over_scheduled: "border-red-200 bg-red-50 text-red-700",
  missing_teacher_allocation: "border-red-200 bg-red-50 text-red-700",
  missing_subject_allocation: "border-red-200 bg-red-50 text-red-700",
};

export default function ValidationPanel({
  open,
  validationSummary,
  conflicts,
  teachers,
  rooms,
  classrooms,
  selectedConflict = null,
  onConflictSelect,
  requirementActions,
  onClose,
  locale,
  publicationReasons = [],
  publicationReferenceNames = {},
  scopeName,
  review,
  reviewContext,
}: ValidationPanelProps) {
  const navigationId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [activeTab, setActiveTab] =
    useState<ValidationNavigationTab>("overview");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectStatusFilter, setSubjectStatusFilter] =
    useState<SubjectStatusFilter>("all");
  const [visibleSubjectCount, setVisibleSubjectCount] = useState(
    INITIAL_VISIBLE_ISSUES,
  );
  const [conflictFilters, setConflictFilters] = useState(emptyConflictFilters);
  const groupedConflicts = groupValidationConflicts(conflicts);
  const resources = { teachers, classrooms, rooms };
  const filteredConflicts = groupedConflicts.filter((group) =>
    group.messages.some((message) =>
      conflictMatchesFilters(
        { ...group.conflict, message },
        conflictFilters,
        resources,
        locale,
      ),
    ),
  );
  const isRTL = locale === "ar";
  const copy = getCopy(isRTL);
  const summary = validationSummary.backendSummary;
  const issueItems = validationSummary.items.filter(
    (item) => item.status !== "complete" || item.issues.length > 0,
  );
  const fallbackSections = validationSections(validationSummary, copy);
  const publicationGroups = classifyPublicationReasons(publicationReasons);
  const fallbackIssueCount = fallbackSections.reduce(
    (total, section) => total + section.issues.length,
    0,
  );
  const blockerSections = fallbackSections.filter(
    (section) => section.tab === "blockers",
  );
  const conflictSections = fallbackSections.filter(
    (section) => section.tab === "conflicts",
  );
  const conflictCount =
    groupedConflicts.length +
    conflictSections.reduce(
      (total, section) => total + section.issues.length,
      0,
    );
  const filteredConflictSections = conflictSections
    .map((section) => ({
      ...section,
      issues: section.issues.filter((issue) =>
        conflictMatchesFilters(
          {
            type: section.conflictType ?? "UNKNOWN",
            dayOfWeek: issue.dayOfWeek ?? null,
            resourceId: issue.teacherId ?? issue.classroomId ?? issue.roomId,
            message: validationIssueText(issue),
          },
          conflictFilters,
          resources,
          locale,
        ),
      ),
    }))
    .filter((section) => section.issues.length > 0);
  const matchingConflictCount =
    filteredConflicts.length +
    filteredConflictSections.reduce(
      (total, section) => total + section.issues.length,
      0,
    );
  const blockerCount =
    publicationReasons.length +
    blockerSections.reduce(
      (total, section) => total + section.issues.length,
      0,
    );
  const attentionItemCount = issueItems.length + conflictCount + blockerCount;
  const filteredSubjectItems = filterSubjectIssues({
    issues: issueItems,
    locale,
    search: subjectSearch,
    status: subjectStatusFilter,
  });
  const visibleSubjectGroups = subjectIssueGroups(
    filteredSubjectItems.slice(0, visibleSubjectCount),
    copy,
  );
  const reviewTab = nextBlockingTab({
    subjectIssueCount: issueItems.length,
    conflictCount,
    blockerCount,
  });
  const hasIssues =
    issueItems.length > 0 ||
    conflicts.length > 0 ||
    fallbackIssueCount > 0 ||
    publicationGroups.length > 0;
  const canPublish =
    (!review ||
      (review.canPublish &&
        review.isCurrent &&
        !review.hasUnsavedChanges &&
        !review.isChecking &&
        !review.failed)) &&
    validationSummary.canPublish &&
    !hasBlockingValidation(validationSummary) &&
    conflicts.length === 0 &&
    publicationReasons.length === 0;
  const navigateToTab = (tab: ValidationNavigationTab) => {
    setActiveTab(tab);
    if (contentRef.current) contentRef.current.scrollTop = 0;
    document.getElementById(`${navigationId}-tab-${tab}`)?.focus();
  };

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={open}
      onClose={onClose}
      transitionDuration={reducedMotion ? 0 : undefined}
      PaperProps={{
        role: "dialog",
        "aria-modal": true,
        "aria-label": copy.title,
        sx: {
          width: { xs: "100vw", sm: 720 },
          maxWidth: "100vw",
          fontFamily: "var(--font-somar), sans-serif",
        },
      }}
    >
      <div

        className="flex h-full min-h-0 flex-col bg-slate-50 text-start"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <ListChecks className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-950">
                  {copy.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {copy.subtitle}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 w-11 shrink-0 cursor-pointer p-2 text-slate-600 focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              aria-label={copy.close}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          {scopeName && (
            <p className="mt-4 break-words rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
              <span className="font-semibold">{copy.reviewingScope}: </span>
              {scopeName}
            </p>
          )}
        </div>

        <ValidationNavigation
          id={navigationId}
          activeTab={activeTab}
          onNavigate={navigateToTab}
          copy={copy}
          isRTL={isRTL}
          counts={{
            overview: null,
            subjects: issueItems.length,
            conflicts: conflictCount,
            blockers: blockerCount,
          }}
        />

        <div
          ref={contentRef}
          role="tabpanel"
          id={`${navigationId}-panel-${activeTab}`}
          aria-labelledby={`${navigationId}-tab-${activeTab}`}
          tabIndex={0}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:p-6"
        >
          {review && <ValidationReviewStatus review={review} locale={locale} />}
          {activeTab === "overview" && (
            <>
              <ReadinessBanner
                canPublish={canPublish}
                hasIssues={hasIssues}
                attentionItemCount={attentionItemCount}
                copy={copy}
              />

              {summary && (
                <div className="grid grid-cols-3 gap-2">
                  <SummaryMetric
                    label={copy.classrooms}
                    value={summary.classroomsChecked}
                    icon={<School className="h-4 w-4" />}
                  />
                  <SummaryMetric
                    label={copy.expectedSlots}
                    value={summary.expectedWeeklySlots}
                    icon={<Clock className="h-4 w-4" />}
                  />
                  <SummaryMetric
                    label={copy.scheduledSlots}
                    value={summary.actualScheduledSlots}
                    icon={<BookOpen className="h-4 w-4" />}
                  />
                </div>
              )}

              {hasIssues ? (
                <ValidationOverview
                  copy={copy}
                  subjectIssueCount={issueItems.length}
                  conflictCount={conflictCount}
                  blockerCount={blockerCount}
                  onNavigate={navigateToTab}
                />
              ) : (
                <ValidationEmptyState
                  copy={copy}
                  message={canPublish ? copy.noIssues : copy.noDetails}
                />
              )}
            </>
          )}

          {activeTab !== "overview" && (
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {activeTab === "subjects"
                  ? copy.subjectIssues
                  : activeTab === "conflicts"
                    ? copy.conflicts
                    : copy.publishBlockers}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {activeTab === "subjects"
                  ? copy.subjectsDescription
                  : activeTab === "conflicts"
                    ? copy.conflictsDescription
                    : copy.requirementsDescription}
              </p>
            </div>
          )}

          {activeTab === "subjects" && (
            <section className="space-y-2">
              <SubjectIssueFilters
                copy={copy}
                search={subjectSearch}
                status={subjectStatusFilter}
                resultCount={filteredSubjectItems.length}
                onClear={() => {
                  setSubjectSearch("");
                  setSubjectStatusFilter("all");
                  setVisibleSubjectCount(INITIAL_VISIBLE_ISSUES);
                }}
                onSearchChange={(search) => {
                  setSubjectSearch(search);
                  setVisibleSubjectCount(INITIAL_VISIBLE_ISSUES);
                }}
                onStatusChange={(status) => {
                  setSubjectStatusFilter(status);
                  setVisibleSubjectCount(INITIAL_VISIBLE_ISSUES);
                }}
              />
              {visibleSubjectGroups.map((group, index) => (
                <SubjectIssueSection
                  key={group.title}
                  group={group}
                  openDestination={requirementActions.openDestination}
                  reviewContext={reviewContext}
                  defaultExpanded={index === 0}
                  locale={locale}
                  copy={copy}
                />
              ))}
              {filteredSubjectItems.length === 0 && (
                <ValidationEmptyState
                  copy={copy}
                  message={
                    issueItems.length > 0
                      ? copy.noMatchingIssues
                      : copy.noSubjectIssues
                  }
                />
              )}
              {visibleSubjectCount < filteredSubjectItems.length && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() =>
                    setVisibleSubjectCount(
                      (currentCount) => currentCount + INITIAL_VISIBLE_ISSUES,
                    )
                  }
                >
                  {copy.showMore} (
                  {filteredSubjectItems.length - visibleSubjectCount})
                </Button>
              )}
            </section>
          )}

          {activeTab === "conflicts" && (
            <section className="space-y-2">
              {conflictCount > 0 && (
                <ValidationConflictFilters
                  filters={conflictFilters}
                  onChange={setConflictFilters}
                  count={matchingConflictCount}
                  locale={locale}
                />
              )}
              {conflictCount > 0 && matchingConflictCount === 0 && (
                <ValidationEmptyState
                  copy={copy}
                  message={copy.noMatchingIssues}
                />
              )}
              {conflictCount === 0 && (
                <ValidationEmptyState copy={copy} message={copy.noConflicts} />
              )}
              {filteredConflicts.length > 0 && (
                <IssueAccordion
                  title={copy.blockingConflicts}
                  count={filteredConflicts.length}
                  defaultExpanded
                >
                  <div className="space-y-3">
                    {filteredConflicts.map(
                      ({ conflict, ...groupDetails }, index) => (
                        <ConflictCard
                          key={`${conflict.code ?? conflict.type}-${conflict.dayKey}-${conflict.periodId ?? conflict.periodIndex}-${index}`}
                          conflict={conflict}
                          group={{ conflict, ...groupDetails }}
                          teachers={teachers}
                          rooms={rooms}
                          classrooms={classrooms}
                          locale={locale}
                          copy={copy}
                          isSelected={
                            selectedConflict === conflict ||
                            Boolean(
                              selectedConflict &&
                              conflict.entryIds.some((id) =>
                                selectedConflict.entryIds.includes(id),
                              ),
                            )
                          }
                          onSelect={onConflictSelect}
                        />
                      ),
                    )}
                  </div>
                </IssueAccordion>
              )}
              {filteredConflictSections.map((section) => (
                <FallbackIssueSection key={section.title} section={section} />
              ))}
            </section>
          )}

          {activeTab === "blockers" && (
            <section className="space-y-2">
              {blockerCount === 0 && (
                <ValidationEmptyState
                  copy={copy}
                  message={copy.noRequirements}
                />
              )}
              {blockerSections.map((section) => (
                <FallbackIssueSection key={section.title} section={section} />
              ))}
              {publicationGroups.map((group, index) => (
                <IssueAccordion
                  key={group.category}
                  title={publicationCategoryLabel(group.category, locale)}
                  count={group.reasons.length}
                  defaultExpanded={index === 0}
                >
                  <div className="space-y-2">
                    {group.reasons.map((reason, reasonIndex) => (
                      <PublicationReasonCard
                        key={`${reason.code}-${reasonIndex}`}
                        reason={reason}
                        locale={locale}
                        referenceNames={publicationReferenceNames}
                        copy={copy}
                        category={group.category}
                        requirementActions={requirementActions}
                      />
                    ))}
                  </div>
                </IssueAccordion>
              ))}
            </section>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white p-4 sm:px-6">
          <Button
            variant="secondary"
            className="min-h-11 flex-1 focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
            onClick={onClose}
          >
            {copy.backToTimetable}
          </Button>
          {activeTab === "overview" && reviewTab && (
            <Button
              className="min-h-11 flex-1 focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
              onClick={() => navigateToTab(reviewTab)}
            >
              {copy.reviewBlockers}
            </Button>
          )}
          {activeTab !== "overview" && (
            <Button
              className="min-h-11 flex-1 focus-visible:ring-2 focus-visible:ring-primary sm:flex-none"
              onClick={() => navigateToTab("overview")}
            >
              {copy.overview}
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function ValidationNavigation({
  id,
  activeTab,
  onNavigate,
  copy,
  isRTL,
  counts,
}: {
  id: string;
  activeTab: ValidationNavigationTab;
  onNavigate: (tab: ValidationNavigationTab) => void;
  copy: ValidationCopy;
  isRTL: boolean;
  counts: Record<ValidationNavigationTab, number | null>;
}) {
  const tabs = [
    { value: "overview", label: copy.overview, shortLabel: copy.overview },
    {
      value: "subjects",
      label: copy.subjectIssues,
      shortLabel: copy.subjectTab,
    },
    { value: "conflicts", label: copy.conflicts, shortLabel: copy.conflicts },
    {
      value: "blockers",
      label: copy.publishBlockers,
      shortLabel: copy.requirementsTab,
    },
  ] as const;
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-2 sm:px-4">
      <RtlProvider value={isRTL}>
        <Tabs
          value={activeTab}
          onChange={(_event, tab) => onNavigate(tab)}
          variant="fullWidth"
          dir={isRTL ? "rtl" : "ltr"}
          aria-label={copy.navigationLabel}
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              "& .MuiTabs-indicator": { transition: "none" },
            },
            "& .MuiTab-root": {
              minWidth: 0,
              minHeight: 64,
              px: 0.5,
              textTransform: "none",
              fontFamily: "inherit",
              color: "#475569",
              "&.Mui-selected": { color: "primary.main" },
              "&.Mui-focusVisible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: -3,
              },
            },
          }}
        >
          {tabs.map((tab) => {
            const count = counts[tab.value];
            return (
              <Tab
                key={tab.value}
                value={tab.value}
                id={`${id}-tab-${tab.value}`}
                aria-controls={`${id}-panel-${tab.value}`}
                aria-label={
                  count === null ? tab.label : tabLabel(tab.label, count)
                }
                label={
                  <span className="flex min-w-0 flex-col items-center gap-1 text-xs font-semibold sm:flex-row sm:gap-2 sm:text-sm">
                    <span>{tab.shortLabel}</span>
                    {count !== null && (
                      <span
                        className={`min-w-5 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${activeTab === tab.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {count}
                      </span>
                    )}
                  </span>
                }
              />
            );
          })}
        </Tabs>
      </RtlProvider>
    </div>
  );
}

function ValidationEmptyState({
  copy,
  message,
}: {
  copy: ValidationCopy;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
      <ListChecks className="h-7 w-7 text-primary" aria-hidden="true" />
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        {message}
      </p>
      <p className="text-xs leading-relaxed text-slate-500">
        {copy.reviewHint}
      </p>
    </div>
  );
}

function PublicationReasonCard({
  reason,
  locale,
  referenceNames,
  copy,
  category,
  requirementActions,
}: {
  reason: TimetablePublishReason;
  locale: string;
  referenceNames: PublicationReasonReferenceNames;
  copy: ValidationCopy;
  category: PublicationReasonCategory;
  requirementActions: PublicationRequirementActions;
}) {
  const presentation = publicationReasonPresentation(
    reason,
    locale,
    referenceNames,
  );
  const actionTarget = publicationRequirementTarget(reason.code, category);
  const destination = publicationRequirementDestination(
    reason,
    category,
    referenceNames,
  );
  return (
    <article className="rounded-xl border border-slate-200 border-s-4 border-s-red-400 bg-white p-3 shadow-sm transition-colors duration-200 hover:border-s-red-500 hover:bg-slate-50/70">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-red-50 p-2 text-red-700">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-slate-900">
              {presentation.message}
            </p>
            <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              {copy.actionRequired}
            </span>
          </div>
          <PublicationReasonDetails details={presentation.details} />
          <PublicationRequirements
            category={category}
            actionTarget={actionTarget}
            copy={copy}
            onAction={() => {
              if (destination) {
                requirementActions.openDestination(destination);
                return;
              }
              requirementActions.focusSchedule();
            }}
          />
        </div>
      </div>
    </article>
  );
}

function PublicationRequirements({
  category,
  actionTarget,
  copy,
  onAction,
}: {
  category: PublicationReasonCategory;
  actionTarget: PublicationRequirementTarget;
  copy: ValidationCopy;
  onAction: () => void;
}) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-start gap-2 rounded-lg bg-primary-50 p-2.5 text-xs leading-5 text-slate-700">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
        <p>
          <span className="font-semibold text-slate-900">
            {copy.recommendedNextStep}:
          </span>{" "}
          {actionTarget === "schedule"
            ? copy.noEntriesHint
            : copy.requirementHints[category]}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        leftIcon={requirementActionIcon(actionTarget)}
        className="mt-2 cursor-pointer"
        onClick={onAction}
      >
        {requirementActionLabel(actionTarget, copy)}
      </Button>
    </div>
  );
}

function PublicationReasonDetails({
  details,
}: {
  details: Array<{ label: string; value: string }>;
}) {
  if (details.length === 0) return null;

  return (
    <dl className="mt-3 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 sm:grid-cols-2">
      {details.map((detail) => (
        <div key={detail.label} className="min-w-0">
          <dt className="text-[11px] font-medium text-slate-500">
            {detail.label}
          </dt>
          <dd className="mt-0.5 break-words text-xs font-semibold text-slate-800">
            {detail.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ValidationOverview({
  copy,
  subjectIssueCount,
  conflictCount,
  blockerCount,
  onNavigate,
}: {
  copy: ValidationCopy;
  subjectIssueCount: number;
  conflictCount: number;
  blockerCount: number;
  onNavigate: (tab: ValidationNavigationTab) => void;
}) {
  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">{copy.overviewDescription}</p>
      <div className="space-y-3">
        <NavigationMetric
          label={copy.subjectIssues}
          count={subjectIssueCount}
          description={copy.subjectsDescription}
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          onClick={() => onNavigate("subjects")}
        />
        <NavigationMetric
          label={copy.conflicts}
          count={conflictCount}
          description={copy.conflictsDescription}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          onClick={() => onNavigate("conflicts")}
        />
        <NavigationMetric
          label={copy.publishBlockers}
          count={blockerCount}
          description={copy.requirementsDescription}
          icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          onClick={() => onNavigate("blockers")}
        />
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        {copy.countsHint}
      </p>
    </section>
  );
}

function NavigationMetric({
  label,
  count,
  onClick,
  description,
  icon,
}: {
  label: string;
  count: number;
  onClick: () => void;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      fullWidth
      className="min-h-20 cursor-pointer justify-start rounded-xl p-4 text-start hover:border-primary-300 hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none [&>span]:w-full"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="hidden rounded-lg bg-primary-50 p-2 text-primary sm:block">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            {label}
          </span>
          <span className="mt-1 block text-xs font-normal leading-relaxed text-slate-600">
            {description}
          </span>
        </span>
        <span
          className={`min-w-8 rounded-lg px-2 py-1 text-center text-base font-semibold tabular-nums ${count > 0 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}
        >
          {count}
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-primary rtl:rotate-180"
          aria-hidden="true"
        />
      </span>
    </Button>
  );
}

function SubjectIssueFilters({
  copy,
  search,
  status,
  resultCount,
  onSearchChange,
  onStatusChange,
  onClear,
}: {
  copy: ValidationCopy;
  search: string;
  status: SubjectStatusFilter;
  resultCount: number;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: SubjectStatusFilter) => void;
  onClear: () => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <Input
        ref={searchRef}
        type="search"
        inputSize="sm"
        value={search}
        aria-label={copy.searchIssues}
        placeholder={copy.searchIssues}
        leftIcon={<Search className="h-4 w-4" />}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <SubjectStatusFilters
        copy={copy}
        selectedStatus={status}
        onSelect={onStatusChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-xs font-medium text-slate-600">
          {copy.resultsCount}: {resultCount}
        </p>
        {(search !== "" || status !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 text-primary focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              onClear();
              searchRef.current?.focus();
            }}
          >
            {copy.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}

function SubjectStatusFilters({
  copy,
  selectedStatus,
  onSelect,
}: {
  copy: ValidationCopy;
  selectedStatus: SubjectStatusFilter;
  onSelect: (status: SubjectStatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={copy.filterIssues}>
      {subjectStatusOptions(copy).map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={selectedStatus === filter.value}
          onClick={() => onSelect(filter.value)}
          className={`min-h-11 cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            selectedStatus === filter.value
              ? "border-primary bg-primary text-white"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function subjectStatusOptions(copy: ValidationCopy) {
  return [
    { value: "all", label: copy.allIssues },
    { value: "under_scheduled", label: copy.status.under_scheduled },
    { value: "over_scheduled", label: copy.status.over_scheduled },
    {
      value: "missing_teacher_allocation",
      label: copy.status.missing_teacher_allocation,
    },
    {
      value: "missing_subject_allocation",
      label: copy.status.missing_subject_allocation,
    },
  ] satisfies Array<{ value: SubjectStatusFilter; label: string }>;
}

function SubjectIssueSection({
  group,
  defaultExpanded,
  locale,
  copy,
  openDestination,
  reviewContext,
}: {
  group: SubjectIssueGroup;
  defaultExpanded: boolean;
  locale: string;
  copy: ValidationCopy;
  openDestination: (path: string) => void;
  reviewContext?: ValidationReviewContext;
}) {
  return (
    <IssueAccordion
      title={group.title}
      count={group.items.length}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-3">
        {group.items.map((item) => (
          <ValidationItemCard
            key={`${item.classroomId}-${item.subjectId ?? "missing"}`}
            item={item}
            locale={locale}
            copy={copy}
            openDestination={openDestination}
            reviewContext={reviewContext}
          />
        ))}
      </div>
    </IssueAccordion>
  );
}

function IssueAccordion({
  title,
  count,
  defaultExpanded = false,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      slotProps={{ transition: { timeout: reducedMotion ? 0 : undefined } }}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px !important",
        overflow: "hidden",
        "&::before": { display: "none" },
        "& .MuiAccordionSummary-root": { minHeight: 52, bgcolor: "#f8fafc" },
        "& .MuiAccordionSummary-root.Mui-focusVisible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: -2,
        },
      }}
    >
      <AccordionSummary expandIcon={<ChevronDown className="h-4 w-4" />}>
        <SectionTitle title={title} count={count} />
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

function ReadinessBanner({
  canPublish,
  attentionItemCount,
  hasIssues,
  copy,
}: {
  canPublish: boolean;
  attentionItemCount: number;
  hasIssues: boolean;
  copy: ValidationCopy;
}) {
  const Icon = canPublish ? CheckCircle : AlertCircle;
  return (
    <div
      role="status"
      className={`rounded-xl border p-4 text-sm ${
        canPublish
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : hasIssues
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="font-medium">
          {canPublish
            ? copy.canPublish
            : hasIssues
              ? copy.cannotPublish
              : copy.checksUnavailable}
        </span>
      </div>
      {hasIssues && (
        <p className="mt-2 leading-relaxed">
          {copy.attentionTotal}: {attentionItemCount}
        </p>
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="min-h-8 text-xs font-medium text-slate-600 sm:min-h-0">
            {label}
          </div>
          <div className="mt-0.5 text-lg font-semibold text-slate-950">
            {value}
          </div>
        </div>
        <div className="hidden rounded-full bg-primary-50 p-1.5 text-primary sm:block">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ValidationItemCard({
  item,
  locale,
  copy,
  openDestination,
  reviewContext,
}: {
  item: TimetableValidationItem;
  locale: string;
  copy: ValidationCopy;
  openDestination: (path: string) => void;
  reviewContext?: ValidationReviewContext;
}) {
  const subjectName =
    localizedName(item.subject, locale) || copy.noSubjectLabel;
  const classroomName = localizedName(item.classroom, locale);
  const gradeName = localizedName(item.grade, locale);
  const expected = item.expectedWeeklyHours;
  const actual = item.scheduledWeeklyHours;
  const delta = expected === null ? null : actual - expected;
  const formatCount = new Intl.NumberFormat(locale).format;

  return (
    <article
      className={`rounded-xl border border-slate-200 border-s-4 bg-white p-4 ${item.status === "under_scheduled" ? "border-s-amber-400" : "border-s-red-400"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.subject?.color && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.subject.color }}
              />
            )}
            <h4 className="break-words text-sm font-semibold text-slate-950">
              {subjectName}
            </h4>
            {item.subject?.code && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                {item.subject.code}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {gradeName} · {classroomName}
          </p>
        </div>

        <StatusBadge status={item.status} copy={copy} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat
          label={copy.expected}
          value={expected === null ? copy.notAvailable : formatCount(expected)}
        />
        <MiniStat label={copy.scheduled} value={formatCount(actual)} />
        <MiniStat
          label={copy.delta}
          value={
            delta === null
              ? copy.notAvailable
              : delta > 0
                ? `+${formatCount(delta)}`
                : formatCount(delta)
          }
          tone={
            delta === null || delta === 0
              ? "normal"
              : delta > 0
                ? "red"
                : "amber"
          }
        />
      </dl>

      {item.issues.length > 0 && (
        <div className="mt-3 space-y-2">
          {item.issues.map((issue, index) => (
            <div
              key={`${issue.code ?? "issue"}-${index}`}
              className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
              {localizedIssueMessage(issue, copy)}
            </div>
          ))}
        </div>
      )}
      <ValidationSubjectActions
        item={item}
        context={reviewContext}
        openDestination={openDestination}
        locale={locale}
      />
    </article>
  );
}

function StatusBadge({
  status,
  copy,
}: {
  status: ValidationStatus;
  copy: ValidationCopy;
}) {
  return (
    <span
      className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {copy.status[status]}
    </span>
  );
}

function MiniStat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string | number;
  tone?: "normal" | "red" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-950";

  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-3 sm:px-3">
      <dt className="text-xs font-medium text-slate-600">{label}</dt>
      <dd className={`mt-1 text-base font-semibold tabular-nums ${toneClass}`}>
        <bdi>{value}</bdi>
      </dd>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
        {count}
      </span>
    </div>
  );
}

function FallbackIssueSection({ section }: { section: ValidationSection }) {
  if (section.issues.length === 0) {
    return null;
  }

  const Icon = section.severity === "error" ? AlertTriangle : AlertCircle;
  const colorClass =
    section.severity === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <IssueAccordion
      title={section.title}
      count={section.issues.length}
      defaultExpanded={section.severity === "error"}
    >
      <div className="space-y-2">
        {section.issues.map((issue, index) => (
          <div
            key={`${section.title}-${index}`}
            className={`flex gap-2 rounded-lg border p-3 text-sm ${colorClass}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{validationIssueText(issue)}</span>
          </div>
        ))}
      </div>
    </IssueAccordion>
  );
}

const DAY_NAMES: Record<string, { ar: string; en: string }> = {
  sun: { ar: "الأحد", en: "Sunday" },
  mon: { ar: "الإثنين", en: "Monday" },
  tue: { ar: "الثلاثاء", en: "Tuesday" },
  wed: { ar: "الأربعاء", en: "Wednesday" },
  thu: { ar: "الخميس", en: "Thursday" },
  fri: { ar: "الجمعة", en: "Friday" },
  sat: { ar: "السبت", en: "Saturday" },
};

function dayLabel(dayKey: string, locale: string): string {
  const names = DAY_NAMES[dayKey];
  return names ? (locale === "ar" ? names.ar : names.en) : dayKey;
}

function ConflictCard({
  conflict,
  group,
  teachers,
  rooms,
  classrooms,
  locale,
  copy,
  isSelected,
  onSelect,
}: {
  conflict: TimetableConflictDisplay;
  group: ValidationConflictGroup;
  teachers: NamedEntity[];
  rooms: NamedEntity[];
  classrooms: NamedEntity[];
  locale: string;
  copy: ValidationCopy;
  isSelected: boolean;
  onSelect: (conflict: TimetableConflictDisplay) => void;
}) {
  const resourceDirectory =
    conflict.type === "ROOM"
      ? rooms
      : conflict.type === "CLASSROOM"
        ? classrooms
        : teachers;
  const resource = resourceDirectory.find(
    (entity) => entity.id === conflict.resourceId,
  );
  const resourceName =
    localizedName(resource ?? null, locale) || copy.unknownResource;
  const hasScheduleMetadata = Boolean(conflict.dayKey || conflict.periodLabel);

  return (
    <Button
      type="button"
      variant="ghost"
      fullWidth
      aria-current={isSelected ? "true" : undefined}
      onClick={() => onSelect(conflict)}
      className={`items-start justify-start whitespace-normal border bg-white p-4 text-start shadow-sm focus:ring-2 focus:ring-primary-500 ${
        isSelected ? "border-primary-500" : "border-red-200"
      }`}
    >
      <span className="flex items-start gap-3">
        <span className="rounded-full bg-red-50 p-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-950">
              {conflictTitle(conflict.type, copy)}
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              {copy.blocking}
            </span>
          </span>
          <span className="mt-1 block text-sm text-slate-700">
            {resourceName}
          </span>
          {hasScheduleMetadata && (
            <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
              {conflict.dayKey && (
                <span>
                  {copy.day}: {dayLabel(conflict.dayKey, locale)}
                </span>
              )}
              {conflict.periodLabel && <span>{conflict.periodLabel}</span>}
              {conflict.startTime && conflict.endTime && (
                <span dir="ltr">
                  {formatTimetableTimeRange(
                    conflict.startTime,
                    conflict.endTime,
                  )}
                </span>
              )}
            </span>
          )}
          <span className="mt-3 block rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
            {conflict.message}
          </span>
          <ValidationConflictGroupSummary group={group} />
          {conflict.proposedIndexes && conflict.proposedIndexes.length > 0 && (
            <span className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">{copy.affectedItems}</span>
              {conflict.proposedIndexes.map((index) => (
                <span
                  key={index}
                  className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700"
                >
                  #{index + 1}
                </span>
              ))}
            </span>
          )}
        </span>
      </span>
    </Button>
  );
}

function conflictTitle(
  type: TimetableConflictDisplay["type"],
  copy: ValidationCopy,
): string {
  switch (type) {
    case "ROOM":
      return copy.roomConflictTitle;
    case "CLASSROOM":
      return copy.classroomConflictTitle;
    case "DUPLICATE":
      return copy.duplicateConflictTitle;
    case "UNKNOWN":
      return copy.unknownConflictTitle;
    default:
      return copy.teacherConflictTitle;
  }
}

function validationSections(
  validationSummary: TimetableValidationSummary,
  copy: ValidationCopy,
): ValidationSection[] {
  return [
    {
      title: copy.blockingReasons,
      issues: validationSummary.blockingReasons.map((message) => ({ message })),
      severity: "error",
      tab: "blockers",
    },
    {
      title: copy.warnings,
      issues: validationSummary.warnings.map((message) => ({ message })),
      severity: "warning",
      tab: "blockers",
    },
    {
      conflictType: "TEACHER",
      title: copy.teacherConflicts,
      issues: validationSummary.teacherConflicts,
      severity: "error",
      tab: "conflicts",
    },
    {
      conflictType: "CLASSROOM",
      title: copy.classroomConflicts,
      issues: validationSummary.classroomConflicts,
      severity: "error",
      tab: "conflicts",
    },
    {
      conflictType: "ROOM",
      title: copy.roomConflicts,
      issues: validationSummary.roomConflicts,
      severity: "error",
      tab: "conflicts",
    },
    {
      conflictType: "ROOM",
      title: copy.roomIntegrity,
      issues: validationSummary.roomIntegrityIssues,
      severity: "error",
      tab: "conflicts",
    },
    {
      conflictType: "UNKNOWN",
      title: copy.conflicts,
      issues: validationSummary.conflicts,
      severity: "error",
      tab: "conflicts",
    },
  ];
}

function subjectIssueGroups(
  issueItems: TimetableValidationItem[],
  copy: ValidationCopy,
): SubjectIssueGroup[] {
  const groups = new Map<ValidationStatus, TimetableValidationItem[]>();
  for (const issueItem of issueItems) {
    groups.set(issueItem.status, [
      ...(groups.get(issueItem.status) ?? []),
      issueItem,
    ]);
  }
  return Array.from(groups, ([status, items]) => ({
    title: copy.status[status],
    items,
  }));
}

function filterSubjectIssues({
  issues,
  locale,
  search,
  status,
}: {
  issues: TimetableValidationItem[];
  locale: string;
  search: string;
  status: SubjectStatusFilter;
}) {
  const normalizedSearch = search.trim().toLocaleLowerCase(locale);

  return issues
    .filter((issue) => status === "all" || issue.status === status)
    .filter((issue) => subjectIssueMatches(issue, locale, normalizedSearch))
    .sort(compareSubjectIssues);
}

function subjectIssueMatches(
  issue: TimetableValidationItem,
  locale: string,
  normalizedSearch: string,
) {
  if (!normalizedSearch) return true;

  return [
    localizedName(issue.subject, locale),
    issue.subject?.code ?? "",
    localizedName(issue.classroom, locale),
    localizedName(issue.grade, locale),
    ...issue.issues.map((validationIssue) => validationIssue.message),
  ]
    .join(" ")
    .toLocaleLowerCase(locale)
    .includes(normalizedSearch);
}

function compareSubjectIssues(
  firstIssue: TimetableValidationItem,
  secondIssue: TimetableValidationItem,
) {
  const statusDifference =
    subjectStatusPriority(firstIssue.status) -
    subjectStatusPriority(secondIssue.status);
  if (statusDifference !== 0) return statusDifference;

  return subjectIssueGap(secondIssue) - subjectIssueGap(firstIssue);
}

function subjectStatusPriority(status: ValidationStatus) {
  const priorities: Record<ValidationStatus, number> = {
    missing_teacher_allocation: 0,
    missing_subject_allocation: 1,
    over_scheduled: 2,
    under_scheduled: 3,
    complete: 4,
  };
  return priorities[status];
}

function subjectIssueGap(issue: TimetableValidationItem) {
  return Math.abs(
    issue.scheduledWeeklyHours - (issue.expectedWeeklyHours ?? 0),
  );
}

function nextBlockingTab({
  subjectIssueCount,
  conflictCount,
  blockerCount,
}: {
  subjectIssueCount: number;
  conflictCount: number;
  blockerCount: number;
}): ValidationNavigationTab | null {
  if (conflictCount > 0) return "conflicts";
  if (blockerCount > 0) return "blockers";
  return subjectIssueCount > 0 ? "subjects" : null;
}

function tabLabel(label: string, count: number): string {
  return `${label} (${count})`;
}

function publicationCategoryLabel(
  category: PublicationReasonCategory,
  locale: string,
) {
  const labels =
    locale === "ar"
      ? {
          configuration: "الإعداد والسياق الأكاديمي",
          curriculum: "متطلبات المنهج",
          teachers: "تخصيصات المعلمين",
          weekly_hours: "اكتمال الساعات الأسبوعية",
          conflicts: "تعارضات الجدول",
          rooms: "صلاحية الغرف",
        }
      : {
          configuration: "Configuration and academic context",
          curriculum: "Curriculum requirements",
          teachers: "Teacher allocations",
          weekly_hours: "Weekly-hour completeness",
          conflicts: "Timetable conflicts",
          rooms: "Room integrity",
        };
  return labels[category];
}

function publicationRequirementTarget(
  reasonCode: string,
  category: PublicationReasonCategory,
): PublicationRequirementTarget {
  if (reasonCode === "no_entries") return "schedule";
  if (category === "configuration") return "configuration";
  if (category === "teachers") return "teacherAllocation";
  if (category === "rooms") return "rooms";
  if (category === "conflicts") return "schedule";
  return "subjects";
}

function publicationRequirementDestination(
  reason: TimetablePublishReason,
  category: PublicationReasonCategory,
  referenceNames: PublicationReasonReferenceNames,
): string | null {
  const target = publicationRequirementTarget(reason.code, category);
  if (reason.code === "no_entries") return null;
  if (target === "configuration") return "/academics/timetable/setup";

  const details = reason.details ?? {};
  if (target === "subjects") {
    return pathWithParams("/academics/subjects", {
      tab: "matrix",
      stage: detailString(details, "stageId"),
      gradeId: detailString(details, "gradeId"),
      subjectId: detailString(details, "subjectId"),
      missing: isMissingCurriculumReason(reason.code) ? "1" : undefined,
    });
  }

  if (target === "teacherAllocation") {
    const classroomId = detailString(details, "classroomId");
    const subjectId = detailString(details, "subjectId");
    return pathWithParams("/academics/teacher-allocation", {
      grade: detailString(details, "gradeId"),
      section: detailString(details, "sectionId"),
      classroom: classroomId,
      subject: subjectId,
      missing: isMissingTeacherReason(reason.code) ? "1" : undefined,
      highlightCell:
        classroomId && subjectId ? `${classroomId}:${subjectId}` : undefined,
    });
  }

  if (target === "rooms") {
    const roomId = detailString(details, "roomId");
    return pathWithParams("/academics/rooms", {
      roomSearch: roomId ? referenceNames.roomId?.[roomId] : undefined,
    });
  }

  return pathWithParams("/academics/timetable", {
    stage: detailString(details, "stageId"),
    grade: detailString(details, "gradeId"),
    section: detailString(details, "sectionId"),
    classroom: detailString(details, "classroomId"),
  });
}

function pathWithParams(
  path: string,
  values: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([name, value]) => {
    if (value) params.set(name, value);
  });
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function detailString(
  details: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = details[name];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isMissingCurriculumReason(reasonCode: string) {
  return (
    reasonCode === "missing_subject_allocation" ||
    reasonCode === "missing_subject_allocation_row"
  );
}

function isMissingTeacherReason(reasonCode: string) {
  return (
    reasonCode === "missing_teacher_allocation" ||
    reasonCode === "teacher_allocation_missing"
  );
}

function requirementActionIcon(target: PublicationRequirementTarget) {
  if (target === "configuration") return <Settings2 className="h-4 w-4" />;
  if (target === "schedule") return <BookOpen className="h-4 w-4" />;
  if (target === "teacherAllocation") {
    return <UserRoundCheck className="h-4 w-4" />;
  }
  if (target === "rooms") return <DoorOpen className="h-4 w-4" />;
  return <ListChecks className="h-4 w-4" />;
}

function requirementActionLabel(
  target: PublicationRequirementTarget,
  copy: ValidationCopy,
) {
  if (target === "configuration") return copy.openConfiguration;
  if (target === "schedule") return copy.openSchedule;
  if (target === "teacherAllocation") return copy.openTeacherAllocation;
  if (target === "rooms") return copy.openRooms;
  return copy.openSubjects;
}

function localizedName(
  entity: { nameAr: string; nameEn: string } | null,
  locale: string,
) {
  if (!entity) return "";
  return locale === "ar"
    ? entity.nameAr || entity.nameEn
    : entity.nameEn || entity.nameAr;
}

function localizedIssueMessage(
  issue: TimetableValidationIssue,
  copy: ValidationCopy,
) {
  if (issue.code === "over_scheduled_subject") {
    return copy.overScheduledMessage;
  }
  if (issue.code === "under_scheduled_subject") {
    return copy.underScheduledMessage;
  }
  if (issue.code === "missing_teacher_allocation") {
    return copy.missingTeacherMessage;
  }
  if (issue.code === "missing_subject_allocation_row") {
    return copy.missingSubjectAllocationMessage;
  }
  return issue.message || validationIssueText(issue);
}

interface ValidationCopy {
  reviewingScope: string;
  backToTimetable: string;
  subjectTab: string;
  requirementsTab: string;
  subjectsDescription: string;
  conflictsDescription: string;
  requirementsDescription: string;
  clearFilters: string;
  noSubjectIssues: string;
  noConflicts: string;
  noRequirements: string;
  checksUnavailable: string;
  noDetails: string;
  reviewHint: string;
  countsHint: string;
  notAvailable: string;
  title: string;
  subtitle: string;
  close: string;
  canPublish: string;
  cannotPublish: string;
  classrooms: string;
  expectedSlots: string;
  scheduledSlots: string;
  noIssues: string;
  navigationLabel: string;
  overview: string;
  overviewDescription: string;
  publishBlockers: string;
  reviewBlockers: string;
  subjectIssues: string;
  noSubjectLabel: string;
  expected: string;
  scheduled: string;
  delta: string;
  blockingReasons: string;
  warnings: string;
  teacherConflicts: string;
  classroomConflicts: string;
  roomConflicts: string;
  roomIntegrity: string;
  conflicts: string;
  conflictAt: string;
  period: string;
  overScheduledMessage: string;
  underScheduledMessage: string;
  missingTeacherMessage: string;
  missingSubjectAllocationMessage: string;
  day: string;
  blockingConflicts: string;
  teacherConflictTitle: string;
  roomConflictTitle: string;
  classroomConflictTitle: string;
  duplicateConflictTitle: string;
  unknownConflictTitle: string;
  blocking: string;
  affectedItems: string;
  unknownResource: string;
  searchIssues: string;
  filterIssues: string;
  allIssues: string;
  resultsCount: string;
  noMatchingIssues: string;
  showMore: string;
  attentionTotal: string;
  actionRequired: string;
  recommendedNextStep: string;
  openConfiguration: string;
  openSchedule: string;
  openSubjects: string;
  openTeacherAllocation: string;
  openRooms: string;
  noEntriesHint: string;
  requirementHints: Record<PublicationReasonCategory, string>;
  status: Record<ValidationStatus, string>;
}

function getCopy(isRTL: boolean): ValidationCopy {
  if (isRTL) {
    return {
      reviewingScope: "نطاق إعدادات الجدول",
      backToTimetable: "العودة إلى الجدول",
      subjectTab: "المواد",
      requirementsTab: "النشر",
      subjectsDescription:
        "ابحث عن المادة أو الفصل، ثم قارن الحصص المطلوبة بالمجدولة.",
      conflictsDescription: "اختر تعارضًا لمراجعة حصصه المتأثرة وفتح جداولها.",
      requirementsDescription:
        "راجع سبب كل متطلب وانتقل إلى الصفحة المناسبة لمعالجته.",
      clearFilters: "مسح عوامل التصفية",
      noSubjectIssues: "لا توجد مشاكل مواد أو فصول في نتائج التحقق الحالية.",
      noConflicts: "لا توجد تعارضات في نتائج التحقق الحالية.",
      noRequirements: "لم تُرجع نتائج التحقق متطلبات نشر إضافية.",
      checksUnavailable: "جاهزية النشر غير مؤكدة بعد.",
      noDetails:
        "لم تصل تفاصيل مشاكل التحقق. عُد إلى الجدول وأعد تشغيل التحقق لتحميل أحدث النتائج.",
      reviewHint:
        "تعرض هذه النافذة آخر نتائج التحقق المحمّلة. أعد التحقق بعد تعديل الجدول.",
      countsHint:
        "قد تظهر المشكلة نفسها في أكثر من قسم؛ الأعداد تمثل نتائج الفحوص وليست مشاكل فريدة.",
      notAvailable: "غير محدد",
      title: "تحقق الجدول",
      subtitle: "مقارنة الحصص المجدولة بالساعات الأسبوعية والتعارضات.",
      close: "إغلاق",
      canPublish: "لا توجد مشاكل مانعة في نتائج التحقق الحالية.",
      cannotPublish: "يجب حل مشاكل التحقق قبل النشر.",
      classrooms: "الفصول",
      expectedSlots: "المطلوب أسبوعيا",
      scheduledSlots: "المجدول",
      noIssues: "لا توجد مشاكل تحقق أو تعارضات.",
      navigationLabel: "أقسام التحقق",
      overview: "نظرة عامة",
      overviewDescription: "ابدأ بالقسم الذي يحتاج إلى المعالجة أولاً.",
      publishBlockers: "متطلبات النشر",
      reviewBlockers: "مراجعة أول مشكلة",
      subjectIssues: "مشاكل المواد والفصول",
      noSubjectLabel: "مادة غير محددة",
      expected: "المطلوب",
      scheduled: "المجدول",
      delta: "الفرق",
      blockingReasons: "أسباب المنع",
      warnings: "التحذيرات",
      teacherConflicts: "تعارضات المعلمين",
      classroomConflicts: "تعارضات الفصول",
      roomConflicts: "تعارضات الغرف",
      roomIntegrity: "صلاحية الغرف",
      conflicts: "التعارضات",
      conflictAt: "يتعارض في",
      period: "الحصة",
      overScheduledMessage: "عدد الحصص المجدولة أعلى من الساعات الأسبوعية.",
      underScheduledMessage: "عدد الحصص المجدولة أقل من الساعات الأسبوعية.",
      missingTeacherMessage: "لا يوجد معلم مخصص لهذه المادة في هذا الفصل.",
      missingSubjectAllocationMessage:
        "لا توجد ساعات أسبوعية لهذه المادة في هذا الفصل.",
      day: "اليوم",
      blockingConflicts: "تعارضات مانعة",
      teacherConflictTitle: "تعارض معلم",
      roomConflictTitle: "تعارض غرفة",
      classroomConflictTitle: "تعارض فصل",
      duplicateConflictTitle: "حصة مكررة",
      unknownConflictTitle: "تعارض في الجدول",
      blocking: "مانع",
      affectedItems: "العناصر المتأثرة:",
      unknownResource: "مورد غير معروف",
      searchIssues: "ابحث باسم المادة أو الفصل أو الصف",
      filterIssues: "تصفية مشاكل المواد",
      allIssues: "الكل",
      resultsCount: "النتائج",
      noMatchingIssues: "لا توجد مشاكل مطابقة للبحث أو عامل التصفية.",
      showMore: "عرض المزيد",
      attentionTotal: "إجمالي النتائج التي تحتاج مراجعة",
      actionRequired: "يتطلب معالجة",
      recommendedNextStep: "الخطوة المقترحة",
      openConfiguration: "فتح إعدادات الجدول",
      openSchedule: "فتح الجدول الدراسي",
      openSubjects: "فتح صفحة المواد",
      openTeacherAllocation: "فتح تخصيص المعلمين",
      openRooms: "فتح صفحة الغرف",
      noEntriesHint: "أضف حصة واحدة على الأقل إلى الجدول، ثم أعد تشغيل التحقق.",
      requirementHints: {
        configuration:
          "راجع نطاق الجدول والفصل الدراسي والأيام والفترات التعليمية.",
        curriculum:
          "تأكد من إضافة الساعات الأسبوعية المطلوبة لكل مادة وصف دراسي.",
        teachers:
          "عيّن معلماً مناسباً لكل مادة وفصل قبل محاولة النشر مرة أخرى.",
        weekly_hours:
          "عدّل عدد الحصص المجدولة حتى يطابق الساعات الأسبوعية المطلوبة.",
        conflicts:
          "انقل إحدى الحصص المتداخلة أو غيّر المعلم أو الفترة الزمنية.",
        rooms: "عيّن غرفة نشطة ومناسبة للسعة، أو عالج حجز الغرفة المتعارض.",
      },
      status: {
        complete: "مكتمل",
        under_scheduled: "أقل من المطلوب",
        over_scheduled: "أعلى من المطلوب",
        missing_teacher_allocation: "معلم ناقص",
        missing_subject_allocation: "توزيع مادة ناقص",
      },
    };
  }

  return {
    reviewingScope: "Configuration scope",
    backToTimetable: "Back to timetable",
    subjectTab: "Subjects",
    requirementsTab: "Publishing",
    subjectsDescription:
      "Find a subject or classroom, then compare required and scheduled weekly lessons.",
    conflictsDescription:
      "Select a conflict to inspect its affected lessons and open their timetables.",
    requirementsDescription:
      "Review each requirement and open the relevant page to resolve it.",
    clearFilters: "Clear filters",
    noSubjectIssues: "No subject or classroom issues in the current checks.",
    noConflicts: "No conflicts in the current checks.",
    noRequirements:
      "The current checks returned no additional publishing requirements.",
    checksUnavailable: "Publishing readiness is not confirmed yet.",
    noDetails:
      "No issue details have been loaded. Return to the timetable and run validation to load the latest checks.",
    reviewHint:
      "These are the latest loaded checks. Run validation again after changing the timetable.",
    countsHint:
      "The same issue can appear in more than one category; counts represent findings rather than unique problems.",
    notAvailable: "Not set",
    title: "Timetable validation",
    subtitle: "Compare scheduled periods with weekly hours and conflicts.",
    close: "Close",
    canPublish: "No blocking issues in the current checks.",
    cannotPublish: "Resolve validation issues before publishing.",
    classrooms: "Classrooms",
    expectedSlots: "Expected slots",
    scheduledSlots: "Scheduled",
    noIssues: "No validation issues or conflicts found.",
    navigationLabel: "Validation sections",
    overview: "Overview",
    overviewDescription: "Start with the section that needs attention first.",
    publishBlockers: "Publishing requirements",
    reviewBlockers: "Review next issue",
    subjectIssues: "Subject scheduling issues",
    noSubjectLabel: "No subject",
    expected: "Expected",
    scheduled: "Scheduled",
    delta: "Delta",
    blockingReasons: "Blocking reasons",
    warnings: "Warnings",
    teacherConflicts: "Teacher conflicts",
    classroomConflicts: "Classroom conflicts",
    roomConflicts: "Room conflicts",
    roomIntegrity: "Room integrity",
    conflicts: "Conflicts",
    conflictAt: "conflict at",
    period: "period",
    overScheduledMessage: "Scheduled periods exceed weekly hours.",
    underScheduledMessage: "Scheduled periods are below weekly hours.",
    missingTeacherMessage:
      "This subject has no teacher allocation for this classroom.",
    missingSubjectAllocationMessage:
      "This subject has no weekly-hours row for this classroom.",
    day: "Day",
    blockingConflicts: "Blocking conflicts",
    teacherConflictTitle: "Teacher conflict",
    roomConflictTitle: "Room conflict",
    classroomConflictTitle: "Classroom conflict",
    duplicateConflictTitle: "Duplicate slot",
    unknownConflictTitle: "Timetable conflict",
    blocking: "Blocking",
    affectedItems: "Affected items:",
    unknownResource: "Unknown resource",
    searchIssues: "Search by subject, classroom, or grade",
    filterIssues: "Filter subject issues",
    allIssues: "All",
    resultsCount: "Results",
    noMatchingIssues: "No issues match the current search and filter.",
    showMore: "Show more",
    attentionTotal: "Total results requiring attention",
    actionRequired: "Action required",
    recommendedNextStep: "Recommended next step",
    openConfiguration: "Open timetable setup",
    openSchedule: "Open timetable",
    openSubjects: "Open subjects",
    openTeacherAllocation: "Open teacher allocation",
    openRooms: "Open rooms",
    noEntriesHint:
      "Add at least one entry to the timetable, then run validation again.",
    requirementHints: {
      configuration:
        "Review the timetable scope, term, active days, and instructional periods.",
      curriculum: "Add the required weekly hours for every subject and grade.",
      teachers:
        "Assign a suitable teacher to every subject and classroom before publishing.",
      weekly_hours:
        "Adjust scheduled periods to match each subject's required weekly hours.",
      conflicts:
        "Move an overlapping entry or change its teacher or time period.",
      rooms:
        "Assign an active room with enough capacity or resolve the room booking conflict.",
    },
    status: {
      complete: "Complete",
      under_scheduled: "Under scheduled",
      over_scheduled: "Over scheduled",
      missing_teacher_allocation: "Missing teacher",
      missing_subject_allocation: "Missing subject allocation",
    },
  };
}

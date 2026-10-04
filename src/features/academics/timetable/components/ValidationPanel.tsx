"use client";

import { Accordion, AccordionDetails, AccordionSummary, Drawer, Tab, Tabs } from "@mui/material";
import RtlProvider from "@mui/system/RtlProvider";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronDown,
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
import { useState, type ReactNode } from "react";
import {
  validationIssueText,
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
}

type ValidationNavigationTab =
  | "overview"
  | "subjects"
  | "conflicts"
  | "blockers";

interface SubjectIssueGroup {
  title: string;
  items: TimetableValidationItem[];
}

type ValidationStatus = TimetableValidationItem["status"];
type SubjectStatusFilter = "all" | Exclude<ValidationStatus, "complete">;
type PublicationRequirementTarget =
  | "configuration"
  | "schedule"
  | "subjects"
  | "teacherAllocation"
  | "rooms";

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
}: ValidationPanelProps) {
  const [activeTab, setActiveTab] = useState<ValidationNavigationTab>("overview");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectStatusFilter, setSubjectStatusFilter] =
    useState<SubjectStatusFilter>("all");
  const [visibleSubjectCount, setVisibleSubjectCount] = useState(
    INITIAL_VISIBLE_ISSUES,
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
    conflicts.length +
    conflictSections.reduce((total, section) => total + section.issues.length, 0);
  const blockerCount =
    publicationReasons.length +
    blockerSections.reduce((total, section) => total + section.issues.length, 0);
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

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 680,
          maxWidth: "100vw",
        },
      }}
    >
      <div
        className="flex h-full flex-col bg-slate-50"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {copy.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{copy.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={copy.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <ReadinessBanner
            canPublish={validationSummary.canPublish}
            attentionItemCount={attentionItemCount}
            copy={copy}
          />

          {summary && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              <SummaryMetric
                label={copy.publishIssues}
                value={attentionItemCount}
                icon={<AlertTriangle className="h-4 w-4" />}
                tone={attentionItemCount > 0 ? "red" : "green"}
              />
            </div>
          )}

          {!hasIssues ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{copy.noIssues}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="sticky -top-4 z-10 border-b border-slate-200 bg-slate-50/95 pb-2 pt-1 backdrop-blur sm:-top-5">
                <RtlProvider value={isRTL}>
                  <Tabs
                    dir={isRTL ? "rtl" : "ltr"}
                    value={activeTab}
                    onChange={(_event, nextTab) => setActiveTab(nextTab)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    aria-label={copy.navigationLabel}
                    sx={{
                      minHeight: 44,
                      "& .MuiTab-root": {
                        minHeight: 44,
                        minWidth: "auto",
                        px: 1.5,
                        textTransform: "none",
                      },
                    }}
                  >
                    <Tab value="overview" label={copy.overview} />
                    <Tab
                      value="subjects"
                      label={tabLabel(copy.subjectIssues, issueItems.length)}
                    />
                    <Tab
                      value="conflicts"
                      label={tabLabel(copy.conflicts, conflictCount)}
                    />
                    <Tab
                      value="blockers"
                      label={tabLabel(copy.publishBlockers, blockerCount)}
                    />
                  </Tabs>
                </RtlProvider>
              </div>

              {activeTab === "overview" && (
                <ValidationOverview
                  copy={copy}
                  subjectIssueCount={issueItems.length}
                  conflictCount={conflictCount}
                  blockerCount={blockerCount}
                  reviewTab={reviewTab}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === "subjects" && (
                <section className="space-y-2">
                  <SubjectIssueFilters
                    copy={copy}
                    search={subjectSearch}
                    status={subjectStatusFilter}
                    resultCount={filteredSubjectItems.length}
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
                      defaultExpanded={index === 0}
                      locale={locale}
                      copy={copy}
                    />
                  ))}
                  {filteredSubjectItems.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
                      {copy.noMatchingIssues}
                    </div>
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
                      {copy.showMore} ({filteredSubjectItems.length - visibleSubjectCount})
                    </Button>
                  )}
                </section>
              )}

              {activeTab === "conflicts" && (
                <section className="space-y-2">
                  {conflicts.length > 0 && (
                    <IssueAccordion
                      title={copy.blockingConflicts}
                      count={conflicts.length}
                      defaultExpanded
                    >
                      <div className="space-y-3">
                        {conflicts.map((conflict, index) => (
                          <ConflictCard
                            key={`${conflict.code ?? conflict.type}-${conflict.dayKey}-${conflict.periodId ?? conflict.periodIndex}-${index}`}
                            conflict={conflict}
                            teachers={teachers}
                            rooms={rooms}
                            classrooms={classrooms}
                            locale={locale}
                            copy={copy}
                            isSelected={selectedConflict === conflict}
                            onSelect={onConflictSelect}
                          />
                        ))}
                      </div>
                    </IssueAccordion>
                  )}
                  {conflictSections.map((section) => (
                    <FallbackIssueSection key={section.title} section={section} />
                  ))}
                </section>
              )}

              {activeTab === "blockers" && (
                <section className="space-y-2">
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
            </>
          )}
        </div>
      </div>
    </Drawer>
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
  const presentation = publicationReasonPresentation(reason, locale, referenceNames);
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
          <PublicationRequirementGuidance
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

function PublicationRequirementGuidance({
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
          <dt className="text-[11px] font-medium text-slate-500">{detail.label}</dt>
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
  reviewTab,
  onNavigate,
}: {
  copy: ValidationCopy;
  subjectIssueCount: number;
  conflictCount: number;
  blockerCount: number;
  reviewTab: ValidationNavigationTab | null;
  onNavigate: (tab: ValidationNavigationTab) => void;
}) {
  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">{copy.overviewDescription}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <NavigationMetric
          label={copy.subjectIssues}
          count={subjectIssueCount}
          onClick={() => onNavigate("subjects")}
        />
        <NavigationMetric
          label={copy.conflicts}
          count={conflictCount}
          onClick={() => onNavigate("conflicts")}
        />
        <NavigationMetric
          label={copy.publishBlockers}
          count={blockerCount}
          onClick={() => onNavigate("blockers")}
        />
      </div>
      <Button
        type="button"
        variant="primary"
        fullWidth
        disabled={reviewTab === null}
        onClick={() => reviewTab && onNavigate(reviewTab)}
      >
        {copy.reviewBlockers}
      </Button>
    </section>
  );
}

function NavigationMetric({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-center transition-colors duration-200 hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="text-xl font-semibold text-slate-950">{count}</div>
      <div className="mt-1 text-xs font-medium text-slate-600">{label}</div>
    </button>
  );
}

function SubjectIssueFilters({
  copy,
  search,
  status,
  resultCount,
  onSearchChange,
  onStatusChange,
}: {
  copy: ValidationCopy;
  search: string;
  status: SubjectStatusFilter;
  resultCount: number;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: SubjectStatusFilter) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <Input
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
      <p className="text-xs font-medium text-slate-600">
        {copy.resultsCount}: {resultCount}
      </p>
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
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
}: {
  group: SubjectIssueGroup;
  defaultExpanded: boolean;
  locale: string;
  copy: ValidationCopy;
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
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
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
  copy,
}: {
  canPublish: boolean;
  attentionItemCount: number;
  copy: ValidationCopy;
}) {
  const Icon = canPublish ? CheckCircle : AlertCircle;
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        canPublish
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="font-medium">
          {canPublish
            ? copy.canPublish
            : `${copy.cannotPublish} ${copy.attentionTotal}: ${attentionItemCount}`}
        </span>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "slate" | "red" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-slate-600">{label}</div>
          <div className="mt-0.5 text-lg font-semibold text-slate-950">
            {value}
          </div>
        </div>
        <div className={`rounded-full p-1.5 ${toneClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function ValidationItemCard({
  item,
  locale,
  copy,
}: {
  item: TimetableValidationItem;
  locale: string;
  copy: ValidationCopy;
}) {
  const subjectName =
    localizedName(item.subject, locale) || copy.noSubjectLabel;
  const classroomName = localizedName(item.classroom, locale);
  const gradeName = localizedName(item.grade, locale);
  const expected = item.expectedWeeklyHours ?? 0;
  const actual = item.scheduledWeeklyHours;
  const delta = actual - expected;

  return (
    <article className="rounded-lg border border-slate-200 border-s-4 border-s-red-400 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.subject?.color && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.subject.color }}
              />
            )}
            <h4 className="truncate text-sm font-semibold text-slate-950">
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

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label={copy.expected} value={expected} />
        <MiniStat label={copy.scheduled} value={actual} />
        <MiniStat
          label={copy.delta}
          value={delta > 0 ? `+${delta}` : String(delta)}
          tone={delta === 0 ? "normal" : delta > 0 ? "red" : "amber"}
        />
      </div>

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
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
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
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneClass}`}>{value}</div>
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
  teachers,
  rooms,
  classrooms,
  locale,
  copy,
  isSelected,
  onSelect,
}: {
  conflict: TimetableConflictDisplay;
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
      title: copy.teacherConflicts,
      issues: validationSummary.teacherConflicts,
      severity: "error",
      tab: "conflicts",
    },
    {
      title: copy.classroomConflicts,
      issues: validationSummary.classroomConflicts,
      severity: "error",
      tab: "conflicts",
    },
    {
      title: copy.roomConflicts,
      issues: validationSummary.roomConflicts,
      severity: "error",
      tab: "conflicts",
    },
    {
      title: copy.roomIntegrity,
      issues: validationSummary.roomIntegrityIssues,
      severity: "error",
      tab: "conflicts",
    },
    {
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
    subjectStatusPriority(firstIssue.status) - subjectStatusPriority(secondIssue.status);
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
  return Math.abs(issue.scheduledWeeklyHours - (issue.expectedWeeklyHours ?? 0));
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
  title: string;
  subtitle: string;
  close: string;
  canPublish: string;
  cannotPublish: string;
  classrooms: string;
  expectedSlots: string;
  scheduledSlots: string;
  publishIssues: string;
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
      title: "تحقق الجدول",
      subtitle: "مقارنة الحصص المجدولة بالساعات الأسبوعية والتعارضات.",
      close: "إغلاق",
      canPublish: "الجدول جاهز للنشر.",
      cannotPublish: "يجب حل مشاكل التحقق قبل النشر.",
      classrooms: "الفصول",
      expectedSlots: "المطلوب أسبوعيا",
      scheduledSlots: "المجدول",
      publishIssues: "نتائج التحقق",
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
      noEntriesHint:
        "أضف حصة واحدة على الأقل إلى الجدول، ثم أعد تشغيل التحقق.",
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
        rooms:
          "عيّن غرفة نشطة ومناسبة للسعة، أو عالج حجز الغرفة المتعارض.",
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
    title: "Timetable validation",
    subtitle: "Compare scheduled periods with weekly hours and conflicts.",
    close: "Close",
    canPublish: "This timetable is ready to publish.",
    cannotPublish: "Resolve validation issues before publishing.",
    classrooms: "Classrooms",
    expectedSlots: "Expected slots",
    scheduledSlots: "Scheduled",
    publishIssues: "Validation results",
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
      curriculum:
        "Add the required weekly hours for every subject and grade.",
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

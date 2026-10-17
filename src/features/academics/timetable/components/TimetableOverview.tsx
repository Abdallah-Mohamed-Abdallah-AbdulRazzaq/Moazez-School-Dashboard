"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { useTimetableOverview } from "../hooks/useTimetableOverview";
import type { TimetableScopeSelection } from "../services/timetableScope";
import { timetableWorkspaceQuery } from "../services/timetableWorkspaceNavigation";
import { TimetablePageLoadingSkeleton } from "./TimetableLoadingSkeletons";
import TimetableScopeDialog from "./TimetableScopeDialog";
import TimetableOverviewList from "./TimetableOverviewList";
import TimetableCoverageDialog from "./TimetableCoverageDialog";

export default function TimetableOverview({
  academicYearId,
  termId,
  contextName,
  readOnly,
}: {
  academicYearId: string;
  termId: string;
  contextName: string;
  readOnly: boolean;
}) {
  const t = useTranslations("academics.timetable.overview");
  const router = useRouter();
  const params = useSearchParams();
  const overview = useTimetableOverview(academicYearId, termId);
  const [creating, setCreating] = useState(false);
  const [uncoveredContext, setUncoveredContext] = useState<string | null>(null);
  const openWorkspace = (
    scope: TimetableScopeSelection,
    configId?: string,
    classroomId?: string,
  ) => {
    const next = timetableWorkspaceQuery(params.toString(), scope, configId);
    if (classroomId) next.set("classroom", classroomId);
    next.set("year", academicYearId);
    next.set("term", termId);
    if (!configId && scope.scopeType !== "TERM") next.set("configure", "1");
    router.push(
      scope.scopeType === "TERM" && !configId
        ? `/academics/timetable/setup?${next}`
        : `?${next}`,
      { scroll: false },
    );
  };
  if (overview.loading)
    return <TimetablePageLoadingSkeleton label={t("loading")} />;
  if (overview.failed || !overview.data)
    return (
      <div role="alert" className="space-y-3 p-6">
        <p>{t("loadFailed")}</p>
        <Button onClick={() => void overview.reload()}>{t("retry")}</Button>
      </div>
    );
  const { tree, dashboard, configurations, publicationStatuses, publications } =
    overview.data;
  const uncovered = tree.classrooms.filter(
    (classroom) =>
      !dashboard.items.some(
        (item) => item.classroomId === classroom.id && item.effectiveConfig,
      ),
  );
  return (
    <main className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">{t("title")}</h1>
            <p className="mt-1 text-sm font-medium text-primary">
              {contextName}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              {t("description")}
            </p>
          </div>
          {!readOnly && (
            <Button
              className="shrink-0"
              leftIcon={<Plus aria-hidden className="h-4 w-4" />}
              onClick={() => setCreating(true)}
            >
              {t("create")}
            </Button>
          )}
        </header>
        <aside className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-50 p-4 text-sm leading-6 text-gray-700">
          <Layers3 aria-hidden className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <p>{t("inheritance")}</p>
        </aside>
        {uncovered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>{t("uncovered", { count: uncovered.length })}</p>
            <Button
              variant="secondary"
              className="min-h-11 shrink-0 focus-visible:ring-2"
              onClick={() => setUncoveredContext(overview.contextKey)}
            >
              {t("viewClassrooms")}
            </Button>
          </div>
        )}
        {[...publicationStatuses.values()].includes("unavailable") && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <p>{t("statusRefreshFailed")}</p>
            <Button
              variant="secondary"
              onClick={() => void overview.retryPublicationStatuses()}
            >
              {t("retry")}
            </Button>
          </div>
        )}
        <section
          aria-label={t("configurations", { count: configurations.length })}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-gray-950">
            {t("configurations", { count: configurations.length })}
          </h2>
          {!configurations.length && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <CalendarDays
                aria-hidden
                className="mx-auto h-8 w-8 text-primary"
              />
              <h3 className="mt-3 font-semibold text-gray-950">
                {t("emptyTitle")}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
                {t(readOnly ? "emptyReadOnly" : "emptyDescription")}
              </p>
              {!readOnly && (
                <Button className="mt-4" onClick={() => setCreating(true)}>
                  {t("create")}
                </Button>
              )}
            </div>
          )}
          {configurations.length > 0 && (
            <TimetableOverviewList
              key={overview.contextKey}
              tree={tree}
              dashboard={dashboard}
              configurations={configurations}
              publicationStatuses={publicationStatuses}
              publications={publications}
              readOnly={readOnly}
              onOpen={openWorkspace}
            />
          )}
        </section>
      </div>
      {uncoveredContext === overview.contextKey && (
        <TimetableCoverageDialog
          tree={tree}
          dashboard={dashboard}
          configurations={configurations}
          classrooms={uncovered}
          category="uncovered"
          scopeLabel={contextName}
          readOnly={readOnly}
          onClose={() => setUncoveredContext(null)}
          onOpen={openWorkspace}
        />
      )}
      {creating && (
        <TimetableScopeDialog
          tree={tree}
          dashboard={dashboard}
          configurations={configurations}
          onClose={() => setCreating(false)}
          onContinue={openWorkspace}
        />
      )}
    </main>
  );
}

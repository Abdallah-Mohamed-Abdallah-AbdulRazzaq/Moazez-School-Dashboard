"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCheck, CheckCircle2, Clock3, Eye, FileCheck2, Search, ShieldCheck, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import type {
  BackendHomeworkCounters,
  HomeworkTargetUiModel,
} from "@/features/academics/homework/services/homeworkApi.types";

const counterKeys = [
  "totalTargets", "assigned", "viewed", "submitted",
  "late", "missing", "reviewed", "excused",
] as const;

type CounterKey = (typeof counterKeys)[number];

const counterAppearance: Record<CounterKey, { icon: LucideIcon; tone: string }> = {
  totalTargets: { icon: UsersRound, tone: "bg-primary/10 text-primary" },
  assigned: { icon: UserRound, tone: "bg-slate-100 text-slate-600" },
  viewed: { icon: Eye, tone: "bg-violet-50 text-violet-700" },
  submitted: { icon: FileCheck2, tone: "bg-blue-50 text-blue-700" },
  late: { icon: Clock3, tone: "bg-amber-50 text-amber-700" },
  missing: { icon: Clock3, tone: "bg-red-50 text-red-700" },
  reviewed: { icon: CheckCheck, tone: "bg-emerald-50 text-emerald-700" },
  excused: { icon: ShieldCheck, tone: "bg-slate-100 text-slate-600" },
};

interface HomeworkCountersProps {
  counters: BackendHomeworkCounters;
  targets: HomeworkTargetUiModel[];
  canViewStudents: boolean;
}

export default function HomeworkCounters({
  counters, targets, canViewStudents,
}: HomeworkCountersProps) {
  const t = useTranslations("academics.homework.counters");
  const locale = useLocale();
  const [selectedCounter, setSelectedCounter] = useState<CounterKey | null>(null);
  const [search, setSearch] = useState("");
  const matchingTargets = targets.filter((target) =>
    (selectedCounter === "totalTargets" || target.status.toLowerCase() === selectedCounter)
    && `${target.studentName} ${target.studentId}`.toLocaleLowerCase(locale)
      .includes(search.trim().toLocaleLowerCase(locale)),
  );

  return (
    <section className="py-1.5" aria-label={t("title")}>
      <div className="sr-only">
        <h2 className="text-sm font-semibold text-gray-900">{t("title")}</h2>
        {canViewStudents && <p className="text-xs text-gray-600">{t("hint")}</p>}
      </div>
      <div className="flex gap-2 overflow-x-auto py-1">
        {counterKeys.map((counter) => {
          const CounterIcon = counterAppearance[counter].icon;
          return (
            <Button
              key={counter}
              variant="secondary"
              size="sm"
              disabled={!canViewStudents}
              aria-label={t("viewStudents", { status: t(counter), count: counters[counter] ?? 0 })}
              aria-haspopup="dialog"
              className={`shrink-0 cursor-pointer !px-2.5 !py-1.5 text-start hover:!border-primary/40 hover:!bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-100 motion-reduce:transition-none ${counter === "totalTargets" ? "!border-primary/25 !bg-primary/5" : ""}`}
              onClick={() => { setSearch(""); setSelectedCounter(counter); }}
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CounterIcon className={`h-4 w-4 shrink-0 rounded ${counterAppearance[counter].tone}`} aria-hidden="true" />
                <span className="text-xs text-gray-600">{t(counter)}</span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {(counters[counter] ?? 0).toLocaleString(locale)}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
      <Modal
        isOpen={canViewStudents && selectedCounter !== null}
        onClose={() => setSelectedCounter(null)}
        title={selectedCounter ? t("studentsTitle", { status: t(selectedCounter) }) : t("title")}
        size="lg"
        description={t("dialogDescription")}
        footer={<Button variant="secondary" onClick={() => setSelectedCounter(null)}>{t("close")}</Button>}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <Input
            label={t("searchStudents")}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label={t("filterStatus")}
            value={selectedCounter ?? "totalTargets"}
            options={counterKeys.map((counter) => ({ value: counter, label: t(counter) }))}
            onChange={(status) => setSelectedCounter(counterKeys.find((counter) => counter === status) ?? "totalTargets")}
          />
        </div>
        <p role="status" className="my-3 text-sm text-gray-600">
          {t("studentCount", { count: matchingTargets.length })}
        </p>
        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100 px-4">
          {matchingTargets.map((target) => {
            const statusKey = counterKeys.find((counter) => counter === target.status.toLowerCase());
            return <li key={target.targetId} className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-gray-900">{target.studentName}</p>
                  <p className="mt-1 truncate text-xs text-gray-500" title={target.studentId}>{target.studentId}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusKey ? counterAppearance[statusKey].tone : "bg-slate-100 text-slate-600"}`}>
                {statusKey ? t(statusKey) : target.status}
              </span>
            </li>;
          })}
        </ul>
        {matchingTargets.length === 0 && (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8" />}
            message={t(search.trim() ? "noSearchResults" : "noStudents")}
            className="!py-8"
          />
        )}
      </Modal>
    </section>
  );
}

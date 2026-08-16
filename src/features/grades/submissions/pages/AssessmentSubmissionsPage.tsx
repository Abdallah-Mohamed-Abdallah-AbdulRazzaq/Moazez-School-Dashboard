"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { DataTable, Input, Select, type Column } from "@/components/ui";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { listAssessmentSubmissions } from "../services/gradesSubmissionsService";
import type { GradeSubmissionRow, SubmissionStatus } from "../types";
import { submissionStatusMessageKey } from "../utils/submissionStatus";

interface SubmissionTableRow extends GradeSubmissionRow {
  [key: string]: unknown;
}

export default function AssessmentSubmissionsPage({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations("academics.grades.submissions");
  const errorT = useTranslations("academics.grades.errors");
  const locale = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState<SubmissionTableRow[]>([]);
  const [status, setStatus] = useState<SubmissionStatus | "">("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(() => [
    { value: "", label: t("allStatuses") },
    ...(["in_progress", "submitted", "corrected"] as const).map((value) => ({
      value,
      label: t(`statuses.${submissionStatusMessageKey(value)}`),
    })),
  ], [t]);

  const columns = useMemo<Column<SubmissionTableRow>[]>(() => [
    {
      key: "student",
      label: t("student"),
      sortable: false,
      render: (_value, row) => (
        <span className="font-medium">
          {locale === "ar" ? row.student?.nameAr || row.student?.nameEn : row.student?.nameEn}
        </span>
      ),
    },
    {
      key: "enrollment",
      label: t("class"),
      sortable: false,
      render: (_value, row) => row.enrollment?.classroomName || "-",
    },
    {
      key: "status",
      label: t("status"),
      sortable: false,
      render: (_value, row) => t(`statuses.${submissionStatusMessageKey(row.status)}`),
    },
    {
      key: "progress",
      label: t("progress"),
      sortable: false,
      render: (_value, row) => `${row.progress.answeredCount}/${row.progress.totalQuestions}`,
    },
    {
      key: "pending",
      label: t("pending"),
      sortable: false,
      render: (_value, row) => row.progress.pendingCorrectionCount,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (_value, row) => (
        <div className="text-end" data-row-action>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/${locale}/grades/submissions/${row.id}`)}
          >
            {t("open")}
          </Button>
        </div>
      ),
    },
  ], [locale, router, t]);

  const loadSubmissions = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listAssessmentSubmissions(assessmentId, {
        status: status || undefined,
        search: search || undefined,
      });
      if (!signal.aborted) setRows(response.items.map((row) => ({ ...row })));
    } catch (requestError) {
      if (!signal.aborted) setError(errorT(mapGradesApiError(requestError)));
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [assessmentId, errorT, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadSubmissions(controller.signal));
    return () => controller.abort();
  }, [loadSubmissions]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t("title")}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
      </div>
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Select
          value={status}
          onChange={(value) => setStatus(value as SubmissionStatus | "")}
          options={statusOptions}
          placeholder={t("allStatuses")}
          aria-label={t("status")}
        />
      </div>
      {error ? <div className="border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error-text)]">{error}</div> : null}
      {!error ? (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          showPagination={false}
          showDensityToggle={false}
          emptyTitle={t("empty")}
          emptyDescription={t("subtitle")}
          searchQuery={search}
        />
      ) : null}
    </div>
  );
}

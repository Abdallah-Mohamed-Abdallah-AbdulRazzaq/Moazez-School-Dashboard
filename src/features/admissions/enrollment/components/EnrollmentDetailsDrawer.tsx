"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { isApiError } from "@/lib/api-error";
import type { EnrollmentDto } from "../api/enrollmentDtos";
import {
  fetchCurrentEnrollment,
  fetchEnrollmentHistory,
} from "../api/enrollmentApi";
import type { EnrollmentRecord } from "../model/enrollment";

interface Props {
  enrollment: EnrollmentRecord | null;
  onClose: () => void;
  canManage: boolean;
  canManageLifecycle: boolean;
  onReenroll: (enrollment: EnrollmentRecord) => void;
  onLifecycle: (
    action: "transfer" | "withdraw" | "promote",
    enrollment: EnrollmentRecord,
  ) => void;
}

async function loadOptionalData<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (isApiError(error) && error.status === 404) return fallback;
    throw error;
  }
}

export default function EnrollmentDetailsDrawer({
  enrollment,
  onClose,
  canManage,
  canManageLifecycle,
  onReenroll,
  onLifecycle,
}: Props) {
  const t = useTranslations("admissions.enrollment");
  const locale = useLocale();
  const fieldLabels = {
    status: t("details.fields.status"),
    academicYear: t("details.fields.academic_year"),
    grade: t("details.fields.grade"),
    section: t("details.fields.section"),
    classroom: t("details.fields.classroom"),
    enrollmentDate: t("details.fields.enrollment_date"),
  };
  const statusLabels = {
    active: t("status.active"),
    completed: t("status.completed"),
    withdrawn: t("status.withdrawn"),
  };
  const notAvailable = t("details.not_available");
  const [current, setCurrent] = useState<EnrollmentDto | null>(null);
  const [history, setHistory] = useState<EnrollmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enrollment) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setCurrent(null);
        setHistory([]);
        setError(false);
        setIsLoading(true);
        return Promise.all([
          loadOptionalData(fetchCurrentEnrollment(enrollment.studentId), null),
          loadOptionalData(fetchEnrollmentHistory(enrollment.studentId), []),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [nextCurrent, nextHistory] = result;
        if (!active) return;
        setCurrent(nextCurrent);
        setHistory(
          [...nextHistory].sort(
            (first, second) =>
              new Date(second.enrollmentDate).getTime() -
              new Date(first.enrollmentDate).getTime(),
          ),
        );
        setError(false);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [enrollment]);

  useEffect(() => {
    if (!enrollment) return;
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [enrollment, onClose]);

  if (!enrollment) return null;
  const shown = enrollment;
  const lifecycleUnavailable = enrollment.status === "withdrawn";

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("details.aria_label")}
        dir={locale === "ar" ? "rtl" : "ltr"}
        onClick={(event) => event.stopPropagation()}
        className={`absolute inset-y-0 flex w-full max-w-xl flex-col bg-white shadow-2xl ${locale === "ar" ? "left-0" : "right-0"}`}
      >
        <header className="flex items-start justify-between border-b border-slate-200 bg-slate-50 p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{t("details.title")}</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950">{enrollment.studentName}</h2>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${enrollment.status === "active" ? "bg-emerald-100 text-emerald-800" : enrollment.status === "withdrawn" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-700"}`}>
              {statusLabels[enrollment.status]}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={onClose}
            aria-label={t("details.close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/50 p-4 sm:p-6" aria-live="polite">
          {isLoading && (
            <div className="py-10" role="status">
              <PartialLoader />
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
              {t("details.unable_to_load")}
            </p>
          )}
          {!isLoading && (
            <>
              <Section
                title={t("details.current_enrollment")}
                enrollment={current}
                empty={t("details.no_active_enrollment")}
                fieldLabels={fieldLabels}
                statusLabels={statusLabels}
                locale={locale}
                notAvailable={notAvailable}
                featured
              />
              <Section title={t("details.overview")} enrollment={shown} fieldLabels={fieldLabels} statusLabels={statusLabels} locale={locale} notAvailable={notAvailable} />
              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <h3 className="font-bold text-slate-950">{t("details.history")}</h3>
                  <p className="text-xs font-medium text-slate-500">{t("details.history_order")}</p>
                </div>
                <div className="space-y-3 border-s-2 border-slate-200 ps-4">
                  {history.length ? (
                    history.map((item) => (
                      <Section
                        key={item.enrollmentId}
                        enrollment={item}
                        compact
                        fieldLabels={fieldLabels}
                        statusLabels={statusLabels}
                        locale={locale}
                        notAvailable={notAvailable}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("details.no_history")}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
        <footer className="flex flex-wrap gap-2 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.45)]">
          {lifecycleUnavailable && (
            <p
              role="status"
              className="w-full rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
            >
              {t("details.withdrawn_lifecycle_help")}
            </p>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!lifecycleUnavailable || !canManage}
            onClick={() => onReenroll(enrollment)}
          >
            {t("actions.new_enrollment")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={lifecycleUnavailable || !canManageLifecycle}
            onClick={() => onLifecycle("transfer", enrollment)}
          >
            {t("actions.transfer")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={lifecycleUnavailable || !canManageLifecycle}
            onClick={() => onLifecycle("promote", enrollment)}
          >
            {t("actions.promote")}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={lifecycleUnavailable || !canManageLifecycle}
            onClick={() => onLifecycle("withdraw", enrollment)}
          >
            {t("actions.withdraw")}
          </Button>
        </footer>
      </aside>
    </div>
  );
}

function Section({
  title,
  enrollment,
  empty,
  compact,
  featured,
  fieldLabels,
  statusLabels,
  locale,
  notAvailable,
}: {
  title?: string;
  enrollment: EnrollmentDto | EnrollmentRecord | null;
  empty?: string;
  compact?: boolean;
  featured?: boolean;
  fieldLabels: {
    status: string;
    academicYear: string;
    grade: string;
    section: string;
    classroom: string;
    enrollmentDate: string;
  };
  statusLabels: Record<string, string>;
  locale: string;
  notAvailable: string;
}) {
  if (!enrollment)
    return (
      <section>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{empty}</p>
      </section>
    );
  const date = "enrollmentDate" in enrollment ? enrollment.enrollmentDate : "";
  return (
    <section
      className={
        compact
          ? "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          : featured
            ? "rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      {title && <h3 className="mb-4 text-base font-bold text-slate-950">{title}</h3>}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Field label={fieldLabels.status} value={statusLabels[enrollment.status] ?? enrollment.status} notAvailable={notAvailable} />
        <Field label={fieldLabels.academicYear} value={enrollment.academicYear} notAvailable={notAvailable} />
        <Field label={fieldLabels.grade} value={enrollment.grade} notAvailable={notAvailable} />
        <Field label={fieldLabels.section} value={enrollment.section} notAvailable={notAvailable} />
        <Field label={fieldLabels.classroom} value={enrollment.classroom} notAvailable={notAvailable} />
        <Field
          label={fieldLabels.enrollmentDate}
          value={date ? new Date(date).toLocaleDateString(locale) : ""}
          notAvailable={notAvailable}
        />
      </dl>
    </section>
  );
}

function Field({ label, value, notAvailable }: { label: string; value: string; notAvailable: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 truncate font-semibold text-slate-900">{value || notAvailable}</dd>
    </div>
  );
}

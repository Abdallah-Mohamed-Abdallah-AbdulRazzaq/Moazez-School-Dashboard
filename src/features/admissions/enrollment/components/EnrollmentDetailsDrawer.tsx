"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { EnrollmentDto } from "../api/enrollmentDtos";
import {
  fetchCurrentEnrollment,
  fetchEnrollment,
  fetchEnrollmentHistory,
} from "../api/enrollmentApi";
import type { EnrollmentRecord } from "../model/enrollment";

interface Props {
  enrollment: EnrollmentRecord | null;
  onClose: () => void;
  canManage: boolean;
  canManageLifecycle: boolean;
  onEdit: (enrollment: EnrollmentRecord) => void;
  onLifecycle: (
    action: "transfer" | "withdraw" | "promote",
    enrollment: EnrollmentRecord,
  ) => void;
}

export default function EnrollmentDetailsDrawer({
  enrollment,
  onClose,
  canManage,
  canManageLifecycle,
  onEdit,
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
  const [detail, setDetail] = useState<EnrollmentDto | null>(null);
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
        setDetail(null);
        setCurrent(null);
        setHistory([]);
        setError(false);
        setIsLoading(true);
        return Promise.all([
          fetchEnrollment(enrollment.id),
          fetchCurrentEnrollment(enrollment.studentId),
          fetchEnrollmentHistory(enrollment.studentId),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [nextDetail, nextCurrent, nextHistory] = result;
        if (!active) return;
        setDetail(nextDetail);
        setCurrent(nextCurrent);
        setHistory(nextHistory);
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
  const shown = detail ?? enrollment;

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
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm text-gray-500">{t("details.title")}</p>
            <h2 className="text-xl font-bold">{enrollment.studentName}</h2>
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
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
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
              <Section title={t("details.overview")} enrollment={shown} fieldLabels={fieldLabels} statusLabels={statusLabels} locale={locale} notAvailable={notAvailable} />
              <Section
                title={t("details.current_enrollment")}
                enrollment={current}
                empty={t("details.no_active_enrollment")}
                fieldLabels={fieldLabels}
                statusLabels={statusLabels}
                locale={locale}
                notAvailable={notAvailable}
              />
              <section>
                <h3 className="mb-3 font-semibold">{t("details.history")}</h3>
                <div className="space-y-3">
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
        <footer className="flex flex-wrap gap-2 border-t border-border p-4">
          {canManage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(enrollment)}
            >
              {t("actions.edit_placement")}
            </Button>
          )}
          {canManageLifecycle && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onLifecycle("transfer", enrollment)}
              >
                {t("actions.transfer")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onLifecycle("promote", enrollment)}
              >
                {t("actions.promote")}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onLifecycle("withdraw", enrollment)}
              >
                {t("actions.withdraw")}
              </Button>
            </>
          )}
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
  fieldLabels,
  statusLabels,
  locale,
  notAvailable,
}: {
  title?: string;
  enrollment: EnrollmentDto | EnrollmentRecord | null;
  empty?: string;
  compact?: boolean;
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
          ? "rounded-lg border border-border p-3"
          : "rounded-xl bg-gray-50 p-4"
      }
    >
      {title && <h3 className="mb-3 font-semibold">{title}</h3>}
      <dl className="grid grid-cols-2 gap-3 text-sm">
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
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value || notAvailable}</dd>
    </div>
  );
}

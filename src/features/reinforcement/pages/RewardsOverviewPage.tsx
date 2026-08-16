"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gift,
  Package,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import MainLoader from "@/components/ui/loaders/MainLoader";
import AcademicStudentCascade, {
  type AcademicCascadeRecord,
  type AcademicStudentCascadeOptions,
  type AcademicStudentCascadeValue,
} from "@/components/ui/academic/AcademicStudentCascade";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  getRewardCatalogSummary,
  getRewardsOverview,
} from "../services/rewardDashboardService";
import type {
  RedemptionStatus,
  RewardCatalogStatus,
  RewardItemType,
} from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const asRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const numberValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const localizedTitle = (
  item: Record<string, unknown> | undefined,
  locale: string,
): string =>
  locale === "ar"
    ? stringValue(item?.titleAr) || stringValue(item?.titleEn) || "-"
    : stringValue(item?.titleEn) || stringValue(item?.titleAr) || "-";

const localizedStudentName = (
  student: Record<string, unknown> | undefined,
  locale: string,
): string => {
  const firstName = stringValue(student?.firstName);
  const lastName = stringValue(student?.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return locale === "ar"
    ? stringValue(student?.nameAr) ||
        stringValue(student?.name) ||
        fullName ||
        "-"
    : stringValue(student?.name) ||
        fullName ||
        stringValue(student?.nameEn) ||
        "-";
};

const formatDate = (value: unknown, locale: string): string => {
  const dateValue = stringValue(value);
  if (!dateValue) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(dateValue));
};

const getLocalizedValue = (
  record: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) {
      return val;
    }
  }
  return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const recordId = (record: Record<string, unknown>): string | undefined =>
  getLocalizedValue(record, ["id", "value"]);

const nestedRecordId = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => {
  const nested = toRecord(record[key]);
  return nested ? recordId(nested) : undefined;
};

const normalizeAcademicRecord = (
  value: unknown,
  parentKey?: "stage" | "grade" | "section",
): AcademicCascadeRecord | null => {
  const record = toRecord(value);
  if (!record) return null;

  const id = recordId(record);
  if (!id) return null;

  const normalized: AcademicCascadeRecord = {
    ...record,
    id,
  };
  if (parentKey) {
    const parentId =
      getLocalizedValue(record, [
        parentKey,
        `${parentKey}Id`,
        `${parentKey}_id`,
        "parentId",
        "parent_id",
      ]) ?? nestedRecordId(record, parentKey);
    if (parentId) {
      normalized[`${parentKey}Id`] = parentId;
    }
  }
  return normalized;
};

const normalizeStudentRecord = (value: unknown): AcademicCascadeRecord | null => {
  const record = toRecord(value);
  if (!record) return null;

  const studentId = getLocalizedValue(record, ["studentId", "id", "student_id"]);
  if (!studentId) return null;

  const classroom = toRecord(record.classroom);
  const section = toRecord(classroom?.section);
  const grade = toRecord(section?.grade);
  const stage = toRecord(grade?.stage);
  const nameEn =
    getLocalizedValue(record, ["nameEn", "fullNameEn", "full_name_en", "name"]) ??
    ([record.firstName, record.lastName]
      .filter((part) => typeof part === "string")
      .join(" ") || studentId);
  const nameAr =
    getLocalizedValue(record, ["nameAr", "fullNameAr", "full_name_ar", "name"]) ?? nameEn;
  const searchText = [
    getLocalizedValue(record, ["searchText"]),
    studentId,
    getLocalizedValue(record, ["enrollmentId", "enrollment_id"]),
    getLocalizedValue(record, ["code"]),
    getLocalizedValue(record, ["admissionNo", "admission_no"]),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...record,
    id: studentId,
    nameEn,
    nameAr,
    searchText,
    stageId:
      getLocalizedValue(record, ["stageId", "stage_id", "stage"]) ??
      getLocalizedValue(grade || {}, ["stageId", "stage_id"]) ??
      nestedRecordId(grade || {}, "stage") ??
      recordId(stage || {}),
    gradeId:
      getLocalizedValue(record, ["gradeId", "grade_id", "grade"]) ??
      getLocalizedValue(section || {}, ["gradeId", "grade_id", "grade"]) ??
      recordId(grade || {}),
    sectionId:
      getLocalizedValue(record, ["sectionId", "section_id", "section"]) ??
      getLocalizedValue(classroom || {}, ["sectionId", "section_id", "section"]) ??
      recordId(section || {}),
    classroomId:
      getLocalizedValue(record, ["classroomId", "classroom_id", "classroom"]) ??
      recordId(classroom || {}),
  };
};

const normalizeAcademicOptions = (
  options: Awaited<ReturnType<typeof getReinforcementFilterOptions>>,
): AcademicStudentCascadeOptions => ({
  stages: (options.stages || [])
    .map((item) => normalizeAcademicRecord(item))
    .filter((item): item is AcademicCascadeRecord => Boolean(item)),
  grades: (options.grades || [])
    .map((item) => normalizeAcademicRecord(item, "stage"))
    .filter((item): item is AcademicCascadeRecord => Boolean(item)),
  sections: (options.sections || [])
    .map((item) => normalizeAcademicRecord(item, "grade"))
    .filter((item): item is AcademicCascadeRecord => Boolean(item)),
  classrooms: (options.classrooms || [])
    .map((item) => normalizeAcademicRecord(item, "section"))
    .filter((item): item is AcademicCascadeRecord => Boolean(item)),
  students: (options.students || [])
    .map(normalizeStudentRecord)
    .filter((item): item is AcademicCascadeRecord => Boolean(item)),
});

function MiniMetric({
  label,
  value,
  color = "text-gray-900",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function RewardsOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId, isInitializing: academicContextLoading } =
    useAcademicYearTermLayoutContext();

  const {
    values,
    setValue,
  } = useReinforcementUrlFilters({
    paramKeys: [
      "studentId",
      "status",
      "catalogStatus",
      "type",
      "includeArchived",
      "includeDeleted",
      "onlyAvailable",
      "dateFrom",
      "dateTo",
    ],
    defaults: {},
  });

  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);

  // Dropdown options states
  const [academicOptions, setAcademicOptions] =
    useState<AcademicStudentCascadeOptions>({});
  const [cascadeValue, setCascadeValue] =
    useState<AcademicStudentCascadeValue>({});
  const [optionsLoading, setOptionsLoading] = useState(false);

  const canView = hasPermission("reinforcement.rewards.view");

  // Load filter options
  useEffect(() => {
    if (!canView || !academicYearId || !termId) {
      void Promise.resolve().then(() => setOptionsLoading(false));
      return;
    }
    
    let active = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const opts = await getReinforcementFilterOptions({
          academicYearId,
          termId,
        });
        if (!active) return;
        
        setAcademicOptions(normalizeAcademicOptions(opts));
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    void loadOptions();
    return () => {
      active = false;
    };
  }, [academicYearId, canView, locale, termId]);

  useEffect(() => {
    if (academicContextLoading || optionsLoading) return;
    if (!academicYearId || !termId) {
      void Promise.resolve().then(() => setCascadeValue({}));
      if (values.studentId) setValue("studentId", "");
      return;
    }
    if (!academicOptions.students) return;

    if (!values.studentId) {
      void Promise.resolve().then(() => setCascadeValue((current) =>
        current.studentId ? {} : current,
      ));
      return;
    }

    const selectedStudent = academicOptions.students.find(
      (student) => student.id === values.studentId || student.studentId === values.studentId,
    );
    if (!selectedStudent) {
      void Promise.resolve().then(() => setCascadeValue({}));
      setValue("studentId", "");
      return;
    }

    const asString = (value: unknown): string | undefined =>
      typeof value === "string" && value ? value : undefined;
      void Promise.resolve().then(() => setCascadeValue({
      stageId: asString(selectedStudent.stageId),
      gradeId: asString(selectedStudent.gradeId),
      sectionId: asString(selectedStudent.sectionId),
      classroomId: asString(selectedStudent.classroomId),
      studentId: values.studentId,
      }));
  }, [academicContextLoading, academicOptions.students, academicYearId, optionsLoading, setValue, termId, values.studentId]);

  const fetchData = useCallback(async () => {
    if (!canView) return;
    
    // Date validation
    if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
      setDateValidationError(t("rewardsModule.overview.errors.invalidDates") || "Start date cannot be after end date");
      setOverview(null);
      setLoading(false);
      return;
    }
    setDateValidationError(null);
    setLoading(true);
    setError(null);
    
    try {
      const [overviewData, summaryData] = await Promise.all([
        getRewardsOverview({
          academicYearId: academicYearId || undefined,
          termId: termId || undefined,
          studentId: values.studentId || undefined,
          status: values.status as RedemptionStatus | undefined,
          type: values.type as RewardItemType | undefined,
          includeArchived: values.includeArchived === "true",
          dateFrom: values.dateFrom || undefined,
          dateTo: values.dateTo || undefined,
        }),
        getRewardCatalogSummary({
          academicYearId: academicYearId || undefined,
          termId: termId || undefined,
          status: values.catalogStatus as RewardCatalogStatus | undefined,
          type: values.type as RewardItemType | undefined,
          includeArchived: values.includeArchived === "true",
          includeDeleted: values.includeDeleted === "true",
          onlyAvailable: values.onlyAvailable === "true",
          dateFrom: values.dateFrom || undefined,
          dateTo: values.dateTo || undefined,
        }),
      ]);
      setOverview(overviewData);
      setCatalogSummary(summaryData);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    t,
    academicYearId,
    termId,
    values.studentId,
    values.status,
    values.catalogStatus,
    values.type,
    values.includeArchived,
    values.includeDeleted,
    values.onlyAvailable,
    values.dateFrom,
    values.dateTo,
  ]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleClearFilters = () => {
    setCascadeValue({});
    setValue("studentId", "");
    setValue("status", "");
    setValue("catalogStatus", "");
    setValue("type", "");
    setValue("includeArchived", "");
    setValue("includeDeleted", "");
    setValue("onlyAvailable", "");
    setValue("dateFrom", "");
    setValue("dateTo", "");
  };

  const catalog = asRecord(overview?.catalog);
  const redemptions = asRecord(overview?.redemptions);
  const fulfillment = asRecord(overview?.fulfillment);
  const xp = asRecord(overview?.xp);
  const topRequestedRewards = asRecordArray(overview?.topRequestedRewards);
  const recentRedemptions = asRecordArray(overview?.recentRedemptions);
  const lowStockRewards = asRecordArray(overview?.lowStockRewards);
  const catalogSummaryValues = asRecord(catalogSummary?.summary);

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <ReinforcementPageHeader
        title={t("rewardsModule.title")}
        description={t("rewardsModule.description")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={loading}
            onClick={fetchData}
          >
            {t("actions.refresh")}
          </Button>
        }
      />

      {/* Error state */}
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Loading state */}
      {loading && !overview ? (
        <MainLoader />
      ) : (
        <>
          {/* Navigation Buttons */}
          <section className="flex flex-wrap gap-4">
            <Link href={`/${locale}/reinforcement/rewards/catalog`}>
              <Button leftIcon={<Package className="h-4 w-4" />}>
                {t("rewardsModule.catalog.title")}
              </Button>
            </Link>
            <Link href={`/${locale}/reinforcement/rewards/redemptions`}>
              <Button
                variant="secondary"
                leftIcon={<Gift className="h-4 w-4" />}
              >
                {t("rewardsModule.redemptions.title")}
              </Button>
            </Link>
          </section>

          {/* Filters section */}
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {t("rewardsModule.overview.filtersTitle") || "Filters"}
            </h2>
            
            <AcademicStudentCascade
              value={cascadeValue}
              options={academicOptions}
              loading={optionsLoading || academicContextLoading}
              disabled={!termId}
              labels={{
                student:
                  t("rewardsModule.redemptions.create.student") || "Student",
              }}
              onChange={(selection) => {
                setCascadeValue(selection);
                setValue("studentId", selection.studentId || "");
              }}
            />

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5 items-end">
              <Select
                label={t("rewardsModule.redemptions.table.status") || "Status"}
                value={values.status || ""}
                onChange={(val) => setValue("status", val)}
                options={[
                  { value: "requested", label: t("rewardsModule.status.requested") },
                  { value: "approved", label: t("rewardsModule.status.approved") },
                  { value: "rejected", label: t("rewardsModule.status.rejected") },
                  { value: "fulfilled", label: t("rewardsModule.status.fulfilled") },
                  { value: "cancelled", label: t("rewardsModule.status.cancelled") },
                ]}
                placeholder={t("rewardsModule.overview.allStatuses") || "All statuses"}
              />

              <Select
                label={t("rewardsModule.catalog.table.type") || "Type"}
                value={values.type || ""}
                onChange={(val) => setValue("type", val)}
                options={[
                  { value: "physical", label: t("rewardsModule.type.physical") },
                  { value: "digital", label: t("rewardsModule.type.digital") },
                  { value: "privilege", label: t("rewardsModule.type.privilege") },
                  { value: "certificate", label: t("rewardsModule.type.certificate") },
                  { value: "other", label: t("rewardsModule.type.other") },
                ]}
                placeholder={t("rewardsModule.overview.allTypes") || "All types"}
              />

              <Select
                label={t("rewardsModule.catalog.table.status") || "Catalog status"}
                value={values.catalogStatus || ""}
                onChange={(val) => setValue("catalogStatus", val)}
                options={[
                  { value: "draft", label: t("rewardsModule.status.draft") },
                  { value: "published", label: t("rewardsModule.status.published") },
                  { value: "archived", label: t("rewardsModule.status.archived") },
                ]}
                placeholder={t("rewardsModule.overview.allCatalogStatuses") || "All catalog statuses"}
              />

              <Input
                type="date"
                label={t("rewardsModule.overview.dateFrom") || "Date From"}
                value={values.dateFrom || ""}
                onChange={(e) => setValue("dateFrom", e.target.value)}
              />

              <Input
                type="date"
                label={t("rewardsModule.overview.dateTo") || "Date To"}
                value={values.dateTo || ""}
                onChange={(e) => setValue("dateTo", e.target.value)}
              />

              <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values.includeArchived === "true"}
                  onChange={(event) =>
                    setValue("includeArchived", event.target.checked ? "true" : "")
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>
                  {t("rewardsModule.overview.includeArchived") || "Include archived"}
                </span>
              </label>

              <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values.includeDeleted === "true"}
                  onChange={(event) =>
                    setValue("includeDeleted", event.target.checked ? "true" : "")
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>
                  {t("rewardsModule.overview.includeDeleted") || "Include deleted"}
                </span>
              </label>

              <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values.onlyAvailable === "true"}
                  onChange={(event) =>
                    setValue("onlyAvailable", event.target.checked ? "true" : "")
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>
                  {t("rewardsModule.overview.onlyAvailable") || "Only available"}
                </span>
              </label>
            </div>

            {(values.studentId || values.status || values.catalogStatus || values.type || values.includeArchived || values.includeDeleted || values.onlyAvailable || values.dateFrom || values.dateTo) ? (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleClearFilters}>
                  {t("rewardsModule.overview.clearFilters") || "Clear Filters"}
                </Button>
              </div>
            ) : null}

            {dateValidationError ? (
              <p className="text-xs text-red-600 font-medium">{dateValidationError}</p>
            ) : null}
          </section>

          {/* KPI Cards */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICardV2
              title={t("rewardsModule.overview.totalCatalogItems")}
              value={numberValue(catalog.total)}
              icon={Package}
              iconColor="#2563eb"
              iconBgColor="#dbeafe"
              showChart={false}
            />
            <KPICardV2
              title={t("rewardsModule.overview.activeItems")}
              value={numberValue(catalog.published)}
              icon={CheckCircle}
              iconColor="#16a34a"
              iconBgColor="#dcfce7"
              showChart={false}
            />
            <KPICardV2
              title={t("rewardsModule.overview.pendingRedemptions")}
              value={numberValue(fulfillment.pendingReview)}
              icon={Clock}
              iconColor="#d97706"
              iconBgColor="#fef3c7"
              showChart={false}
            />
            <KPICardV2
              title={t("rewardsModule.overview.totalEarnedXp")}
              value={numberValue(xp.totalEarnedXp)}
              icon={Gift}
              iconColor="#7c3aed"
              iconBgColor="#ede9fe"
              showChart={false}
            />
          </section>

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.catalogHealth")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniMetric
                  label={t("rewardsModule.status.draft")}
                  value={numberValue(catalog.draft)}
                />
                <MiniMetric
                  label={t("rewardsModule.status.published")}
                  value={numberValue(catalog.published)}
                  color="text-emerald-600"
                />
                <MiniMetric
                  label={t("rewardsModule.status.archived")}
                  value={numberValue(catalog.archived)}
                  color="text-amber-600"
                />
                <MiniMetric
                  label={t("rewardsModule.overview.available")}
                  value={numberValue(catalog.available)}
                  color="text-primary"
                />
                <MiniMetric
                  label={t("rewardsModule.catalog.stock.unlimited")}
                  value={numberValue(catalog.unlimited)}
                />
                <MiniMetric
                  label={t("rewardsModule.overview.limited")}
                  value={numberValue(catalog.limited)}
                />
                <MiniMetric
                  label={t("rewardsModule.overview.lowStock")}
                  value={numberValue(catalog.lowStock)}
                  color="text-amber-600"
                />
                <MiniMetric
                  label={t("rewardsModule.overview.outOfStock")}
                  value={numberValue(catalog.outOfStock)}
                  color="text-red-600"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.fulfillment")}
              </h2>
              <div className="space-y-3">
                <MiniMetric
                  label={t("rewardsModule.overview.fulfillmentRate")}
                  value={`${Math.round(numberValue(fulfillment.fulfillmentRate) * 100)}%`}
                  color="text-emerald-600"
                />
                <MiniMetric
                  label={t("rewardsModule.overview.pendingReview")}
                  value={numberValue(fulfillment.pendingReview)}
                  color="text-amber-600"
                />
                <MiniMetric
                  label={t("rewardsModule.overview.pendingFulfillment")}
                  value={numberValue(fulfillment.pendingFulfillment)}
                  color="text-primary"
                />
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.redemptionSummary")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "requested",
                  "approved",
                  "rejected",
                  "fulfilled",
                  "cancelled",
                ].map((status) => (
                  <MiniMetric
                    key={status}
                    label={t(`rewardsModule.status.${status}`)}
                    value={numberValue(redemptions[status])}
                  />
                ))}
                <MiniMetric
                  label={t("rewardsModule.overview.open")}
                  value={numberValue(redemptions.open)}
                  color="text-primary"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.xpSummary")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric
                  label={t("rewardsModule.overview.totalEarnedXp")}
                  value={numberValue(xp.totalEarnedXp)}
                  color="text-primary"
                />
                <MiniMetric
                  label={t("rewardsModule.overview.studentsWithXp")}
                  value={numberValue(xp.studentsWithXp)}
                />
                <MiniMetric
                  label={t("rewardsModule.overview.averageEarnedXp")}
                  value={numberValue(xp.averageEarnedXp)}
                />
              </div>
            </section>
          </div>

          {/* Catalog Summary */}
          {catalogSummary ? (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.catalog.title")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("rewardsModule.status.draft")}
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-700">
                    {numberValue(catalogSummaryValues.draft)}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("rewardsModule.status.published")}
                  </div>
                  <div className="mt-1 text-lg font-bold text-emerald-600">
                    {numberValue(catalogSummaryValues.published)}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("rewardsModule.status.archived")}
                  </div>
                  <div className="mt-1 text-lg font-bold text-amber-600">
                    {numberValue(catalogSummaryValues.archived)}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1fr,1.2fr]">
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.topRequestedRewards")}
              </h2>
              {topRequestedRewards.length > 0 ? (
                <div className="space-y-2">
                  {topRequestedRewards.slice(0, 10).map((reward) => {
                    const type = stringValue(reward.type) || "other";
                    const status = stringValue(reward.status) || "draft";

                    return (
                      <div
                        key={
                          stringValue(reward.catalogItemId) ||
                          localizedTitle(reward, locale)
                        }
                        className="rounded-lg bg-gray-50 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {localizedTitle(reward, locale)}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                {t(`rewardsModule.type.${type}`, {
                                  defaultValue: type,
                                })}
                              </span>
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                {t(`rewardsModule.status.${status}`, {
                                  defaultValue: status,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-end">
                            <p className="text-lg font-bold text-primary">
                              {numberValue(reward.totalRequests)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("rewardsModule.overview.requests")}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-500">
                          {[
                            "approved",
                            "fulfilled",
                            "rejected",
                            "cancelled",
                          ].map((statusKey) => (
                            <div key={statusKey}>
                              <span className="font-semibold text-gray-700">
                                {numberValue(reward[statusKey])}
                              </span>{" "}
                              {t(`rewardsModule.status.${statusKey}`)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyBlock
                  message={t("rewardsModule.emptyStates.topRequestedRewards")}
                />
              )}
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.recentRedemptions")}
              </h2>
              {recentRedemptions.length > 0 ? (
                <div className="space-y-2">
                  {recentRedemptions.slice(0, 10).map((redemption) => {
                    const catalogItem = asRecord(redemption.catalogItem);
                    const student = asRecord(redemption.student);
                    const status =
                      stringValue(redemption.status) || "requested";

                    return (
                      <div
                        key={
                          stringValue(redemption.id) ||
                          `${stringValue(redemption.catalogItemId)}-${stringValue(redemption.studentId)}`
                        }
                        className="flex flex-col gap-3 rounded-lg border border-gray-50 px-3 py-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {localizedTitle(catalogItem, locale)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {localizedStudentName(student, locale)}
                          </p>
                        </div>
                        <div className="shrink-0 text-start sm:text-end">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {t(`rewardsModule.status.${status}`, {
                              defaultValue: status,
                            })}
                          </span>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(redemption.requestedAt, locale)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyBlock
                  message={t("rewardsModule.emptyStates.recentRedemptions")}
                />
              )}
            </section>
          </div>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-semibold text-gray-900">
                {t("rewardsModule.overview.lowStockRewards")}
              </h2>
            </div>
            {lowStockRewards.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {lowStockRewards.slice(0, 15).map((reward) => {
                  const type = stringValue(reward.type) || "other";

                  return (
                    <div
                      key={
                        stringValue(reward.id) || localizedTitle(reward, locale)
                      }
                      className="rounded-lg bg-amber-50 px-3 py-3"
                    >
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {localizedTitle(reward, locale)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-amber-700">
                          {t(`rewardsModule.type.${type}`, {
                            defaultValue: type,
                          })}
                        </span>
                        <span className="text-gray-600">
                          {t("rewardsModule.catalog.table.stock")}:{" "}
                          {numberValue(reward.stockRemaining)} /{" "}
                          {numberValue(reward.stockQuantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyBlock
                message={t("rewardsModule.emptyStates.lowStockRewards")}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

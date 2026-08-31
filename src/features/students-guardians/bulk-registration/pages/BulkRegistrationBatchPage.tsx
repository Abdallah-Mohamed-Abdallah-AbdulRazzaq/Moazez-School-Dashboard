"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAcademicYears,
  fetchStructureTree,
  fetchTermsByYear,
  type StructureTree,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { isApiError } from "@/lib/api-error";
import {
  confirmBulkRegistration,
  createBulkRegistration,
  downloadBulkRegistrationTemplate,
  listBulkRegistrationRows,
} from "../api/bulkRegistrationApi";
import type {
  BulkRegistrationBatchDetail,
  BulkRegistrationBatchPlacement,
  BulkRegistrationPlacementInput,
  BulkRegistrationRow,
  BulkRegistrationRowStatus,
} from "../api/bulkRegistrationDtos";
import BulkRegistrationBatchSummary, {
  bulkRegistrationPlacementLabel,
  type BulkRegistrationPlacementNames,
} from "../components/BulkRegistrationBatchSummary";
import BulkRegistrationConfirmation from "../components/BulkRegistrationConfirmation";
import BulkRegistrationRowsTable from "../components/BulkRegistrationRowsTable";
import BulkRegistrationUploadPanel from "../components/BulkRegistrationUploadPanel";
import { useBulkRegistrationBatch } from "../hooks/useBulkRegistrationBatch";
import { getBulkRegistrationDefaultRowStatus } from "../model/bulkRegistrationModel";

interface BulkRegistrationBatchPageProps {
  batchId: string;
}

interface ConfirmedSnapshot {
  batch: BulkRegistrationBatchDetail;
  previousUpdatedAt: string;
}

const CORRECTABLE_FAILURES = new Set([
  "VALIDATION_FAILED",
  "EXECUTION_PARTIAL_FAILED",
  "FAILED",
]);

const copy = {
  en: {
    eyebrow: "Students and guardians",
    title: "Bulk registration batch",
    description:
      "Review backend validation, confirm a fresh ready batch, and continue to credentials after completion.",
    loadFailed: "The registration batch could not be loaded.",
    refresh: "Refresh batch",
    stale: "The batch changed before confirmation. Review the refreshed result.",
    confirmFailed: "Registration could not be confirmed.",
    confirmed: "Registration started.",
    correctedTitle: "Upload corrected CSV",
    correctedDescription:
      "This creates a new batch and leaves the current batch unchanged.",
    uploadSuccess: "Corrected CSV uploaded as a new batch.",
    uploadFailed: "The corrected CSV could not be uploaded.",
    downloadSuccess: "CSV template downloaded.",
    downloadFailed: "CSV template could not be downloaded.",
    completedTitle: "Student creation is complete",
    completedDescription:
      "Continue to credentials with this registration batch as the source.",
    credentials: "Continue to credentials",
  },
  ar: {
    eyebrow: "الطلاب وأولياء الأمور",
    title: "دفعة التسجيل الجماعي",
    description:
      "راجع تحقق الخادم، وأكد الدفعة الجاهزة الحديثة، ثم انتقل إلى بيانات الدخول بعد الاكتمال.",
    loadFailed: "تعذر تحميل دفعة التسجيل.",
    refresh: "تحديث الدفعة",
    stale: "تغيرت الدفعة قبل التأكيد. راجع النتيجة المحدثة.",
    confirmFailed: "تعذر تأكيد التسجيل.",
    confirmed: "بدأ تنفيذ التسجيل.",
    correctedTitle: "رفع ملف CSV مصحح",
    correctedDescription:
      "ينشئ هذا الإجراء دفعة جديدة ويترك الدفعة الحالية دون تغيير.",
    uploadSuccess: "تم رفع CSV المصحح كدفعة جديدة.",
    uploadFailed: "تعذر رفع ملف CSV المصحح.",
    downloadSuccess: "تم تنزيل قالب CSV.",
    downloadFailed: "تعذر تنزيل قالب CSV.",
    completedTitle: "اكتمل إنشاء الطلاب",
    completedDescription:
      "انتقل إلى بيانات الدخول باستخدام دفعة التسجيل هذه كمصدر.",
    credentials: "الانتقال إلى بيانات الدخول",
  },
} as const;

function localizedName(
  record: { name: string; nameAr?: string; nameEn?: string },
  locale: "ar" | "en",
): string {
  return locale === "ar"
    ? record.nameAr || record.name || record.nameEn || ""
    : record.nameEn || record.name || record.nameAr || "";
}

function placementNamesFromTree(
  tree: StructureTree,
  classroomId: string,
  locale: "ar" | "en",
): Pick<BulkRegistrationPlacementNames, "stage" | "grade" | "section" | "classroom"> | null {
  const classroom = tree.classrooms.find((candidate) => candidate.id === classroomId);
  const section = tree.sections.find((candidate) => candidate.id === classroom?.sectionId);
  const grade = tree.grades.find((candidate) => candidate.id === section?.gradeId);
  const stage = tree.stages.find((candidate) => candidate.id === grade?.stageId);
  if (!classroom || !section || !grade || !stage) return null;
  return {
    classroom: localizedName(classroom, locale),
    section: localizedName(section, locale),
    grade: localizedName(grade, locale),
    stage: localizedName(stage, locale),
  };
}

function structureTerm(terms: Term[], termId: string | null): Term | undefined {
  return (
    terms.find((term) => term.id === termId) ||
    terms.find((term) => term.status === "open") ||
    terms[0]
  );
}

async function resolvedPlacementNames(
  placement: BulkRegistrationBatchPlacement,
  locale: "ar" | "en",
): Promise<BulkRegistrationPlacementNames | null> {
  const years = await fetchAcademicYears();
  const year = years.find((candidate) => candidate.id === placement.academicYearId);
  const terms = await fetchTermsByYear(placement.academicYearId);
  const selectedTerm = terms.find((candidate) => candidate.id === placement.termId);
  const selectedStructureTerm = structureTerm(terms, placement.termId);
  if (!year || !selectedStructureTerm) return null;
  const tree = await fetchStructureTree(year.id, selectedStructureTerm.id);
  const hierarchy = placementNamesFromTree(
    tree,
    placement.classroomId,
    locale,
  );
  return hierarchy
    ? {
        academicYear: localizedName(year, locale),
        term: selectedTerm ? localizedName(selectedTerm, locale) : null,
        ...hierarchy,
      }
    : null;
}

function placementInput(
  batch: BulkRegistrationBatchDetail,
): BulkRegistrationPlacementInput {
  return {
    academicYearId: batch.placement.academicYearId,
    ...(batch.placement.termId ? { termId: batch.placement.termId } : {}),
    classroomId: batch.placement.classroomId,
    enrollmentDate: batch.placement.enrollmentDate,
  };
}

export default function BulkRegistrationBatchPage({
  batchId,
}: BulkRegistrationBatchPageProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const params = useParams<{ lang?: string }>();
  const lang = typeof params.lang === "string" ? params.lang : locale;
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();
  const polling = useBulkRegistrationBatch(batchId);
  const polledBatch = polling.data?.id === batchId ? polling.data : null;
  const [confirmedSnapshot, setConfirmedSnapshot] =
    useState<ConfirmedSnapshot | null>(null);
  const [conflictSnapshot, setConflictSnapshot] =
    useState<BulkRegistrationBatchDetail | null>(null);
  const [placementNames, setPlacementNames] =
    useState<BulkRegistrationPlacementNames | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmationInFlight = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [rows, setRows] = useState<BulkRegistrationRow[]>([]);
  const [rowsTotal, setRowsTotal] = useState(0);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsLoadFailed, setRowsLoadFailed] = useState(false);
  const [rowsRetryKey, setRowsRetryKey] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [selectedRowStatus, setSelectedRowStatus] =
    useState<BulkRegistrationRowStatus | undefined>();
  const [rowFilterTouched, setRowFilterTouched] = useState(false);
  const batch = confirmedSnapshot?.batch ?? polledBatch;
  const batchStatus = batch?.status;
  const placementAcademicYearId = polledBatch?.placement.academicYearId;
  const placementClassroomId = polledBatch?.placement.classroomId;
  const placementEnrollmentDate = polledBatch?.placement.enrollmentDate;
  const placementTermId = polledBatch?.placement.termId;
  const defaultRowStatus = batch
    ? getBulkRegistrationDefaultRowStatus(batch.status)
    : undefined;
  const rowStatus = rowFilterTouched ? selectedRowStatus : defaultRowStatus;

  useEffect(() => {
    setConfirmedSnapshot(null);
    setConflictSnapshot(null);
    setPlacementNames(null);
    setSelectedFile(null);
    setPage(1);
    setLimit(50);
    setSelectedRowStatus(undefined);
    setRowFilterTouched(false);
  }, [batchId]);

  useEffect(() => {
    if (!confirmedSnapshot || !polledBatch) return;
    if (polledBatch.updatedAt !== confirmedSnapshot.previousUpdatedAt) {
      setConfirmedSnapshot(null);
    }
  }, [confirmedSnapshot, polledBatch]);

  useEffect(() => {
    if (!conflictSnapshot || !polledBatch || polledBatch === conflictSnapshot) return;
    setConflictSnapshot(null);
  }, [conflictSnapshot, polledBatch]);

  useEffect(() => {
    if (
      !placementAcademicYearId ||
      !placementClassroomId ||
      !placementEnrollmentDate
    ) {
      return;
    }
    let active = true;
    setPlacementNames(null);
    resolvedPlacementNames(
      {
        academicYearId: placementAcademicYearId,
        classroomId: placementClassroomId,
        termId: placementTermId ?? null,
        enrollmentDate: placementEnrollmentDate,
      },
      locale,
    ).then(
      (names) => {
        if (active) setPlacementNames(names);
      },
      () => {
        if (active) setPlacementNames(null);
      },
    );
    return () => {
      active = false;
    };
  }, [
    locale,
    placementAcademicYearId,
    placementClassroomId,
    placementEnrollmentDate,
    placementTermId,
  ]);

  useEffect(() => {
    if (!batchStatus) return;
    const controller = new AbortController();
    setRowsLoading(true);
    setRowsLoadFailed(false);
    listBulkRegistrationRows(
      batchId,
      { page, limit, ...(rowStatus ? { status: rowStatus } : {}) },
      controller.signal,
    ).then(
      (rowsPage) => {
        if (controller.signal.aborted) return;
        setRows(rowsPage.items);
        setRowsTotal(rowsPage.total);
        setRowsLoading(false);
      },
      () => {
        if (controller.signal.aborted) return;
        setRowsLoadFailed(true);
        setRowsLoading(false);
      },
    );
    return () => controller.abort();
  }, [batchId, batchStatus, limit, page, rowStatus, rowsRetryKey]);

  const confirmBatch = async () => {
    if (!batch || batch.status !== "READY" || confirmationInFlight.current) return;
    confirmationInFlight.current = true;
    setConfirming(true);
    try {
      const executingBatch = await confirmBulkRegistration(batch.id);
      setConfirmedSnapshot({
        batch: executingBatch,
        previousUpdatedAt: batch.updatedAt,
      });
      polling.resumeFrom(executingBatch);
      showSuccess(text.confirmed);
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setConflictSnapshot(polledBatch);
        polling.retry();
        showWarning(text.stale);
      } else {
        showError(text.confirmFailed);
      }
    } finally {
      confirmationInFlight.current = false;
      setConfirming(false);
    }
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadBulkRegistrationTemplate();
      showSuccess(text.downloadSuccess);
    } catch {
      showError(text.downloadFailed);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const uploadCorrectedCsv = async () => {
    if (!batch || !selectedFile) return;
    setUploading(true);
    try {
      const replacementBatch = await createBulkRegistration(
        placementInput(batch),
        selectedFile,
      );
      showSuccess(text.uploadSuccess);
      router.replace(
        `/${lang}/students-guardians/bulk-registration/${replacementBatch.id}`,
      );
    } catch {
      showError(text.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const openStudent = useCallback(
    (studentId: string) => {
      router.push(`/${lang}/students-guardians/students/${studentId}`);
    },
    [lang, router],
  );

  const placementLabel = useMemo(
    () => (batch ? bulkRegistrationPlacementLabel(batch, placementNames) : ""),
    [batch, placementNames],
  );
  const freshReady = Boolean(
    batch === polledBatch &&
      batch?.status === "READY" &&
      !polling.isRefreshing &&
      !polling.error &&
      !conflictSnapshot,
  );

  if (polling.isInitialLoading && !batch) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <PartialLoader />
      </div>
    );
  }

  if (!batch) {
    return (
      <EmptyState
        message={text.loadFailed}
        action={<Button onClick={polling.retry}>{text.refresh}</Button>}
      />
    );
  }

  const correctableFailure = CORRECTABLE_FAILURES.has(batch.status);

  return (
    <div
      className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-primary">{text.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {text.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            {text.description}
          </p>
        </header>

        <BulkRegistrationBatchSummary
          batch={batch}
          placementNames={placementNames}
        />

        <BulkRegistrationConfirmation
          batch={batch}
          placementLabel={placementLabel}
          fresh={freshReady}
          loading={confirming}
          onConfirm={() => void confirmBatch()}
        />

        {correctableFailure ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {text.correctedTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {text.correctedDescription}
              </p>
            </div>
            <BulkRegistrationUploadPanel
              enabled
              selectedFile={selectedFile}
              downloadingTemplate={downloadingTemplate}
              uploading={uploading}
              onDownloadTemplate={() => void downloadTemplate()}
              onFileChange={setSelectedFile}
              onUpload={() => void uploadCorrectedCsv()}
            />
          </section>
        ) : null}

        {batch.status === "COMPLETED" ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-semibold text-emerald-900">
              {text.completedTitle}
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              {text.completedDescription}
            </p>
            <div className="mt-4">
              <Button
                onClick={() =>
                  router.push(
                    `/${lang}/students-guardians/credentials?sourceRegistrationBatchId=${encodeURIComponent(batch.id)}`,
                  )
                }
              >
                {text.credentials}
              </Button>
            </div>
          </section>
        ) : null}

        <BulkRegistrationRowsTable
          rows={rows}
          page={page}
          limit={limit}
          total={rowsTotal}
          status={rowStatus}
          loading={rowsLoading}
          loadFailed={rowsLoadFailed}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onStatusChange={(nextStatus) => {
            setRowFilterTouched(true);
            setSelectedRowStatus(nextStatus);
            setPage(1);
          }}
          onRetry={() => setRowsRetryKey((key) => key + 1)}
          onOpenStudent={openStudent}
        />
      </div>
    </div>
  );
}

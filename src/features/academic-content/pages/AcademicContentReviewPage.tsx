"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, FileCheck2, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import AcademicContentAccessGuard from "../components/AcademicContentAccessGuard";
import RevisionSnapshotView from "../components/editor/RevisionSnapshotView";
import ReviewDecisionActions from "../components/review/ReviewDecisionActions";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import { getAcademicContentRevision } from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../services/academicContentSelectors";
import type {
  AcademicContentRevisionDetail,
  AcademicContentTransitionResponse,
} from "../types/contracts";

const APPROVE_PERMISSION = "academics.academic_content.approve" as const;

interface LocalizedAcademicName {
  name: string;
  nameAr?: string;
  nameEn?: string;
}

function localizedAcademicName(
  entity: LocalizedAcademicName | undefined,
  locale: string,
): string | undefined {
  return (locale === "ar" ? entity?.nameAr : entity?.nameEn) || entity?.name;
}

function ReviewPageAccess({ children }: { children: React.ReactNode }) {
  return (
    <AcademicContentAccessGuard requiredPermission={APPROVE_PERMISSION}>
      {children}
    </AcademicContentAccessGuard>
  );
}

function LoadedAcademicContentReviewPage({
  contentId,
  revisionId,
}: {
  contentId: string;
  revisionId: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAcademicContentTranslations("review");
  const [revision, setRevision] =
    useState<AcademicContentRevisionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [targetOptions, setTargetOptions] =
    useState<AcademicTargetOptions | null>(null);
  const [targetOptionsUnavailable, setTargetOptionsUnavailable] =
    useState(false);
  const requestId = useRef(0);
  const { academicYears, terms } = useAcademicYearTermLayoutContext();

  const loadRevision = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedRevision = await getAcademicContentRevision(
        contentId,
        revisionId,
      );
      if (currentRequestId !== requestId.current) return;
      if (loadedRevision.id !== revisionId) {
        setLoadError(t("revision_mismatch"));
        setRevision(null);
        return;
      }
      setRevision(loadedRevision);
    } catch (error) {
      if (currentRequestId === requestId.current) {
        setLoadError(academicContentUiError(error).message);
        setRevision(null);
      }
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }, [contentId, revisionId, t]);

  useEffect(() => {
    void loadRevision();
    return () => {
      requestId.current += 1;
    };
  }, [loadRevision]);

  useEffect(() => {
    if (!revision || revision.targets.length === 0) return;
    let active = true;
    setTargetOptions(null);
    setTargetOptionsUnavailable(false);
    void loadAcademicTargetOptions({
      academicYearId: revision.academicYearId,
      termId: revision.termId,
    })
      .then((loadedOptions) => {
        if (active) setTargetOptions(loadedOptions);
      })
      .catch(() => {
        if (active) setTargetOptionsUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const queuePath = () => {
    const query = searchParams.toString();
    return `/${locale}/academic-content-hub/review${query ? `?${query}` : ""}`;
  };

  const finishDecision = (result: AcademicContentTransitionResponse) => {
    if (result.revisionId !== revisionId) {
      setDecisionError(t("stale_decision"));
      return;
    }
    setDecisionError(null);
    router.push(queuePath(), { scroll: false });
    router.refresh();
  };

  if (isLoading) {
    return (
      <main className="flex min-h-80 items-center justify-center p-4 sm:p-6">
        <PartialLoader />
      </main>
    );
  }

  if (loadError || !revision) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-white shadow-sm"
        >
          <EmptyState
            title={t("revision_unavailable")}
            message={loadError ?? t("revision_unavailable")}
            icon={<RefreshCw aria-hidden="true" className="size-10" />}
            action={
              <Button onClick={() => void loadRevision()}>{t("retry")}</Button>
            }
          />
        </div>
      </main>
    );
  }

  const academicYearName = localizedAcademicName(
    academicYears.find((year) => year.id === revision.academicYearId),
    locale,
  );
  const termName = localizedAcademicName(
    terms.find((term) => term.id === revision.termId),
    locale,
  );

  return (
    <main className="mx-auto min-w-0 max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileCheck2 aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              {t("detail_eyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">
              {t("detail_title", { number: revision.revisionNumber })}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              {t("detail_description")}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          leftIcon={
            <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          }
          onClick={() => router.push(queuePath(), { scroll: false })}
        >
          {t("back_to_queue")}
        </Button>
      </header>

      {decisionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {decisionError}
        </div>
      )}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <RevisionSnapshotView
          revision={revision}
          displayContext={{
            academicYearName,
            termName,
            targetOptions,
            targetOptionsUnavailable,
          }}
        />
        <aside className="xl:sticky xl:top-6">
          <ReviewDecisionActions
            contentId={contentId}
            revisionNumber={revision.revisionNumber}
            onDecisionComplete={finishDecision}
          />
        </aside>
      </div>
    </main>
  );
}

export default function AcademicContentReviewPage({
  contentId,
  revisionId,
}: {
  contentId: string;
  revisionId: string;
}) {
  return (
    <ReviewPageAccess>
      <LoadedAcademicContentReviewPage
        contentId={contentId}
        revisionId={revisionId}
      />
    </ReviewPageAccess>
  );
}

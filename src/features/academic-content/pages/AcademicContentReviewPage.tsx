"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import AcademicContentAccessGuard from "../components/AcademicContentAccessGuard";
import RevisionSnapshotView from "../components/editor/RevisionSnapshotView";
import ReviewDecisionActions from "../components/review/ReviewDecisionActions";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import { getAcademicContentRevision } from "../services/academicContentApi";
import { academicContentUiError } from "../services/academicContentErrors";
import type {
  AcademicContentRevisionDetail,
  AcademicContentTransitionResponse,
} from "../types/contracts";

const APPROVE_PERMISSION = "academics.academic_content.approve" as const;

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
  const [revision, setRevision] = useState<AcademicContentRevisionDetail | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const loadRevision = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedRevision = await getAcademicContentRevision(contentId, revisionId);
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
        <div role="alert" className="rounded-xl border border-red-200 bg-white shadow-sm">
          <EmptyState
            title={t("revision_unavailable")}
            message={loadError ?? t("revision_unavailable")}
            icon={<RefreshCw aria-hidden="true" className="size-10" />}
            action={<Button onClick={() => void loadRevision()}>{t("retry")}</Button>}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-w-0 max-w-screen-xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">{t("detail_eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {t("detail_title", { number: revision.revisionNumber })}
          </h1>
        </div>
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />}
          onClick={() => router.push(queuePath(), { scroll: false })}
        >
          {t("back_to_queue")}
        </Button>
      </div>

      {decisionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {decisionError}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <RevisionSnapshotView revision={revision} />
      </section>
      <ReviewDecisionActions
        contentId={contentId}
        reviewedRevisionId={revisionId}
        onDecisionComplete={finishDecision}
      />
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

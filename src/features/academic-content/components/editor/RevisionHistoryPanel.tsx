"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { listAcademicContentRevisions } from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentRevisionListResponse } from "../../types/contracts";
import RevisionDetailModal from "./RevisionDetailModal";

const PAGE_SIZE = 10;

export default function RevisionHistoryPanel({ contentId }: { contentId: string }) {
  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState<{
    key: string;
    response: AcademicContentRevisionListResponse;
  } | null>(null);
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const requestKey = `${contentId}:${page}`;

  useEffect(() => {
    let active = true;
    void listAcademicContentRevisions(contentId, { page, limit: PAGE_SIZE })
      .then((loadedResponse) => {
        if (active) setLoadedPage({ key: requestKey, response: loadedResponse });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setLoadError({ key: requestKey, message: academicContentUiError(loadError).message });
        }
      });
    return () => {
      active = false;
    };
  }, [contentId, page, requestKey]);

  const response = loadedPage?.key === requestKey ? loadedPage.response : null;
  const error = loadError?.key === requestKey ? loadError.message : null;
  const isLoading = !response && !error;

  const totalPages = response ? Math.max(1, Math.ceil(response.total / response.limit)) : 1;

  return (
    <section
      id="revisions"
      aria-labelledby="revisions-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <History aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div>
          <h2 id="revisions-heading" className="text-lg font-semibold text-gray-900">
            Revision history
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Open immutable snapshots captured by the backend.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center"><PartialLoader /></div>
      ) : response && response.items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {response.items.map((revision) => (
            <button
              key={revision.id}
              type="button"
              aria-label={`Open revision ${revision.revisionNumber}`}
              onClick={() => setSelectedRevisionId(revision.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-start transition-colors hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span>
                <span className="block text-sm font-semibold text-gray-900">{revision.title}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  Revision {revision.revisionNumber} · Snapshot v{revision.snapshotContractVersion}
                </span>
              </span>
              <span className="text-xs text-gray-500">{revision.capturedAt}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          No revisions have been captured.
        </p>
      )}

      {response && response.total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Previous revisions page"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Next revisions page"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      )}

      <RevisionDetailModal
        contentId={contentId}
        revisionId={selectedRevisionId}
        isOpen={selectedRevisionId !== null}
        onClose={() => setSelectedRevisionId(null)}
      />
    </section>
  );
}

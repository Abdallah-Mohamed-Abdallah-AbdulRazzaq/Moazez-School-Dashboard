"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal/Modal";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { formatByteCount } from "../../model/academicContentPolicy";
import { getAcademicContentRevision } from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentRevisionDetail } from "../../types/contracts";

interface RevisionDetailModalProps {
  contentId: string;
  revisionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RevisionDetailModal({
  contentId,
  revisionId,
  isOpen,
  onClose,
}: RevisionDetailModalProps) {
  const [revision, setRevision] = useState<AcademicContentRevisionDetail | null>(null);
  const [loadError, setLoadError] = useState<{
    revisionId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !revisionId) return;
    let active = true;
    void getAcademicContentRevision(contentId, revisionId)
      .then((loadedRevision) => {
        if (!active) return;
        if (loadedRevision.id !== revisionId) {
          setLoadError({
            revisionId,
            message: "The revision response did not match the requested snapshot.",
          });
          return;
        }
        setRevision(loadedRevision);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setLoadError({
            revisionId,
            message: academicContentUiError(loadError).message,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [contentId, isOpen, revisionId]);

  const currentRevision = revision?.id === revisionId ? revision : null;
  const currentError = loadError?.revisionId === revisionId ? loadError.message : null;
  const isLoading = isOpen && Boolean(revisionId) && !currentRevision && !currentError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentRevision ? `Revision ${currentRevision.revisionNumber}` : "Revision snapshot"}
      size="xl"
    >
      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <PartialLoader />
        </div>
      ) : currentError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {currentError}
        </div>
      ) : currentRevision ? (
        <div className="space-y-5 pb-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Immutable historical snapshot · Snapshot contract v{currentRevision.snapshotContractVersion}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Title", currentRevision.title],
              ["Type", currentRevision.type],
              ["Audience", currentRevision.audience],
              ["Source status", currentRevision.sourceStatus],
              ["Academic year", currentRevision.academicYearId],
              ["Term", currentRevision.termId],
              ["Captured at", currentRevision.capturedAt],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 break-words text-sm text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>

          {currentRevision.description && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{currentRevision.description}</p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-gray-900">Type details</h3>
            {currentRevision.details === null ? (
              <p className="mt-2 text-sm text-gray-500">
                No type-specific details in this snapshot.
              </p>
            ) : (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(currentRevision.details, null, 2)}
              </pre>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900">Targets</h3>
            {currentRevision.targets.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No historical targets.</p>
            ) : (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(currentRevision.targets, null, 2)}
              </pre>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900">Files</h3>
            <ul className="mt-2 space-y-2">
              {currentRevision.assets.map((asset) => (
                <li key={`${asset.fileId}:${asset.sortOrder}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-900">{asset.originalName}</span>
                  <span className="ms-2 text-gray-500">
                    {asset.mimeType} · {formatByteCount(asset.sizeBytes)}
                  </span>
                </li>
              ))}
              {currentRevision.assets.length === 0 && <li className="text-sm text-gray-500">No historical files.</li>}
            </ul>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Links</h3>
              <ul className="mt-2 space-y-2">
                {currentRevision.links.map((link) => (
                  <li key={link.id} className="text-sm">
                    <a className="text-primary underline" href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
                {currentRevision.links.length === 0 && <li className="text-sm text-gray-500">No historical links.</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {currentRevision.tags.map((tag) => (
                  <li key={tag.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {tag.value}
                  </li>
                ))}
                {currentRevision.tags.length === 0 && <li className="text-sm text-gray-500">No historical tags.</li>}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

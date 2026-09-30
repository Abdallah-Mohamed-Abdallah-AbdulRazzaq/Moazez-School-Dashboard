"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/modal/Modal";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { formatByteCount } from "../../model/academicContentPolicy";
import { getAcademicContentRevision } from "../../services/academicContentApi";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentRevisionDetail } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

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
  const t = useAcademicContentTranslations("revisions");

  useEffect(() => {
    if (!isOpen || !revisionId) return;
    let active = true;
    void getAcademicContentRevision(contentId, revisionId)
      .then((loadedRevision) => {
        if (!active) return;
        if (loadedRevision.id !== revisionId) {
          setLoadError({
            revisionId,
            message: t("mismatch"),
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
  }, [contentId, isOpen, revisionId, t]);

  const currentRevision = revision?.id === revisionId ? revision : null;
  const currentError = loadError?.revisionId === revisionId ? loadError.message : null;
  const isLoading = isOpen && Boolean(revisionId) && !currentRevision && !currentError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentRevision ? t("modal_number", { number: currentRevision.revisionNumber }) : t("modal_title")}
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
            {t("immutable", { version: currentRevision.snapshotContractVersion })}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              [t("field_title"), currentRevision.title],
              [t("field_type"), currentRevision.type],
              [t("field_audience"), currentRevision.audience],
              [t("field_source_status"), currentRevision.sourceStatus],
              [t("field_academic_year"), currentRevision.academicYearId],
              [t("field_term"), currentRevision.termId],
              [t("field_captured_at"), currentRevision.capturedAt],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 break-words text-sm text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>

          {currentRevision.description && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900">{t("description_label")}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{currentRevision.description}</p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-gray-900">{t("type_details")}</h3>
            {currentRevision.details === null ? (
              <p className="mt-2 text-sm text-gray-500">
                {t("no_details")}
              </p>
            ) : (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(currentRevision.details, null, 2)}
              </pre>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900">{t("targets")}</h3>
            {currentRevision.targets.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">{t("no_targets")}</p>
            ) : (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(currentRevision.targets, null, 2)}
              </pre>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900">{t("files")}</h3>
            <ul className="mt-2 space-y-2">
              {currentRevision.assets.map((asset) => (
                <li key={`${asset.fileId}:${asset.sortOrder}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-900">{asset.originalName}</span>
                  <span className="ms-2 text-gray-500">
                    {asset.mimeType} · {formatByteCount(asset.sizeBytes)}
                  </span>
                </li>
              ))}
              {currentRevision.assets.length === 0 && <li className="text-sm text-gray-500">{t("no_files")}</li>}
            </ul>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t("links")}</h3>
              <ul className="mt-2 space-y-2">
                {currentRevision.links.map((link) => (
                  <li key={link.id} className="text-sm">
                    <a className="text-primary underline" href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
                {currentRevision.links.length === 0 && <li className="text-sm text-gray-500">{t("no_links")}</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t("tags")}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {currentRevision.tags.map((tag) => (
                  <li key={tag.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {tag.value}
                  </li>
                ))}
                {currentRevision.tags.length === 0 && <li className="text-sm text-gray-500">{t("no_tags")}</li>}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

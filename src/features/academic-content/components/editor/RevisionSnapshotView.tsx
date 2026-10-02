"use client";

import { formatByteCount } from "../../model/academicContentPolicy";
import type { AcademicContentRevisionDetail } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

export default function RevisionSnapshotView({
  revision,
}: {
  revision: AcademicContentRevisionDetail;
}) {
  const t = useAcademicContentTranslations("revisions");

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        {t("immutable", { version: revision.snapshotContractVersion })}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          [t("field_title"), revision.title],
          [t("field_type"), revision.type],
          [t("field_audience"), revision.audience],
          [t("field_source_status"), revision.sourceStatus],
          [t("field_academic_year"), revision.academicYearId],
          [t("field_term"), revision.termId],
          [t("field_captured_at"), revision.capturedAt],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 break-words text-sm text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>

      {revision.description && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900">
            {t("description_label")}
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {revision.description}
          </p>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-gray-900">
          {t("type_details")}
        </h3>
        {revision.details === null ? (
          <p className="mt-2 text-sm text-gray-500">{t("no_details")}</p>
        ) : (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(revision.details, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900">{t("targets")}</h3>
        {revision.targets.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{t("no_targets")}</p>
        ) : (
          <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(revision.targets, null, 2)}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900">{t("files")}</h3>
        <ul className="mt-2 space-y-2">
          {revision.assets.map((asset) => (
            <li
              key={`${asset.fileId}:${asset.sortOrder}`}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-900">{asset.originalName}</span>
              <span className="ms-2 text-gray-500">
                {asset.mimeType} · {formatByteCount(asset.sizeBytes)}
              </span>
            </li>
          ))}
          {revision.assets.length === 0 && (
            <li className="text-sm text-gray-500">{t("no_files")}</li>
          )}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t("links")}</h3>
          <ul className="mt-2 space-y-2">
            {revision.links.map((link) => (
              <li key={link.id} className="text-sm">
                <a
                  className="text-primary underline"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
            {revision.links.length === 0 && (
              <li className="text-sm text-gray-500">{t("no_links")}</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t("tags")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {revision.tags.map((tag) => (
              <li
                key={tag.id}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
              >
                {tag.value}
              </li>
            ))}
            {revision.tags.length === 0 && (
              <li className="text-sm text-gray-500">{t("no_tags")}</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

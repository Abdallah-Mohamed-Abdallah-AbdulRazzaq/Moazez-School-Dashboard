"use client";

import { Download, FileText, Link2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  formatByteCount,
  isValidHttpsUrl,
} from "../../model/academicContentPolicy";
import type {
  AcademicContentAsset,
  AcademicContentDetail,
} from "../../types/contracts";
import EditorSummaryCard from "../editor/EditorSummaryCard";

type Content = Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>;

export default function OnlineSessionResources({
  content,
  downloadError,
  onDownload,
}: {
  content: Content;
  downloadError: string | null;
  onDownload: (asset: AcademicContentAsset) => void;
}) {
  const t = useAcademicContentTranslations("online_session_detail");
  if (!content.assets.length && !content.links.length && !content.tags.length)
    return null;
  return (
    <section aria-label={t("resources")} className="space-y-4">
      {downloadError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {downloadError}
        </p>
      ) : null}
      {content.assets.length ? (
        <EditorSummaryCard
          icon={<FileText aria-hidden="true" className="size-5" />}
          title={t("materials")}
        >
          <ul className="divide-y divide-gray-100">
            {content.assets.map((asset) => (
              <li
                key={asset.assetId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {asset.originalName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {asset.mimeType} · {formatByteCount(asset.sizeBytes)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label={t("download_named", { name: asset.originalName })}
                  leftIcon={<Download aria-hidden="true" className="size-4" />}
                  onClick={() => onDownload(asset)}
                >
                  {t("download")}
                </Button>
              </li>
            ))}
          </ul>
        </EditorSummaryCard>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {content.links.length ? (
          <EditorSummaryCard
            icon={<Link2 aria-hidden="true" className="size-5" />}
            title={t("related_links")}
          >
            <ul className="space-y-2">
              {content.links.map((link) => (
                <li key={link.id}>
                  {isValidHttpsUrl(link.url) ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </EditorSummaryCard>
        ) : null}
        {content.tags.length ? (
          <EditorSummaryCard
            icon={<Tags aria-hidden="true" className="size-5" />}
            title={t("tags")}
          >
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {tag.value}
                </span>
              ))}
            </div>
          </EditorSummaryCard>
        ) : null}
      </div>
    </section>
  );
}

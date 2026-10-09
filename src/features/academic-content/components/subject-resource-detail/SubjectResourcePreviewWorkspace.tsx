"use client";

import { Download, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { EmbeddedFilePreview } from "@/components/ui/embedded-file-preview";
import { formatByteCount } from "../../model/academicContentPolicy";
import {
  orderedSubjectResourceAssets,
  subjectResourceAssetKind,
} from "../../model/subjectResourceDetail";
import type { AcademicContentAsset } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

interface SubjectResourcePreviewWorkspaceProps {
  assets: AcademicContentAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onDownload: (asset: AcademicContentAsset) => void;
}

type Translate = ReturnType<typeof useAcademicContentTranslations>;

function EmptyPreview({ t }: { t: Translate }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center">
        <FileQuestion aria-hidden="true" className="size-10 text-gray-400" />
        <h2 className="font-semibold text-gray-900">
          {t("preview.empty_title")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("preview.empty_description")}
        </p>
      </div>
    </section>
  );
}

function previewLabels(t: Translate) {
  return {
    loading: t("preview.loading"),
    unavailable: t("preview.unavailable"),
    unavailableDescription: t("preview.unavailable_description"),
    accessDenied: t("preview.access_denied"),
    accessDeniedDescription: t("preview.access_denied_description"),
    tooLarge: t("preview.too_large"),
    truncated: t("preview.truncated"),
  };
}

function AssetSelector({
  assets,
  selectedAsset,
  onSelectAsset,
  label,
}: {
  assets: AcademicContentAsset[];
  selectedAsset: AcademicContentAsset;
  onSelectAsset: (assetId: string) => void;
  label: string;
}) {
  if (assets.length <= 1) return null;
  return (
    <div
      aria-label={label}
      className="flex gap-2 overflow-x-auto border-t border-gray-200 p-3"
    >
      {assets.map((asset) => (
        <button
          key={asset.assetId}
          type="button"
          aria-pressed={asset.assetId === selectedAsset.assetId}
          className={`min-w-44 rounded-lg border px-3 py-2 text-start transition-colors ${asset.assetId === selectedAsset.assetId ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"}`}
          onClick={() => onSelectAsset(asset.assetId)}
        >
          <span className="block truncate text-sm font-medium">
            {asset.originalName}
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            {formatByteCount(asset.sizeBytes)}
          </span>
        </button>
      ))}
    </div>
  );
}

function SelectedAssetPreview({
  asset,
  onDownload,
  t,
}: {
  asset: AcademicContentAsset;
  onDownload: (asset: AcademicContentAsset) => void;
  t: Translate;
}) {
  const previewFile = {
    id: asset.fileId,
    name: asset.originalName,
    size: Number(asset.sizeBytes),
    type: asset.mimeType,
  };
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-gray-950">
            {asset.originalName}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {asset.mimeType} · {formatByteCount(asset.sizeBytes)}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Download aria-hidden="true" className="size-4" />}
          onClick={() => onDownload(asset)}
        >
          {t("actions.download")}
        </Button>
      </header>
      <div className="bg-gray-50">
        <EmbeddedFilePreview
          file={previewFile}
          kind={subjectResourceAssetKind(asset)}
          labels={previewLabels(t)}
        />
      </div>
    </>
  );
}

export default function SubjectResourcePreviewWorkspace({
  assets,
  selectedAssetId,
  onSelectAsset,
  onDownload,
}: SubjectResourcePreviewWorkspaceProps) {
  const t = useAcademicContentTranslations("subject_resource_detail");
  const orderedAssets = orderedSubjectResourceAssets(assets);
  const selectedAsset =
    orderedAssets.find((asset) => asset.assetId === selectedAssetId) ?? null;

  if (!selectedAsset) return <EmptyPreview t={t} />;

  return (
    <section
      aria-label={t("preview.title")}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <SelectedAssetPreview
        asset={selectedAsset}
        onDownload={onDownload}
        t={t}
      />
      <AssetSelector
        assets={orderedAssets}
        selectedAsset={selectedAsset}
        onSelectAsset={onSelectAsset}
        label={t("preview.attachments")}
      />
    </section>
  );
}

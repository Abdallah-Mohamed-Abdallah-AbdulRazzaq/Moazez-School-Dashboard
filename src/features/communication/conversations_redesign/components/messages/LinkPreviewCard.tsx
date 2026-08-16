import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  firstUrlInText,
  isPreviewableUrl,
  normalizePreviewUrl,
  type LinkPreviewMetadata,
} from "@/features/communication/conversations_redesign/utils/linkPreview";

export function LinkPreviewCard({
  isOwn,
  text,
}: {
  isOwn: boolean;
  text: string;
}) {
  const previewUrl = useMemo(() => {
    const firstUrl = firstUrlInText(text);
    return firstUrl && isPreviewableUrl(firstUrl)
      ? normalizePreviewUrl(firstUrl)
      : null;
  }, [text]);
  const [previewState, setPreviewState] = useState<{
    metadata: LinkPreviewMetadata | null;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!previewUrl) return;

    let isActive = true;

    fetch(`/api/link-preview?url=${encodeURIComponent(previewUrl)}`, {
      cache: "force-cache",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((nextMetadata: LinkPreviewMetadata | null) => {
        if (isActive) {
          setPreviewState({ metadata: nextMetadata, url: previewUrl });
        }
      })
      .catch(() => {
        if (isActive) setPreviewState({ metadata: null, url: previewUrl });
      });

    return () => {
      isActive = false;
    };
  }, [previewUrl]);

  const metadata =
    previewState?.url === previewUrl ? previewState.metadata : null;
  if (!metadata) return null;

  return (
    <a
      href={metadata.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 block overflow-hidden rounded-lg border text-start transition hover:opacity-90 ${
        isOwn
          ? "border-white/20 bg-primary-700/30 text-white"
          : "border-slate-200 bg-slate-50 text-slate-900"
      }`}
    >
      {metadata.image ? (
        <Image
          src={metadata.image}
          alt={metadata.title}
          width={480}
          height={180}
          unoptimized
          className="h-32 w-full object-cover"
        />
      ) : null}
      <div className="space-y-1 px-3 py-2">
        <p
          className={`text-[11px] font-medium uppercase ${
            isOwn ? "text-white/70" : "text-slate-500"
          }`}
        >
          {metadata.domain}
        </p>
        <p className="line-clamp-2 text-sm font-semibold leading-5">
          {metadata.title}
        </p>
        {metadata.description ? (
          <p
            className={`line-clamp-2 text-xs leading-5 ${
              isOwn ? "text-white/75" : "text-slate-600"
            }`}
          >
            {metadata.description}
          </p>
        ) : null}
      </div>
    </a>
  );
}

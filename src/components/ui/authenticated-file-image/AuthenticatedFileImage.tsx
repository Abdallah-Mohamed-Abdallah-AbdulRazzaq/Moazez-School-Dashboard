"use client";

import { useEffect, useState } from "react";
import { ImageOff, LoaderCircle, RefreshCw } from "lucide-react";
import { downloadFileBlob } from "@/services/filesService";

type ImageState =
  | { requestKey: string | null; status: "idle" | "error"; url: null }
  | { requestKey: string; status: "ready"; url: string };

export interface AuthenticatedFileImageProps {
  fileId?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  canDownload: boolean;
  unavailableLabel: string;
  retryLabel: string;
  className?: string;
  cache?: boolean;
}

const authenticatedImageUrlCache = new Map<string, string>();
const authenticatedImageRequestCache = new Map<string, Promise<string>>();

function loadCachedImageUrl(fileId: string): Promise<string> {
  const cachedUrl = authenticatedImageUrlCache.get(fileId);
  if (cachedUrl) return Promise.resolve(cachedUrl);

  const cachedRequest = authenticatedImageRequestCache.get(fileId);
  if (cachedRequest) return cachedRequest;

  const request = downloadFileBlob(fileId)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      authenticatedImageUrlCache.set(fileId, url);
      authenticatedImageRequestCache.delete(fileId);
      return url;
    })
    .catch((error) => {
      authenticatedImageRequestCache.delete(fileId);
      throw error;
    });

  authenticatedImageRequestCache.set(fileId, request);
  return request;
}

export function clearAuthenticatedFileImageCache() {
  authenticatedImageUrlCache.forEach((url) => URL.revokeObjectURL(url));
  authenticatedImageUrlCache.clear();
  authenticatedImageRequestCache.clear();
}

export default function AuthenticatedFileImage({
  fileId,
  fallbackSrc,
  alt,
  canDownload,
  unavailableLabel,
  retryLabel,
  className = "h-12 w-12",
  cache = false,
}: AuthenticatedFileImageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = fileId && canDownload ? `${fileId}:${retryCount}` : null;
  const cachedUrl = cache && fileId
    ? authenticatedImageUrlCache.get(fileId)
    : undefined;
  const [state, setState] = useState<ImageState>(() => {
    return cachedUrl && requestKey
      ? { requestKey, status: "ready", url: cachedUrl }
      : { requestKey: null, status: "idle", url: null };
  });

  useEffect(() => {
    if (!fileId || !requestKey) return;
    if (cachedUrl) return;

    let active = true;
    let objectUrl: string | null = null;

    const imageRequest = cache
      ? loadCachedImageUrl(fileId)
      : downloadFileBlob(fileId).then((blob) => {
          objectUrl = URL.createObjectURL(blob);
          return objectUrl;
        });

    void imageRequest
      .then((url) => {
        if (!active) return;
        setState({ requestKey, status: "ready", url });
      })
      .catch(() => {
        if (active) setState({ requestKey, status: "error", url: null });
      });

    return () => {
      active = false;
      if (!cache && objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cache, cachedUrl, fileId, requestKey]);

  const visibleState =
    cachedUrl && requestKey
      ? { requestKey, status: "ready" as const, url: cachedUrl }
      : state.requestKey === requestKey
      ? state
      : requestKey
        ? { requestKey, status: "loading" as const, url: null }
        : { requestKey: null, status: "idle" as const, url: null };

  const frameClass = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400 ${className}`;

  if (!fileId && fallbackSrc) {
    return (
      // Public fallback URLs do not require the authenticated file proxy.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackSrc}
        alt={alt}
        className={`${className} shrink-0 rounded-lg object-cover`}
      />
    );
  }

  if (visibleState.status === "ready") {
    return (
      // Blob URLs are created after authenticated downloads and cannot use Next image optimization.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visibleState.url}
        alt={alt}
        className={`${className} shrink-0 rounded-lg object-cover`}
      />
    );
  }

  if (visibleState.status === "loading") {
    return (
      <div className={frameClass} aria-label={alt} aria-busy="true">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (visibleState.status === "error") {
    return (
      <div className={`${frameClass} flex-col gap-1 p-1 text-center`}>
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setRetryCount((current) => current + 1)}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {retryLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={`${frameClass} flex-col gap-1 p-1 text-center`}>
      <ImageOff className="h-4 w-4" aria-hidden="true" />
      <span className="line-clamp-2 text-[10px]">{unavailableLabel}</span>
    </div>
  );
}

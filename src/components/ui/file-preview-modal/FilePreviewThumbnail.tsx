"use client";

import { FileText, LoaderCircle, Play } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type CachedAuthenticatedFile,
  loadAuthenticatedFileUrl,
} from "@/lib/files/authenticatedFileUrlCache";

interface FilePreviewThumbnailProps {
  alt: string;
  fileId: string;
}

export default function FilePreviewThumbnail({ alt, fileId }: FilePreviewThumbnailProps) {
  const [file, setFile] = useState<CachedAuthenticatedFile | null>(null);

  useEffect(() => {
    let active = true;
    void loadAuthenticatedFileUrl(fileId)
      .then((cachedFile) => {
        if (active) setFile(cachedFile);
      })
      .catch(() => {
        if (active) setFile(null);
      });
    return () => {
      active = false;
    };
  }, [fileId]);

  const frameClass = "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-primary shadow-sm ring-1 ring-sky-100";

  if (!file) {
    return <span className={frameClass}><LoaderCircle className="h-4 w-4 animate-spin" aria-label={alt} /></span>;
  }

  if (file.mimeType.startsWith("image/")) {
    return <span className={frameClass}>
      {/* Blob URLs from authenticated downloads cannot be optimized by next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={file.url} alt={alt} className="h-full w-full object-cover" />
    </span>;
  }

  if (file.mimeType.startsWith("video/")) {
    return <span className={frameClass}><video src={file.url} muted preload="metadata" className="h-full w-full object-cover" aria-label={alt} /><span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"><Play className="h-4 w-4 fill-current" aria-hidden="true" /></span></span>;
  }

  return <span className={frameClass}><FileText className="h-5 w-5" aria-label={alt} /></span>;
}

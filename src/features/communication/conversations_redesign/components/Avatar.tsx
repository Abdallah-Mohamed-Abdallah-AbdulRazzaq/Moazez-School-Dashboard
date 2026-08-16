"use client";

import { useEffect, useState } from "react";
import {
  getCachedAuthenticatedFile,
  loadAuthenticatedFileUrl,
} from "@/lib/files/authenticatedFileUrlCache";

export default function Avatar({
  avatarUrl,
  fileId,
  name,
  online,
  size = "md",
}: {
  avatarUrl?: string;
  fileId?: string;
  name?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const cachedAvatar = fileId ? getCachedAuthenticatedFile(fileId) : undefined;
  const [loadedAvatar, setLoadedAvatar] = useState<{
    fileId: string;
    url: string;
  } | null>(null);
  const resolvedUrl =
    avatarUrl ??
    cachedAvatar?.url ??
    (loadedAvatar && loadedAvatar.fileId === fileId
      ? loadedAvatar.url
      : undefined);

  useEffect(() => {
    if (avatarUrl || !fileId) return;
    if (cachedAvatar) {
      void loadAuthenticatedFileUrl(fileId);
      return;
    }

    let active = true;
    void loadAuthenticatedFileUrl(fileId)
      .then(({ url }) => {
        if (active) setLoadedAvatar({ fileId, url });
      })
      .catch(() => {
        if (active) setLoadedAvatar(null);
      });

    return () => {
      active = false;
    };
  }, [avatarUrl, cachedAvatar, fileId]);

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-primary-300 font-bold text-primary-900 ${sizes[size]}`}
      style={
        resolvedUrl
          ? {
              backgroundImage: `url("${resolvedUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-hidden="true"
    >
      {!resolvedUrl ? initials(name) : null}
      {online ? (
        <span className="absolute bottom-0 end-0 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </span>
      ) : null}
    </div>
  );
}

function initials(name?: string | null) {
  const source = name?.trim() || "?";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

"use client";

import type { ReactNode } from "react";
import { Megaphone, X } from "lucide-react";
import Button from "../button/Button";

export interface AnnouncementBannerProps {
  title: string;
  description: string;
  newLabel: string;
  closeLabel: string;
  action: ReactNode;
  onClose: () => void;
}

export default function AnnouncementBanner({
  title,
  description,
  newLabel,
  closeLabel,
  action,
  onClose,
}: AnnouncementBannerProps) {
  return (
    <section
      aria-label={title}
      className="relative m-3 flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-linear-to-r from-primary/15 via-white to-primary/5 p-4 pe-12 shadow-md shadow-primary/10 ring-1 ring-inset ring-white/70 sm:m-4 sm:gap-4 rtl:bg-linear-to-l"
    >
      <span className="relative isolate flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-white to-primary/20 text-primary shadow-md shadow-primary/20 ring-1 ring-inset ring-white/80">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-primary/20 blur-md"
        />
        <Megaphone aria-hidden="true" className="size-6" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
            {newLabel}
          </span>
          <p className="text-base font-bold tracking-tight text-gray-950">
            {title}
          </p>
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
      </div>
      <div className="ms-auto flex shrink-0 items-center">{action}</div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute end-1 top-1 min-h-11 min-w-11 !p-2 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
    </section>
  );
}

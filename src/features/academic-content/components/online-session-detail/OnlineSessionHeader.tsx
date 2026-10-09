"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

interface Props {
  title: string;
  backHref: string;
  canEdit: boolean;
  lifecycleActions: ReactNode;
  onEdit: () => void;
}

export default function OnlineSessionHeader({
  title,
  backHref,
  canEdit,
  lifecycleActions,
  onEdit,
}: Props) {
  const t = useAcademicContentTranslations("online_session_detail");
  return (
    <header className="space-y-4">
      <nav
        aria-label={t("breadcrumb_label")}
        className="flex flex-wrap items-center gap-2 text-sm text-gray-500"
      >
        <span>{t("content_center")}</span>
        <span aria-hidden="true">/</span>
        <span>{t("online_sessions")}</span>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-gray-800">{title}</span>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("back")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Pencil aria-hidden="true" className="size-4" />}
              onClick={onEdit}
            >
              {t("edit")}
            </Button>
          ) : null}
          {lifecycleActions}
        </div>
      </div>
    </header>
  );
}

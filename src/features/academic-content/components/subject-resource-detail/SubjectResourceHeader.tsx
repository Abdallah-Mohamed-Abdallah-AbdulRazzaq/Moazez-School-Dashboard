"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Edit3, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import RichTextContent from "@/components/ui/rich-text-content/RichTextContent";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type {
  AcademicContentAsset,
  AcademicContentDetail,
} from "../../types/contracts";
import { academicContentOverviewHref } from "../overview/overviewRoutes";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";

type SubjectResourceContent = Extract<
  AcademicContentDetail,
  { type: "SUBJECT_RESOURCE" }
>;

interface SubjectResourceHeaderProps {
  content: SubjectResourceContent;
  locale: string;
  selectedAsset: AcademicContentAsset | null;
  canManage: boolean;
  onEdit: () => void;
  onShare: () => void;
  onDownload: (asset: AcademicContentAsset) => void;
  isDownloading?: boolean;
  lifecycleActions?: ReactNode;
}

function HeaderActions(props: SubjectResourceHeaderProps) {
  const t = useAcademicContentTranslations("subject_resource_detail.actions");
  const downloadT = useAcademicContentTranslations("downloads");
  return (
    <div className="flex flex-wrap items-center gap-2">
      {props.canManage ? (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Edit3 aria-hidden="true" className="size-4" />}
          onClick={props.onEdit}
        >
          {t("edit")}
        </Button>
      ) : null}
      <Button
        size="sm"
        leftIcon={<Share2 aria-hidden="true" className="size-4" />}
        onClick={props.onShare}
      >
        {t("share")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={<Download aria-hidden="true" className="size-4" />}
        disabled={!props.selectedAsset}
        loading={props.isDownloading}
        onClick={() =>
          props.selectedAsset && props.onDownload(props.selectedAsset)
        }
      >
        {props.isDownloading ? downloadT("preparing_button") : t("download")}
      </Button>
      {props.lifecycleActions}
    </div>
  );
}

export default function SubjectResourceHeader(
  props: SubjectResourceHeaderProps,
) {
  const t = useAcademicContentTranslations("subject_resource_detail");
  const backHref = academicContentOverviewHref({
    locale: props.locale,
    routeSuffix: "/subject-resources",
    yearId: props.content.academicYearId,
    termId: props.content.termId,
  });
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("back_to_resources")}
        </Link>
        <HeaderActions {...props} />
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <FileText aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                {props.content.title}
              </h1>
              {props.content.description ? (
                <RichTextContent
                  value={props.content.description}
                  className="mt-1 text-sm text-gray-600"
                />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AcademicContentStatusBadge status={props.content.status} />
            {props.content.publicationStatus ? (
              <PublicationStatusBadge
                status={props.content.publicationStatus}
              />
            ) : null}
          </div>
        </div>
      </section>
    </header>
  );
}

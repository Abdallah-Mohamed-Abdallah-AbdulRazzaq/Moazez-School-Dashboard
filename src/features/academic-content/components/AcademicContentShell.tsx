"use client";

import {
  Archive,
  ClipboardCheck,
  FilePlus2,
  Files,
  LibraryBig,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";

function contextQuery(
  searchParams: { get: (key: string) => string | null },
  contentStatus?: string,
): string {
  const query = new URLSearchParams();
  for (const key of ["year", "term"]) {
    const queryValue = searchParams.get(key);
    if (queryValue) query.set(key, queryValue);
  }
  if (contentStatus) query.set("contentStatus", contentStatus);
  const serializedQuery = query.toString();
  return serializedQuery ? `?${serializedQuery}` : "";
}

export default function AcademicContentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const t = useAcademicContentTranslations("shell");
  const rootPath = `/${locale}/academic-content-hub`;
  const selectedStatus = searchParams.get("contentStatus");
  const canManage = hasPermission("academics.academic_content.manage");
  const canApprove = hasPermission("academics.academic_content.approve");
  const reviewQueuePath = `${rootPath}/review`;
  const filePolicyPath = `${rootPath}/settings/file-policy`;
  const workflowPolicyPath = `${rootPath}/settings/workflow`;
  const libraryTabs = [
    { icon: LibraryBig, label: t("library"), status: null },
    { icon: FilePlus2, label: t("drafts"), status: "DRAFT" },
    { icon: Archive, label: t("archived"), status: "ARCHIVED" },
  ] as const;

  return (
    <div className="min-w-0 bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Files aria-hidden="true" className="size-5" />
            </span>
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
              {t("title")}
            </h1>
          </div>
          {canManage && (
            <Button
              size="sm"
              leftIcon={<FilePlus2 aria-hidden="true" className="size-4" />}
              onClick={() =>
                router.push(`${rootPath}/new${contextQuery(searchParams)}`)
              }
            >
              {t("create")}
            </Button>
          )}
        </div>
        <nav
          aria-label={t("nav_label")}
          className="mx-auto mt-4 flex max-w-screen-2xl gap-1 overflow-x-auto"
        >
          {libraryTabs.map(({ icon: Icon, label, status }) => {
            const isActive = pathname === rootPath && selectedStatus === status;
            return (
              <Link
                key={label}
                href={`${rootPath}${contextQuery(searchParams, status ?? undefined)}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            );
          })}
          {canApprove && (
            <Link
              href={`${reviewQueuePath}${contextQuery(searchParams)}`}
              aria-current={pathname.startsWith(reviewQueuePath) ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(reviewQueuePath)
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <ClipboardCheck aria-hidden="true" className="size-4" />
              {t("review_queue")}
            </Link>
          )}
          <Link
            href={`${filePolicyPath}${contextQuery(searchParams)}`}
            aria-current={pathname.startsWith(filePolicyPath) ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(filePolicyPath)
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Settings2 aria-hidden="true" className="size-4" />
            {t("settings")}
          </Link>
          <Link
            href={`${workflowPolicyPath}${contextQuery(searchParams)}`}
            aria-current={pathname.startsWith(workflowPolicyPath) ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(workflowPolicyPath)
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {t("workflow_policy")}
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

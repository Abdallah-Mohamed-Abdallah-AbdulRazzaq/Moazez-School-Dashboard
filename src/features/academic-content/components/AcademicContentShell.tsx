"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ClipboardCheck,
  FilePlus2,
  Files,
  LayoutDashboard,
  LayoutTemplate,
  LibraryBig,
  Settings2,
} from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";
import { ACADEMIC_CONTENT_TYPES } from "../types/contracts";
import AcademicContentOverviewHeader from "./overview/AcademicContentOverviewHeader";
import { CONTENT_TYPE_PRESENTATION } from "./overview/contentTypePresentation";
import { academicContentTypeHref } from "./overview/overviewRoutes";

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

interface ShellNavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}

function ShellNavLink({ href, label, icon: Icon, active }: ShellNavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
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
  const typeLabel = useAcademicContentTranslations("types");
  const rootPath = `/${locale}/academic-content-hub`;
  const libraryPath = `${rootPath}/library`;
  const selectedStatus = searchParams.get("contentStatus");
  const selectedYearId = searchParams.get("year") ?? "";
  const selectedTermId = searchParams.get("term") ?? "";
  const isOverview = pathname === rootPath;
  const canManage = hasPermission("academics.academic_content.manage");
  const canApprove = hasPermission("academics.academic_content.approve");
  const query = contextQuery(searchParams);
  const libraryLinks = [
    { icon: LibraryBig, label: t("all_content"), status: null },
    { icon: FilePlus2, label: t("drafts"), status: "DRAFT" },
    { icon: Archive, label: t("archived"), status: "ARCHIVED" },
  ] as const;

  return (
    <div className="min-w-0 bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-screen-2xl">
          {isOverview ? (
            <AcademicContentOverviewHeader
              yearId={selectedYearId}
              termId={selectedTermId}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Files aria-hidden="true" className="size-5" />
                </span>
                <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                  {t("title")}
                </h1>
              </div>
              {canManage ? (
                <Button
                  size="sm"
                  leftIcon={<FilePlus2 aria-hidden="true" className="size-4" />}
                  onClick={() => router.push(`${rootPath}/new${query}`)}
                >
                  {t("create")}
                </Button>
              ) : null}
            </div>
          )}
        </div>
        <nav
          aria-label={t("nav_label")}
          className="mx-auto mt-4 flex max-w-screen-2xl gap-1 overflow-x-auto"
        >
          <ShellNavLink
            icon={LayoutDashboard}
            label={t("overview")}
            href={`${rootPath}${query}`}
            active={isOverview}
          />
          {libraryLinks.map(({ icon, label, status }) => (
            <ShellNavLink
              key={label}
              icon={icon}
              label={label}
              href={`${libraryPath}${contextQuery(searchParams, status ?? undefined)}`}
              active={pathname === libraryPath && selectedStatus === status}
            />
          ))}
          {ACADEMIC_CONTENT_TYPES.map((contentType) => {
            const { icon } = CONTENT_TYPE_PRESENTATION[contentType];
            const href = academicContentTypeHref({
              locale,
              contentType,
              yearId: selectedYearId,
              termId: selectedTermId,
            });
            const routePath = href.split("?")[0];

            return (
              <ShellNavLink
                key={contentType}
                icon={icon}
                label={typeLabel(contentType)}
                href={href}
                active={
                  pathname === routePath || pathname.startsWith(`${routePath}/`)
                }
              />
            );
          })}
          {canApprove ? (
            <ShellNavLink
              icon={ClipboardCheck}
              label={t("review_queue")}
              href={`${rootPath}/review${query}`}
              active={pathname.startsWith(`${rootPath}/review`)}
            />
          ) : null}
          <ShellNavLink
            icon={LayoutTemplate}
            label={t("preparation_templates")}
            href={`${rootPath}/templates${query}`}
            active={pathname.startsWith(`${rootPath}/templates`)}
          />
          <ShellNavLink
            icon={Settings2}
            label={t("settings")}
            href={`${rootPath}/settings${query}`}
            active={pathname.startsWith(`${rootPath}/settings`)}
          />
        </nav>
      </header>
      {children}
    </div>
  );
}

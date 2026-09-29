"use client";

import { Archive, FilePlus2, Files, LibraryBig, Settings2 } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { usePermissions } from "@/hooks/usePermissions";

const shellLabels = {
  ar: {
    archived: "المؤرشف",
    create: "إنشاء محتوى",
    drafts: "المسودات",
    library: "المكتبة",
    settings: "الإعدادات",
    title: "مركز المحتوى الأكاديمي",
  },
  en: {
    archived: "Archived",
    create: "Create content",
    drafts: "Drafts",
    library: "Library",
    settings: "Settings",
    title: "Academic Content Hub",
  },
} as const;

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
  const labels = locale === "ar" ? shellLabels.ar : shellLabels.en;
  const rootPath = `/${locale}/academic-content-hub`;
  const selectedStatus = searchParams.get("contentStatus");
  const canManage = hasPermission("academics.academic_content.manage");
  const libraryTabs = [
    { icon: LibraryBig, label: labels.library, status: null },
    { icon: FilePlus2, label: labels.drafts, status: "DRAFT" },
    { icon: Archive, label: labels.archived, status: "ARCHIVED" },
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
              {labels.title}
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
              {labels.create}
            </Button>
          )}
        </div>
        <nav
          aria-label={labels.title}
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
          <Link
            href={`${rootPath}/settings/file-policy${contextQuery(searchParams)}`}
            aria-current={pathname.startsWith(`${rootPath}/settings`) ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(`${rootPath}/settings`)
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Settings2 aria-hidden="true" className="size-4" />
            {labels.settings}
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { DropdownMenu } from "@/components/ui/dropdown";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { ACADEMIC_CONTENT_TYPES } from "../../types/contracts";
import { academicContentOverviewHref } from "./overviewRoutes";

export interface AcademicContentOverviewHeaderProps {
  yearId: string;
  termId: string;
}

export default function AcademicContentOverviewHeader({
  yearId,
  termId,
}: AcademicContentOverviewHeaderProps) {
  const locale = useLocale();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const t = useAcademicContentTranslations("overview");
  const typeLabel = useAcademicContentTranslations("types");
  const canManage = hasPermission("academics.academic_content.manage");

  const creationOptions = ACADEMIC_CONTENT_TYPES.map((contentType) => ({
    label: typeLabel(contentType),
    value: contentType,
  }));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
          {t("description")}
        </p>
      </div>
      {canManage ? (
        <DropdownMenu
          items={creationOptions}
          onSelect={(contentType) =>
            router.push(
              academicContentOverviewHref({
                locale,
                routeSuffix: "/new",
                yearId,
                termId,
                extraQuery: { type: contentType },
              }),
            )
          }
          width="w-64"
          trigger={(
            <Button
              className="shrink-0"
              leftIcon={<Plus aria-hidden="true" className="size-4" />}
              rightIcon={<ChevronDown aria-hidden="true" className="size-4" />}
            >
              {t("create")}
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}

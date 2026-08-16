"use client";

import { Edit } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import type {
  ReinforcementScopeOption,
  ReinforcementTargetScope,
  XpPolicy,
} from "../types";
import ReinforcementTableSkeleton from "./shared/ReinforcementTableSkeleton";

interface XpPolicyTableProps {
  policies: XpPolicy[];
  loading?: boolean;
  canManage?: boolean;
  scopeOptions?: Partial<
    Record<ReinforcementTargetScope, ReinforcementScopeOption[]>
  >;
  onEdit: (policy: XpPolicy) => void;
}

export default function XpPolicyTable({
  policies,
  loading = false,
  canManage = false,
  scopeOptions,
  onEdit,
}: XpPolicyTableProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");

  if (loading) return <ReinforcementTableSkeleton columns={5} />;

  if (policies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        {t("emptyStates.xpPolicies")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {policies.map((policy) => {
        const targetOption = scopeOptions?.[policy.scopeType]?.find(
          (option) => option.value === policy.scopeKey,
        );
        const targetName =
          targetOption?.[locale === "ar" ? "nameAr" : "nameEn"] ||
          targetOption?.nameEn ||
          targetOption?.nameAr ||
          policy.scopeKey;

        return (
          <article
            key={policy.id ?? `default-${policy.academicYearId}-${policy.termId}`}
            className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {t(`assignmentScope.${policy.scopeType}`)}
                {policy.scopeKey ? ` / ${targetName}` : ""}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {policy.isActive ? t("activeState.active") : t("activeState.inactive")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {policy.isDefault ? t("xp.defaultPolicy") : t("xp.customPolicy")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {t("xp.dailyCap")}: {policy.dailyCap ?? t("xp.notSet")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {t("xp.weeklyCap")}: {policy.weeklyCap ?? t("xp.notSet")}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {t("xp.cooldownMinutes")}: {policy.cooldownMinutes ?? t("xp.notSet")}
                </span>
              </div>
              {policy.allowedReasons?.length ? (
                <p className="mt-2 text-sm text-gray-500">
                  {t("xp.allowedReasons")}: {policy.allowedReasons.join(", ")}
                </p>
              ) : null}
              {(policy.startsAt || policy.endsAt) && (
                <p className="mt-2 text-xs text-gray-500">
                  {policy.startsAt
                    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(policy.startsAt),
                      )
                    : "-"}{" "}
                  -{" "}
                  {policy.endsAt
                    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(policy.endsAt),
                      )
                    : "-"}
                </p>
              )}
            </div>
            {canManage && !policy.isDefault && policy.id ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<Edit className="h-4 w-4" />}
                onClick={() => onEdit(policy)}
              >
                {t("actions.edit")}
              </Button>
            ) : null}
          </div>
          </article>
        );
      })}
    </div>
  );
}

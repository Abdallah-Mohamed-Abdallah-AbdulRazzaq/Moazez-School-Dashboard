"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import CommunicationEntitySelect, {
  type CommunicationEntitySelectProps,
} from "@/features/communication/components/selectors/CommunicationEntitySelect";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import { listBehaviorCategories } from "@/features/behavior/services/behaviorApiService";

type SearchSelectProps = Omit<CommunicationEntitySelectProps, "search">;

export function BehaviorCategorySearchSelect(props: SearchSelectProps) {
  const locale = useLocale();
  const search = useCallback(async (query: string) => {
    const response = await listBehaviorCategories({ search: query, limit: 30 });
    return response.items.map((category) => ({
      id: category.id,
      label:
        (locale === "ar" ? category.nameAr : category.nameEn) ||
        category.nameEn ||
        category.nameAr ||
        category.code,
      description: category.code,
    }));
  }, [locale]);

  return <CommunicationEntitySelect {...props} search={search} />;
}

export function BehaviorCreatedBySearchSelect(props: SearchSelectProps) {
  return <UserSearchSelect {...props} />;
}

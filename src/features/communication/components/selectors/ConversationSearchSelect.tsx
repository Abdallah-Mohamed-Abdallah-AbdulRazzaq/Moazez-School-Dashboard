"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { searchConversations } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, {
  type CommunicationEntitySelectProps,
} from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function ConversationSearchSelect(props: Props) {
  const locale = useLocale();
  const search = useCallback(
    (query: string) => searchConversations(query, locale),
    [locale],
  );
  return <CommunicationEntitySelect {...props} search={search} />;
}

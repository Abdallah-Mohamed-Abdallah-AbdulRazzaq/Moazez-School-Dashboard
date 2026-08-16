"use client";

import { useCallback } from "react";
import { searchConversations } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function ConversationSearchSelect(props: Props) {
  const search = useCallback((query: string) => searchConversations(query), []);
  return <CommunicationEntitySelect {...props} search={search} />;
}

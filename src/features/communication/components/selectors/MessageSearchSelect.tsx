"use client";

import { useCallback } from "react";
import { searchMessages } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, {
  type CommunicationEntitySelectProps,
} from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search"> & {
  conversationId?: string;
};

export default function MessageSearchSelect({
  conversationId,
  disabled,
  helperText,
  ...props
}: Props) {
  const search = useCallback(
    (query: string) => searchMessages(conversationId ?? "", query),
    [conversationId],
  );

  return (
    <CommunicationEntitySelect
      {...props}
      disabled={disabled || !conversationId}
      helperText={helperText}
      search={search}
    />
  );
}

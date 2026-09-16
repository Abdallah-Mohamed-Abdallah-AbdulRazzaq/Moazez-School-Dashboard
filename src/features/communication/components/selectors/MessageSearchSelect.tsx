"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { searchMessages } from "@/features/communication/api/communication-selectors.service";
import type { Message } from "@/features/communication/types/message.types";
import CommunicationEntitySelect, {
  type CommunicationEntitySelectProps,
} from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps<Message>, "search" | "onOptionChange"> & {
  conversationId?: string;
  onMessageChange?: (message: Message | null) => void;
};

export default function MessageSearchSelect({
  conversationId,
  disabled,
  helperText,
  onMessageChange,
  ...props
}: Props) {
  const locale = useLocale();
  const search = useCallback(
    (query: string) => searchMessages(conversationId ?? "", query, locale),
    [conversationId, locale],
  );

  return (
    <CommunicationEntitySelect<Message>
      {...props}
      disabled={disabled || !conversationId}
      helperText={helperText}
      search={search}
      onOptionChange={(option) => onMessageChange?.(option?.entity ?? null)}
    />
  );
}

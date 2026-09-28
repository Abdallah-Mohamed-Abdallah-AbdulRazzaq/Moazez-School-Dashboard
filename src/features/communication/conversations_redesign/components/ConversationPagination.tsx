"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export interface ConversationPaginationProps {
  page: number;
  totalPages: number;
  isLoading: boolean;
  isRTL: boolean;
  labels: ConversationRedesignLabels;
  onPageChange: (page: number) => void;
}

export default function ConversationPagination({
  page,
  totalPages,
  isLoading,
  isRTL,
  labels,
  onPageChange,
}: ConversationPaginationProps) {
  if (totalPages === 0) {
    return null;
  }

  const PreviousIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const pageLabel = labels.conversationPageOf
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages));

  return (
    <nav
      aria-label={pageLabel}
      className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-2"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isLoading || page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label={labels.previousPage}
        leftIcon={<PreviousIcon aria-hidden="true" className="h-4 w-4" />}
      >
        {labels.previousPage}
      </Button>

      <span
        aria-live="polite"
        className="inline-flex min-w-0 items-center justify-center gap-1.5 text-xs font-medium text-gray-600"
      >
        {isLoading ? (
          <span role="status" aria-label={labels.loadingConversations}>
            <RefreshCw
              aria-hidden="true"
              className="h-3.5 w-3.5 motion-safe:animate-spin"
            />
          </span>
        ) : null}
        {pageLabel}
      </span>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isLoading || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label={labels.nextPage}
        rightIcon={<NextIcon aria-hidden="true" className="h-4 w-4" />}
      >
        {labels.nextPage}
      </Button>
    </nav>
  );
}

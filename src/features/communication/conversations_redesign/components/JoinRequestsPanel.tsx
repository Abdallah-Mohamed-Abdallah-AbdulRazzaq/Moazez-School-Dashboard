import { Plus } from "lucide-react";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { ActionButton, PanelLayout, PanelState, StatusPill } from "@/features/communication/conversations_redesign/components/PanelLayout";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationJoinRequest } from "@/features/communication/types/conversation.types";
import { actorName, displayNameForUserId, getAvatarUrl } from "@/features/communication/conversations_redesign/utils/displayNames";
import { formatRelativeDate, statusLabel } from "@/features/communication/conversations_redesign/utils/formatters";

export default function JoinRequestsPanel({
  canCreate,
  canReview,
  error,
  isLoading,
  joinRequests,
  labels,
  locale,
  onCreateRequest,
  onReject,
  onReview,
  total,
  userDisplayNames,
}: {
  canCreate: boolean;
  canReview: boolean;
  error: string | null;
  isLoading: boolean;
  joinRequests: ConversationJoinRequest[];
  labels: ConversationRedesignLabels;
  locale: string;
  onCreateRequest: () => void;
  onReject: (request: ConversationJoinRequest) => void;
  onReview: (request: ConversationJoinRequest) => void;
  total: number;
  userDisplayNames: UserDisplayNameMap;
}) {
  return (
    <PanelLayout
      action={
        canCreate ? (
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreateRequest}
          >
            {labels.createJoinRequest}
          </ActionButton>
        ) : null
      }
      title={`${labels.joinRequests} (${total || joinRequests.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {joinRequests.length === 0 ? (
            <PanelState label={labels.joinRequests} />
          ) : null}
          {joinRequests.map((request) => {
            const name =
              request.requestedBy?.displayName ||
              actorName(request.user) ||
              displayNameForUserId(
                request.requestedById || request.userId,
                userDisplayNames,
                labels.requester,
              );
            return (
              <div
                key={request.id}
                className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-5 last:border-b-0"
              >
                <div className="flex min-w-0 gap-3">
                  <Avatar avatarUrl={getAvatarUrl(request.user)} name={name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {name}
                    </p>
                    {request.note ? (
                      <p className="mt-2 rounded bg-slate-100 px-3 py-2 text-sm italic text-slate-600">
                        &quot;{request.note}&quot;
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {formatRelativeDate(request.createdAt, locale) ||
                        labels.today}
                    </p>
                  </div>
                </div>
                {canReview && request.status === "pending" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void onReject(request)}
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {labels.rejectRequest}
                    </button>
                    <button
                      type="button"
                      onClick={() => onReview(request)}
                      className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-hover"
                    >
                      {labels.reviewJoinRequest}
                    </button>
                  </div>
                ) : (
                  <StatusPill
                    tone={
                      request.status === "approved"
                        ? "green"
                        : request.status === "rejected"
                          ? "red"
                          : "orange"
                    }
                  >
                    {statusLabel(request.status, labels)}
                  </StatusPill>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </PanelLayout>
  );
}


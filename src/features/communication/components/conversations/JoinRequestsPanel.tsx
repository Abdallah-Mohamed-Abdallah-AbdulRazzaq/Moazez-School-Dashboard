"use client";

import { useState } from "react";
import { RefreshCw, UserRoundPlus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type {
  CreateConversationJoinRequestValues,
  ReviewConversationJoinRequestValues,
} from "@/features/communication/hooks/useConversationJoinRequests";
import type { ConversationJoinRequest } from "@/features/communication/types/conversation.types";
import CreateJoinRequestDialog from "./CreateJoinRequestDialog";
import ReviewJoinRequestDialog, {
  type ReviewJoinRequestMode,
} from "./ReviewJoinRequestDialog";

export interface JoinRequestsPanelLabels {
  title: string;
  count: string;
  createJoinRequest: string;
  refresh: string;
  loading: string;
  empty: string;
  errorTitle: string;
  requestId: string;
  requesterUserId: string;
  status: string;
  note: string;
  createdAt: string;
  approve: string;
  reject: string;
  cancel: string;
  create: string;
  createTitle: string;
  approveTitle: string;
  rejectTitle: string;
  approveDescription: string;
  rejectDescription: string;
  reason: string;
  pending: string;
  approved: string;
  rejected: string;
}

export interface JoinRequestsPanelProps {
  joinRequests: ConversationJoinRequest[];
  total?: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isMutating?: boolean;
  error?: string | null;
  canCreateJoinRequest?: boolean;
  canReviewJoinRequests?: boolean;
  labels: JoinRequestsPanelLabels;
  onRefresh: () => Promise<void> | void;
  onCreateJoinRequest: (
    values?: CreateConversationJoinRequestValues,
  ) => Promise<unknown>;
  onApproveJoinRequest: (
    requestId: string,
    values?: ReviewConversationJoinRequestValues,
  ) => Promise<unknown>;
  onRejectJoinRequest: (
    requestId: string,
    values?: ReviewConversationJoinRequestValues,
  ) => Promise<unknown>;
}

function requesterUserId(joinRequest: ConversationJoinRequest) {
  return joinRequest.userId || joinRequest.user?.userId || joinRequest.user?.id || "";
}

function localizedStatus(
  status: ConversationJoinRequest["status"],
  labels: JoinRequestsPanelLabels,
) {
  const map = {
    pending: labels.pending,
    approved: labels.approved,
    rejected: labels.rejected,
  };
  return status ? map[status] ?? status : "-";
}

function isPendingJoinRequest(joinRequest: ConversationJoinRequest) {
  return !joinRequest.status || joinRequest.status === "pending";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function JoinRequestsPanel({
  canCreateJoinRequest,
  canReviewJoinRequests,
  error,
  isLoading,
  isMutating,
  isRefreshing,
  joinRequests,
  labels,
  onApproveJoinRequest,
  onCreateJoinRequest,
  onRefresh,
  onRejectJoinRequest,
  total,
}: JoinRequestsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewMode, setReviewMode] =
    useState<ReviewJoinRequestMode>("approve");
  const [reviewingJoinRequest, setReviewingJoinRequest] =
    useState<ConversationJoinRequest | null>(null);

  const closeReviewDialog = () => setReviewingJoinRequest(null);

  const submitReview = async (values?: ReviewConversationJoinRequestValues) => {
    if (!reviewingJoinRequest?.id) return;
    if (reviewMode === "approve") {
      await onApproveJoinRequest(reviewingJoinRequest.id, values);
    } else {
      await onRejectJoinRequest(reviewingJoinRequest.id, values);
    }
    closeReviewDialog();
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {labels.title}
          </h2>
          <p className="text-xs text-slate-500">
            {labels.count.replace(
              "{count}",
              String(total ?? joinRequests.length),
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isRefreshing}
            disabled={isMutating}
            onClick={() => void onRefresh()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {labels.refresh}
          </Button>
          {canCreateJoinRequest ? (
            <Button
              type="button"
              size="sm"
              disabled={isMutating}
              onClick={() => setCreateOpen(true)}
              leftIcon={<UserRoundPlus className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {labels.createJoinRequest}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <CommunicationErrorState title={labels.errorTitle} message={error} />
      ) : null}

      {isLoading ? (
        <CommunicationLoadingState label={labels.loading} />
      ) : joinRequests.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {joinRequests.map((joinRequest) => {
            const userId = requesterUserId(joinRequest);
            const createdAt = formatDate(joinRequest.createdAt);
            const canReviewRequest =
              Boolean(canReviewJoinRequests) && isPendingJoinRequest(joinRequest);

            return (
              <div
                key={joinRequest.id}
                className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="grid gap-1 text-xs text-slate-600">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {labels.requesterUserId}: {userId || "-"}
                  </p>
                  <span>
                    {labels.requestId}: {joinRequest.id}
                  </span>
                  <div>
                    <CommunicationStatusChip
                      label={localizedStatus(joinRequest.status, labels)}
                      tone={
                        joinRequest.status === "approved"
                          ? "success"
                          : joinRequest.status === "rejected"
                            ? "error"
                            : "warning"
                      }
                    />
                  </div>
                  {joinRequest.note ? (
                    <span>
                      {labels.note}: {joinRequest.note}
                    </span>
                  ) : null}
                  {createdAt ? (
                    <span>
                      {labels.createdAt}: {createdAt}
                    </span>
                  ) : null}
                </div>

                {canReviewRequest ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => {
                        setReviewMode("approve");
                        setReviewingJoinRequest(joinRequest);
                      }}
                    >
                      {labels.approve}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => {
                        setReviewMode("reject");
                        setReviewingJoinRequest(joinRequest);
                      }}
                    >
                      {labels.reject}
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          {labels.empty}
        </p>
      )}

      <CreateJoinRequestDialog
        open={createOpen}
        labels={{
          title: labels.createTitle,
          note: labels.note,
          cancel: labels.cancel,
          create: labels.create,
        }}
        isSubmitting={isMutating}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await onCreateJoinRequest(values);
          setCreateOpen(false);
        }}
      />
      <ReviewJoinRequestDialog
        open={Boolean(reviewingJoinRequest)}
        mode={reviewMode}
        joinRequest={reviewingJoinRequest}
        labels={{
          approveTitle: labels.approveTitle,
          rejectTitle: labels.rejectTitle,
          approveDescription: labels.approveDescription,
          rejectDescription: labels.rejectDescription,
          reason: labels.reason,
          cancel: labels.cancel,
          approve: labels.approve,
          reject: labels.reject,
        }}
        isSubmitting={isMutating}
        onClose={closeReviewDialog}
        onSubmit={submitReview}
      />
    </section>
  );
}

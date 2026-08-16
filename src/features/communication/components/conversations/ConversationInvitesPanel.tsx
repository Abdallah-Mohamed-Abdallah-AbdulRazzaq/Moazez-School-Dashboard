"use client";

import { useState } from "react";
import { MailPlus, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type {
  CreateConversationInviteValues,
  RejectConversationInviteValues,
} from "@/features/communication/hooks/useConversationInvites";
import type { ConversationInvite } from "@/features/communication/types/conversation.types";
import CreateInviteDialog from "./CreateInviteDialog";
import RejectInviteDialog from "./RejectInviteDialog";

export interface ConversationInvitesPanelLabels {
  title: string;
  count: string;
  createInvite: string;
  refresh: string;
  loading: string;
  empty: string;
  errorTitle: string;
  inviteId: string;
  invitedUserId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  accept: string;
  reject: string;
  cancel: string;
  create: string;
  createTitle: string;
  rejectTitle: string;
  rejectDescription: string;
  reason: string;
  userRequired: string;
  pending: string;
  accepted: string;
  rejected: string;
  expired: string;
}

export interface ConversationInvitesPanelProps {
  invites: ConversationInvite[];
  total?: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isMutating?: boolean;
  error?: string | null;
  canCreateInvite?: boolean;
  currentUserId?: string | null;
  labels: ConversationInvitesPanelLabels;
  onRefresh: () => Promise<void> | void;
  onCreateInvite: (values: CreateConversationInviteValues) => Promise<unknown>;
  onAcceptInvite: (inviteId: string) => Promise<unknown>;
  onRejectInvite: (
    inviteId: string,
    values?: RejectConversationInviteValues,
  ) => Promise<unknown>;
}

function inviteUserId(invite: ConversationInvite) {
  return invite.invitedUserId || invite.invitedUser?.userId || invite.invitedUser?.id || "";
}

function localizedStatus(
  status: ConversationInvite["status"],
  labels: ConversationInvitesPanelLabels,
) {
  const map = {
    pending: labels.pending,
    accepted: labels.accepted,
    rejected: labels.rejected,
    expired: labels.expired,
  };
  return status ? map[status] ?? status : "-";
}

function isPendingInvite(invite: ConversationInvite) {
  return !invite.status || invite.status === "pending";
}

function canCurrentUserReviewInvite(
  invite: ConversationInvite,
  currentUserId?: string | null,
) {
  if (!currentUserId) return true;
  return inviteUserId(invite) === currentUserId;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function ConversationInvitesPanel({
  canCreateInvite,
  currentUserId,
  error,
  invites,
  isLoading,
  isMutating,
  isRefreshing,
  labels,
  onAcceptInvite,
  onCreateInvite,
  onRefresh,
  onRejectInvite,
  total,
}: ConversationInvitesPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectingInvite, setRejectingInvite] =
    useState<ConversationInvite | null>(null);

  const confirmReject = async (values?: RejectConversationInviteValues) => {
    if (!rejectingInvite?.id) return;
    await onRejectInvite(rejectingInvite.id, values);
    setRejectingInvite(null);
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {labels.title}
          </h2>
          <p className="text-xs text-slate-500">
            {labels.count.replace("{count}", String(total ?? invites.length))}
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
          {canCreateInvite ? (
            <Button
              type="button"
              size="sm"
              disabled={isMutating}
              onClick={() => setCreateOpen(true)}
              leftIcon={<MailPlus className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {labels.createInvite}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <CommunicationErrorState title={labels.errorTitle} message={error} />
      ) : null}

      {isLoading ? (
        <CommunicationLoadingState label={labels.loading} />
      ) : invites.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {invites.map((invite) => {
            const invitedUserId = inviteUserId(invite);
            const expiresAt = formatDate(invite.expiresAt);
            const createdAt = formatDate(invite.createdAt);
            const canReviewInvite =
              isPendingInvite(invite) &&
              canCurrentUserReviewInvite(invite, currentUserId);

            return (
              <div
                key={invite.id}
                className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="grid gap-1 text-xs text-slate-600">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {labels.invitedUserId}: {invitedUserId || "-"}
                  </p>
                  <span>
                    {labels.inviteId}: {invite.id}
                  </span>
                  <div>
                    <CommunicationStatusChip
                      label={localizedStatus(invite.status, labels)}
                      tone={
                        invite.status === "accepted"
                          ? "success"
                          : invite.status === "rejected" ||
                              invite.status === "expired"
                            ? "error"
                            : "warning"
                      }
                    />
                  </div>
                  {expiresAt ? (
                    <span>
                      {labels.expiresAt}: {expiresAt}
                    </span>
                  ) : null}
                  {createdAt ? (
                    <span>
                      {labels.createdAt}: {createdAt}
                    </span>
                  ) : null}
                </div>

                {canReviewInvite ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => void onAcceptInvite(invite.id)}
                    >
                      {labels.accept}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => setRejectingInvite(invite)}
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

      <CreateInviteDialog
        open={createOpen}
        labels={{
          title: labels.createTitle,
          invitedUserId: labels.invitedUserId,
          expiresAt: labels.expiresAt,
          cancel: labels.cancel,
          create: labels.create,
          userRequired: labels.userRequired,
        }}
        isSubmitting={isMutating}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await onCreateInvite(values);
          setCreateOpen(false);
        }}
      />
      <RejectInviteDialog
        open={Boolean(rejectingInvite)}
        invite={rejectingInvite}
        labels={{
          title: labels.rejectTitle,
          description: labels.rejectDescription,
          reason: labels.reason,
          cancel: labels.cancel,
          reject: labels.reject,
        }}
        isSubmitting={isMutating}
        onClose={() => setRejectingInvite(null)}
        onSubmit={confirmReject}
      />
    </section>
  );
}

import { Plus } from "lucide-react";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { ActionButton, PanelLayout, PanelState, StatusPill } from "@/features/communication/conversations_redesign/components/PanelLayout";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationInvite } from "@/features/communication/types/conversation.types";
import { actorName, displayNameForUserId, getAvatarUrl } from "@/features/communication/conversations_redesign/utils/displayNames";
import { formatDate, statusLabel } from "@/features/communication/conversations_redesign/utils/formatters";

export default function InvitesPanel({
  canCreate,
  canManage,
  currentUserId,
  error,
  invites,
  isLoading,
  isMutating,
  labels,
  locale,
  onAcceptInvite,
  onCreateInvite,
  onRejectInvite,
  total,
  userDisplayNames,
  isActiveParticipant,
}: {
  canCreate: boolean;
  canManage: boolean;
  currentUserId?: string | null;
  error: string | null;
  invites: ConversationInvite[];
  isLoading: boolean;
  isMutating: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  onAcceptInvite: (invite: ConversationInvite) => Promise<unknown>;
  onCreateInvite: () => void;
  onRejectInvite: (invite: ConversationInvite) => void;
  total: number;
  userDisplayNames: UserDisplayNameMap;
  isActiveParticipant?: boolean;
}) {
  return (
    <PanelLayout
      action={
        canCreate ? (
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreateInvite}
          >
            {labels.createInvite}
          </ActionButton>
        ) : null
      }
      title={`${labels.invites} (${total || invites.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {invites.length === 0 ? <PanelState label={labels.invites} /> : null}
          {invites.map((invite) => {
            const invitedUserId =
              invite.invitedUserId ||
              invite.invitedUser?.userId ||
              invite.invitedUser?.id ||
              "";
            const name =
              actorName(invite.invitedUser) ||
              displayNameForUserId(
                invitedUserId,
                userDisplayNames,
                labels.invitedUser,
              );
            const isPending = !invite.status || invite.status === "pending";
            const isCurrentUserInvite = Boolean(
              currentUserId && invitedUserId === currentUserId,
            );
            const canRespondToInvite = isPending && isCurrentUserInvite;
            const canRejectInvite =
              isPending && ((canManage && isActiveParticipant) || isCurrentUserInvite);
            return (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    avatarUrl={getAvatarUrl(invite.invitedUser)}
                    name={name}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {labels.expires}:{" "}
                      {formatDate(invite.expiresAt, locale) ||
                        labels.noExpiration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill
                    tone={
                      invite.status === "accepted"
                        ? "green"
                        : isPending
                          ? "orange"
                          : "red"
                    }
                  >
                    {statusLabel(invite.status, labels)}
                  </StatusPill>
                  {canRespondToInvite ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void onAcceptInvite(invite)}
                      className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {labels.acceptInvite}
                    </button>
                  ) : null}
                  {canRejectInvite ? (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void onRejectInvite(invite)}
                      className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {canManage && !isCurrentUserInvite
                        ? labels.revokeInvite
                        : labels.rejectInvite}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </PanelLayout>
  );
}


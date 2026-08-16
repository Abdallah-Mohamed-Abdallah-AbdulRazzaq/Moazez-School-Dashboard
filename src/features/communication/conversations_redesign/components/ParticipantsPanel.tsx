import { UserPlus } from "lucide-react";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { ActionButton, PanelLayout, PanelState, ParticipantActionButton, StatusPill } from "@/features/communication/conversations_redesign/components/PanelLayout";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationParticipant } from "@/features/communication/types/conversation.types";
import { actorName, displayNameForUserId, getAvatarUrl } from "@/features/communication/conversations_redesign/utils/displayNames";
import { formatRelativeDate, participantUserId } from "@/features/communication/conversations_redesign/utils/formatters";
import { normalizeRole, normalizeStatus } from "@/features/communication/utils/communication-errors";
import { targetRoleForTransition } from "@/features/communication/utils/participant-role-transitions";

export default function ParticipantsPanel({
  canLeaveConversation,
  canManage,
  currentUserId,
  error,
  isLoading,
  labels,
  locale,
  onAddParticipant,
  onDemoteParticipant,
  onEditParticipant,
  onLeaveConversation,
  onPromoteParticipant,
  onRemoveParticipant,
  participants,
  presenceByUserId,
  userDisplayNames,
}: {
  canLeaveConversation: boolean;
  canManage: boolean;
  currentUserId?: string | null;
  error: string | null;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  onAddParticipant: () => void;
  onDemoteParticipant: (participant: ConversationParticipant) => void;
  onEditParticipant: (participant: ConversationParticipant) => void;
  onLeaveConversation: () => void;
  onPromoteParticipant: (participant: ConversationParticipant) => void;
  onRemoveParticipant: (participant: ConversationParticipant) => void;
  participants: ConversationParticipant[];
  presenceByUserId: Record<string, { isOnline?: boolean }>;
  total: number;
  userDisplayNames: UserDisplayNameMap;
}) {
  // Filter out SYSTEM role participants
  const visibleParticipants = participants.filter(
    (p) => normalizeRole(p.role) !== "SYSTEM",
  );

  // Separate active members from former members
  const activeParticipants = visibleParticipants.filter(
    (p) => normalizeStatus(p.status) === "active" || normalizeStatus(p.status) === "muted",
  );
  const formerParticipants = visibleParticipants.filter(
    (p) =>
      normalizeStatus(p.status) === "left" ||
      normalizeStatus(p.status) === "removed" ||
      normalizeStatus(p.status) === "blocked",
  );
  const invitedParticipants = visibleParticipants.filter(
    (p) => normalizeStatus(p.status) === "invited",
  );

  // Count active owners
  const activeOwnerCount = visibleParticipants.filter(
    (p) =>
      normalizeRole(p.role) === "OWNER" &&
      ["active", "muted"].includes(normalizeStatus(p.status)),
  ).length;

  return (
    <PanelLayout
      action={
        <div className="flex flex-wrap justify-end gap-2">
          {canLeaveConversation ? (
            <button
              type="button"
              onClick={onLeaveConversation}
              className="inline-flex h-9 items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
            >
              {labels.leaveConversation}
            </button>
          ) : null}
          {canManage ? (
            <ActionButton
              icon={<UserPlus className="h-4 w-4" />}
              onClick={onAddParticipant}
            >
              {labels.addParticipant}
            </ActionButton>
          ) : null}
        </div>
      }
      title={`${labels.participants} (${activeParticipants.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <>
          {/* Active members */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {activeParticipants.length === 0 ? (
              <PanelState label={labels.participants} />
            ) : null}
            {activeParticipants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                canManage={canManage}
                currentUserId={currentUserId}
                labels={labels}
                locale={locale}
                presenceByUserId={presenceByUserId}
                userDisplayNames={userDisplayNames}
                activeOwnerCount={activeOwnerCount}
                onDemoteParticipant={onDemoteParticipant}
                onEditParticipant={onEditParticipant}
                onPromoteParticipant={onPromoteParticipant}
                onRemoveParticipant={onRemoveParticipant}
              />
            ))}
          </div>

          {/* Invited (pending) */}
          {invitedParticipants.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {labels.invited} ({invitedParticipants.length})
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {invitedParticipants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    canManage={canManage}
                    currentUserId={currentUserId}
                    labels={labels}
                    locale={locale}
                    presenceByUserId={presenceByUserId}
                    userDisplayNames={userDisplayNames}
                    activeOwnerCount={activeOwnerCount}
                    onDemoteParticipant={onDemoteParticipant}
                    onEditParticipant={onEditParticipant}
                    onPromoteParticipant={onPromoteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Former members */}
          {formerParticipants.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {labels.left} ({formerParticipants.length})
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white opacity-60 shadow-sm">
                {formerParticipants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    canManage={false}
                    currentUserId={currentUserId}
                    labels={labels}
                    locale={locale}
                    presenceByUserId={presenceByUserId}
                    userDisplayNames={userDisplayNames}
                    activeOwnerCount={activeOwnerCount}
                    onDemoteParticipant={onDemoteParticipant}
                    onEditParticipant={onEditParticipant}
                    onPromoteParticipant={onPromoteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </PanelLayout>
  );
}

function ParticipantRow({
  participant,
  canManage,
  currentUserId,
  labels,
  locale,
  presenceByUserId,
  userDisplayNames,
  activeOwnerCount,
  onDemoteParticipant,
  onEditParticipant,
  onPromoteParticipant,
  onRemoveParticipant,
}: {
  participant: ConversationParticipant;
  canManage: boolean;
  currentUserId?: string | null;
  labels: ConversationRedesignLabels;
  locale: string;
  presenceByUserId: Record<string, { isOnline?: boolean }>;
  userDisplayNames: UserDisplayNameMap;
  activeOwnerCount: number;
  onDemoteParticipant: (participant: ConversationParticipant) => void;
  onEditParticipant: (participant: ConversationParticipant) => void;
  onPromoteParticipant: (participant: ConversationParticipant) => void;
  onRemoveParticipant: (participant: ConversationParticipant) => void;
}) {
  const userId = participantUserId(participant);
  const name =
    participant.user?.displayName ||
    actorName(participant.actor) ||
    displayNameForUserId(userId, userDisplayNames, labels.participant);
  const isCurrentUser = currentUserId && userId === currentUserId;
  const isOnline = Boolean(presenceByUserId[userId]?.isOnline);
  const canManageThisParticipant = canManage && !isCurrentUser;

  const normalizedRole = normalizeRole(participant.role);
  const normalizedStatus = normalizeStatus(participant.status);
  const promotionTarget = targetRoleForTransition(participant.role, "promote");
  const demotionTarget = targetRoleForTransition(participant.role, "demote");

  const isLastOwner =
    normalizedRole === "OWNER" &&
    ["active", "muted"].includes(normalizedStatus) &&
    activeOwnerCount === 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          avatarUrl={getAvatarUrl(participant.actor)}
          name={name}
          online={isOnline}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-950">
              {name}
            </p>
            {normalizedRole === "OWNER" ? (
              <StatusPill tone="blue">{labels.owner}</StatusPill>
            ) : null}
            {normalizedRole === "ADMIN" ? (
              <StatusPill tone="blue">{labels.admin}</StatusPill>
            ) : null}
            {normalizedRole === "MODERATOR" ? (
              <StatusPill tone="blue">{labels.moderator}</StatusPill>
            ) : null}
            {normalizedRole === "MEMBER" ? (
              <StatusPill tone="gray">{labels.member}</StatusPill>
            ) : null}
            {normalizedRole === "READ_ONLY" ? (
              <StatusPill tone="gray">{labels.readOnlyRole}</StatusPill>
            ) : null}
            {normalizedStatus === "muted" ? (
              <StatusPill tone="orange">{labels.muted}</StatusPill>
            ) : null}
            {normalizedStatus === "invited" ? (
              <StatusPill tone="yellow">{labels.pending}</StatusPill>
            ) : null}
            {normalizedStatus === "left" ? (
              <StatusPill tone="gray">{labels.left}</StatusPill>
            ) : null}
            {normalizedStatus === "removed" ? (
              <StatusPill tone="gray">{labels.removed}</StatusPill>
            ) : null}
            {normalizedStatus === "blocked" ? (
              <StatusPill tone="red">{labels.blocked}</StatusPill>
            ) : null}
            {isCurrentUser ? (
              <StatusPill tone="green">{labels.you}</StatusPill>
            ) : null}
            {participant.user?.userType ? (
              <StatusPill tone="gray">
                {labels[`userType_${participant.user.userType.toLowerCase()}` as keyof typeof labels] ||
                  participant.user.userType}
              </StatusPill>
            ) : null}
          </div>
          <p className="text-xs text-slate-600">
            {labels.joined}{" "}
            {formatRelativeDate(participant.joinedAt, locale) ||
              labels.recently}
          </p>
        </div>
      </div>
      {canManageThisParticipant ? (
        normalizedStatus === "invited" ? (
          <div className="flex h-8 items-center text-xs font-bold text-slate-400">
            {labels.pending}
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <ParticipantActionButton
              onClick={() => onEditParticipant(participant)}
            >
              {labels.editParticipant}
            </ParticipantActionButton>
            {promotionTarget ? (
              <ParticipantActionButton
                onClick={() => onPromoteParticipant(participant)}
              >
                {labels.promote}
              </ParticipantActionButton>
            ) : null}
            {demotionTarget ? (
              <ParticipantActionButton
                onClick={() => onDemoteParticipant(participant)}
                disabled={isLastOwner}
              >
                {labels.demote}
              </ParticipantActionButton>
            ) : null}
            <button
              type="button"
              onClick={() => onRemoveParticipant(participant)}
              disabled={isLastOwner}
              className="h-8 rounded-md border border-rose-200 px-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-rose-700"
            >
              {labels.removeParticipant}
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}


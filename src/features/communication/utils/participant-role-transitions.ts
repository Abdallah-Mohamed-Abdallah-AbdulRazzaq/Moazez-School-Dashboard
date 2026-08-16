import type { ParticipantRole } from "@/features/communication/types/conversation.types";

export type ParticipantRoleTransition = "promote" | "demote";

const targetRoles: Record<
  ParticipantRoleTransition,
  Partial<Record<ParticipantRole, ParticipantRole>>
> = {
  promote: {
    read_only: "member",
    member: "moderator",
    moderator: "admin",
    admin: "owner",
  },
  demote: {
    owner: "admin",
    admin: "moderator",
    moderator: "member",
    member: "read_only",
  },
};

export function targetRoleForTransition(
  role: string | null | undefined,
  transition: ParticipantRoleTransition,
): ParticipantRole | null {
  const normalizedRole = role?.toLowerCase() as ParticipantRole | undefined;
  return normalizedRole ? targetRoles[transition][normalizedRole] ?? null : null;
}

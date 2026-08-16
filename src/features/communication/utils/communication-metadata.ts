import type { CommunicationRecord } from "@/features/communication/types/communication.types";

export type CommunicationMetadataContext =
  | "conversation_create"
  | "conversation_update"
  | "conversation_invite_create"
  | "conversation_join_request_create"
  | "announcement_create"
  | "announcement_update"
  | "restriction_create"
  | "restriction_update"
  | "report_create"
  | "policy_update"
  | "block_create"
  | "message_send";

const FORBIDDEN_METADATA_KEYS = new Set([
  "token",
  "accessToken",
  "refreshToken",
  "password",
  "secret",
  "nationalId",
]);

function clientTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function compactSafeMetadata(
  metadata: CommunicationRecord,
): CommunicationRecord | undefined {
  const output: CommunicationRecord = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || FORBIDDEN_METADATA_KEYS.has(key)) continue;
    output[key] = value;
  }

  return Object.keys(output).length ? output : undefined;
}

export function createCommunicationMetadata(
  context: CommunicationMetadataContext,
  extra?: CommunicationRecord | null,
): CommunicationRecord | undefined {
  return compactSafeMetadata({
    source: "sis_dashboard",
    clientPlatform: "web",
    uiModule: "communication",
    context,
    clientTimezone: clientTimezone(),
    ...(extra ?? {}),
  });
}

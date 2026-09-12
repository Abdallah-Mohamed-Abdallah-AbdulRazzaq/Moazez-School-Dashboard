import { COMMUNICATION_REALTIME_DEBUG } from "./communication-socket";

type RealtimeDiagnosticDetails = Record<
  string,
  string | number | boolean | undefined
>;

let liveSocketOwners = 0;

export function logRealtimeEvent(
  event: string,
  details: RealtimeDiagnosticDetails = {},
) {
  if (!COMMUNICATION_REALTIME_DEBUG) return;
  console.info("[communication socket]", { event, ...details });
}

export function registerSocketOwner() {
  if (!COMMUNICATION_REALTIME_DEBUG) return () => undefined;

  liveSocketOwners += 1;
  if (liveSocketOwners > 1) {
    console.warn("[communication socket] multiple live provider sockets", {
      liveSocketOwners,
    });
  }

  let isRegistered = true;
  return () => {
    if (!isRegistered) return;
    isRegistered = false;
    liveSocketOwners = Math.max(0, liveSocketOwners - 1);
  };
}

export function warnDuplicateRoomJoin(currentRoomCount: number) {
  if (!COMMUNICATION_REALTIME_DEBUG) return;
  console.warn("[communication socket] duplicate room join suppressed", {
    currentRoomCount,
  });
}

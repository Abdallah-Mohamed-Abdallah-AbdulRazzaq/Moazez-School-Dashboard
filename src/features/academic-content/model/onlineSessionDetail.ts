import { isValidHttpsUrl } from "./academicContentPolicy";
import type { AcademicContentOnlineSessionDetail } from "../types/contracts";

export type OnlineSessionDetailState = "upcoming" | "live" | "ended";

export function onlineSessionDetailState(
  detail: AcademicContentOnlineSessionDetail,
  now = new Date(),
): OnlineSessionDetailState {
  const current = now.getTime();
  if (current < new Date(detail.startAt).getTime()) return "upcoming";
  if (current < new Date(detail.endAt).getTime()) return "live";
  return "ended";
}

export function onlineSessionDetailDurationMinutes(
  detail: AcademicContentOnlineSessionDetail,
): number {
  const duration =
    new Date(detail.endAt).getTime() - new Date(detail.startAt).getTime();
  return Math.max(1, Math.ceil(duration / 60_000));
}

export function onlineSessionCountdownMinutes(
  detail: AcademicContentOnlineSessionDetail,
  now = new Date(),
): number | null {
  if (onlineSessionDetailState(detail, now) !== "upcoming") return null;
  return Math.max(
    1,
    Math.ceil((new Date(detail.startAt).getTime() - now.getTime()) / 60_000),
  );
}

export function onlineSessionJoinHref(
  detail: AcademicContentOnlineSessionDetail,
): string | null {
  return isValidHttpsUrl(detail.joinUrl) ? detail.joinUrl : null;
}

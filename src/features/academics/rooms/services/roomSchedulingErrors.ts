import { isApiError } from "@/lib/api-error";

export type RoomSchedulingUiError = {
  code: "academics.rooms.scheduling_dependency";
  reason?: RoomSchedulingReason;
  details: Partial<Record<RoomSchedulingDetail, number>>;
  traceId?: string;
};

export type RoomSchedulingReason =
  "room_deactivation" | "capacity_insufficient" | "room_delete";

export type RoomSchedulingDetail =
  | "activeTimetableEntryCount"
  | "classroomDefaultRoomCount"
  | "incompatibleClassroomCount"
  | "proposedRoomCapacity";

const schedulingDetails: RoomSchedulingDetail[] = [
  "activeTimetableEntryCount",
  "classroomDefaultRoomCount",
  "incompatibleClassroomCount",
  "proposedRoomCapacity",
];

const schedulingReasons: RoomSchedulingReason[] = [
  "room_deactivation",
  "capacity_insufficient",
  "room_delete",
];

export function roomSchedulingUiError(
  error: unknown,
): RoomSchedulingUiError | null {
  if (
    !isApiError(error) ||
    error.code !== "academics.rooms.scheduling_dependency"
  ) {
    return null;
  }

  const backendDetails: Record<string, unknown> =
    error.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : {};
  const reason = schedulingReasons.find(
    (candidate) => backendDetails.reason === candidate,
  );
  const details = Object.fromEntries(
    schedulingDetails.flatMap((detailName) => {
      const detailValue = backendDetails[detailName];
      return typeof detailValue === "number" && Number.isFinite(detailValue)
        ? [[detailName, detailValue]]
        : [];
    }),
  ) as RoomSchedulingUiError["details"];

  return {
    code: error.code,
    reason,
    details,
    traceId: error.traceId,
  };
}

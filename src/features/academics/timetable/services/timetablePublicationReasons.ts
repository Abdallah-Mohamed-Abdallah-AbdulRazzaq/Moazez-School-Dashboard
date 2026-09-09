import type { TimetablePublishReason } from "./timetableApiTypes";

export type PublicationReasonCategory = "configuration" | "curriculum" | "teachers" | "weekly_hours" | "conflicts" | "rooms";

export interface PublicationReasonGroup {
  category: PublicationReasonCategory;
  reasons: TimetablePublishReason[];
}

const categories: PublicationReasonCategory[] = ["configuration", "curriculum", "teachers", "weekly_hours", "conflicts", "rooms"];

export function classifyPublicationReasons(reasons: TimetablePublishReason[] = []): PublicationReasonGroup[] {
  const grouped = new Map<PublicationReasonCategory, TimetablePublishReason[]>();
  for (const reason of reasons) {
    const category = publicationReasonCategory(reason.code);
    grouped.set(category, [...(grouped.get(category) ?? []), reason]);
  }
  return categories.flatMap((category) => {
    const categoryReasons = grouped.get(category);
    return categoryReasons ? [{ category, reasons: categoryReasons }] : [];
  });
}

function publicationReasonCategory(code: string): PublicationReasonCategory {
  const normalizedCode = code.toLowerCase();
  if (normalizedCode.includes("room")) return "rooms";
  if (normalizedCode.includes("conflict")) return "conflicts";
  if (normalizedCode.includes("teacher")) return "teachers";
  if (normalizedCode.includes("hour") || normalizedCode.includes("scheduled")) return "weekly_hours";
  if (normalizedCode.includes("allocation") || normalizedCode.includes("subject") || normalizedCode.includes("curriculum")) return "curriculum";
  return "configuration";
}

import type { AttachmentMeta } from "../types";

export function getNewAttachmentFileIds(
  current: AttachmentMeta[],
  initial: AttachmentMeta[],
): string[] {
  const existingIds = new Set(initial.map((attachment) => attachment.id));
  return [
    ...new Set(
      current
        .map((attachment) => attachment.id)
        .filter((id) => id && !existingIds.has(id)),
    ),
  ];
}

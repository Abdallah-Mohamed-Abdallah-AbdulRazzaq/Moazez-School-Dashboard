import { ShieldAlert } from "lucide-react";

import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function AccessDeniedComposer({
  labels,
  requiredPermission,
}: {
  labels: ConversationRedesignLabels;
  requiredPermission: string;
}) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <ShieldAlert aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{labels.messagePermissionDeniedTitle}</p>
          <p className="mt-0.5 text-xs text-amber-800">{labels.messagePermissionDeniedDescription}</p>
          <code className="mt-2 inline-block rounded bg-white/70 px-2 py-1 text-xs text-amber-900">
            {requiredPermission}
          </code>
        </div>
      </div>
    </div>
  );
}

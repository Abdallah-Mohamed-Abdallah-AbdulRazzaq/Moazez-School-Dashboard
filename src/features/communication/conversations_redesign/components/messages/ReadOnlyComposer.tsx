import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

export function ReadOnlyComposer({ labels }: { labels: ConversationRedesignLabels }) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
        {labels.readOnlyComposer}
      </div>
    </div>
  );
}

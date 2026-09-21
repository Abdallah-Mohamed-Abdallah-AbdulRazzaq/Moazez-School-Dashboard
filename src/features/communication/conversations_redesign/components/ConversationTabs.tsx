import { useRef } from "react";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { DetailTab } from "@/features/communication/conversations_redesign/types";

const tabs: Array<{
  value: DetailTab;
  labelKey: "messages" | "participants" | "invites" | "joinRequests";
}> = [
  { value: "messages", labelKey: "messages" },
  { value: "participants", labelKey: "participants" },
  { value: "invites", labelKey: "invites" },
  { value: "joinRequests", labelKey: "joinRequests" },
];

export default function ConversationTabs({
  activeTab,
  availableTabs,
  hasPendingJoinRequests,
  labels,
  onTabChange,
}: {
  activeTab: DetailTab;
  availableTabs?: DetailTab[];
  hasPendingJoinRequests: boolean;
  labels: ConversationRedesignLabels;
  onTabChange: (tab: DetailTab) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const renderedTabs = availableTabs
    ? tabs.filter((tab) => availableTabs.includes(tab.value))
    : tabs;

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const isRtl = document.documentElement.dir === "rtl";
    const previousKey = isRtl ? "ArrowRight" : "ArrowLeft";
    const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
    let nextIndex: number | null = null;

    if (event.key === previousKey) {
      nextIndex = (index - 1 + renderedTabs.length) % renderedTabs.length;
    } else if (event.key === nextKey) {
      nextIndex = (index + 1) % renderedTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = renderedTabs.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    onTabChange(renderedTabs[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <nav
      aria-label={labels.conversations}
      role="tablist"
      className="flex h-12 shrink-0 items-end gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4"
    >
      {renderedTabs.map((tab, index) => (
        <button
          key={tab.value}
          ref={(element) => {
            tabRefs.current[index] = element;
          }}
          type="button"
          role="tab"
          aria-label={
            tab.value === "joinRequests" && hasPendingJoinRequests
              ? `${labels[tab.labelKey]} — ${labels.pendingJoinRequests}`
              : undefined
          }
          aria-selected={activeTab === tab.value}
          tabIndex={activeTab === tab.value ? 0 : -1}
          onClick={() => onTabChange(tab.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`h-12 shrink-0 cursor-pointer border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
            activeTab === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-primary"
          }`}
        >
          <span className="inline-flex items-center">
            {labels[tab.labelKey]}
            {tab.value === "joinRequests" && hasPendingJoinRequests ? (
              <span
                aria-hidden="true"
                className="ms-2 h-2 w-2 rounded-full bg-red-500"
              />
            ) : null}
          </span>
        </button>
      ))}
    </nav>
  );
}


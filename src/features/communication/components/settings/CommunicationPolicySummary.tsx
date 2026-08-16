"use client";

import CommunicationStatusChip from "@/features/communication/components/layout/CommunicationStatusChip";
import type { CommunicationPolicy } from "@/features/communication/types/communication.types";

export interface CommunicationPolicySummaryLabels {
  title: string;
  enabled: string;
  disabled: string;
  attachments: string;
  reactions: string;
  moderationMode: string;
  maxGroupMembers: string;
  maxMessageLength: string;
  maxAttachmentSize: string;
  notSet: string;
}

export interface CommunicationPolicySummaryProps {
  policy?: CommunicationPolicy | null;
  labels: CommunicationPolicySummaryLabels;
}

function enabledValue(value: boolean | undefined, labels: CommunicationPolicySummaryLabels) {
  return value === false ? labels.disabled : labels.enabled;
}

export default function CommunicationPolicySummary({
  labels,
  policy,
}: CommunicationPolicySummaryProps) {
  const communicationEnabled = policy?.isEnabled ?? policy?.allowConversations;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{labels.title}</h2>
        <CommunicationStatusChip
          label={enabledValue(communicationEnabled, labels)}
          tone={communicationEnabled === false ? "error" : "success"}
        />
      </div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">{labels.attachments}</dt>
          <dd className="font-medium text-slate-800">
            {enabledValue(policy?.allowAttachments, labels)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.reactions}</dt>
          <dd className="font-medium text-slate-800">
            {enabledValue(policy?.allowReactions, labels)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.moderationMode}</dt>
          <dd className="font-medium text-slate-800">
            {policy?.moderationMode || labels.notSet}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.maxGroupMembers}</dt>
          <dd className="font-medium text-slate-800">
            {policy?.maxGroupMembers ?? labels.notSet}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.maxMessageLength}</dt>
          <dd className="font-medium text-slate-800">
            {policy?.maxMessageLength ?? labels.notSet}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{labels.maxAttachmentSize}</dt>
          <dd className="font-medium text-slate-800">
            {policy?.maxAttachmentSizeMb ?? labels.notSet}
          </dd>
        </div>
      </dl>
    </section>
  );
}

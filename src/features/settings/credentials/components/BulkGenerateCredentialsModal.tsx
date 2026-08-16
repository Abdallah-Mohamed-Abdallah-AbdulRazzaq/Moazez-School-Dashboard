"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import type {
  BulkCredentialPreviewRequest,
  BulkCredentialPreviewResponse,
  CredentialBulkScope,
  CredentialRoleOption,
} from "@/features/settings/credentials/types";
import { getBulkCredentialPreviewPayloadKey } from "@/features/settings/credentials/services/credentialsService";

interface BulkGenerateCredentialsModalProps {
  isOpen: boolean;
  roles: CredentialRoleOption[];
  fixedRoleKey?: string;
  preview: BulkCredentialPreviewResponse | null;
  previewPayloadKey: string | null;
  isPreviewing: boolean;
  isGenerating: boolean;
  error?: string | null;
  onClose: () => void;
  onPreview: (payload: BulkCredentialPreviewRequest) => Promise<void>;
  onGenerate: (payload: BulkCredentialPreviewRequest) => Promise<void>;
  labels: {
    title: string;
    description: string;
    role: string;
    status: string;
    all: string;
    active: string;
    invited: string;
    inactive: string;
    missingOnly: string;
    mustChangeOnly: string;
    forceChange: string;
    preview: string;
    previewing: string;
    generate: string;
    generating: string;
    cancel: string;
    totalMatched: string;
    eligible: string;
    skipped: string;
    skippedReasons: string;
    skipReasonLabels: Record<string, string>;
    unknownSkipReason: (reason: string) => string;
  };
}

export default function BulkGenerateCredentialsModal({
  isOpen,
  roles,
  fixedRoleKey,
  preview,
  previewPayloadKey,
  isPreviewing,
  isGenerating,
  error,
  onClose,
  onPreview,
  onGenerate,
  labels,
}: BulkGenerateCredentialsModalProps) {
  const [scope, setScope] = useState<CredentialBulkScope>("missing_password");
  const [roleKey, setRoleKey] = useState("");
  const [includeUsersWithPassword, setIncludeUsersWithPassword] = useState(false);
  const [includeDisabledUsers, setIncludeDisabledUsers] = useState(false);

  const payload = useMemo<BulkCredentialPreviewRequest>(() => {
    if (fixedRoleKey) {
      return {
        scope: "role",
        roleKeys: [fixedRoleKey],
        includeUsersWithPassword,
        includeDisabledUsers,
      };
    }
    if (scope === "role" && roleKey) {
      return {
        scope,
        roleKeys: [roleKey],
        includeUsersWithPassword,
        includeDisabledUsers,
      };
    }
    return {
      scope,
      includeUsersWithPassword,
      includeDisabledUsers,
    };
  }, [fixedRoleKey, includeDisabledUsers, includeUsersWithPassword, roleKey, scope]);

  const payloadKey = getBulkCredentialPreviewPayloadKey(payload);
  const isPreviewCurrent = Boolean(preview && previewPayloadKey === payloadKey);
  const getSkipReasonLabel = (reason: string): string =>
    labels.skipReasonLabels[reason] ?? labels.unknownSkipReason(reason);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={labels.title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            variant="secondary"
            loading={isPreviewing}
            onClick={() => void onPreview(payload)}
          >
            {isPreviewing ? labels.previewing : labels.preview}
          </Button>
          <Button
            variant="primary"
            loading={isGenerating}
            disabled={
              !isPreviewCurrent ||
              !preview ||
              preview.eligibleCount < 1 ||
              isPreviewing ||
              isGenerating
            }
            onClick={() => void onGenerate(payload)}
          >
            {isGenerating ? labels.generating : labels.generate}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{labels.description}</p>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {!fixedRoleKey ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={labels.status}
            value={scope}
            onChange={(value) => setScope(value as CredentialBulkScope)}
            options={[
              { value: "missing_password", label: labels.missingOnly },
              { value: "all_school_users", label: labels.all },
              { value: "role", label: labels.role },
            ]}
          />
          <Select
            label={labels.role}
            value={roleKey}
            onChange={setRoleKey}
            disabled={scope !== "role"}
            options={[
              { value: "", label: labels.all },
              ...roles.map((role) => ({
                value: role.key ?? role.id,
                label: role.name,
                disabled: !role.key,
              })),
            ]}
          />
        </div> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              checked: includeUsersWithPassword,
              label: labels.active,
              onChange: setIncludeUsersWithPassword,
            },
            {
              checked: includeDisabledUsers,
              label: labels.inactive,
              onChange: setIncludeDisabledUsers,
            },
          ].map((option) => (
            <label
              key={option.label}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300"
                checked={option.checked}
                onChange={(event) => option.onChange(event.target.checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {preview && isPreviewCurrent ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                {labels.totalMatched}:{" "}
                <strong className="text-gray-900">{preview.totalMatched}</strong>
              </span>
              <span>
                {labels.eligible}:{" "}
                <strong className="text-gray-900">{preview.eligibleCount}</strong>
              </span>
              <span>
                {labels.skipped}:{" "}
                <strong className="text-gray-900">{preview.skippedCount}</strong>
              </span>
            </div>
            {Object.keys(preview.skippedReasons).length > 0 ? (
              <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <p className="font-medium">{labels.skippedReasons}</p>
                <ul className="mt-1 space-y-1">
                  {Object.entries(preview.skippedReasons).map(
                    ([reason, count]) => (
                      <li key={reason}>
                        {getSkipReasonLabel(reason)}: {count}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {preview.recipients.map((recipient) => (
                <div
                  key={recipient.userId}
                  className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {recipient.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {recipient.username || recipient.loginEmail}
                    </span>
                  </span>
                  <span
                    className={
                      recipient.eligible ? "text-green-700" : "text-gray-500"
                    }
                  >
                    {recipient.eligible
                      ? labels.eligible
                      : recipient.skipReason
                        ? getSkipReasonLabel(recipient.skipReason)
                        : labels.skipped}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAdminOverview,
  getPolicy,
  updatePolicy,
} from "@/features/communication/api/communication.service";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import type {
  CommunicationAdminOverview,
  ModerationMode,
  CommunicationPolicy,
  CommunicationRecord,
  StudentDirectMode,
  UpdateCommunicationPolicyPayload,
} from "@/features/communication/types/communication.types";

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

let cachedPolicy: CommunicationPolicy | null = null;
const policyListeners = new Set<(policy: CommunicationPolicy | null) => void>();

function notifyPolicyListeners(policy: CommunicationPolicy | null) {
  cachedPolicy = policy;
  policyListeners.forEach((listener) => listener(policy));
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;
  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );
  return (item ?? response) as T;
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load communication policy.";
}

function parseMetadata(metadataText?: string): CommunicationRecord | undefined {
  const trimmed = metadataText?.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as unknown;
  if (!isRecord(parsed)) throw new Error("Metadata must be a JSON object.");
  return parsed;
}

export interface CommunicationPolicyFormValues {
  isEnabled?: boolean;
  allowAdminToAnyone?: boolean;
  allowDirectStaffToStaff?: boolean;
  allowTeacherToParent?: boolean;
  allowTeacherToStudent?: boolean;
  allowStudentToTeacher?: boolean;
  allowStudentToStudent?: boolean;
  allowTeacherCreatedGroups?: boolean;
  allowStudentCreatedGroups?: boolean;
  requireApprovalForStudentGroups?: boolean;
  allowParentToParent?: boolean;
  allowAttachments?: boolean;
  allowVoiceMessages?: boolean;
  allowVideoMessages?: boolean;
  allowReactions?: boolean;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  allowReadReceipts?: boolean;
  allowDeliveryReceipts?: boolean;
  allowOnlinePresence?: boolean;
  maxGroupMembers?: string;
  maxMessageLength?: string;
  maxAttachmentSizeMb?: string;
  retentionDays?: string;
  moderationMode?: ModerationMode;
  studentDirectMode?: StudentDirectMode;
  metadataText?: string;
}

export function policyToFormValues(
  policy: CommunicationPolicy | null,
): CommunicationPolicyFormValues {
  return {
    isEnabled: policy?.isEnabled ?? policy?.allowConversations ?? true,
    allowAdminToAnyone: policy?.allowAdminToAnyone ?? false,
    allowDirectStaffToStaff: policy?.allowDirectStaffToStaff ?? true,
    allowTeacherToParent: policy?.allowTeacherToParent ?? true,
    allowTeacherToStudent: policy?.allowTeacherToStudent ?? true,
    allowStudentToTeacher: policy?.allowStudentToTeacher ?? true,
    allowStudentToStudent: policy?.allowStudentToStudent ?? false,
    allowTeacherCreatedGroups: policy?.allowTeacherCreatedGroups ?? true,
    allowStudentCreatedGroups: policy?.allowStudentCreatedGroups ?? false,
    requireApprovalForStudentGroups:
      policy?.requireApprovalForStudentGroups ?? true,
    allowParentToParent: policy?.allowParentToParent ?? false,
    allowAttachments: policy?.allowAttachments ?? true,
    allowVoiceMessages: policy?.allowVoiceMessages ?? false,
    allowVideoMessages: policy?.allowVideoMessages ?? false,
    allowReactions: policy?.allowReactions ?? true,
    allowMessageEdit:
      policy?.allowMessageEdit ?? policy?.allowMessageEditing ?? true,
    allowMessageDelete:
      policy?.allowMessageDelete ?? policy?.allowMessageDeleting ?? true,
    allowReadReceipts: policy?.allowReadReceipts ?? true,
    allowDeliveryReceipts: policy?.allowDeliveryReceipts ?? true,
    allowOnlinePresence: policy?.allowOnlinePresence ?? true,
    maxGroupMembers:
      typeof policy?.maxGroupMembers === "number"
        ? String(policy.maxGroupMembers)
        : "",
    maxMessageLength:
      typeof policy?.maxMessageLength === "number"
        ? String(policy.maxMessageLength)
        : "",
    maxAttachmentSizeMb:
      typeof policy?.maxAttachmentSizeMb === "number"
        ? String(policy.maxAttachmentSizeMb)
        : "",
    retentionDays:
      typeof policy?.retentionDays === "number"
        ? String(policy.retentionDays)
        : "",
    moderationMode: policy?.moderationMode ?? "standard",
    studentDirectMode: policy?.studentDirectMode ?? "disabled",
    metadataText: policy?.metadata ? JSON.stringify(policy.metadata, null, 2) : "",
  };
}

function optionalNumber(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function payloadFromValues(
  values: CommunicationPolicyFormValues,
): UpdateCommunicationPolicyPayload {
  const metadata = parseMetadata(values.metadataText);
  const allowMessageEdit = Boolean(values.allowMessageEdit);
  const allowMessageDelete = Boolean(values.allowMessageDelete);
  const maxGroupMembers = optionalNumber(values.maxGroupMembers);
  const maxMessageLength = optionalNumber(values.maxMessageLength);
  const maxAttachmentSizeMb = optionalNumber(values.maxAttachmentSizeMb);
  const retentionDays = optionalNumber(values.retentionDays);
  const internalMetadata = createCommunicationMetadata("policy_update", {
    updatedFrom: "communication_settings_page",
  });

  return {
    isEnabled: Boolean(values.isEnabled),
    allowAdminToAnyone: Boolean(values.allowAdminToAnyone),
    allowDirectStaffToStaff: Boolean(values.allowDirectStaffToStaff),
    allowTeacherToParent: Boolean(values.allowTeacherToParent),
    allowTeacherToStudent: Boolean(values.allowTeacherToStudent),
    allowStudentToTeacher: Boolean(values.allowStudentToTeacher),
    allowStudentToStudent: Boolean(values.allowStudentToStudent),
    allowTeacherCreatedGroups: Boolean(values.allowTeacherCreatedGroups),
    allowStudentCreatedGroups: Boolean(values.allowStudentCreatedGroups),
    requireApprovalForStudentGroups: Boolean(
      values.requireApprovalForStudentGroups,
    ),
    allowParentToParent: Boolean(values.allowParentToParent),
    allowAttachments: Boolean(values.allowAttachments),
    allowVoiceMessages: Boolean(values.allowVoiceMessages),
    allowVideoMessages: Boolean(values.allowVideoMessages),
    allowReactions: Boolean(values.allowReactions),
    allowMessageEdit,
    allowMessageDelete,
    allowReadReceipts: Boolean(values.allowReadReceipts),
    allowDeliveryReceipts: Boolean(values.allowDeliveryReceipts),
    allowOnlinePresence: Boolean(values.allowOnlinePresence),
    moderationMode: values.moderationMode || "standard",
    studentDirectMode: values.studentDirectMode,
    ...(maxGroupMembers !== undefined ? { maxGroupMembers } : {}),
    ...(maxMessageLength !== undefined ? { maxMessageLength } : {}),
    ...(maxAttachmentSizeMb !== undefined ? { maxAttachmentSizeMb } : {}),
    ...(retentionDays !== undefined ? { retentionDays } : {}),
    metadata: {
      ...(internalMetadata ?? {}),
      ...(metadata ?? {}),
    },
  };
}

interface UseCommunicationPolicyOptions {
  enabled?: boolean;
  includeAdminOverview?: boolean;
}

export function useCommunicationPolicy({
  enabled = true,
  includeAdminOverview = true,
}: UseCommunicationPolicyOptions = {}) {
  const mountedRef = useRef(false);
  const [policy, setPolicy] = useState<CommunicationPolicy | null>(cachedPolicy);
  const [adminOverview, setAdminOverview] =
    useState<CommunicationAdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(enabled && !cachedPolicy);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsRefreshing(true);
    setError(null);

    try {
      const policyResponse = await getPolicy();
      const nextPolicy = unwrapItem<CommunicationPolicy>(policyResponse);
      const nextOverview = includeAdminOverview
        ? unwrapItem<CommunicationAdminOverview>(await getAdminOverview())
        : null;

      if (!mountedRef.current) return;
      notifyPolicyListeners(nextPolicy);
      if (nextOverview) setAdminOverview(nextOverview);
    } catch (nextError) {
      if (mountedRef.current) setError(errorMessageFromUnknown(nextError));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [enabled, includeAdminOverview]);

  useEffect(() => {
    mountedRef.current = true;
    const listener = (nextPolicy: CommunicationPolicy | null) => {
      if (mountedRef.current) setPolicy(nextPolicy);
    };
    policyListeners.add(listener);
    if (enabled && !cachedPolicy) {
    void Promise.resolve().then(refresh);
    } else if (enabled && includeAdminOverview) {
      void getAdminOverview()
        .then((response) => {
          if (mountedRef.current) {
            setAdminOverview(unwrapItem<CommunicationAdminOverview>(response));
          }
        })
        .catch(() => undefined);
    }

    return () => {
      mountedRef.current = false;
      policyListeners.delete(listener);
    };
  }, [enabled, includeAdminOverview, refresh]);

  const save = useCallback(
    async (values: CommunicationPolicyFormValues) => {
      setIsSaving(true);
      setError(null);
      try {
        const response = await updatePolicy(payloadFromValues(values));
        const nextPolicy = unwrapItem<CommunicationPolicy>(response);
        if (mountedRef.current) notifyPolicyListeners(nextPolicy);
        return nextPolicy;
      } catch (nextError) {
        const message = errorMessageFromUnknown(nextError);
        if (mountedRef.current) setError(message);
        throw nextError;
      } finally {
        if (mountedRef.current) setIsSaving(false);
      }
    },
    [],
  );

  return {
    policy,
    adminOverview,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    refresh,
    save,
  };
}

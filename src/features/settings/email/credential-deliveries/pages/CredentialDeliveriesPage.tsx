"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import CredentialDeliveryWizard, {
  type CredentialDeliveryWizardValues,
} from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import {
  createCredentialDelivery,
  previewCredentialDeliveryRecipients,
} from "@/features/settings/email/credential-deliveries/services/credentialDeliveryService";
import { fetchAllSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type {
  CredentialDeliveryPreviewResponse,
} from "@/features/settings/email/credential-deliveries/types";
import type { EmailDeliveryBatch } from "@/features/settings/email/deliveries/types";
import type { RoleDefinition } from "@/features/settings/types";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import {
  buildCredentialCreatePayload,
  buildCredentialPreviewPayload,
  credentialPreviewFingerprint,
} from "@/features/settings/email/credential-deliveries/utils/credentialDeliveryPayloads";

export default function CredentialDeliveriesPage() {
  const t = useTranslations("settings.email.credentialDeliveries");
  const { showSuccess } = useToast();
  const { hasPermission } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get("userId")?.trim() || undefined;
  const canManage = hasPermission(
    "settings.email.credential_deliveries.manage",
  );
  const [preview, setPreview] =
    useState<CredentialDeliveryPreviewResponse | null>(null);
  const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(
    null,
  );
  const [createdBatch, setCreatedBatch] =
    useState<EmailDeliveryBatch | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [rolesError, setRolesError] = useState(false);
  const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshingRoles, setIsRefreshingRoles] = useState(false);
  const [wizardRevision, setWizardRevision] = useState(0);
  const activePreviewFingerprint = useRef<string | null>(null);
  const previewRequestId = useRef(0);

  const hydrateRoles = useCallback(async () => {
    setIsRefreshingRoles(true);
    setRolesError(false);
    try {
      setRoles(await fetchAllSettingsRoles());
    } catch {
      setRolesError(true);
    } finally {
      setIsRefreshingRoles(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(hydrateRoles);
  }, [hydrateRoles]);

  const invalidatePreview = () => {
    previewRequestId.current += 1;
    activePreviewFingerprint.current = null;
    setPreview(null);
    setPreviewFingerprint(null);
    setCreatedBatch(null);
    setIsPreviewing(false);
  };

  const handlePreview = async (values: CredentialDeliveryWizardValues) => {
    const fingerprint = credentialPreviewFingerprint(values);
    const requestId = previewRequestId.current + 1;
    previewRequestId.current = requestId;
    activePreviewFingerprint.current = fingerprint;
    setIsPreviewing(true);
    setPageError(null);
    setPreview(null);
    setPreviewFingerprint(null);
    setCreatedBatch(null);
    try {
      const result = await previewCredentialDeliveryRecipients(
        buildCredentialPreviewPayload(values),
      );
      if (
        previewRequestId.current !== requestId ||
        activePreviewFingerprint.current !== fingerprint
      ) {
        return null;
      }
      setPreview(result);
      setPreviewFingerprint(fingerprint);
      showSuccess(t("messages.preview_ready"));
      return result;
    } catch (error) {
      if (previewRequestId.current === requestId) {
        setPageError(classifySettingsWorkflowError(error));
      }
      return null;
    } finally {
      if (previewRequestId.current === requestId) {
        setIsPreviewing(false);
      }
    }
  };

  const handleCreate = async (values: CredentialDeliveryWizardValues) => {
    if (!canManage) {
      return null;
    }
    if (previewFingerprint !== credentialPreviewFingerprint(values)) {
      invalidatePreview();
      return null;
    }
    setIsCreating(true);
    setPageError(null);
    try {
      const result = await createCredentialDelivery(
        buildCredentialCreatePayload(values),
      );
      setCreatedBatch(result);
      showSuccess(t("messages.created"));
      return result;
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SettingsAccessGuard permission="settings.email.credential_deliveries.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => {
                setPreview(null);
                setPreviewFingerprint(null);
                setCreatedBatch(null);
                activePreviewFingerprint.current = null;
                previewRequestId.current += 1;
                setPageError(null);
                setWizardRevision((current) => current + 1);
                router.replace(pathname, { scroll: false });
                void hydrateRoles();
              }}
              loading={isRefreshingRoles}
              disabled={isCreating}
            >
              {t("reset")}
            </Button>
          }
        />

        {pageError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={pageError} />
          </div>
        ) : null}

        <CredentialDeliveryWizard
          key={`${selectedUserId ?? "default"}-${wizardRevision}`}
          initialUserId={selectedUserId}
          canManage={canManage}
          roles={roles}
          isLoadingRoles={isRefreshingRoles}
          rolesError={rolesError}
          onRetryRoles={hydrateRoles}
          preview={preview}
          previewFingerprint={previewFingerprint}
          createdBatch={createdBatch}
          isPreviewing={isPreviewing}
          isCreating={isCreating}
          onPreview={handlePreview}
          onCreate={handleCreate}
          onPreviewInvalidated={invalidatePreview}
        />
      </main>
    </SettingsAccessGuard>
  );
}

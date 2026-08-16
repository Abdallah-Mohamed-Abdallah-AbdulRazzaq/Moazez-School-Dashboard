"use client";

import { useState } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import TemporaryPasswordRevealModal, {
  type RevealedCredential,
} from "@/features/settings/credentials/components/TemporaryPasswordRevealModal";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import { generateUserCredential } from "@/features/settings/credentials/services/credentialsService";
import type { SettingsUserRecord } from "@/features/settings/types";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import { useTranslations } from "next-intl";

interface UserProvisioningModalProps {
  isOpen: boolean;
  user: SettingsUserRecord | null;
  canGenerate: boolean;
  canDeliver: boolean;
  onDeliver: (user: SettingsUserRecord) => void;
  onClose: () => void;
}

export default function UserProvisioningModal({
  isOpen,
  user,
  canGenerate,
  canDeliver,
  onDeliver,
  onClose,
}: UserProvisioningModalProps) {
  const t = useTranslations("settings.users.provisioning");
  const tCommon = useTranslations("common");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] =
    useState<SettingsWorkflowError | null>(null);
  const [revealedCredential, setRevealedCredential] =
    useState<RevealedCredential | null>(null);

  const closeProvisioning = () => {
    setGenerationError(null);
    setRevealedCredential(null);
    onClose();
  };

  const generateCredential = async () => {
    if (!user) {
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      setRevealedCredential(await generateUserCredential(user.id));
    } catch (error) {
      setGenerationError(classifySettingsWorkflowError(error));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && Boolean(user) && !revealedCredential}
        onClose={closeProvisioning}
        title={t("title")}
        description={t("description", { name: user?.fullName ?? "" })}
        size="md"
        closeOnOverlayClick={false}
        closeOnEscape={!isGenerating}
        showCloseButton={!isGenerating}
        footer={
          <Button
            variant="secondary"
            onClick={closeProvisioning}
            disabled={isGenerating}
          >
            {t("finish_later")}
          </Button>
        }
      >
        <div className="space-y-4 py-2">
          {generationError ? (
            <SettingsWorkflowErrorAlert error={generationError} />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {canGenerate ? (
              <Button
                variant="primary"
                leftIcon={<KeyRound className="h-4 w-4" />}
                loading={isGenerating}
                onClick={() => void generateCredential()}
              >
                {isGenerating ? t("generating") : t("generate")}
              </Button>
            ) : null}
            {canDeliver && user ? (
              <Button
                variant="secondary"
                leftIcon={<MailCheck className="h-4 w-4" />}
                disabled={isGenerating}
                onClick={() => onDeliver(user)}
              >
                {t("deliver")}
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">{t("separate_outcomes")}</p>
        </div>
      </Modal>
      <TemporaryPasswordRevealModal
        isOpen={Boolean(revealedCredential)}
        credentials={revealedCredential ? [revealedCredential] : []}
        onClose={closeProvisioning}
        labels={{
          title: t("reveal.title"),
          warning: t("reveal.warning"),
          noPassword: t("reveal.no_password"),
          copy: t("reveal.copy"),
          copied: t("reveal.copied"),
          close: tCommon("close"),
          user: t("reveal.user"),
          password: t("reveal.password"),
          show: t("reveal.show"),
          hide: t("reveal.hide"),
        }}
      />
    </>
  );
}

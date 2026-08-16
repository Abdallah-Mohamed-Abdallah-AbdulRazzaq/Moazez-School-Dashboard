"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";
import type { IntegrationProviderStatus } from "@/features/settings/types";

interface IntegrationConfigModalProps {
  isOpen: boolean;
  integration: IntegrationProviderStatus | null;
  onClose: () => void;
  onSave: (integrationId: string, values: Record<string, string>) => Promise<void>;
}

export default function IntegrationConfigModal({
  isOpen,
  integration,
  onClose,
  onSave,
}: IntegrationConfigModalProps) {
  const t = useTranslations("settings.integrations");
  const tCommon = useTranslations("common");
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setValues(integration?.configuration.values || {});
    });
    void Promise.resolve().then(() => setIsSaving(false));
  }, [integration]);

  const isValid = useMemo(() => {
    if (!integration) {
      return false;
    }
    return integration.fields.every((field) =>
      field.required ? Boolean(values[field.key]?.trim()) : true,
    );
  }, [integration, values]);

  const handleSave = async () => {
    if (!integration || !isValid) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(integration.id, values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={integration ? `${t("configure")} ${integration.provider}` : t("configure")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? tCommon("saving") : tCommon("save")}
          </Button>
        </>
      }
    >
      {integration ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integration.fields.map((field) =>
            field.type === "select" ? (
              <Select
                key={field.key}
                label={field.label}
                value={values[field.key] || ""}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [field.key]: value }))
                }
                options={field.options || []}
              />
            ) : (
              <Input
                key={field.key}
                label={field.label}
                type={field.type === "password" ? "password" : "text"}
                value={values[field.key] || ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                placeholder={field.placeholder}
              />
            ),
          )}
        </div>
      ) : null}
    </Modal>
  );
}

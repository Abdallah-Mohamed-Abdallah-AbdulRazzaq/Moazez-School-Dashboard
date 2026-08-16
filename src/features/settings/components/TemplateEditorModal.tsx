"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Button from "@/components/ui/button/Button";
import type { NotificationTemplateConfig } from "@/features/settings/types";

interface TemplateEditorModalProps {
  isOpen: boolean;
  template: NotificationTemplateConfig | null;
  onClose: () => void;
  onSave: (payload: NotificationTemplateConfig) => Promise<void>;
}

export default function TemplateEditorModal({
  isOpen,
  template,
  onClose,
  onSave,
}: TemplateEditorModalProps) {
  const t = useTranslations("settings.templates");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = useState<NotificationTemplateConfig | null>(template);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setDraft(
        template
          ? {
              ...template,
              variables: [...template.variables],
              template: {
                ...template.template,
                channels: [...template.template.channels],
              },
            }
          : null,
      );
      setIsSaving(false);
    });
  }, [template]);

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("edit_template")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!draft || isSaving}>
            {isSaving ? tCommon("saving") : tCommon("save")}
          </Button>
        </>
      }
    >
      {draft ? (
        <div className="space-y-4">
          <Input
            label={t("subject_label")}
            value={draft.template.emailSubject}
            onChange={(e) =>
              setDraft({
                ...draft,
                template: { ...draft.template, emailSubject: e.target.value },
              })
            }
          />
          <TextArea
            label={t("message_label")}
            rows={5}
            value={draft.template.message}
            onChange={(e) =>
              setDraft({
                ...draft,
                template: { ...draft.template, message: e.target.value },
              })
            }
          />
          <TextArea
            label={t("sms_label")}
            rows={4}
            value={draft.template.smsMessage}
            onChange={(e) =>
              setDraft({
                ...draft,
                template: { ...draft.template, smsMessage: e.target.value },
              })
            }
          />
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">{t("channel_controls")}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {draft.channelStates.map((channelState) => (
                <label key={channelState.channel} className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={channelState.enabled}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        channelStates: draft.channelStates.map((item) =>
                          item.channel === channelState.channel
                            ? { ...item, enabled: event.target.checked }
                            : item,
                        ),
                        template: {
                          ...draft.template,
                          channels: draft.channelStates
                            .map((item) =>
                              item.channel === channelState.channel
                                ? { ...item, enabled: event.target.checked }
                                : item,
                            )
                            .filter((item) => item.enabled)
                            .map((item) => item.channel),
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {channelState.channel.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

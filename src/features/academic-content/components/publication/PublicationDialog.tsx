"use client";

import { useState } from "react";
import { CalendarClock, Send } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import Modal from "@/components/ui/modal/Modal";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  validatePublicationDraft,
  type PublicationDraft,
  type PublicationDraftError,
} from "../../model/academicContentPublicationPolicy";
import type { AcademicContentType } from "../../types/contracts";

interface PublicationDialogProps {
  isOpen: boolean;
  mode: PublicationDraft["mode"];
  contentType: AcademicContentType;
  showMinorUpdateOption: boolean;
  isMutating: boolean;
  onClose: () => void;
  onSubmit: (draft: PublicationDraft) => void;
}

function emptyDraft(mode: PublicationDraft["mode"]): PublicationDraft {
  return {
    mode,
    publishAt: null,
    visibleFrom: null,
    visibleUntil: null,
    notifyMinorUpdate: false,
  };
}

function OpenPublicationDialog({
  mode,
  contentType,
  showMinorUpdateOption,
  isMutating,
  onClose,
  onSubmit,
}: PublicationDialogProps) {
  const t = useAcademicContentTranslations("publication");
  const commonT = useAcademicContentTranslations("common");
  const [draft, setDraft] = useState<PublicationDraft>(() => emptyDraft(mode));
  const [validationErrors, setValidationErrors] = useState<
    PublicationDraftError[]
  >([]);

  const updateDraft = (change: Partial<PublicationDraft>) => {
    setDraft((current) => ({ ...current, ...change }));
    setValidationErrors([]);
  };

  const submit = () => {
    const errors = validatePublicationDraft(draft, new Date());
    setValidationErrors(errors);
    if (errors.length === 0) onSubmit(draft);
  };

  const close = () => {
    if (!isMutating) onClose();
  };

  const errorMessage = (error: PublicationDraftError) =>
    validationErrors.includes(error) ? t(`validation.${error}`) : undefined;
  const isSchedule = mode === "schedule";

  return (
    <Modal
      isOpen
      onClose={close}
      title={isSchedule ? t("schedule") : t("publish_now")}
      icon={
        isSchedule ? (
          <CalendarClock aria-hidden="true" className="size-6" />
        ) : (
          <Send aria-hidden="true" className="size-6" />
        )
      }
      size="md"
      showCloseButton={!isMutating}
      closeOnOverlayClick={!isMutating}
      closeOnEscape={!isMutating}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={isMutating}
            onClick={close}
          >
            {commonT("cancel")}
          </Button>
          <Button
            type="button"
            loading={isMutating}
            disabled={isMutating}
            onClick={submit}
          >
            {isSchedule ? t("submit_schedule") : t("submit_publish")}
          </Button>
        </>
      }
    >
      <div className="space-y-5 py-2">
        {isSchedule ? (
          <DateTimePicker
            label={t("publish_at")}
            value={draft.publishAt}
            minDateTime={new Date()}
            required
            disabled={isMutating}
            error={
              errorMessage("publish_at_required") ??
              errorMessage("publish_at_not_future")
            }
            onChange={(publishAt) => updateDraft({ publishAt })}
          />
        ) : null}

        <DateTimePicker
          label={t("visible_from")}
          value={draft.visibleFrom}
          disabled={isMutating}
          error={errorMessage("visible_from_before_publish")}
          helperText={t("optional")}
          onChange={(visibleFrom) => updateDraft({ visibleFrom })}
        />

        <DateTimePicker
          label={t("visible_until")}
          value={draft.visibleUntil}
          disabled={isMutating}
          error={errorMessage("visible_until_before_visible_from")}
          helperText={
            contentType === "ONLINE_SESSION"
              ? t("online_session_end_hint")
              : t("optional")
          }
          onChange={(visibleUntil) => updateDraft({ visibleUntil })}
        />

        {showMinorUpdateOption ? (
          <Checkbox
            checked={draft.notifyMinorUpdate}
            disabled={isMutating}
            label={t("notify_minor_update")}
            description={t("notify_minor_update_description")}
            onChange={(event) =>
              updateDraft({ notifyMinorUpdate: event.target.checked })
            }
          />
        ) : null}
      </div>
    </Modal>
  );
}

export default function PublicationDialog(props: PublicationDialogProps) {
  if (!props.isOpen) return null;

  return <OpenPublicationDialog key={props.mode} {...props} />;
}

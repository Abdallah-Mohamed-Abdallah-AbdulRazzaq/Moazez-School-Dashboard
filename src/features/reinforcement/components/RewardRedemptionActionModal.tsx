"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import TextArea from "@/components/ui/input/TextArea";
import type {
  ApproveRewardRedemptionPayload,
  RejectRewardRedemptionPayload,
  FulfillRewardRedemptionPayload,
  CancelRewardRedemptionPayload,
} from "../types";

export type RedemptionActionType = "approve" | "reject" | "fulfill" | "cancel";

export type RedemptionActionPayload =
  | ApproveRewardRedemptionPayload
  | RejectRewardRedemptionPayload
  | FulfillRewardRedemptionPayload
  | CancelRewardRedemptionPayload;

interface RewardRedemptionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RedemptionActionPayload) => Promise<void> | void;
  actionType: RedemptionActionType;
  loading?: boolean;
}

export default function RewardRedemptionActionModal({
  isOpen,
  onClose,
  onSubmit,
  actionType,
  loading = false,
}: RewardRedemptionActionModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement.rewardsModule");
  const tCommon = useTranslations("reinforcement");

  const [fieldEn, setFieldEn] = useState("");
  const [fieldAr, setFieldAr] = useState("");

  // Reset form when modal opens/closes or action type changes
  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      setFieldEn("");
      setFieldAr("");
    });
  }, [isOpen, actionType]);

  const isDanger = actionType === "reject" || actionType === "cancel";

  const getModalTitle = (): string => {
    switch (actionType) {
      case "approve":
        return t("redemptions.modal.approveTitle");
      case "reject":
        return t("redemptions.modal.rejectTitle");
      case "fulfill":
        return t("redemptions.modal.fulfillTitle");
      case "cancel":
        return t("redemptions.modal.cancelTitle");
    }
  };

  const getModalDescription = (): string => {
    switch (actionType) {
      case "approve":
        return t("redemptions.modal.approveDescription");
      case "reject":
        return t("redemptions.modal.rejectDescription");
      case "fulfill":
        return t("redemptions.modal.fulfillDescription");
      case "cancel":
        return t("redemptions.modal.cancelDescription");
    }
  };

  const getFieldLabelEn = (): string => {
    switch (actionType) {
      case "approve":
      case "reject":
        return t("redemptions.modal.reviewNoteEn");
      case "fulfill":
        return t("redemptions.modal.fulfillmentNoteEn");
      case "cancel":
        return t("redemptions.modal.cancellationReasonEn");
    }
  };

  const getFieldLabelAr = (): string => {
    switch (actionType) {
      case "approve":
      case "reject":
        return t("redemptions.modal.reviewNoteAr");
      case "fulfill":
        return t("redemptions.modal.fulfillmentNoteAr");
      case "cancel":
        return t("redemptions.modal.cancellationReasonAr");
    }
  };

  const getConfirmLabel = (): string => {
    switch (actionType) {
      case "approve":
        return t("redemptions.modal.confirmApprove");
      case "reject":
        return t("redemptions.modal.confirmReject");
      case "fulfill":
        return t("redemptions.modal.confirmFulfill");
      case "cancel":
        return t("redemptions.modal.confirmCancel");
    }
  };

  const handleSubmit = () => {
    const enValue = fieldEn.trim() || undefined;
    const arValue = fieldAr.trim() || undefined;

    let payload: RedemptionActionPayload;

    switch (actionType) {
      case "approve":
        payload = { reviewNoteEn: enValue, reviewNoteAr: arValue };
        break;
      case "reject":
        payload = { reviewNoteEn: enValue, reviewNoteAr: arValue };
        break;
      case "fulfill":
        payload = { fulfillmentNoteEn: enValue, fulfillmentNoteAr: arValue };
        break;
      case "cancel":
        payload = {
          cancellationReasonEn: enValue,
          cancellationReasonAr: arValue,
        };
        break;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      description={getModalDescription()}
      variant={isDanger ? "danger" : "confirm"}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "danger" : "primary"}
            loading={loading}
            onClick={handleSubmit}
          >
            {getConfirmLabel()}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <TextArea
          label={getFieldLabelEn()}
          value={fieldEn}
          onChange={(e) => setFieldEn(e.target.value)}
          rows={3}
        />
        <TextArea
          label={getFieldLabelAr()}
          value={fieldAr}
          dir="rtl"
          onChange={(e) => setFieldAr(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}

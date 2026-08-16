// FILE: src/components/admissions/DecisionModal.tsx

"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Button, Modal, TextArea } from "@/components/ui";
import { Application, DecisionType } from "@/features/admissions/types/admissions";

interface DecisionModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: DecisionType, reason: string) => void;
  isSubmitting?: boolean;
}

export default function DecisionModal({
  application,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: DecisionModalProps) {
  const t = useTranslations("admissions.decision_modal");
  const locale = useLocale();
  const [decision, setDecision] = useState<DecisionType>("accept");
  const [reason, setReason] = useState("");
  const state = application.dashboardState?.decisionState;

  if (!isOpen) return null;

  const studentName =
    locale === "ar"
      ? application.full_name_ar ||
        application.studentNameArabic ||
        application.studentName
      : application.full_name_en || application.studentName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (isSubmitting || (state && !({ accept: state.canAccept, waitlist: state.canWaitlist, reject: state.canReject }[decision]))) return;
    onSubmit(decision, trimmedReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={studentName}
      size="lg"
      showCloseButton={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="decision-modal-form"
            loading={isSubmitting}
          >
            {t("submit")}
          </Button>
        </>
      }
    >
        <form id="decision-modal-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
          {/* Decision Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t("decision")} *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDecision("accept")}
                disabled={isSubmitting || state?.canAccept === false}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === "accept"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="flex flex-col items-center">
                  <CheckCircle
                    className={`w-6 h-6 mb-2 ${
                      decision === "accept" ? "text-emerald-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      decision === "accept" ? "text-emerald-900" : "text-gray-700"
                    }`}
                  >
                  {t("accept")}
                  </span>
                </span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setDecision("waitlist")}
                disabled={isSubmitting || state?.canWaitlist === false}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === "waitlist"
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="flex flex-col items-center">
                  <Clock
                    className={`w-6 h-6 mb-2 ${
                      decision === "waitlist" ? "text-amber-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      decision === "waitlist" ? "text-amber-900" : "text-gray-700"
                    }`}
                  >
                  {t("waitlist")}
                  </span>
                </span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setDecision("reject")}
                disabled={isSubmitting || state?.canReject === false}
                className={`p-4 border-2 rounded-lg transition-all ${
                  decision === "reject"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="flex flex-col items-center">
                  <XCircle
                    className={`w-6 h-6 mb-2 ${
                      decision === "reject" ? "text-red-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      decision === "reject" ? "text-red-900" : "text-gray-700"
                    }`}
                  >
                  {t("reject")}
                  </span>
                </span>
              </Button>
            </div>
          </div>

          {/* Reason */}
          <TextArea
              label={t("reason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={t("reason_placeholder")}
              disabled={isSubmitting}
              maxLength={2000}
              resize="none"
            />
        </form>
    </Modal>
  );
}

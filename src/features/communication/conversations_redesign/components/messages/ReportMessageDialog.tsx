"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import Modal from "@/components/ui/modal/Modal";
import type {
  CreateMessageReportPayload,
  ReportReason,
} from "@/features/communication/types/safety.types";

const labels = {
  en: {
    title: "Report message",
    description: "Help the school review this message by sharing the reason for your report.",
    reason: "Reason",
    descriptionLabel: "Description",
    descriptionHint: "Add context that will help the reviewer (optional).",
    comment: "Additional comment",
    commentHint: "Anything else the reviewer should know (optional).",
    cancel: "Cancel",
    submit: "Submit report",
    spam: "Spam",
    harassment: "Harassment",
    bullying: "Bullying",
    abusiveLanguage: "Abusive language",
    inappropriateContent: "Inappropriate content",
    safety: "Safety concern",
    privacy: "Privacy concern",
    other: "Other",
  },
  ar: {
    title: "الإبلاغ عن رسالة",
    description: "ساعد المدرسة على مراجعة هذه الرسالة عبر تحديد سبب البلاغ.",
    reason: "سبب البلاغ",
    descriptionLabel: "الوصف",
    descriptionHint: "أضف تفاصيل تساعد المراجع على فهم البلاغ (اختياري).",
    comment: "ملاحظة إضافية",
    commentHint: "أي معلومات أخرى ينبغي أن يعرفها المراجع (اختياري).",
    cancel: "إلغاء",
    submit: "إرسال البلاغ",
    spam: "رسائل مزعجة",
    harassment: "تحرش",
    bullying: "تنمر",
    abusiveLanguage: "لغة مسيئة",
    inappropriateContent: "محتوى غير مناسب",
    safety: "مشكلة تتعلق بالسلامة",
    privacy: "مشكلة تتعلق بالخصوصية",
    other: "أخرى",
  },
} as const;

export interface ReportMessageDialogProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  locale: "en" | "ar";
  onClose: () => void;
  onSubmit: (payload: CreateMessageReportPayload) => Promise<void>;
}

export default function ReportMessageDialog({
  isOpen,
  isSubmitting = false,
  locale,
  onClose,
  onSubmit,
}: ReportMessageDialogProps) {
  const t = labels[locale];
  const [reason, setReason] = useState<ReportReason>("inappropriate_content");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");

  const submitReport = async () => {
    await onSubmit({
      reason,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.title}
      description={t.description}
      icon={<Flag className="h-6 w-6" aria-hidden="true" />}
      variant="danger"
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="button" loading={isSubmitting} onClick={() => void submitReport()}>
            {t.submit}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <Select
          label={t.reason}
          required
          value={reason}
          options={[
            { value: "spam", label: t.spam },
            { value: "harassment", label: t.harassment },
            { value: "bullying", label: t.bullying },
            { value: "abusive_language", label: t.abusiveLanguage },
            { value: "inappropriate_content", label: t.inappropriateContent },
            { value: "safety", label: t.safety },
            { value: "privacy", label: t.privacy },
            { value: "other", label: t.other },
          ]}
          onChange={(value) => setReason(value as ReportReason)}
        />
        <TextArea
          label={t.descriptionLabel}
          helperText={t.descriptionHint}
          maxLength={1000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextArea
          label={t.comment}
          helperText={t.commentHint}
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>
    </Modal>
  );
}

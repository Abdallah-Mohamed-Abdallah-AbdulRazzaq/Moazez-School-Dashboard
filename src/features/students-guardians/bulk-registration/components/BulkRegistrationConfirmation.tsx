"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import type { BulkRegistrationBatchDetail } from "../api/bulkRegistrationDtos";

interface BulkRegistrationConfirmationProps {
  batch: BulkRegistrationBatchDetail;
  placementLabel: string;
  fresh: boolean;
  loading: boolean;
  onConfirm: () => void;
}

const copy = {
  en: {
    open: "Confirm registration",
    title: "Create student records?",
    description: (validRows: number, placement: string) =>
      `Create ${validRows} valid rows in ${placement}. The latest batch snapshot is authoritative.`,
    confirm: (validRows: number) => `Create ${validRows} students`,
    cancel: "Cancel",
  },
  ar: {
    open: "تأكيد التسجيل",
    title: "إنشاء سجلات الطلاب؟",
    description: (validRows: number, placement: string) =>
      `سيتم إنشاء ${validRows} صفًا صحيحًا في ${placement}. أحدث حالة للدفعة هي المرجع النهائي.`,
    confirm: (validRows: number) => `إنشاء ${validRows} طالبًا`,
    cancel: "إلغاء",
  },
} as const;

export default function BulkRegistrationConfirmation({
  batch,
  placementLabel,
  fresh,
  loading,
  onConfirm,
}: BulkRegistrationConfirmationProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const [dialogOpen, setDialogOpen] = useState(false);
  const eligible = fresh && batch.status === "READY";

  if (!eligible) return null;

  return (
    <div className="flex justify-end">
      <Button onClick={() => setDialogOpen(true)}>{text.open}</Button>
      <ConfirmDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          onConfirm();
        }}
        title={text.title}
        description={text.description(batch.counters.validRows, placementLabel)}
        confirmLabel={text.confirm(batch.counters.validRows)}
        cancelLabel={text.cancel}
        loading={loading}
        severity="warning"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, RefreshCw, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import RestrictionFormDialog from "@/features/communication/components/safety/RestrictionFormDialog";
import RestrictionsTable from "@/features/communication/components/safety/RestrictionsTable";
import RevokeRestrictionDialog from "@/features/communication/components/safety/RevokeRestrictionDialog";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import {
  useRestrictions,
  type RestrictionFormValues,
} from "@/features/communication/hooks/useRestrictions";
import type { Restriction } from "@/features/communication/types/safety.types";

const labels = {
  en: {
    title: "Restrictions",
    description:
      "Create and manage temporary limits for communication actions by user.",
    refresh: "Refresh",
    newRestriction: "New Restriction",
    loading: "Loading restrictions...",
    errorTitle: "Unable to load restrictions",
    retry: "Retry",
    activeOnly: "Scope",
    activeOnlyValue: "Active only",
    allValue: "All restrictions",
    targetUserId: "Target user",
    targetPlaceholder: "Search users...",
    clear: "Clear",
    emptyTitle: "No restrictions found",
    emptyDescription:
      "Create a restriction or adjust filters to review communication limits.",
    targetUser: "Target user",
    type: "Restriction type",
    reason: "Reason",
    status: "Status",
    expiresAt: "Expires at",
    active: "Active",
    lifted: "Lifted",
    expired: "Expired",
    revoked: "Revoked",
    edit: "Edit",
    revoke: "Revoke",
    unknown: "Unknown",
    createTitle: "Create Restriction",
    editTitle: "Edit Restriction",
    groupCreateDisabled: "Disable group creation",
    messageSendDisabled: "Disable message sending",
    mute: "Mute user",
    readOnly: "Read only",
    directMessageDisabled: "Disable direct messages",
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    targetRequired: "Select a user.",
    reasonRequired: "Enter a reason.",
    revokeTitle: "Revoke restriction",
    revokeDescription:
      "This will remove the selected restriction. Backend policy remains the source of truth for enforcement.",
    created: "Restriction created.",
    updated: "Restriction updated.",
    revokedDone: "Restriction revoked.",
    mutationFailed: "Action failed. Please try again.",
    countLabel: "restriction",
    countLabelPlural: "restrictions",
  },
  ar: {
    title: "القيود",
    description: "أنشئ وأدر قيودا مؤقتة على إجراءات التواصل حسب المستخدم.",
    refresh: "تحديث",
    newRestriction: "قيد جديد",
    loading: "جار تحميل القيود...",
    errorTitle: "تعذر تحميل القيود",
    retry: "إعادة المحاولة",
    activeOnly: "النطاق",
    activeOnlyValue: "النشطة فقط",
    allValue: "كل القيود",
    targetUserId: "المستخدم المستهدف",
    targetPlaceholder: "ابحث عن المستخدمين...",
    clear: "مسح",
    emptyTitle: "لا توجد قيود",
    emptyDescription: "أنشئ قيدا أو عدل عوامل التصفية لمراجعة حدود التواصل.",
    targetUser: "المستخدم المستهدف",
    type: "نوع القيد",
    reason: "السبب",
    status: "الحالة",
    expiresAt: "ينتهي في",
    active: "نشط",
    lifted: "مرفوع",
    expired: "منتهي",
    revoked: "ملغي",
    edit: "تعديل",
    revoke: "إلغاء",
    unknown: "غير معروف",
    createTitle: "إنشاء قيد",
    editTitle: "تعديل القيد",
    groupCreateDisabled: "تعطيل إنشاء المجموعات",
    messageSendDisabled: "تعطيل إرسال الرسائل",
    mute: "كتم المستخدم",
    readOnly: "قراءة فقط",
    directMessageDisabled: "تعطيل الرسائل المباشرة",
    cancel: "إلغاء",
    create: "إنشاء",
    save: "حفظ",
    targetRequired: "اختر مستخدمًا.",
    reasonRequired: "أدخل السبب.",
    revokeTitle: "إلغاء القيد",
    revokeDescription:
      "سيؤدي ذلك إلى إزالة القيد المحدد. تظل الخلفية مصدر الحقيقة لتطبيق السياسات.",
    created: "تم إنشاء القيد.",
    updated: "تم تحديث القيد.",
    revokedDone: "تم إلغاء القيد.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
    countLabel: "قيد",
    countLabelPlural: "قيود",
  },
};

type LocaleKey = keyof typeof labels;

export default function RestrictionsPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const {
    create,
    error,
    filters,
    isLoading,
    isMutating,
    isRefreshing,
    refresh,
    restrictions,
    revoke,
    setFilters,
    total,
    update,
  } = useRestrictions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRestriction, setEditingRestriction] =
    useState<Restriction | null>(null);
  const [revokingRestriction, setRevokingRestriction] =
    useState<Restriction | null>(null);

  const activeOptions = [
    { value: "true", label: t.activeOnlyValue },
    { value: "false", label: t.allValue },
  ];

  const openCreateDialog = () => {
    setEditingRestriction(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: RestrictionFormValues) => {
    try {
      if (editingRestriction) {
        await update(editingRestriction.id, values);
        showSuccess(t.updated);
      } else {
        await create(values);
        showSuccess(t.created);
      }
      setDialogOpen(false);
      setEditingRestriction(null);
    } catch {
      showError(t.mutationFailed);
    }
  };

  const handleRevoke = async () => {
    if (!revokingRestriction) return;
    try {
      await revoke(revokingRestriction.id);
      showSuccess(t.revokedDone);
      setRevokingRestriction(null);
    } catch {
      showError(t.mutationFailed);
    }
  };

  if (isLoading) {
    return <CommunicationLoadingState label={t.loading} />;
  }

  return (
    <div className="space-y-6">
      <CommunicationPageHeader
        title={t.title}
        description={t.description}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              loading={isRefreshing}
              onClick={() => void refresh()}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {t.refresh}
            </Button>
            <Button
              type="button"
              onClick={openCreateDialog}
              leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              {t.newRestriction}
            </Button>
          </>
        }
      />
      <CommunicationTabs />

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <Select
          label={t.activeOnly}
          value={String(filters.activeOnly)}
          options={activeOptions}
          onChange={(value) =>
            setFilters({ ...filters, activeOnly: value === "true" })
          }
        />
        <UserSearchSelect
          label={t.targetUserId}
          placeholder={t.targetPlaceholder}
          value={filters.targetUserId}
          onChange={(targetUserId) => setFilters({ ...filters, targetUserId })}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFilters({ activeOnly: true, targetUserId: "" })}
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
        >
          {t.clear}
        </Button>
      </div>

      {error ? (
        <CommunicationErrorState
          title={t.errorTitle}
          message={error}
          action={
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              {t.retry}
            </Button>
          }
        />
      ) : null}

      <div className="text-sm text-slate-500">
        {total} {total === 1 ? t.countLabel : t.countLabelPlural}
      </div>

      <RestrictionsTable
        restrictions={restrictions}
        disabled={isMutating}
        onEdit={(restriction) => {
          setEditingRestriction(restriction);
          setDialogOpen(true);
        }}
        onRevoke={setRevokingRestriction}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          targetUser: t.targetUser,
          type: t.type,
          reason: t.reason,
          status: t.status,
          expiresAt: t.expiresAt,
          active: t.active,
          lifted: t.lifted,
          expired: t.expired,
          revoked: t.revoked,
          edit: t.edit,
          revoke: t.revoke,
          unknown: t.unknown,
        }}
      />

      {dialogOpen ? (
        <RestrictionFormDialog
          key={editingRestriction?.id ?? "create-restriction"}
          open={dialogOpen}
          restriction={editingRestriction}
          isSubmitting={isMutating}
          onClose={() => {
            setDialogOpen(false);
            setEditingRestriction(null);
          }}
          onSubmit={handleSubmit}
          labels={{
            createTitle: t.createTitle,
            editTitle: t.editTitle,
            targetUserId: t.targetUserId,
            type: t.type,
            groupCreateDisabled: t.groupCreateDisabled,
            messageSendDisabled: t.messageSendDisabled,
            mute: t.mute,
            readOnly: t.readOnly,
            directMessageDisabled: t.directMessageDisabled,
            reason: t.reason,
            expiresAt: t.expiresAt,
            cancel: t.cancel,
            create: t.create,
            save: t.save,
            targetRequired: t.targetRequired,
            reasonRequired: t.reasonRequired,
          }}
        />
      ) : null}

      <RevokeRestrictionDialog
        open={Boolean(revokingRestriction)}
        restriction={revokingRestriction}
        isSubmitting={isMutating}
        onClose={() => setRevokingRestriction(null)}
        onConfirm={handleRevoke}
        labels={{
          title: t.revokeTitle,
          description: t.revokeDescription,
          cancel: t.cancel,
          revoke: t.revoke,
        }}
      />
    </div>
  );
}

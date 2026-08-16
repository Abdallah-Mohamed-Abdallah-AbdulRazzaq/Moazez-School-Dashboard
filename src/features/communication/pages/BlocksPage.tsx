"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, RefreshCw, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import CommunicationPageHeader from "@/features/communication/components/layout/CommunicationPageHeader";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";
import UserSearchSelect from "@/features/communication/components/selectors/UserSearchSelect";
import BlocksTable from "@/features/communication/components/safety/BlocksTable";
import CreateBlockDialog from "@/features/communication/components/safety/CreateBlockDialog";
import DeleteBlockDialog from "@/features/communication/components/safety/DeleteBlockDialog";
import {
  useBlocks,
  type BlockFormValues,
} from "@/features/communication/hooks/useBlocks";
import type { UserBlock } from "@/features/communication/types/safety.types";

const labels = {
  en: {
    title: "Blocks",
    description:
      "View blocked users, create new blocks, and remove blocks when needed.",
    refresh: "Refresh",
    newBlock: "New Block",
    loading: "Loading blocks...",
    errorTitle: "Unable to load blocks",
    retry: "Retry",
    targetUserId: "Target user",
    targetPlaceholder: "Search users...",
    clear: "Clear",
    emptyTitle: "No blocks found",
    emptyDescription:
      "Create a block or adjust the filter to review blocked interactions.",
    targetUser: "Blocked user",
    blockerUser: "Blocked by",
    reason: "Reason",
    reasonPlaceholder: "Optional reason for this block.",
    createdAt: "Created",
    unblock: "Unblock",
    unknown: "Unknown",
    createTitle: "Create Block",
    cancel: "Cancel",
    create: "Create",
    targetRequired: "Select a user.",
    deleteTitle: "Unblock user",
    deleteDescription:
      "This will remove the selected block. Chat interactions still rely on backend policy checks.",
    created: "Block created.",
    deleted: "Block removed.",
    selfBlock: "You cannot block your own user account.",
    mutationFailed: "Action failed. Please try again.",
    countLabel: "block",
    countLabelPlural: "blocks",
  },
  ar: {
    title: "الحظر",
    description: "اعرض المستخدمين المحظورين وأنشئ حظرا جديدا وأزل الحظر عند الحاجة.",
    refresh: "تحديث",
    newBlock: "حظر جديد",
    loading: "جار تحميل الحظر...",
    errorTitle: "تعذر تحميل الحظر",
    retry: "إعادة المحاولة",
    targetUserId: "المستخدم المستهدف",
    targetPlaceholder: "ابحث عن المستخدمين...",
    clear: "مسح",
    emptyTitle: "لا يوجد حظر",
    emptyDescription: "أنشئ حظرا أو عدل المرشح لمراجعة التفاعلات المحظورة.",
    targetUser: "المستخدم المحظور",
    blockerUser: "تم الحظر بواسطة",
    reason: "السبب",
    reasonPlaceholder: "سبب اختياري لهذا الحظر.",
    createdAt: "تاريخ الإنشاء",
    unblock: "إلغاء الحظر",
    unknown: "غير معروف",
    createTitle: "إنشاء حظر",
    cancel: "إلغاء",
    create: "إنشاء",
    targetRequired: "اختر مستخدمًا.",
    deleteTitle: "إلغاء حظر المستخدم",
    deleteDescription:
      "سيؤدي ذلك إلى إزالة الحظر المحدد. تظل تفاعلات المحادثة معتمدة على فحوصات الخلفية.",
    created: "تم إنشاء الحظر.",
    deleted: "تمت إزالة الحظر.",
    selfBlock: "لا يمكنك حظر حسابك نفسه.",
    mutationFailed: "فشل الإجراء. حاول مرة أخرى.",
    countLabel: "حظر",
    countLabelPlural: "حظر",
  },
};

type LocaleKey = keyof typeof labels;

export default function BlocksPage() {
  const locale = useLocale() as LocaleKey;
  const t = labels[locale] ?? labels.en;
  const { showSuccess, showError } = useToast();
  const {
    blocks,
    create,
    error,
    filters,
    isLoading,
    isMutating,
    isRefreshing,
    refresh,
    remove,
    setFilters,
    total,
  } = useBlocks();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<UserBlock | null>(null);

  const handleCreate = async (values: BlockFormValues) => {
    try {
      await create(values);
      showSuccess(t.created);
      setCreateOpen(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error && nextError.message.includes("own user")
          ? t.selfBlock
          : nextError instanceof Error
            ? nextError.message
            : t.mutationFailed;
      showError(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingBlock) return;
    try {
      await remove(deletingBlock.id);
      showSuccess(t.deleted);
      setDeletingBlock(null);
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
              onClick={() => setCreateOpen(true)}
              leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              {t.newBlock}
            </Button>
          </>
        }
      />
      <CommunicationTabs />

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
        <UserSearchSelect
          label={t.targetUserId}
          placeholder={t.targetPlaceholder}
          value={filters.targetUserId}
          onChange={(targetUserId) => setFilters({ targetUserId })}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFilters({ targetUserId: "" })}
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

      <BlocksTable
        blocks={blocks}
        disabled={isMutating}
        onDelete={setDeletingBlock}
        labels={{
          emptyTitle: t.emptyTitle,
          emptyDescription: t.emptyDescription,
          targetUser: t.targetUser,
          blockerUser: t.blockerUser,
          reason: t.reason,
          createdAt: t.createdAt,
          unblock: t.unblock,
          unknown: t.unknown,
        }}
      />

      <CreateBlockDialog
        open={createOpen}
        isSubmitting={isMutating}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        labels={{
          title: t.createTitle,
          targetUserId: t.targetUserId,
          reason: t.reason,
          reasonPlaceholder: t.reasonPlaceholder,
          cancel: t.cancel,
          create: t.create,
          targetRequired: t.targetRequired,
        }}
      />

      <DeleteBlockDialog
        open={Boolean(deletingBlock)}
        block={deletingBlock}
        isSubmitting={isMutating}
        onClose={() => setDeletingBlock(null)}
        onConfirm={handleDelete}
        labels={{
          title: t.deleteTitle,
          description: t.deleteDescription,
          cancel: t.cancel,
          unblock: t.unblock,
        }}
      />
    </div>
  );
}

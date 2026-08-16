"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { AccessDenied, Button, EmptyState } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import EditTeacherDialog from "@/features/teachers/components/EditTeacherDialog";
import EmploymentTransitionDialog from "@/features/teachers/components/EmploymentTransitionDialog";
import EmploymentTransitionResultDialog from "@/features/teachers/components/EmploymentTransitionResultDialog";
import TeacherDetailHeader from "@/features/teachers/components/TeacherDetailHeader";
import TeacherDetailSections from "@/features/teachers/components/TeacherDetailSections";
import TeacherCredentialCard from "@/features/teachers/components/TeacherCredentialCard";
import TeacherActionErrorAlert from "@/features/teachers/components/TeacherActionErrorAlert";
import { useTeacherActions } from "@/features/teachers/hooks/useTeacherActions";
import { useTeacherDetail } from "@/features/teachers/hooks/useTeacherDetail";
import { getAllowedTransitions } from "@/features/teachers/utils/employmentTransitions";
import { toTeacherUiError, type TeacherUiError } from "@/features/teachers/utils/teacherErrors";
import type {
  ChangeTeacherEmploymentStatusRequest,
  TeacherEmploymentStatus,
  TeacherEmploymentStatusResponse,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";
import { usePermissions } from "@/hooks/usePermissions";

export default function TeacherDetailPage({ teacherId }: { teacherId: string }) {
  const locale = useLocale();
  const t = useTranslations("teachers");
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const permissions = usePermissions();
  const canView = permissions.hasPermission("teachers.records.view");
  const canManage = permissions.hasPermission("teachers.records.manage");
  const canManageCredentials = permissions.hasPermission("settings.users.manage");
  const detail = useTeacherDetail(teacherId, permissions.isPermissionsReady && canView);
  const actions = useTeacherActions();
  const [showEdit, setShowEdit] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TeacherEmploymentStatus | null>(null);
  const [transitionResponse, setTransitionResponse] = useState<TeacherEmploymentStatusResponse | null>(null);
  const [actionError, setActionError] = useState<TeacherUiError | null>(null);

  if (permissions.isLoading || detail.isLoading) return <MainLoader />;
  if (!canView) return <AccessDenied />;

  const loadError = detail.error ? toTeacherUiError(detail.error) : null;
  if (loadError?.code === "teachers.profile.not_found") {
    return <EmptyState title={t("not_found.title")} message={t("not_found.description")} action={<Button onClick={() => router.push(`/${locale}/teachers`)}>{t("actions.back_to_list")}</Button>} />;
  }
  if (loadError || !detail.teacher) {
    return <EmptyState title={t("states.error_title")} message={loadError?.message ?? t("messages.load_failed")} action={<Button onClick={() => void detail.refresh()}>{t("states.retry")}</Button>} />;
  }

  const teacher = detail.teacher;
  const actionErrorMessage = (error: TeacherUiError) =>
    error.identityIntegrityConflict
      ? t("errors.identity_inconsistent")
      : error.message;
  const updateTeacher = async (input: UpdateTeacherRequest) => {
    const updatedTeacher = await actions.updateTeacher(teacher.id, input);
    detail.replaceTeacher(updatedTeacher);
    setShowEdit(false);
    showSuccess(t("messages.update_success"));
  };
  const changeEmployment = async (input: ChangeTeacherEmploymentStatusRequest) => {
    setActionError(null);
    try {
      const response = await actions.changeEmploymentStatus(teacher.id, input);
      detail.replaceTeacher(response.teacher);
      setTargetStatus(null);
      setTransitionResponse(response);
      showSuccess(t("messages.status_update_success"));
    } catch (transitionError) {
      const uiError = toTeacherUiError(transitionError);
      setActionError(uiError);
      if (uiError.shouldRefresh) {
        setTargetStatus(null);
        await detail.refresh();
      }
      showError(actionErrorMessage(uiError));
    }
  };
  return (
    <main className="min-h-0 flex-1 overflow-x-hidden p-4 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/${locale}/teachers`} className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="h-4 w-4" />{t("actions.back_to_list")}</Link>
          {canManage ? <div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setShowEdit(true)}>{t("actions.edit")}</Button>{teacher.employmentStatus === "ACTIVE" ? <Button variant="secondary" onClick={() => setTargetStatus("INACTIVE")}>{t("actions.disable_account")}</Button> : null}{getAllowedTransitions(teacher.employmentStatus).filter((status) => status !== "INACTIVE").map((status) => <Button key={status} variant={status === "TERMINATED" ? "danger" : "secondary"} onClick={() => setTargetStatus(status)}>{t(`lifecycle.actions.${status.toLowerCase()}`)}</Button>)}</div> : null}
        </div>
        <TeacherActionErrorAlert error={actionError} />
        <TeacherDetailHeader teacher={teacher} />
        <TeacherCredentialCard teacher={teacher} canManage={canManageCredentials} onChanged={detail.refresh} />
        <TeacherDetailSections teacher={teacher} />
      </div>
      {showEdit ? <EditTeacherDialog isOpen teacher={teacher} isSubmitting={actions.activeAction === "update"} onClose={() => setShowEdit(false)} onSubmit={updateTeacher} /> : null}
      {targetStatus ? <EmploymentTransitionDialog isOpen teacher={teacher} targetStatus={targetStatus} isSubmitting={actions.activeAction === "employment"} onClose={() => setTargetStatus(null)} onSubmit={changeEmployment} /> : null}
      <EmploymentTransitionResultDialog response={transitionResponse} onClose={() => setTransitionResponse(null)} />
    </main>
  );
}

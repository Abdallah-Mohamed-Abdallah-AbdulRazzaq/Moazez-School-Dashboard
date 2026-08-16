"use client";

import { ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTaskForm from "../components/ReinforcementTaskForm";
import { createReinforcementTask } from "../services/reinforcementTasksService";
import type { CreateReinforcementTaskPayload } from "../types";

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReinforcementTaskCreatePage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("reinforcement.tasks.manage");

  const handleSubmit = async (payload: CreateReinforcementTaskPayload) => {
    try {
      const task = await createReinforcementTask(payload);
      showSuccess(t("tasks.messages.created"));
      router.push(`/${locale}/reinforcement/tasks/${task.id}`);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canManage) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50">
      <ReinforcementPageHeader
        title={t("tasks.createTitle")}
        description={t("tasks.createDescription")}
      />
      <ReinforcementTaskForm onSubmit={handleSubmit} />
    </div>
  );
}

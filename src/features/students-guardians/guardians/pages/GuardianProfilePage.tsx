// FILE: src/components/students-guardians/GuardianProfilePage.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Phone,
  Mail,
  Star,
  Lock,
  Edit,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import OverviewTab from "@/features/students-guardians/guardians/components/tabs/OverviewTab";
import StudentsTab from "@/features/students-guardians/guardians/components/tabs/StudentsTab";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import GuardianAccountLinkModal from "@/features/students-guardians/guardians/components/GuardianAccountLinkModal";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

interface GuardianProfilePageProps {
  guardianId: string;
}

type TabKey = "overview" | "students" | "documents" | "notes" | "timeline";

type GuardianEditForm = {
  full_name: string;
  relation: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  national_id: string;
  job_title: string;
  workplace: string;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
};

const tabs = [
  { key: "overview" as TabKey, labelKey: "tabs.overview", icon: User },
  { key: "students" as TabKey, labelKey: "tabs.students", icon: Users },
];

const getRelationColor = (relation: string) => {
  const colors: Record<string, string> = {
    father: "bg-blue-100 text-blue-700",
    mother: "bg-pink-100 text-pink-700",
    guardian: "bg-purple-100 text-purple-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colors[relation.toLowerCase()] || colors.other;
};

const buildGuardianEditForm = (guardian: StudentGuardian): GuardianEditForm => ({
  full_name: guardian.full_name || "",
  relation: guardian.relation || "",
  phone_primary: guardian.phone_primary || "",
  phone_secondary: guardian.phone_secondary || "",
  email: guardian.email || "",
  national_id: guardian.national_id || "",
  job_title: guardian.job_title || "",
  workplace: guardian.workplace || "",
  is_primary: Boolean(guardian.is_primary),
  can_pickup: Boolean(guardian.can_pickup),
  can_receive_notifications: Boolean(guardian.can_receive_notifications),
});

export default function GuardianProfilePage({
  guardianId,
}: GuardianProfilePageProps) {
  const t = useTranslations("students_guardians.guardian_profile");
  const locale = useLocale();
  const router = useRouter();
  const permissions = usePermissions();
  const { canLinkGuardianAccount, canManageGuardians } =
    getStudentsGuardiansCapabilities(permissions);
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [guardian, setGuardian] = useState<StudentGuardian | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<GuardianEditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      try {
        const guardianData = await studentsService.fetchGuardianById(guardianId);
        if (!isCancelled) {
          setGuardian(guardianData ?? null);
          setLoadError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setGuardian(null);
          setLoadError(
            error instanceof Error ? error.message : t("guardian_not_found"),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [guardianId, t]);

  if (isLoading) {
    return <MainLoader />;
  }

  if (!guardian) {
    return (
      <div className="p-6">
        <EmptyState
          message={loadError || t("guardian_not_found")}
          action={<Button type="button" onClick={() => router.push(`/${lang}/students-guardians/guardians`)}>{t("back_to_guardians")}</Button>}
          className="bg-white rounded-xl"
        />
      </div>
    );
  }

  const openEditModal = () => {
    if (!canManageGuardians) {
      return;
    }

    setEditForm(buildGuardianEditForm(guardian));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSavingEdit) {
      return;
    }
    setIsEditModalOpen(false);
    setEditForm(null);
    setEditError(null);
  };

  const updateEditForm = <Key extends keyof GuardianEditForm>(
    key: Key,
    value: GuardianEditForm[Key],
  ) => {
    setEditForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  };

  const saveGuardianEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageGuardians || !editForm) {
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const updatedGuardian = await studentsService.updateGuardian(
        guardian.guardianId,
        editForm,
      );
      setGuardian((current) =>
        current ? { ...current, ...updatedGuardian } : updatedGuardian,
      );
      setIsEditModalOpen(false);
      setEditForm(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : t("loading_error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 sm:p-6">
          {/* Back Button */}
          <Button type="button" variant="ghost"
            onClick={() => router.push(`/${lang}/students-guardians/guardians`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            {locale === "ar" ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {t("back_to_guardians")}
            </span>
          </Button>

          {/* Guardian Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary to-hover flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {guardian.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {guardian.full_name}
                </h1>
                <div className="flex items-center gap-2">
                  {guardian.is_primary && (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  )}
                  <span
                    className={`w-fit inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRelationColor(guardian.relation)}`}
                  >
                    {guardian.relation.charAt(0).toUpperCase() +
                      guardian.relation.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{t("guardian_id")}:</span>{" "}
                  {guardian.guardianId}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {guardian.phone_primary}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {guardian.email}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<Edit className="h-4 w-4" />}
                onClick={openEditModal}
                disabled={!canManageGuardians}
              >
                {t("actions.edit")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                leftIcon={<Lock className="h-4 w-4" />}
                disabled={!canLinkGuardianAccount}
                title={
                  canLinkGuardianAccount
                    ? t("account_linking.action")
                    : t("account_linking.manage_required")
                }
                onClick={() => setIsAccountModalOpen(true)}
              >
                {t("account_linking.action")}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button type="button" variant="ghost"
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.labelKey)}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === "overview" && <OverviewTab guardian={guardian} />}
        {activeTab === "students" && <StudentsTab guardian={guardian} />}
      </div>
      <GuardianAccountLinkModal
        isOpen={isAccountModalOpen}
        guardian={guardian}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={t("actions.edit")}
        size="lg"
        closeOnEscape={!isSavingEdit}
        closeOnOverlayClick={!isSavingEdit}
        showCloseButton={!isSavingEdit}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeEditModal}
              disabled={isSavingEdit}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              form="guardian-profile-edit-form"
              loading={isSavingEdit}
            >
              {t("actions.save")}
            </Button>
          </>
        }
      >
        {editForm && (
          <form
            id="guardian-profile-edit-form"
            onSubmit={saveGuardianEdit}
            className="space-y-4 pb-4"
          >
            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={t("fields.full_name")}
                value={editForm.full_name}
                onChange={(event) =>
                  updateEditForm("full_name", event.target.value)
                }
                required
              />
              <Input
                label={t("fields.relation")}
                value={editForm.relation}
                onChange={(event) =>
                  updateEditForm("relation", event.target.value)
                }
                required
              />
              <Input
                label={t("fields.primary_phone")}
                type="tel"
                value={editForm.phone_primary}
                onChange={(event) =>
                  updateEditForm("phone_primary", event.target.value)
                }
                required
              />
              <Input
                label={t("fields.secondary_phone")}
                type="tel"
                value={editForm.phone_secondary}
                onChange={(event) =>
                  updateEditForm("phone_secondary", event.target.value)
                }
              />
              <Input
                label={t("fields.email")}
                type="email"
                value={editForm.email}
                onChange={(event) => updateEditForm("email", event.target.value)}
              />
              <Input
                label={t("fields.national_id")}
                value={editForm.national_id}
                onChange={(event) =>
                  updateEditForm("national_id", event.target.value)
                }
              />
              <Input
                label={t("fields.job_title")}
                value={editForm.job_title}
                onChange={(event) =>
                  updateEditForm("job_title", event.target.value)
                }
              />
              <Input
                label={t("fields.workplace")}
                value={editForm.workplace}
                onChange={(event) =>
                  updateEditForm("workplace", event.target.value)
                }
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.is_primary}
                  onChange={(event) =>
                    updateEditForm("is_primary", event.target.checked)
                  }
                />
                {t("fields.primary_guardian")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.can_pickup}
                  onChange={(event) =>
                    updateEditForm("can_pickup", event.target.checked)
                  }
                />
                {t("fields.can_pickup")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.can_receive_notifications}
                  onChange={(event) =>
                    updateEditForm(
                      "can_receive_notifications",
                      event.target.checked,
                    )
                  }
                />
                {t("fields.can_receive_notifications")}
              </label>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

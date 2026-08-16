"use client";

import { useState, useEffect } from "react";
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
  Edit,
} from "lucide-react";
import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import { useSectionTabs } from "@/hooks/useSectionTabs";
import { buildLocalePath } from "@/lib/routing/localePath";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import { GuardianProfileProvider } from "@/features/students-guardians/guardians/context/GuardianProfileContext";
import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";

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
  { key: "overview", labelKey: "tabs.overview", icon: User },
  { key: "students", labelKey: "tabs.students", icon: Users },
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

export default function GuardianProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentsGuardiansPermissionGuard permissions={["students.guardians.view"]}>
      <GuardianProfileLayoutContent>{children}</GuardianProfileLayoutContent>
    </StudentsGuardiansPermissionGuard>
  );
}

function GuardianProfileLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations("students_guardians.guardian_profile");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const permissions = usePermissions();
  const { canManageGuardians } =
    getStudentsGuardiansCapabilities(permissions);
  const lang = (params.lang as string) || "en";

  const { activeTab, entityId: guardianId, handleTabClick } = useSectionTabs({
    basePath: ["students-guardians", "guardians"],
    idParam: "guardianId",
    tabs,
  });

  const [guardian, setGuardian] = useState<StudentGuardian | null>(null);
  const [isLoadingGuardian, setIsLoadingGuardian] = useState(true);
  const [guardianLoadError, setGuardianLoadError] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<GuardianEditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadGuardian = async () => {
      try {
        setIsLoadingGuardian(true);
        setGuardianLoadError(false);
        const data = await studentsService.fetchGuardianById(guardianId);
        if (mounted) {
          if (!data) {
            setGuardianLoadError(true);
          } else {
            setGuardian(data);
          }
        }
      } catch {
        if (mounted) {
          setGuardianLoadError(true);
        }
      } finally {
        if (mounted) {
          setIsLoadingGuardian(false);
        }
      }
    };

    if (guardianId) {
      loadGuardian();
    }

    return () => {
      mounted = false;
    };
  }, [guardianId]);

  const openEditModal = () => {
    if (!canManageGuardians || !guardian) return;
    setEditForm(buildGuardianEditForm(guardian));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSavingEdit) return;
    setIsEditModalOpen(false);
    setEditForm(null);
    setEditError(null);
  };

  const updateEditForm = <Key extends keyof GuardianEditForm>(
    key: Key,
    value: GuardianEditForm[Key],
  ) => {
    setEditForm((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const saveGuardianEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageGuardians || !editForm || !guardian) return;

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

  if (isLoadingGuardian) {
    return (
      <div className="p-6 flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#036b80]"></div>
      </div>
    );
  }

  if (guardianLoadError || !guardian) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">{t("guardian_not_found")}</p>
          <button
            onClick={() => router.push(buildLocalePath(lang, "students-guardians", "guardians"))}
            className="mt-4 text-[#036b80] hover:underline"
          >
            {t("back_to_guardians")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <GuardianProfileProvider guardian={guardian}>
      <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(buildLocalePath(lang, "students-guardians", "guardians"))}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          {locale === "ar" ? (
            <ArrowRight className="w-5 h-5" />
          ) : (
            <ArrowLeft className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{t("back_to_guardians")}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#036b80] to-[#024d5c] flex items-center justify-center text-white font-bold text-xl shrink-0">
              {guardian.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {guardian.full_name}
                </h1>
                {guardian.is_primary && (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
                <span>
                  {t("guardian_id")}: {guardian.guardianId}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRelationColor(guardian.relation)}`}
                >
                  {guardian.relation.charAt(0).toUpperCase() +
                    guardian.relation.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{guardian.phone_primary}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{guardian.email}</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Edit className="h-4 w-4" />}
            onClick={openEditModal}
            disabled={!canManageGuardians}
          >
            {t("actions.edit")}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-[#036b80] text-[#036b80]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>

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
              form="guardian-route-edit-form"
              loading={isSavingEdit}
            >
              {t("actions.save")}
            </Button>
          </>
        }
      >
        {editForm && (
          <form
            id="guardian-route-edit-form"
            onSubmit={saveGuardianEdit}
            className="space-y-4 pb-4"
          >
            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label={t("fields.full_name")} value={editForm.full_name} onChange={(event) => updateEditForm("full_name", event.target.value)} required />
              <Input label={t("fields.relation")} value={editForm.relation} onChange={(event) => updateEditForm("relation", event.target.value)} required />
              <Input type="tel" label={t("fields.primary_phone")} value={editForm.phone_primary} onChange={(event) => updateEditForm("phone_primary", event.target.value)} required />
              <Input type="tel" label={t("fields.secondary_phone")} value={editForm.phone_secondary} onChange={(event) => updateEditForm("phone_secondary", event.target.value)} />
              <Input label={t("fields.email")} type="email" value={editForm.email} onChange={(event) => updateEditForm("email", event.target.value)} />
              <Input label={t("fields.national_id")} value={editForm.national_id} onChange={(event) => updateEditForm("national_id", event.target.value)} />
              <Input label={t("fields.job_title")} value={editForm.job_title} onChange={(event) => updateEditForm("job_title", event.target.value)} />
              <Input label={t("fields.workplace")} value={editForm.workplace} onChange={(event) => updateEditForm("workplace", event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editForm.is_primary} onChange={(event) => updateEditForm("is_primary", event.target.checked)} />
                {t("fields.primary_guardian")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editForm.can_pickup} onChange={(event) => updateEditForm("can_pickup", event.target.checked)} />
                {t("fields.can_pickup")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editForm.can_receive_notifications} onChange={(event) => updateEditForm("can_receive_notifications", event.target.checked)} />
                {t("fields.can_receive_notifications")}
              </label>
            </div>
          </form>
        )}
      </Modal>
      </div>
    </GuardianProfileProvider>
  );
}

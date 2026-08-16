// FILE: src/components/leads/LeadDetails.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  ArrowRight,
  Edit,
} from "lucide-react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";
import CreateLeadModal from "@/features/admissions/leads/components/CreateLeadModal";
import ApplicationCreateStepper from "@/features/admissions/applications/components/ApplicationCreateStepper";
import { Button } from "@/components/ui";
import {
  fetchLeadById,
  updateLead,
} from "@/features/admissions/leads/services/leadsApiService";
import { Lead } from "@/features/admissions/types/leads";
import type {
  UpdateLeadPayload,
} from "@/features/admissions/leads/types/lead";
import {
  mapLeadChannelToApplicationSource,
  type ApplicationCreationPayload,
} from "@/features/admissions/applications/services/applicationCreationService";
import { createApplicationIntake } from "@/features/admissions/applications/services/applicationIntakeService";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";

interface LeadDetailsProps {
  leadId: string;
}

export default function LeadDetails({ leadId }: LeadDetailsProps) {
  const router = useRouter();
  const t = useTranslations("admissions.lead_details");
  const t_leads = useTranslations("admissions.leads");
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewLeads = hasPermission("admissions.leads.view");
  const canManageLeads = hasPermission("admissions.leads.manage");
  const canManageApplications = hasPermission("admissions.applications.manage");
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateApplicationOpen, setIsCreateApplicationOpen] = useState(false);
  const [creationRecovery, setCreationRecovery] = useState<{
    applicationId: string;
    failedDocuments: string[];
    conversionFailed: boolean;
  } | null>(null);

  const loadLead = useCallback(async () => {
    if (!canViewLeads) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const foundLead = await fetchLeadById(leadId);
      setLead(foundLead);
    } catch (err) {
      console.error("Failed to load lead:", err);
      showToast("Lead not found", "error");
      router.push(`/${locale}/admissions/leads`);
    } finally {
      setIsLoading(false);
    }
  }, [canViewLeads, leadId, router, locale, showToast]);

  useEffect(() => {
    void Promise.resolve().then(loadLead);
  }, [loadLead]);

  if (!canViewLeads) {
    return <AdmissionsAccessDenied />;
  }

  if (isLoading || !lead) {
    return <MainLoader />;
  }

  const displayName = lead.studentName || lead.primaryContactName || lead.name || "";

  const handleConvertToApplication = () => {
    setIsCreateApplicationOpen(true);
  };

  const handleCreateApplicationFromLead = async (
    data: ApplicationCreationPayload,
  ) => {
    try {
      const intakeOutcome = await createApplicationIntake({
        ...data,
        leadId: lead.id,
        source: mapLeadChannelToApplicationSource(lead.channel),
      });
      setIsCreateApplicationOpen(false);

      if (intakeOutcome.failedDocumentLabels.length > 0) {
        setCreationRecovery({
          applicationId: intakeOutcome.application.id,
          failedDocuments: intakeOutcome.failedDocumentLabels,
          conversionFailed: false,
        });
        return;
      }

      try {
        await updateLead(lead.id, { status: "Converted" });
      } catch (conversionError) {
        console.error("Failed to convert lead after application creation:", conversionError);
        setCreationRecovery({
          applicationId: intakeOutcome.application.id,
          failedDocuments: [],
          conversionFailed: true,
        });
        return;
      }

      setCreationRecovery(null);
      showToast(t("marked_converted"), "success");
      router.push(
        `/${locale}/admissions/applications/${intakeOutcome.application.id}`,
      );
    } catch (err) {
      console.error("Failed to create application from lead:", err);
      showToast(t("mark_converted_failed"), "error");
    }
  };

  const handleUpdateLead = async (data: UpdateLeadPayload) => {
    try {
      const updatedLead = await updateLead(lead.id, data);
      setLead(updatedLead);
      showToast(t_leads("lead_updated"), "success");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update lead:", err);
      showToast(t_leads("update_failed"), "error");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          type="button"
          onClick={() => router.push(`/${locale}/admissions/leads`)}
          variant="ghost"
          size="sm"
          className="p-2"
          title={t("back_to_leads")}
          aria-label={t("back_to_leads")}
        >
          {locale === "ar" ? (
            <ArrowRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          )}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
        </div>
        <LeadStatusBadge status={lead.status} size="md" />
      </div>

      {creationRecovery && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{t_leads("partial_creation.title")}</p>
          <p className="mt-1">
            {creationRecovery.conversionFailed
              ? t_leads("partial_creation.conversion_failed")
              : t_leads("partial_creation.documents_failed", {
                  documents: creationRecovery.failedDocuments.join(", "),
                })}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              router.push(
                `/${locale}/admissions/applications/${creationRecovery.applicationId}/documents`,
              )
            }
          >
            {t_leads("partial_creation.open_documents")}
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {canManageLeads && <div className="px-6 pt-4 flex items-center justify-end">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              size="sm"
              leftIcon={<Edit className="h-4 w-4" />}
            >
              {t_leads("edit")}
            </Button>
            {canManageApplications && (
              <Button
                type="button"
                onClick={handleConvertToApplication}
                size="sm"
              >
                {t("mark_converted")}
              </Button>
            )}
          </div>
        </div>}

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
              <section className="h-full rounded-lg border border-purple-200 bg-linear-to-br from-purple-50 to-purple-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  {t("guardian_parent_contact")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      {t("guardian_name")}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.primaryContactName || displayName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {t("phone")}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {lead.phone}
                    </p>
                  </div>
                  {lead.email && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {t("email")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {lead.email}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="h-full rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t("lead_details")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{t("status")}</p>
                    <div className="mt-1">
                      <LeadStatusBadge status={lead.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("channel")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const channelMap: Record<string, string> = {
                          "In-app": "in_app",
                          Referral: "referral",
                          "Walk-in": "walk_in",
                          Other: "other",
                        };
                        const translationKey =
                          channelMap[lead.channel] || "other";
                        return t_leads(translationKey);
                      })()}
                    </p>
                  </div>
                  {lead.studentName && (
                    <div>
                      <p className="text-xs text-gray-500">
                        {t_leads("student_name")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.studentName}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {t("created")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </section>
          </div>
        </div>
      </div>

      {canManageLeads && <CreateLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateLead}
        initialLead={lead}
        mode="update"
      />}
      {canManageLeads && canManageApplications && <ApplicationCreateStepper
        lead={lead}
        isOpen={isCreateApplicationOpen}
        onClose={() => setIsCreateApplicationOpen(false)}
        onSubmit={handleCreateApplicationFromLead}
      />}
    </div>
  );
}

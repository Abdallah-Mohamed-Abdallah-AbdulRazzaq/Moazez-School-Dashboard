"use client";

import { useTranslations } from "next-intl";
import { User, Phone, Mail, Briefcase } from "lucide-react";
import { Application } from "@/features/admissions/types/admissions";
import type { Guardian } from "@/features/admissions/applications/types/guardian";

interface GuardiansTabProps {
  application: Application;
  guardians?: Guardian[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function GuardiansTab({
  application,
  guardians,
  isLoading = false,
  error = null,
  onRetry,
}: GuardiansTabProps) {
  const t = useTranslations("admissions.application360");
  const displayGuardians = guardians ?? application.guardians ?? [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{t("guardians.title")}</h3>
      {isLoading ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          {t("guardians.loading")}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
            >
              {t("guardians.retry")}
            </button>
          ) : null}
        </div>
      ) : displayGuardians.length > 0 ? (
        <div className="space-y-4">
          {displayGuardians.map((guardian, index) => (
            <div
              key={guardian.id || index}
              className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {guardian.full_name}
                    {guardian.is_primary && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                        {t("guardians.primary")}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {guardian.relation}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />{" "}
                      {t("guardians.primary_phone")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {guardian.phone_primary}
                    </p>
                  </div>
                  {guardian.phone_secondary && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{" "}
                        {t("guardians.secondary_phone")}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {guardian.phone_secondary}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {t("guardians.email")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {guardian.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("guardians.national_id")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {guardian.national_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />{" "}
                      {t("guardians.job_title")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {guardian.job_title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("guardians.workplace")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {guardian.workplace}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t("guardians.permissions")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {guardian.can_pickup && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {t("guardians.can_pickup")}
                        </span>
                      )}
                      {guardian.can_receive_notifications && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {t("guardians.receives_notifications")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600">
            {t("guardians.empty")}
          </p>
        </div>
      )}
    </div>
  );
}

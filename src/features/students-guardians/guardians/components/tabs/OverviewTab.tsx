// FILE: src/components/students-guardians/guardian-tabs/OverviewTab.tsx

"use client";

import { useTranslations } from "next-intl";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
} from "lucide-react";
import type { StudentGuardian } from "@/features/students-guardians/students/types";

interface OverviewTabProps {
  guardian: StudentGuardian;
}

export default function OverviewTab({ guardian }: OverviewTabProps) {
  const t = useTranslations("students_guardians.guardian_profile");

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          {t("sections.personal_info")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            label={t("fields.full_name")}
            value={guardian.full_name}
            icon={User}
          />
          <InfoItem
            label={t("fields.national_id")}
            value={guardian.national_id}
            icon={FileText}
          />
          <InfoItem
            label={t("fields.relation")}
            value={
              guardian.relation.charAt(0).toUpperCase() +
              guardian.relation.slice(1)
            }
            icon={User}
          />
          <InfoItem
            label={t("fields.primary_guardian")}
            value={guardian.is_primary ? t("yes") : t("no")}
            icon={guardian.is_primary ? CheckCircle : XCircle}
            valueColor={
              guardian.is_primary ? "text-green-600" : "text-gray-600"
            }
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          {t("sections.contact_info")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            label={t("fields.primary_phone")}
            value={guardian.phone_primary}
            icon={Phone}
          />
          <InfoItem
            label={t("fields.secondary_phone")}
            value={guardian.phone_secondary || t("not_provided")}
            icon={Phone}
          />
          <InfoItem
            label={t("fields.email")}
            value={guardian.email}
            icon={Mail}
          />
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          {t("sections.professional_info")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            label={t("fields.job_title")}
            value={guardian.job_title || t("not_provided")}
            icon={Briefcase}
          />
          <InfoItem
            label={t("fields.workplace")}
            value={guardian.workplace || t("not_provided")}
            icon={Briefcase}
          />
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {t("sections.permissions")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PermissionItem
            label={t("fields.can_pickup")}
            value={guardian.can_pickup}
          />
          <PermissionItem
            label={t("fields.can_receive_notifications")}
            value={guardian.can_receive_notifications}
          />
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
  icon: React.ElementType;
  valueColor?: string;
}

function InfoItem({ label, value, icon: Icon, valueColor }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`font-medium ${valueColor || "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface PermissionItemProps {
  label: string;
  value: boolean;
}

function PermissionItem({ label, value }: PermissionItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Yes</span>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">No</span>
          </>
        )}
      </div>
    </div>
  );
}

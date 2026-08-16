"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Input, Select } from "@/components/ui/input";

interface Guardian {
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
}

interface GuardianInfoStepProps {
  guardians: Guardian[];
  guardianErrors: Record<string, string>[];
  updateGuardian: (index: number, field: string, value: unknown) => void;
  addGuardian: () => void;
  removeGuardian: (index: number) => void;
  setGuardians: (guardians: Guardian[]) => void;
  setGuardianErrors: (errors: Record<string, string>[]) => void;
}

export default function GuardianInfoStep({
  guardians,
  guardianErrors,
  updateGuardian,
  addGuardian,
  removeGuardian,
  setGuardians,
  setGuardianErrors,
}: GuardianInfoStepProps) {
  const t = useTranslations("admissions.create_application");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("guardian.title")}</h3>
        <button
          type="button"
          onClick={addGuardian}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("buttons.add_guardian")}
        </button>
      </div>

      {guardians.map((guardian, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">
              {t("guardian.title")} {index + 1}
              {guardian.is_primary && (
                <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                  {t("guardian.is_primary")}
                </span>
              )}
            </h4>
            {guardians.length > 1 && (
              <button
                type="button"
                onClick={() => removeGuardian(index)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                {t("buttons.remove_guardian")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("guardian.full_name")}
              value={guardian.full_name}
              onChange={(e) =>
                updateGuardian(index, "full_name", e.target.value)
              }
              error={guardianErrors[index]?.full_name}
              placeholder={t("guardian.full_name_placeholder")}
              required
            />
            <Select
              label={t("guardian.relation")}
              value={guardian.relation}
              onChange={(value) => updateGuardian(index, "relation", value)}
              options={[
                { value: "father", label: t("guardian.father") },
                { value: "mother", label: t("guardian.mother") },
                { value: "guardian", label: t("guardian.other") },
              ]}
              required
            />
            <Input
              label={t("guardian.phone_primary")}
              type="tel"
              value={guardian.phone_primary}
              onChange={(e) =>
                updateGuardian(index, "phone_primary", e.target.value)
              }
              error={guardianErrors[index]?.phone_primary}
              placeholder={t("guardian.phone_primary_placeholder")}
              required
            />
            <Input
              label={t("guardian.phone_secondary")}
              type="tel"
              value={guardian.phone_secondary}
              onChange={(e) =>
                updateGuardian(index, "phone_secondary", e.target.value)
              }
              error={guardianErrors[index]?.phone_secondary}
              placeholder={t("guardian.phone_primary_placeholder")}
            />
            <Input
              label={t("guardian.email")}
              type="email"
              value={guardian.email}
              onChange={(e) => updateGuardian(index, "email", e.target.value)}
              error={guardianErrors[index]?.email}
              placeholder={t("guardian.email_placeholder")}
              required
            />
            <Input
              label={t("guardian.national_id")}
              value={guardian.national_id}
              onChange={(e) =>
                updateGuardian(index, "national_id", e.target.value)
              }
              placeholder={t("guardian.national_id_placeholder")}
            />
            <Input
              label={t("guardian.job_title")}
              value={guardian.job_title}
              onChange={(e) =>
                updateGuardian(index, "job_title", e.target.value)
              }
              placeholder={t("guardian.job_title_placeholder")}
            />
            <Input
              label={t("guardian.workplace")}
              value={guardian.workplace}
              onChange={(e) =>
                updateGuardian(index, "workplace", e.target.value)
              }
              placeholder={t("guardian.workplace_placeholder")}
            />
          </div>

          {/* Guardian Permissions */}
          <div className="border-t border-gray-200 pt-4">
            <h5 className="font-medium text-gray-900 mb-3 text-sm">
              {t("guardian.permissions")}
            </h5>
            {guardianErrors[index]?.is_primary && (
              <div className="flex items-center gap-1 mb-2 text-red-600 text-xs bg-red-50 p-2 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>{guardianErrors[index].is_primary}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardian.is_primary}
                  onChange={(e) => {
                    // If setting as primary, unset all others
                    if (e.target.checked) {
                      const updatedGuardians = guardians.map((g, i) => ({
                        ...g,
                        is_primary: i === index,
                      }));
                      setGuardians(updatedGuardians);
                      // Clear primary error
                      const newErrors = [...guardianErrors];
                      guardians.forEach((_, i) => {
                        if (newErrors[i]?.is_primary) {
                          delete newErrors[i].is_primary;
                        }
                      });
                      setGuardianErrors(newErrors);
                    } else {
                      updateGuardian(index, "is_primary", false);
                    }
                  }}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  {t("guardian.is_primary")}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardian.can_pickup}
                  onChange={(e) =>
                    updateGuardian(index, "can_pickup", e.target.checked)
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  {t("guardian.can_pickup")}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardian.can_receive_notifications}
                  onChange={(e) =>
                    updateGuardian(
                      index,
                      "can_receive_notifications",
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  {t("guardian.can_receive_notifications")}
                </span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// FILE: src/components/students-guardians/profile-tabs/WithdrawalTab.tsx

"use client";

import { LogOut, AlertTriangle, User } from "lucide-react";
import { Student } from "@/features/students-guardians/students/types";
import { useTranslations } from "next-intl";

interface WithdrawalTabProps {
  student: Student;
}

export default function WithdrawalTab({ student }: WithdrawalTabProps) {
  const t = useTranslations("students_guardians.profile.withdrawal");

  const isWithdrawn = student.status === "Withdrawn";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        {/* Status */}
        {isWithdrawn ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">
                {t("student_withdrawn")}
              </p>
              <p className="text-sm text-red-700">{t("withdrawn_message")}</p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <User className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">
                {t("student_active")}
              </p>
              <p className="text-sm text-green-700">{t("active_message")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Information (if withdrawn) */}
      {isWithdrawn ? (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {t("withdrawal_details")}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("withdrawal_date")}
                </label>
                <p className="text-sm text-gray-900">{t("not_available")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("withdrawal_reason")}
                </label>
                <p className="text-sm text-gray-900">{t("not_available")}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("notes")}
              </label>
              <p className="text-sm text-gray-900">{t("no_notes")}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State for Active Students */
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("no_withdrawal")}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {t("no_withdrawal_desc")}
          </p>
        </div>
      )}

      {/* Withdrawal History Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {t("withdrawal_history")}
        </h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{t("no_history")}</p>
        </div>
      </div>
    </div>
  );
}

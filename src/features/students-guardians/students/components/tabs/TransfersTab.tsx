"use client";

import { ArrowLeftRight } from "lucide-react";
import { Student } from "@/features/students-guardians/students/types";
import { useTranslations } from "next-intl";
import {
  getTransfersByStudentId,
  getWithdrawalsByStudentId,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";

interface TransfersTabProps {
  student: Student;
}

export default function TransfersTab({ student }: TransfersTabProps) {
  const t = useTranslations("students_guardians.profile.transfers");
  const tTransfers = useTranslations("students_guardians.transfers_withdrawals");
  const transfers = getTransfersByStudentId(student.id);
  const withdrawals = getWithdrawalsByStudentId(student.id);
  const history = [...transfers, ...withdrawals].sort(
    (left, right) =>
      new Date(right.requestDate).getTime() - new Date(left.requestDate).getTime(),
  );

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
              <p className="text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">{t("info_message")}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("no_transfers")}
          </h3>
          <p className="text-sm text-gray-500 mb-6">{t("no_transfers_desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        <div className="space-y-3">
          {history.map((item) => {
            const target = "type" in item && item.type === "internal"
              ? item.targetClass || item.targetClassroom || item.targetSection || t("no_history")
              : ("externalSchool" in item ? item.externalSchool : undefined) || item.reason;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{item.id}</p>
                  <span className="text-xs text-gray-500">{item.requestDate}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{target}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {tTransfers(`filters.statuses.${item.status}`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

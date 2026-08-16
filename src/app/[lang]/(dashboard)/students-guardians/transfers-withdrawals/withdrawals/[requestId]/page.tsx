"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getWithdrawalById } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import WithdrawalRequestDetailsPage from "@/features/students-guardians/transfers-withdrawals/components/details/WithdrawalRequestDetailsPage";

export default function WithdrawalDetailsRoute() {
  const params = useParams<{ requestId: string }>();
  const requestId = Array.isArray(params?.requestId)
    ? params.requestId[0]
    : params?.requestId;
  const withdrawal = useMemo(
    () => (requestId ? getWithdrawalById(requestId) : undefined),
    [requestId],
  );

  if (!withdrawal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Withdrawal request not found</p>
        </div>
      </div>
    );
  }

  return <WithdrawalRequestDetailsPage withdrawal={withdrawal} />;
}

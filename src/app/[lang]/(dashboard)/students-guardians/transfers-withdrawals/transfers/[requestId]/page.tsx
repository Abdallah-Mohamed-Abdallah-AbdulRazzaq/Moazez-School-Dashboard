"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getTransferById } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import TransferRequestDetailsPage from "@/features/students-guardians/transfers-withdrawals/components/details/TransferRequestDetailsPage";

export default function TransferDetailsRoute() {
  const params = useParams<{ requestId: string }>();
  const requestId = Array.isArray(params?.requestId)
    ? params.requestId[0]
    : params?.requestId;
  const transfer = useMemo(
    () => (requestId ? getTransferById(requestId) : undefined),
    [requestId],
  );

  if (!transfer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Transfer request not found</p>
        </div>
      </div>
    );
  }

  return <TransferRequestDetailsPage transfer={transfer} />;
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  Clock,
  Plus,
  TrendingDown,
  UserMinus,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import TransfersWithdrawalsTrendChart from "@/features/students-guardians/dashboard/components/charts/TransfersWithdrawalsTrendChart";
import TransfersByStageChart from "@/features/students-guardians/dashboard/components/charts/TransfersByStageChart";
import WithdrawalReasonsChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalReasonsChart";
import WithdrawalsByBehaviorChart from "@/features/students-guardians/dashboard/components/charts/WithdrawalsByBehaviorChart";
import TransfersWithdrawalsTable from "@/features/students-guardians/transfers-withdrawals/components/tables/TransfersWithdrawalsTable";
import { fetchTransfersWithdrawalsOverviewMetrics } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import CreateTransferWithdrawalModal from "../../students/components/modals/CreateTransferWithdrawalModal";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";

export default function TransfersWithdrawalsPage() {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [metrics, setMetrics] = useState({
    transfersThisMonth: 0,
    withdrawalsThisMonth: 0,
    pendingRequests: 0,
    dropoutRate: 0,
    behaviorRelatedWithdrawals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { values, setValue } = useUrlQueryState<{
    search: string;
  }>({
    defaults: {
      search: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
  });

  const tableSearchQuery = values.search;

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const nextMetrics = await fetchTransfersWithdrawalsOverviewMetrics();
        if (!isCancelled) {
          setMetrics(nextMetrics);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : t("subtitle"));
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
  }, [t]);

  if (isLoading) {
    return <MainLoader />;
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-xl p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }
  const netChange = metrics.transfersThisMonth - metrics.withdrawalsThisMonth;
  const dropoutThreshold = 5;
  const showDropoutAlert = metrics.dropoutRate > dropoutThreshold;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("create_application")}
        </button>
      </div>

      {showDropoutAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">
              {t("alerts.high_dropout_rate")}
            </p>
            <p className="text-sm text-red-700 mt-1">
              {t("alerts.dropout_message", { rate: metrics.dropoutRate })}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <KPICardV2
          title={t("kpis.transfers_this_month")}
          value={metrics.transfersThisMonth}
          subtitle={t("kpis.incoming_students")}
          icon={ArrowLeftRight}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("kpis.withdrawals_this_month")}
          value={metrics.withdrawalsThisMonth}
          subtitle={t("kpis.outgoing_students")}
          icon={UserMinus}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
        />
        <KPICardV2
          title={t("kpis.net_change")}
          value={netChange >= 0 ? `+${netChange}` : netChange}
          subtitle={t("kpis.transfers_minus_withdrawals")}
          icon={TrendingDown}
          iconColor={netChange >= 0 ? "#10b981" : "#f59e0b"}
          iconBgColor={netChange >= 0 ? "#d1fae5" : "#fef3c7"}
        />
        <KPICardV2
          title={t("kpis.dropout_rate")}
          value={`${metrics.dropoutRate}%`}
          subtitle={
            metrics.dropoutRate > dropoutThreshold
              ? t("kpis.above_threshold")
              : t("kpis.within_normal")
          }
          icon={AlertTriangle}
          iconColor={metrics.dropoutRate > dropoutThreshold ? "#ef4444" : "#10b981"}
          iconBgColor={metrics.dropoutRate > dropoutThreshold ? "#fee2e2" : "#d1fae5"}
        />
        <KPICardV2
          title={t("kpis.pending_requests")}
          value={metrics.pendingRequests}
          subtitle={t("kpis.awaiting_review")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("kpis.behavior_related")}
          value={`${metrics.behaviorRelatedWithdrawals}%`}
          subtitle={t("kpis.low_behavior_score")}
          icon={Award}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr">
        <TransfersWithdrawalsTrendChart />
        <TransfersByStageChart />
        <WithdrawalReasonsChart />
        <WithdrawalsByBehaviorChart />
      </div>

      <TransfersWithdrawalsTable
        searchQuery={tableSearchQuery}
        onSearchChange={(value) => {
          setValue("search", value, "replace");
        }}
      />

      {showCreateModal && (
        <CreateTransferWithdrawalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            console.log("Application submitted:", data);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

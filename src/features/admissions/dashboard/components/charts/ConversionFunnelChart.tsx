// FILE: src/components/admissions/charts/ConversionFunnelChart.tsx

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  FunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  type LabelProps,
} from "recharts";
import { ChartCard } from "@/components/ui/chart-card";

interface FunnelData {
  leads: number;
  applications: number;
  accepted: number;
  enrolled: number;
}

interface ConversionFunnelChartProps {
  data: FunnelData;
}

export default function ConversionFunnelChart({
  data,
}: ConversionFunnelChartProps) {
  const t = useTranslations("admissions.charts");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const { leads, applications, accepted, enrolled } = data;

  // Calculate conversion percentages
  const leadsToApps =
    leads > 0 ? ((applications / leads) * 100).toFixed(1) : "0.0";
  const appsToAccepted =
    applications > 0 ? ((accepted / applications) * 100).toFixed(1) : "0.0";
  const acceptedToEnrolled =
    accepted > 0 ? ((enrolled / accepted) * 100).toFixed(1) : "0.0";
  const overallConversion =
    leads > 0 ? ((enrolled / leads) * 100).toFixed(1) : "0.0";

  const stages = [
    {
      name: t("leads"),
      value: leads,
      fill: "#6366f1", // Indigo
    },
    {
      name: t("applications"),
      value: applications,
      fill: "#8b5cf6", // Purple
    },
    {
      name: t("accepted"),
      value: accepted,
      fill: "#10b981", // Green
    },
    {
      name: t("enrolled"),
      value: enrolled,
      fill: "#14b8a6", // Teal
    },
  ];

  const hasData = leads > 0 || applications > 0 || accepted > 0 || enrolled > 0;

  const periodOptions = [
    { label: t("all_time"), value: "all" },
    { label: t("this_month"), value: "month" },
    { label: t("this_term"), value: "term" },
    { label: t("this_year"), value: "year" },
  ];

  if (!hasData) {
    return (
      <ChartCard
        title={t("conversion_funnel")}
        subtitle={t("pipeline_stages")}
        description={t("conversion_funnel_desc")}
        periodOptions={periodOptions}
        defaultPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        bgColor="#ede9fe"
      >
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{t("no_data")}</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={t("conversion_funnel")}
      subtitle={t("pipeline_stages")}
      description={t("conversion_funnel_desc")}
      periodOptions={periodOptions}
      defaultPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      bgColor="#ede9fe"
      className="h-full flex flex-col justify-between"
    >
      {/* Overall Conversion */}
      <div className="mb-6 p-4 bg-linear-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {t("overall_conversion_rate")}
          </span>
          <span className="text-2xl font-bold text-primary">
            {overallConversion}%
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {t("enrolled_out_of_leads", { enrolled, leads })}
        </p>
      </div>

      {/* Recharts Funnel */}
      <div className="w-full" style={{ height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              formatter={(tooltipValue) =>
                typeof tooltipValue === "number"
                  ? tooltipValue.toLocaleString()
                  : String(tooltipValue ?? "0")
              }
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            />
            <Funnel
              dataKey="value"
              data={stages}
              isAnimationActive
            >
              <LabelList
                position="center"
                content={(props: LabelProps) => {
                  const { x = 0, y = 0, width = 0, height = 0, value, name } = props;
                  const centerX = Number(x) + Number(width) / 2;
                  const centerY = Number(y) + Number(height) / 2;
                  
                  return (
                    <g>
                      <text
                        x={centerX}
                        y={centerY - 12}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: "22px", fontWeight: "700" }}
                      >
                        {value?.toLocaleString()}
                      </text>
                      <text
                        x={centerX}
                        y={centerY + 12}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: "14px", fontWeight: "600" }}
                      >
                        {name}
                      </text>
                    </g>
                  );
                }}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">{t("leads_to_apps")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {leadsToApps}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("apps_to_accepted")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {appsToAccepted}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("accepted_to_enrolled")}</p>
            <p className="text-sm font-semibold text-gray-900">
              {acceptedToEnrolled}%
            </p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { useTranslations } from "next-intl";
import { ChartCard } from "@/components/ui";

interface AttendanceCardProps {
  presentRate: number;
  absentRate: number;
}

export default function AttendanceCard({
  presentRate,
  absentRate,
}: AttendanceCardProps) {
  const t = useTranslations("attendance");
  const data = [
    { id: 0, value: presentRate, color: "#036b80" },
    { id: 1, value: absentRate, color: "#0ac5b2" },
  ];

  return (
    <ChartCard
      title={t("title")}
      description={t("description")}
      showPeriodFilter={false}
    >
      <div className="bg-white rounded-[20px] p-8 shadow-(--main-box-shadow)">
        <div className="flex items-center justify-center mb-6 ">
          <PieChart
            series={[
              {
                data,
                innerRadius: 90,
                outerRadius: 120,
                paddingAngle: 0,
                cornerRadius: 8,
                startAngle: -90,
                endAngle: 90,
                cx: 150,
                cy: 150,
              },
            ]}
            width={300}
            height={200}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          />
        </div>

        <div className="flex items-center justify-around">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{presentRate}%</p>
              <p className="text-xs text-gray-500">{t("present")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0ac5b2]" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{absentRate}%</p>
              <p className="text-xs text-gray-500">{t("absent")}</p>
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

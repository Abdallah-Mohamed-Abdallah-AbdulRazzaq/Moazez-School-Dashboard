"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  School,
  Settings2,
  ArrowRight,
  Info,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import type { DashboardModulePage } from "../types/dashboardApi.types";
import ModuleWidgetCard from "./ModuleWidgetCard";
import { resolveDashboardActionTarget } from "../utils/resolveDashboardActionTarget";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const moduleIcons: Record<string, LucideIcon> = {
  users: Users,
  "graduation-cap": GraduationCap,
  calendar: Calendar,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  "list-todo": ListTodo,
  admissions: Users,
  academics: GraduationCap,
  attendance: CheckCircle2,
  grades: BookOpen,
  homework: BookOpen,
  behavior: ShieldAlert,
  reinforcement: School,
  settings: Settings2,
};

const toneStyles: Record<
  string,
  { border: string; bg: string; text: string; icon: string; dot: string }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    dot: "bg-red-500",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-600",
    dot: "bg-amber-500",
  },
  info: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    icon: "text-cyan-600",
    dot: "bg-cyan-500",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  neutral: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-500",
    dot: "bg-gray-400",
  },
};

interface ModuleTabDashboardViewProps {
  pageData: DashboardModulePage;
}

export default function ModuleTabDashboardView({
  pageData,
}: ModuleTabDashboardViewProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard_new");
  const moduleIdentity = pageData.module;
  const overview = pageData.overview;
  const widgets = pageData.widgets || [];
  const analytics = pageData.analytics || { charts: [], availableData: [] };

  const Icon = moduleIcons[moduleIdentity.iconKey] || Info;
  const toneStyle = toneStyles[moduleIdentity.tone] || toneStyles.neutral;

  // Localize path helper
  const localizedPath = (target: string) => {
    const cleanTarget = target.startsWith("/") ? target : `/${target}`;
    return `/${locale}${cleanTarget}`;
  };

  // If emptyState is present, display a dedicated empty state banner
  if (pageData.emptyState) {
    return (
      <div
        className="space-y-6"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Header Block */}
        <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg border ${toneStyle.border} ${toneStyle.bg} p-2`}>
                <Icon className={`h-6 w-6 ${toneStyle.icon}`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-950">
                  {moduleIdentity.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {moduleIdentity.description}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Empty State Banner */}
        <article className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <Info className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            {pageData.emptyState.message}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {pageData.emptyState.reason === "no_widgets_or_charts"
              ? "This module is not fully configured or contains no data."
              : ""}
          </p>
        </article>
      </div>
    );
  }

  const BackIcon = locale === "ar" ? ArrowRight : ChevronRight;

  return (
    <div
      className="space-y-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Header Block */}
      <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg border ${toneStyle.border} ${toneStyle.bg} p-2`}>
              <Icon className={`h-6 w-6 ${toneStyle.icon}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-950">
                {moduleIdentity.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {moduleIdentity.description}
              </p>
            </div>
          </div>
          {moduleIdentity.sourceRoute && (
            <Link
              href={localizedPath(
                resolveDashboardActionTarget(moduleIdentity.sourceRoute),
              )}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              {t("dashboard.open_module_page")}
              <ArrowRight className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`} />
            </Link>
          )}
        </div>
      </header>

      {/* Quick Stats Grid */}
      {overview.quickStats && overview.quickStats.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overview.quickStats.map((stat) => {
            const statToneStyle = toneStyles[stat.tone] || toneStyles.neutral;
            const StatIcon = moduleIcons[stat.iconKey] || Info;
            return (
              <article
                key={stat.key}
                className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-950">
                      {stat.value}
                      {stat.unit && (
                        <span className={`text-sm font-normal text-gray-600 ${locale === "ar" ? "mr-0.5" : "ml-0.5"}`}>
                          {stat.unit}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={`rounded-full border ${statToneStyle.border} ${statToneStyle.bg} p-2`}>
                    <StatIcon className={`h-4 w-4 ${statToneStyle.icon}`} />
                  </div>
                </div>
                {stat.action && (
                  <Link
                    href={localizedPath(
                      resolveDashboardActionTarget(stat.action.target),
                    )}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-hover focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none rounded cursor-pointer duration-200"
                  >
                    {stat.action.label}
                    <BackIcon className="h-3 w-3" />
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Active Modules / Sections Grid */}
      {pageData.sections && pageData.sections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
            <School className="h-5 w-5 text-primary-600" />
            {t("dashboard.active_areas")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageData.sections.map((sec) => {
              const secToneStyle = toneStyles[sec.status] || toneStyles.neutral;
              return (
                <article
                  key={sec.sectionKey}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-gray-950 truncate">
                      {sec.title}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${secToneStyle.border} ${secToneStyle.bg} ${secToneStyle.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${secToneStyle.dot} ${locale === "ar" ? "ml-1.5" : "mr-1.5"}`} />
                      {t.has(`dashboard.module_state.${sec.status}`)
                        ? t(`dashboard.module_state.${sec.status}`)
                        : sec.status}
                    </span>
                  </div>
                  {sec.items && sec.items.length > 0 ? (
                    <ul className="space-y-1.5">
                      {sec.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="h-1 w-1 rounded-full bg-gray-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active items</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Scoped Risks & Actions Panel */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Risks */}
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-950 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("dashboard.risks_alerts")}
          </h2>
          <div className="space-y-3">
            {overview.risks && overview.risks.length > 0 ? (
              overview.risks.map((risk) => {
                const riskToneStyle = toneStyles[risk.severity] || toneStyles.neutral;
                return (
                  <div
                    key={risk.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${riskToneStyle.dot}`} />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{risk.title}</h3>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {t("dashboard.count", { value: risk.count }) || `Count: ${risk.count}`}
                        </p>
                      </div>
                    </div>
                    {risk.action && (
                      <Link
                        href={localizedPath(
                          resolveDashboardActionTarget(risk.action.target),
                        )}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none cursor-pointer duration-200"
                      >
                        {risk.action.label}
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center py-6 text-sm text-gray-600">
                {t("dashboard.no_risks")}
              </p>
            )}
          </div>
        </article>

        {/* Next Actions */}
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-950 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-500" />
            {t("dashboard.recommended_actions")}
          </h2>
          <div className="space-y-3">
            {overview.actions && overview.actions.length > 0 ? (
              overview.actions.map((action) => (
                <div
                  key={action.key}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2.5"
                >
                  <div>
                    <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase">
                      {t(`dashboard.priority_${action.priority.toLowerCase()}`) || `${action.priority} Priority`}
                    </span>
                    <h3 className="mt-1.5 text-sm font-semibold text-gray-900">{action.label}</h3>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{action.description}</p>
                  </div>
                  {action.action && (
                    <Link
                      href={localizedPath(
                        resolveDashboardActionTarget(action.action.target),
                      )}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-hover focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus:outline-none rounded cursor-pointer duration-200"
                    >
                      {action.action.label}
                      <ArrowRight className={`h-3.5 w-3.5 ${locale === "ar" ? "rotate-180" : ""}`} />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-sm text-gray-600">
                {t("dashboard.no_actions")}
              </p>
            )}
          </div>
        </article>
      </section>

      {/* Scoped Charts */}
      {analytics.availableData && analytics.availableData.length > 0 && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {analytics.availableData.map((chartData) => {
            const chartDef = analytics.charts?.find((c) => c.chartKey === chartData.chartKey) || {
              title: "Trend Chart",
              description: "Module performance trend",
              type: "line",
            };

            const chartDataPoints = chartData.data?.series[0]?.points || [];
            const formattedData = chartDataPoints.map((point, index) => {
              const item: Record<string, string | number> = { name: point.x };
              (chartData.data?.series || []).forEach((s) => {
                item[s.key] = s.points[index]?.y ?? 0;
              });
              return item;
            });

            return (
              <article key={chartData.chartKey} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-950">{chartDef.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{chartDef.description}</p>
                </div>

                <div className="mt-4 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartDef.type === "bar" ? (
                      <BarChart
                        data={formattedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11 }}
                        />
                        {(chartData.data?.series || []).map((s, sIdx) => (
                          <Bar
                            key={s.key}
                            dataKey={s.key}
                            name={s.label || s.key}
                            fill={sIdx === 0 ? "#3b82f6" : sIdx === 1 ? "#10b981" : "#f59e0b"}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart
                        data={formattedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11 }}
                        />
                        {(chartData.data?.series || []).map((s, sIdx) => (
                          <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.label || s.key}
                            stroke={sIdx === 0 ? "#3b82f6" : sIdx === 1 ? "#10b981" : "#f59e0b"}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Widgets Grid */}
      {widgets.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-950">
            {t("dashboard.assigned_widgets")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {widgets.map((widget) => (
              <ModuleWidgetCard key={widget.widgetKey} widget={widget} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

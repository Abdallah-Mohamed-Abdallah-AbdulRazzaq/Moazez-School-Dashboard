"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Calendar, CheckCircle2, Clock, Info, ListTodo, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardMiniChartWidget, DashboardWidget, DashboardWidgetAction, DashboardWidgetTone } from "../types/dashboardApi.types";
import { resolveDashboardActionTarget } from "../utils/resolveDashboardActionTarget";

const widgetIcons: Record<string, LucideIcon> = {
  users: Users, "graduation-cap": TrendingUp, calendar: Calendar, "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp, "list-todo": ListTodo, admissions: Users, academics: TrendingUp,
  attendance: CheckCircle2, grades: TrendingUp, homework: CheckCircle2, behavior: AlertTriangle,
  reinforcement: TrendingUp, settings: Info,
};

const toneStyles: Record<DashboardWidgetTone, { badge: string; icon: string; progress: string; value: string }> = {
  critical: { badge: "bg-red-50 text-red-700", icon: "text-red-600", progress: "bg-red-500", value: "text-red-700" },
  warning: { badge: "bg-amber-50 text-amber-700", icon: "text-amber-600", progress: "bg-amber-500", value: "text-amber-700" },
  info: { badge: "bg-sky-50 text-sky-700", icon: "text-sky-600", progress: "bg-sky-500", value: "text-sky-700" },
  success: { badge: "bg-emerald-50 text-emerald-700", icon: "text-emerald-600", progress: "bg-emerald-500", value: "text-emerald-700" },
  neutral: { badge: "bg-gray-100 text-gray-700", icon: "text-gray-500", progress: "bg-gray-500", value: "text-gray-950" },
};
const chartColors = ["#2563eb", "#0f766e", "#d97706", "#7c3aed"];

export default function ModuleWidgetCard({ widget }: { widget: DashboardWidget }) {
  const Icon = widgetIcons[widget.iconKey] ?? Info;
  const tone = toneStyles[widget.tone];
  const preferredAction = widget.emptyState?.action ?? widget.action;

  switch (widget.type) {
    case "stat-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<Icon className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} /><p className="mt-5 text-3xl font-bold text-gray-950">{widget.data.value}</p><p className="mt-2 text-xs text-gray-600">{widget.subtitle ?? widget.data.label}</p></WidgetFrame>;
    case "action-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<Icon className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} badge={widget.data.status.replace("_", " ")} tone={tone} /><p className={`mt-4 text-3xl font-bold ${tone.value}`}>{widget.data.value}</p><p className="mt-2 text-sm leading-5 text-gray-600">{widget.data.message}</p></WidgetFrame>;
    case "risk-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<AlertTriangle className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} badge={widget.data.riskLevel} tone={tone} /><p className={`mt-4 text-3xl font-bold ${tone.value}`}>{widget.data.count}</p><p className="mt-2 text-sm text-gray-600">{widget.subtitle ?? widget.data.label}</p></WidgetFrame>;
    case "progress-card": {
      const percent = widget.data.percent;
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<Icon className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} badge={percent === null ? "unavailable" : `${percent}%`} tone={tone} />{percent === null ? <WidgetEmptyState widget={widget} /> : <><div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${tone.progress}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div><p className="mt-3 text-sm text-gray-600">{widget.data.segments.map((segment) => `${segment.label}: ${segment.value}`).join(" · ")}</p></>}</WidgetFrame>;
    }
    case "mini-chart-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<TrendingUp className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} /><p className="mt-3 text-2xl font-bold text-gray-950">{widget.data.summary?.value ?? Object.values(widget.data.totals).reduce((total, current) => total + current, 0)}</p>{widget.data.empty ? <WidgetEmptyState widget={widget} /> : <MiniChart widget={widget} />}</WidgetFrame>;
    case "timeline-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<Clock className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} /><div className="mt-4 max-h-44 space-y-3 overflow-y-auto pr-1">{widget.data.items.length ? widget.data.items.map((activity) => <div key={`${activity.eventType}-${activity.occurredAt}`}><p className="text-sm font-medium text-gray-950">{activity.title}</p><p className="mt-1 line-clamp-2 text-xs text-gray-600">{activity.description}</p><p className="mt-1 text-xs text-gray-500">{activity.actor.displayName} · {formatDate(activity.occurredAt)}</p></div>) : <WidgetEmptyState widget={widget} fallback="No recent activity." />}</div></WidgetFrame>;
    case "calendar-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<Calendar className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} badge={`${widget.data.summary.total} events`} tone={tone} /><div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">{widget.data.events.length ? widget.data.events.map((event, index) => <div key={`${event.title}-${event.date}-${index}`} className="rounded-lg bg-gray-50 p-2"><p className="truncate text-sm font-medium text-gray-950">{event.title}</p><p className="mt-1 text-xs text-gray-600">{event.date}{event.startTime ? ` · ${event.startTime}` : ""}</p></div>) : <WidgetEmptyState widget={widget} fallback="No events scheduled for today." />}</div></WidgetFrame>;
    case "todo-card":
      return <WidgetFrame widget={widget} action={preferredAction}><WidgetHeader icon={<ListTodo className={`h-4 w-4 ${tone.icon}`} />} title={widget.title} badge={`${widget.data.summary.pending} pending`} tone={tone} /><div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">{widget.data.items.length ? widget.data.items.map((todo, index) => <div key={`${todo.title}-${index}`} className="flex items-center gap-2 text-sm"><CheckCircle2 className={`h-4 w-4 shrink-0 ${todo.status === "completed" ? "text-emerald-500" : "text-gray-300"}`} /><span className={todo.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}>{todo.title}</span></div>) : <WidgetEmptyState widget={widget} fallback="No tasks for today." />}</div></WidgetFrame>;
  }
}

function WidgetFrame({ widget, action, children }: { widget: DashboardWidget; action: DashboardWidgetAction | null; children: React.ReactNode }) {
  const content = <article className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-200">{children}</article>;
  return action ? <Link href={resolveDashboardActionTarget(action.target)} aria-label={`${action.label}: ${widget.title}`} className="group block h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:[&>article]:border-primary/40 hover:[&>article]:shadow-md">{content}</Link> : content;
}

function WidgetHeader({ icon, title, badge, tone }: { icon: React.ReactNode; title: string; badge?: string; tone?: { badge: string } }) {
  return <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="rounded-full bg-gray-50 p-2">{icon}</span><p className="truncate text-sm font-semibold text-gray-950">{title}</p></div>{badge && tone ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone.badge}`}>{badge}</span> : null}</div>;
}

function WidgetEmptyState({ widget, fallback }: { widget: DashboardWidget; fallback?: string }) {
  const message = widget.emptyState?.description ?? fallback ?? "No data is available.";
  return <p className="mt-4 rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-600">{widget.emptyState?.title ? `${widget.emptyState.title}: ${message}` : message}</p>;
}

function MiniChart({ widget }: { widget: DashboardMiniChartWidget }) {
  const byLabel = new Map<string, Record<string, string | number>>();
  widget.data.series.forEach((series) => series.points.forEach((point) => { const chartPoint = byLabel.get(point.x) ?? { label: point.x }; chartPoint[series.key] = point.y; byLabel.set(point.x, chartPoint); }));
  const chartData = Array.from(byLabel.values());
  if (!chartData.length) return <WidgetEmptyState widget={widget} fallback="No data points are available." />;
  const chartSeries = widget.data.series.map((series, index) => ({ ...series, color: chartColors[index % chartColors.length] }));
  const axes = <><CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" minTickGap={24} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} /><YAxis width={28} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} /></>;
  return <div className="mt-3 h-32" role="img" aria-label={`${widget.title} chart`}><ResponsiveContainer width="100%" height="100%">{widget.meta.analytics?.chartType === "area" ? <AreaChart data={chartData}>{axes}{chartSeries.map((series) => <Area key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} fill={series.color} fillOpacity={0.15} strokeWidth={2} />)}</AreaChart> : <LineChart data={chartData}>{axes}{chartSeries.map((series) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={series.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}</LineChart>}</ResponsiveContainer></div>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }

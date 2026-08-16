import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  MapPin,
  Eye,
  Gauge,
  Thermometer,
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
} from "lucide-react";

// ─── Collapsed Header ───────────────────────────────────────────────────────

function CollapsedHeader({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      onClick={onExpand}
      className="w-full text-left group"
    >
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-5 py-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Location + Date */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <MapPin size={15} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[15px] font-semibold text-[#111827] leading-tight">Dhaka, Bangladesh</span>
                <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">Sun, 04 Aug 2024</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-[#111827] leading-none">28°C</span>
                <span className="text-[13px] font-medium text-blue-500">Heavy Rain</span>
              </div>
            </div>
          </div>

          {/* Center: Hint Chips */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap justify-center">
            <HintChip icon={<Wind size={12} className="text-[#6B7280]" />} label="7.90 km/h" />
            <HintChip icon={<Droplets size={12} className="text-blue-400" />} label="85%" />
            <HintChip icon={<Sunrise size={12} className="text-amber-400" />} label="4:50 AM" />
            <HintChip icon={<Sunset size={12} className="text-orange-400" />} label="6:45 PM" />
          </div>

          {/* Right: Temp details + chevron */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden md:flex flex-col items-end gap-0.5">
              <span className="text-[11px] text-[#9CA3AF]">Low <span className="text-[#6B7280] font-medium">24°C</span></span>
              <span className="text-[11px] text-[#9CA3AF]">Feels <span className="text-[#6B7280] font-medium">31°C</span></span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#E5E7EB] transition-colors">
              <ChevronDown size={16} className="text-[#6B7280]" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function HintChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
      {icon}
      {label}
    </span>
  );
}

// ─── Expanded: Main Weather Card ────────────────────────────────────────────

function MainWeatherCard() {
  return (
    <div className="bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] rounded-2xl p-5 text-white relative overflow-hidden h-full min-h-[220px] flex flex-col justify-between">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={13} className="opacity-80" />
          <span className="text-[13px] font-medium opacity-90">Dhaka, Bangladesh</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="text-5xl font-bold leading-none mb-1">28°C</div>
            <div className="text-[13px] font-medium opacity-80 mb-3">Heavy Rain</div>
            <div className="flex gap-3 text-[12px] opacity-75">
              <span>↓ Low 24°C</span>
              <span>Feels 31°C</span>
            </div>
          </div>
          <div className="w-16 h-16 flex items-center justify-center">
            <CloudRain size={56} className="opacity-90 text-white" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mt-4">
        {[
          { icon: <Wind size={11} />, val: "7.90 km/h" },
          { icon: <Droplets size={11} />, val: "85%" },
          { icon: <Sunrise size={11} />, val: "4:50 AM" },
          { icon: <Sunset size={11} />, val: "6:45 PM" },
        ].map(({ icon, val }) => (
          <span key={val} className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[11px] font-medium">
            {icon}{val}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Expanded: Today's Highlight Card ───────────────────────────────────────

function HighlightCard() {
  const metrics = [
    {
      label: "UV Index",
      value: "3",
      sub: "Moderate",
      icon: <Sun size={18} className="text-amber-400" />,
      color: "bg-amber-50 border-amber-100",
    },
    {
      label: "Humidity",
      value: "85%",
      sub: "Very humid",
      icon: <Droplets size={18} className="text-blue-400" />,
      color: "bg-blue-50 border-blue-100",
    },
    {
      label: "Visibility",
      value: "4.2 km",
      sub: "Moderate",
      icon: <Eye size={18} className="text-purple-400" />,
      color: "bg-purple-50 border-purple-100",
    },
    {
      label: "Pressure",
      value: "1012 hPa",
      sub: "Normal",
      icon: <Gauge size={18} className="text-green-400" />,
      color: "bg-green-50 border-green-100",
    },
    {
      label: "Wind Speed",
      value: "7.9 km/h",
      sub: "Light breeze",
      icon: <Wind size={18} className="text-sky-400" />,
      color: "bg-sky-50 border-sky-100",
    },
    {
      label: "Feels Like",
      value: "31°C",
      sub: "Warmer",
      icon: <Thermometer size={18} className="text-rose-400" />,
      color: "bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-[#111827]">Today&apos;s Highlight</h3>
        <span className="text-[11px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">Sun, 04 Aug</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {metrics.map((m) => (
          <div key={m.label} className={`rounded-xl border p-3 ${m.color}`}>
            <div className="mb-1.5">{m.icon}</div>
            <div className="text-[15px] font-bold text-[#111827] leading-tight">{m.value}</div>
            <div className="text-[10px] text-[#6B7280] mt-0.5">{m.label}</div>
            <div className="text-[10px] text-[#9CA3AF]">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Expanded: Other Countries Card ─────────────────────────────────────────

function OtherCountriesCard() {
  const cities = [
    { city: "London", country: "UK", temp: "16°C", cond: "Cloudy", icon: <Cloud size={16} className="text-[#9CA3AF]" />, flag: "🇬🇧" },
    { city: "New York", country: "USA", temp: "24°C", cond: "Sunny", icon: <Sun size={16} className="text-amber-400" />, flag: "🇺🇸" },
    { city: "Tokyo", country: "Japan", temp: "31°C", cond: "Humid", icon: <CloudRain size={16} className="text-blue-400" />, flag: "🇯🇵" },
    { city: "Dubai", country: "UAE", temp: "42°C", cond: "Sunny", icon: <Sun size={16} className="text-amber-500" />, flag: "🇦🇪" },
    { city: "Sydney", country: "Australia", temp: "19°C", cond: "Partly cloudy", icon: <Cloud size={16} className="text-[#9CA3AF]" />, flag: "🇦🇺" },
    { city: "Oslo", country: "Norway", temp: "8°C", cond: "Snow", icon: <CloudSnow size={16} className="text-sky-300" />, flag: "🇳🇴" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
      <h3 className="text-[14px] font-semibold text-[#111827] mb-4">Other Countries</h3>
      <div className="space-y-2">
        {cities.map((c) => (
          <div key={c.city} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
            <div className="flex items-center gap-2.5">
              <span className="text-lg leading-none">{c.flag}</span>
              <div>
                <div className="text-[13px] font-semibold text-[#111827]">{c.city}</div>
                <div className="text-[11px] text-[#9CA3AF]">{c.country}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.icon}
              <div className="text-right">
                <div className="text-[13px] font-bold text-[#111827]">{c.temp}</div>
                <div className="text-[10px] text-[#9CA3AF]">{c.cond}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Expanded: 10 Day Forecast Card ─────────────────────────────────────────

function ForecastCard() {
  const days = [
    { day: "Today", high: 28, low: 24, cond: "Heavy Rain", icon: <CloudRain size={14} className="text-blue-400" />, bar: 85 },
    { day: "Mon", high: 27, low: 23, cond: "Rain", icon: <CloudRain size={14} className="text-blue-400" />, bar: 70 },
    { day: "Tue", high: 26, low: 22, cond: "Cloudy", icon: <Cloud size={14} className="text-[#9CA3AF]" />, bar: 55 },
    { day: "Wed", high: 29, low: 24, cond: "Partly Sunny", icon: <Cloud size={14} className="text-[#9CA3AF]" />, bar: 40 },
    { day: "Thu", high: 32, low: 26, cond: "Sunny", icon: <Sun size={14} className="text-amber-400" />, bar: 15 },
    { day: "Fri", high: 33, low: 27, cond: "Sunny", icon: <Sun size={14} className="text-amber-400" />, bar: 10 },
    { day: "Sat", high: 31, low: 25, cond: "Partly Cloudy", icon: <Cloud size={14} className="text-[#9CA3AF]" />, bar: 35 },
    { day: "Sun", high: 29, low: 23, cond: "Rain", icon: <CloudRain size={14} className="text-blue-400" />, bar: 65 },
    { day: "Mon", high: 27, low: 22, cond: "Cloudy", icon: <Cloud size={14} className="text-[#9CA3AF]" />, bar: 50 },
    { day: "Tue", high: 30, low: 25, cond: "Sunny", icon: <Sun size={14} className="text-amber-400" />, bar: 20 },
  ];

  const maxHigh = Math.max(...days.map((d) => d.high));
  const minLow = Math.min(...days.map((d) => d.low));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
      <h3 className="text-[14px] font-semibold text-[#111827] mb-4">10-Day Forecast</h3>
      <div className="space-y-1.5">
        {days.map((d, i) => {
          const lowPct = ((d.low - minLow) / (maxHigh - minLow)) * 100;
          const highPct = ((d.high - minLow) / (maxHigh - minLow)) * 100;
          return (
            <div key={i} className="flex items-center gap-3 py-1">
              <span className="w-9 text-[12px] font-medium text-[#6B7280] shrink-0">{d.day}</span>
              <div className="w-5 flex justify-center shrink-0">{d.icon}</div>
              <span className="text-[11px] text-[#9CA3AF] w-20 hidden sm:block shrink-0">{d.cond}</span>
              <span className="text-[12px] font-medium text-[#6B7280] w-7 text-right shrink-0">{d.low}°</span>
              <div className="flex-1 relative h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-blue-300 to-amber-400"
                  style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
                />
              </div>
              <span className="text-[12px] font-semibold text-[#111827] w-7 shrink-0">{d.high}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Expanded Layout ─────────────────────────────────────────────────────────

function ExpandedContent({ onCollapse }: { onCollapse: () => void }) {
  return (
    <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden">
      {/* Expanded header bar */}
      <button
        onClick={onCollapse}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
            <MapPin size={13} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#111827]">Dhaka, Bangladesh</span>
            <span className="text-[11px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">Sun, 04 Aug 2024</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#9CA3AF] hidden sm:block">Collapse</span>
          <div className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#E5E7EB] transition-colors">
            <ChevronUp size={15} className="text-[#6B7280]" />
          </div>
        </div>
      </button>

      {/* Dashboard Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top row */}
        <MainWeatherCard />
        <HighlightCard />
        {/* Bottom row */}
        <OtherCountriesCard />
        <ForecastCard />
      </div>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────

export default function App() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-start justify-center py-12 px-4" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <div className="w-full max-w-3xl">
        {/* Label */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Weather Dashboard</span>
          <div className="flex-1 h-px bg-[#E5E7EB]" />
          <span className="text-[11px] font-medium text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-full px-2.5 py-0.5">
            {expanded ? "Expanded" : "Collapsed"}
          </span>
        </div>

        {/* Dropdown */}
        <div className="relative">
          {!expanded ? (
            <div className="animate-in fade-in duration-200">
              <CollapsedHeader onExpand={() => setExpanded(true)} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <ExpandedContent onCollapse={() => setExpanded(false)} />
            </div>
          )}
        </div>

        {/* Variant switcher hint */}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setExpanded(false)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${
              !expanded
                ? "bg-[#111827] text-white border-[#111827]"
                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#9CA3AF]"
            }`}
          >
            Dropdown / Collapsed
          </button>
          <button
            onClick={() => setExpanded(true)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${
              expanded
                ? "bg-[#111827] text-white border-[#111827]"
                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#9CA3AF]"
            }`}
          >
            Dropdown / Expanded
          </button>
        </div>
      </div>
    </div>
  );
}

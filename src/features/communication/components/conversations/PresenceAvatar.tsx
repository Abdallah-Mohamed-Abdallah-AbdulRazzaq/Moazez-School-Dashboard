import type { CommunicationPresence } from "@/features/communication/hooks/usePresence";

export interface PresenceAvatarProps {
  name: string;
  presence?: CommunicationPresence;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export default function PresenceAvatar({ name, presence }: PresenceAvatarProps) {
  const isOnline = presence?.isOnline || presence?.status === "online";

  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {initials(name)}
      <span
        className={`absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-white ${
          isOnline ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
    </span>
  );
}

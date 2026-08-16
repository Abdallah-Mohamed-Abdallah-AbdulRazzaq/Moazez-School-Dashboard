import type { TypingUser } from "@/features/communication/hooks/useTypingIndicator";

export interface TypingIndicatorProps {
  users: TypingUser[];
  label: string;
}

export default function TypingIndicator({ label, users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names = users
    .slice(0, 2)
    .map((user) => user.name || user.userId)
    .join(", ");

  return (
    <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
      </span>
      <span>
        {names} {label}
      </span>
    </div>
  );
}

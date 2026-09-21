import { Clock3 } from "lucide-react";

export interface NavigationStatusBadgeProps {
  label: string;
}

export function NavigationStatusBadge({ label }: NavigationStatusBadgeProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-200/70 bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      <Clock3 aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
}

export default NavigationStatusBadge;

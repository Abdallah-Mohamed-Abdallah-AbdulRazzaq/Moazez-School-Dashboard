import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import ButtonLink from "@/components/ui/button/ButtonLink";

interface AcademicContentSettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}

export default function AcademicContentSettingsCard({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
}: AcademicContentSettingsCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-gray-950">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
        {description}
      </p>
      <ButtonLink
        href={href}
        variant="secondary"
        className="mt-5 self-start"
        rightIcon={
          <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        }
      >
        {actionLabel}
      </ButtonLink>
    </article>
  );
}

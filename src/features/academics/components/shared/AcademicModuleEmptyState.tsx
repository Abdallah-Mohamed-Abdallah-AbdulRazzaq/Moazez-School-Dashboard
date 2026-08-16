"use client";

import type { LucideIcon } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface AcademicModuleEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;
  className?: string;
}

export default function AcademicModuleEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  ctaDisabled = false,
  className = "",
}: AcademicModuleEmptyStateProps) {
  const showCta = Boolean(ctaLabel && onCtaClick);

  return (
    <div
      className={`flex flex-1 items-center justify-center bg-gray-50 px-6 py-12 ${className}`}
    >
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon
            className="h-8 w-8"
            aria-hidden="true"
            data-testid="academic-empty-state-icon"
          />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm leading-6 text-gray-600">{description}</p>
        {showCta ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="primary"
              disabled={ctaDisabled}
              onClick={onCtaClick}
            >
              {ctaLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

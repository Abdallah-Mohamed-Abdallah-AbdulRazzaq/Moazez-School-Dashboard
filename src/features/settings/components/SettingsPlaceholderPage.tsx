"use client";

import { Settings2 } from "lucide-react";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";

interface SettingsPlaceholderPageProps {
  title: string;
  subtitle: string;
  body: string;
}

export default function SettingsPlaceholderPage({
  title,
  subtitle,
  body,
}: SettingsPlaceholderPageProps) {
  return (
    <div className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <SettingsPageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-primary">
          <Settings2 className="h-7 w-7" />
        </div>
        <p className="text-base font-medium text-gray-900">{title}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">{body}</p>
      </div>
    </div>
  );
}

"use client";

interface SettingsPageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function SettingsPageHeader({
  title,
  subtitle,
  actions,
}: SettingsPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

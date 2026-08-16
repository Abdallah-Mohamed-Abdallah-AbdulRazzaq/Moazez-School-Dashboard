"use client";

import { Archive, CircleCheck, Download, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import type {
  Curriculum,
} from "@/features/academics/curriculum/services/curriculumService";

interface CurriculumActionAvailability {
  canActivate: boolean;
  canArchive: boolean;
  canDelete: boolean;
}

interface CurriculumDetailsActions {
  openExport: () => void;
  activate: () => void;
  requestArchive: () => void;
  requestDelete: () => void;
}

interface CurriculumDetailsPanelProps {
  curriculum: Curriculum;
  exportRowCount: number;
  availability: CurriculumActionAvailability;
  actions: CurriculumDetailsActions;
}

interface CurriculumRightPanelProps {
  details: CurriculumDetailsPanelProps;
}

interface ActionButtonConfig {
  key: string;
  label: string;
  variant: "secondary" | "danger";
  disabled: boolean;
  onClick: () => void;
  icon: ReactNode;
}

export const curriculumStatusLabelKey = (status: Curriculum["status"]) =>
  `status.${status}` as const;

function CurriculumDetailsPanel({
  curriculum,
  exportRowCount,
  availability,
  actions,
}: CurriculumDetailsPanelProps) {
  return (
    <div className="p-6 space-y-5">
      <CurriculumHeading curriculum={curriculum} />
      <CurriculumStats curriculum={curriculum} />
      <CurriculumActions
        exportRowCount={exportRowCount}
        availability={availability}
        actions={actions}
      />
    </div>
  );
}

function CurriculumHeading({ curriculum }: { curriculum: Curriculum }) {
  const t = useTranslations("academics.curriculum");

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-900">
        {t("details.title")}
      </h2>
      {curriculum.title && (
        <h3 className="break-words text-base font-semibold text-gray-900">
          {curriculum.title}
        </h3>
      )}
      {curriculum.description && (
        <p className="break-words text-sm leading-6 text-gray-600">
          {curriculum.description}
        </p>
      )}
    </div>
  );
}

function CurriculumStats({ curriculum }: { curriculum: Curriculum }) {
  const t = useTranslations("academics.curriculum");

  return (
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <DetailRow
        label={t("details.status")}
        value={t(curriculumStatusLabelKey(curriculum.status))}
      />
      <DetailRow label={t("details.units")} value={curriculum.unitCount} />
      <DetailRow label={t("details.lessons")} value={curriculum.lessonCount} />
    </div>
  );
}

function CurriculumActions({
  exportRowCount,
  availability,
  actions,
}: Omit<CurriculumDetailsPanelProps, "curriculum">) {
  const t = useTranslations("academics.curriculum");
  const tExport = useTranslations("academics.export");
  const actionButtons: ActionButtonConfig[] = [
    {
      key: "export",
      label: tExport("button"),
      variant: "secondary",
      disabled: exportRowCount === 0,
      onClick: actions.openExport,
      icon: <Download className="h-4 w-4" />,
    },
    {
      key: "activate",
      label: t("actions.activate_curriculum"),
      variant: "secondary",
      disabled: !availability.canActivate,
      onClick: actions.activate,
      icon: <CircleCheck className="h-4 w-4" />,
    },
    {
      key: "archive",
      label: t("actions.archive_curriculum"),
      variant: "secondary",
      disabled: !availability.canArchive,
      onClick: actions.requestArchive,
      icon: <Archive className="h-4 w-4" />,
    },
    {
      key: "delete",
      label: t("actions.delete_curriculum"),
      variant: "danger",
      disabled: !availability.canDelete,
      onClick: actions.requestDelete,
      icon: <Trash2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {t("actions.menu")}
      </h3>
      <ActionButtons buttons={actionButtons} />
    </div>
  );
}

function ActionButtons({ buttons }: { buttons: ActionButtonConfig[] }) {
  return (
    <div className="grid gap-2">
      {buttons.map((button) => (
        <Button
          key={button.key}
          variant={button.variant}
          size="sm"
          fullWidth
          className="justify-start"
          disabled={button.disabled}
          onClick={button.onClick}
          leftIcon={button.icon}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function CurriculumRightPanel({
  details,
}: CurriculumRightPanelProps) {
  return <CurriculumDetailsPanel {...details} />;
}

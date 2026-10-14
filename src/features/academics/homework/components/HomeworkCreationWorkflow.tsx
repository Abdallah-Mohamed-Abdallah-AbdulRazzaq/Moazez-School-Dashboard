"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ClipboardList, Layers3 } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface HomeworkCreationWorkflowProps {
  multipleClasses: boolean;
  locked: boolean;
  multipleUnavailable?: string;
  onChoose: (workflow: "draft" | "multiple") => void;
}

export default function HomeworkCreationWorkflow({ multipleClasses, locked, multipleUnavailable, onChoose }: HomeworkCreationWorkflowProps) {
  const t = useTranslations("academics.homework.manual");
  const unavailableId = useId();
  const choices = [
    { workflow: "draft", title: t("draftWorkflow"), description: t("draftWorkflowHelp"), Icon: ClipboardList, selected: !multipleClasses },
    { workflow: "multiple", title: t("multipleWorkflow"), description: t("multipleWorkflowHelp"), Icon: Layers3, selected: multipleClasses },
  ] as const;

  return <div role="group" aria-label={t("workflowChoice")} className="space-y-2">
    <div className="grid gap-3 md:grid-cols-2">
      {choices.map(({ workflow, title, description, Icon, selected }) => <Button
        key={workflow}
        variant="secondary"
        aria-label={title}
        aria-pressed={selected}
        aria-describedby={workflow === "multiple" && multipleUnavailable ? unavailableId : undefined}
        disabled={locked || (workflow === "multiple" && Boolean(multipleUnavailable))}
        onClick={() => onChoose(workflow)}
        className={`min-h-24 items-start justify-start rounded-xl p-4 text-start focus-visible:ring-2 ${selected ? "border-primary! bg-primary-50! text-primary!" : "bg-white"}`}
      >
        <span className="flex items-start gap-3">
          <Icon size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span><span className="block text-base font-semibold">{title}</span><span className="mt-1 block text-sm font-normal leading-5 text-gray-600">{description}</span></span>
        </span>
      </Button>)}
    </div>
    {multipleUnavailable && <p id={unavailableId} className="text-sm text-gray-600">{multipleUnavailable}</p>}
  </div>;
}

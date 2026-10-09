"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

type ManagementPanel = "readiness" | "publication" | "revisions";

export default function OnlineSessionManagementHistory({
  showPublication,
  readinessPanel,
  publicationPanel,
  revisionPanel,
}: {
  showPublication: boolean;
  readinessPanel: ReactNode;
  publicationPanel: ReactNode;
  revisionPanel: ReactNode;
}) {
  const t = useAcademicContentTranslations("online_session_detail.management");
  const [selected, setSelected] = useState<ManagementPanel>("readiness");
  const active =
    selected === "publication" && !showPublication ? "readiness" : selected;
  const panels: Record<ManagementPanel, ReactNode> = {
    readiness: readinessPanel,
    publication: publicationPanel,
    revisions: revisionPanel,
  };
  const options: ManagementPanel[] = showPublication
    ? ["readiness", "publication", "revisions"]
    : ["readiness", "revisions"];
  return (
    <section aria-label={t("label")} className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={active === option ? "primary" : "ghost"}
            aria-pressed={active === option}
            onClick={() => setSelected(option)}
          >
            {t(option)}
          </Button>
        ))}
      </div>
      <div>{panels[active]}</div>
    </section>
  );
}

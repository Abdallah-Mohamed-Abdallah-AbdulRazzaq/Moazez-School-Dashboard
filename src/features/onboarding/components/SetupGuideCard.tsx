"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSetupStatusContext } from "../context/SetupStatusContext";
import { SetupGuideContent } from "./SetupGuideContent";

function dismissedKey(schoolId: string) {
  return `sis:onboarding:dismissed:${schoolId || "unknown"}`;
}

export function SetupGuideCard() {
  const t = useTranslations("onboarding");
  const result = useSetupStatusContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const key = dismissedKey(result.schoolId);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setIsDismissed(sessionStorage.getItem(key) === "true");
    });
  }, [key]);

  if (result.evaluation.isComplete || isDismissed) {
    return null;
  }

  return (
    <div className="relative mb-5">
      <button
        aria-label={t("guide.dismiss")}
        className="absolute right-3 top-3 z-10 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => {
          sessionStorage.setItem(key, "true");
          setIsDismissed(true);
        }}
        type="button"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
      <SetupGuideContent result={result} />
    </div>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import AnnouncementBanner from "@/components/ui/announcement-banner/AnnouncementBanner";
import { buttonClassName } from "@/components/ui/button/Button";
import GuardedLink from "@/components/navigation/GuardedLink";
import { DashboardAnnouncementOutlet } from "@/components/layout/DashboardAnnouncementPlacement";
import { useAcademicContentTranslations } from "../hooks/useAcademicContentTranslations";

function subscribeToDismissal(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function storedDismissal(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) === "dismissed";
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    return false;
  }
}

export default function AcademicContentAnnouncement({
  userId,
  canView,
}: {
  userId: string;
  canView: boolean;
}) {
  const t = useAcademicContentTranslations("announcement");
  const locale = useLocale();
  const storageKey = `moazez:academic-content-launch:v1:${userId}`;
  const [closed, setClosed] = useState(false);
  const dismissed = useSyncExternalStore(
    subscribeToDismissal,
    () => storedDismissal(storageKey),
    () => false,
  );
  const closeAnnouncement = () => {
    setClosed(true);
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      // Closing must still work when the browser blocks persistent storage.
    }
  };

  if (!canView || closed || dismissed) return null;

  return (
    <DashboardAnnouncementOutlet>
      <AnnouncementBanner
        title={t("title")}
        description={t("description")}
        newLabel={t("new")}
        closeLabel={t("dismiss")}
        onClose={closeAnnouncement}
        action={
          <GuardedLink
            href={`/${locale}/academic-content-hub/library`}
            className={buttonClassName({
              size: "sm",
              className: "min-h-9 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            })}
          >
            {t("explore")}
            <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
          </GuardedLink>
        }
      />
    </DashboardAnnouncementOutlet>
  );
}

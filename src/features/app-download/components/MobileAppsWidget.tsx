import { Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  APP_DOWNLOAD_CONFIG,
  MOBILE_APP_AUDIENCES,
} from "@/features/app-download/utils/appDownloadAudience";
import { MobileAppStoreLinks } from "./MobileAppStoreLinks";

export function MobileAppsWidget() {
  const t = useTranslations();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary-50 p-2.5 text-primary-700">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-950">
            {t("mobile_apps.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("mobile_apps.description")}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MOBILE_APP_AUDIENCES.map((audience) => (
          <article key={audience} className="rounded-xl border border-gray-100 p-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t(`app_download.${APP_DOWNLOAD_CONFIG[audience].translationKey}`)}
            </h3>
            <div className="mt-3">
              <MobileAppStoreLinks audience={audience} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

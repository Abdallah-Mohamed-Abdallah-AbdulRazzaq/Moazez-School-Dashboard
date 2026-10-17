"use client";

import { useTranslations } from "next-intl";
import type { overviewProgress } from "../services/timetableOverviewProgress";

export default function TimetableOverviewProgress({
  progress,
}: {
  progress: ReturnType<typeof overviewProgress>;
}) {
  const t = useTranslations("academics.timetable.overview");
  return (
    <div className="min-w-0 space-y-2">
      <p
        className={`text-sm font-medium ${progress.needsReview ? "text-amber-800" : "text-gray-800"}`}
      >
        {t(`progressStep.${progress.step}`)}
      </p>
      {progress.completed !== undefined && progress.step !== "published" && (
        <>
          <progress
            className="block h-1.5 w-full max-w-48 appearance-none overflow-hidden rounded-full bg-gray-100 [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:bg-primary"
            value={progress.completed}
            max={3}
            aria-label={t("setupProgress", { count: progress.completed })}
          />
          <p className="text-xs text-gray-500">
            {t("setupProgress", { count: progress.completed })}
          </p>
          <p className="text-xs leading-5 text-gray-500">
            {t("setupCheckpoints")}
          </p>
        </>
      )}
      {progress.needsReview && (
        <p className="text-xs leading-5 text-amber-800">{t("reviewNeeded")}</p>
      )}
      {progress.step === "review" && !progress.needsReview && (
        <p className="text-xs leading-5 text-gray-500">
          {t("reviewInWorkspace")}
        </p>
      )}
    </div>
  );
}

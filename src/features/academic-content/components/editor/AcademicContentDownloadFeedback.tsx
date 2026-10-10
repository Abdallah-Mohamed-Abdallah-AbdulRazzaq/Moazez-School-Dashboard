"use client";

import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentDownloadState } from "../../hooks/useAcademicContentDownload";

export default function AcademicContentDownloadFeedback({ state }: {
  state: AcademicContentDownloadState | null;
}) {
  const t = useAcademicContentTranslations("downloads");
  if (!state) return null;
  const pending = state.phase === "preparing" || state.phase === "downloading";
  return (
    <div role={state.phase === "error" ? "alert" : "status"}
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
      <p className="break-words">{state.phase === "error" ? state.error : t(state.phase, { name: state.name })}</p>
      {pending ? (
        <div className="mt-2 flex items-center gap-3">
          <progress className="h-2 w-full min-w-0 accent-primary" max={100}
            value={state.percent ?? undefined} aria-label={t("progress_label", { name: state.name })} />
          {state.percent !== null ? <span>{state.percent}%</span> : null}
        </div>
      ) : null}
    </div>
  );
}

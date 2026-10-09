"use client";

import { useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  KeyRound,
  Radio,
  TriangleAlert,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import ButtonLink from "@/components/ui/button/ButtonLink";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  onlineSessionCountdownMinutes,
  onlineSessionDetailDurationMinutes,
  onlineSessionDetailState,
  onlineSessionJoinHref,
  type OnlineSessionDetailState,
} from "../../model/onlineSessionDetail";
import type {
  AcademicContentDetail,
  AcademicOnlineSessionPlatform,
} from "../../types/contracts";
import MeetingPlatformIcon from "../overview/MeetingPlatformIcon";

type Content = Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>;
const STATE_STYLE: Record<OnlineSessionDetailState, string> = {
  upcoming: "bg-amber-100 text-amber-800",
  live: "bg-emerald-100 text-emerald-800",
  ended: "bg-slate-200 text-slate-700",
};
const PLATFORM_CARD_STYLE: Record<AcademicOnlineSessionPlatform, string> = {
  GOOGLE_MEET:
    "border-emerald-200 bg-gradient-to-br from-[#0F9D58] via-[#087F5B] to-[#00695C]",
  ZOOM: "border-blue-200 bg-gradient-to-br from-[#2D8CFF] via-[#0B5CDE] to-[#173B8F]",
  MICROSOFT_TEAMS:
    "border-violet-200 bg-gradient-to-br from-[#6264A7] via-[#5059C9] to-[#343A75]",
  WEBEX:
    "border-cyan-200 bg-gradient-to-br from-[#00BCEB] via-[#008C95] to-[#075E73]",
  OTHER:
    "border-slate-200 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
};

export default function OnlineSessionLobbyHero({
  content,
  now = new Date(),
  onEdit,
}: {
  content: Content;
  now?: Date;
  onEdit?: () => void;
}) {
  const t = useAcademicContentTranslations("online_session_detail");
  const platformT = useAcademicContentTranslations("platforms");
  const locale = useLocale();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const detail = content.details;
  if (!detail)
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-6 text-amber-700"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-950">{content.title}</h1>
            <h2 className="mt-3 font-semibold text-amber-900">
              {t("incomplete_title")}
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              {t("incomplete_description")}
            </p>
            {onEdit ? (
              <Button className="mt-4" size="sm" onClick={onEdit}>
                {t("edit")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    );
  const state = onlineSessionDetailState(detail, now);
  const countdown = onlineSessionCountdownMinutes(detail, now);
  const joinHref = onlineSessionJoinHref(detail);
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const copyCode = async () => {
    if (!detail.accessCode) return;
    try {
      await navigator.clipboard.writeText(detail.accessCode);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };
  return (
    <section
      className={`overflow-hidden rounded-2xl border text-white shadow-lg ${PLATFORM_CARD_STYLE[detail.platform]}`}
    >
      <div className="p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <MeetingPlatformIcon platform={detail.platform} />
            <span className="text-sm font-semibold text-white/90">
              {detail.platform === "OTHER"
                ? detail.providerName || platformT("OTHER")
                : platformT(detail.platform)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATE_STYLE[state]}`}
            >
              {state === "live" ? (
                <Radio aria-hidden="true" className="size-3.5" />
              ) : (
                <CalendarClock aria-hidden="true" className="size-3.5" />
              )}
              {t(`states.${state}`)}
            </span>
          </div>
          <h1 className="mt-4 break-words text-xl font-bold">
            {content.title}
          </h1>
          <div className="mt-4 space-y-2 rounded-xl bg-black/10 p-3 text-sm text-white/90 ring-1 ring-white/10">
            <span className="inline-flex items-center gap-2">
              <CalendarClock aria-hidden="true" className="size-4" />
              <time dateTime={detail.startAt}>
                {formatter.format(new Date(detail.startAt))}
              </time>
            </span>
            <span className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4" />
              {t("duration_minutes", {
                minutes: onlineSessionDetailDurationMinutes(detail),
              })}
            </span>
            <span className="block ps-6 text-xs text-white/70">
              {detail.timezone}
            </span>
          </div>
          {countdown !== null ? (
            <p className="mt-3 text-sm font-medium text-white/90">
              {t("starts_in", { minutes: countdown })}
            </p>
          ) : null}
          {detail.accessCode ? (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
                <KeyRound aria-hidden="true" className="size-4" />
                <span className="truncate">
                  {t("access_code")}: <strong>{detail.accessCode}</strong>
                </span>
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={t("copy_access_code")}
                leftIcon={
                  copyState === "copied" ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Copy aria-hidden="true" className="size-4" />
                  )
                }
                onClick={() => void copyCode()}
              >
                {copyState === "copied" ? t("copied") : t("copy")}
              </Button>
              <span
                role={copyState === "error" ? "alert" : "status"}
                className="sr-only"
              >
                {copyState === "copied"
                  ? t("copied_announcement")
                  : copyState === "error"
                    ? t("copy_failed")
                    : ""}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-5 border-t border-white/15 pt-5">
          {joinHref ? (
            <ButtonLink
              href={joinHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
              fullWidth
              rightIcon={<ExternalLink aria-hidden="true" className="size-5" />}
              aria-label={t("join_session_named", { title: content.title })}
            >
              {t("join_session")}
            </ButtonLink>
          ) : (
            <Button
              size="lg"
              fullWidth
              disabled
              aria-label={t("meeting_link_unavailable")}
            >
              {t("join_session")}
            </Button>
          )}{" "}
          {!joinHref ? (
            <p className="mt-2 text-center text-xs text-white/70">
              {t("meeting_link_unavailable")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

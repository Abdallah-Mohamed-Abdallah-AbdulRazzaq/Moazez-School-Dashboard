"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Circle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { isApiError } from "@/lib/api-error";
import AuthenticatedFileImage from "@/components/ui/authenticated-file-image/AuthenticatedFileImage";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import StudentEnrollmentMissingState from "@/features/students-guardians/students/components/StudentEnrollmentMissingState";
import StudentTabSkeleton from "@/features/students-guardians/students/components/StudentTabSkeleton";
import { isStudentEnrollmentNotFoundError } from "@/features/students-guardians/students/utils/studentProfileErrors";
import { usePermissions } from "@/hooks/usePermissions";
import type { Student } from "@/features/students-guardians/students/types";
import { getStudentHeroJourneyProgress } from "@/features/hero-journey/services/heroJourneyProgressService";
import {
  awardHeroJourneyBadge,
  getStudentHeroJourneyRewards,
  grantHeroJourneyXp,
} from "@/features/hero-journey/services/heroJourneyRewardsService";
import {
  getMissionTitle,
  getRewardCoverage,
  isAwaitingMissionCompletion,
  normalizeHeroJourneyProgress,
  normalizeHeroJourneyRewards,
} from "./heroJourneyTabPresentation";
import type { HeroJourneyActivity, HeroJourneyMission } from "./heroJourneyTabTypes";

const eventIcons: Record<string, typeof Activity> = {
  mission_started: Activity,
  objective_completed: ClipboardCheck,
  mission_completed: CheckCircle2,
  xp_granted: Sparkles,
  badge_awarded: Award,
};

const statusStyles: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-amber-50 text-amber-700",
};

function MissionCard({ mission, locale, canDownloadFiles }: { mission: HeroJourneyMission; locale: string; canDownloadFiles: boolean }) {
  const t = useTranslations("students_guardians.hero_journey");
  const missionTitle = getMissionTitle(mission, locale);
  const title = missionTitle === "Mission" ? t("mission") : missionTitle;
  const progress = Math.min(Math.max(mission.progressPercent, 0), 100);
  const badgeName = mission.badgeReward
    ? (locale === "ar" ? mission.badgeReward.nameAr || mission.badgeReward.nameEn : mission.badgeReward.nameEn || mission.badgeReward.nameAr) || t("badge")
    : t("badge");

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("requiredObjectives", { completed: mission.completedRequiredObjectives, required: mission.requiredObjectives })}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[mission.status] ?? "bg-gray-100 text-gray-700"}`}>
          {t(`statuses.${mission.status}`)}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">{t("missionProgress")}</span>
          <span className="font-semibold text-gray-900">{progress}%</span>
        </div>
        <div role="progressbar" aria-label={t("progressLabel", { mission: title })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-teal-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isAwaitingMissionCompletion(mission) ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("awaitingCompletion")}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-violet-600" />{mission.rewardXp} XP</span>
        {mission.badgeReward ? <span className="inline-flex items-center gap-1.5"><AuthenticatedFileImage fileId={mission.badgeReward.fileId} fallbackSrc={mission.badgeReward.assetPath} alt={badgeName} canDownload={canDownloadFiles} unavailableLabel={t("badgeImageUnavailable")} retryLabel={t("retry")} className="h-7 w-7" />{badgeName}</span> : null}
        {mission.requiredLevel > 0 ? <span>{t("level", { level: mission.requiredLevel })}</span> : null}
        {mission.totalObjectives > 0 ? <span>{t("objectives", { completed: mission.completedObjectives, total: mission.totalObjectives })}{mission.optionalObjectives > 0 ? ` · ${t("optionalObjectives", { count: mission.optionalObjectives })}` : ""}</span> : null}
      </div>
      {mission.lastActivityAt ? <time dateTime={mission.lastActivityAt} className="mt-3 block text-xs text-gray-500">{t("lastActivity", { date: new Date(mission.lastActivityAt).toLocaleString(locale) })}</time> : null}
    </article>
  );
}

function ActivityFeed({ events, missionNames, locale }: { events: HeroJourneyActivity[]; missionNames: Map<string, string>; locale: string }) {
  const t = useTranslations("students_guardians.hero_journey");
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-labelledby="hero-journey-activity">
      <div className="mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-teal-700" /><h2 id="hero-journey-activity" className="font-semibold text-gray-900">{t("recentActivity")}</h2></div>
      {events.length ? <div className="space-y-3">{events.map((event) => {
        const Icon = eventIcons[event.type] ?? Circle;
        return <div key={event.id} className="flex gap-3 rounded-lg bg-gray-50 p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-700"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-sm font-medium text-gray-900">{t(`events.${event.type}`)}</p><p className="mt-0.5 truncate text-sm text-gray-600">{event.missionId ? missionNames.get(event.missionId) || t("mission") : t("heroJourney")}</p>{event.occurredAt ? <time dateTime={event.occurredAt} title={new Date(event.occurredAt).toLocaleString(locale)} className="mt-1 block text-xs text-gray-500">{new Date(event.occurredAt).toLocaleString(locale)}</time> : null}</div></div>;
      })}</div> : <p className="text-sm text-gray-500">{t("noRecentActivity")}</p>}
    </section>
  );
}

export default function HeroJourneyTab({ student, academicYearId, termId }: { student: Student; academicYearId?: string | null; termId?: string | null }) {
  const locale = useLocale();
  const t = useTranslations("students_guardians.hero_journey");
  const loadError = t("unableLoad");
  const { hasPermission, isPermissionsReady } = usePermissions();
  const [progress, setProgress] = useState(() => normalizeHeroJourneyProgress({}));
  const [rewards, setRewards] = useState(() => normalizeHeroJourneyRewards({}));
  const [amount, setAmount] = useState("");
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrollmentMissing, setIsEnrollmentMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const query = useMemo(() => ({ academicYearId: academicYearId || undefined, termId: termId || undefined }), [academicYearId, termId]);
  const rewardsQuery = useMemo(() => ({ ...query, includeEvents: true }), [query]);
  const load = useCallback(async () => {
    setLoading(true); setError(null); setIsEnrollmentMissing(false);
    try {
      const [nextProgress, nextRewards] = await Promise.all([getStudentHeroJourneyProgress(student.id, query), getStudentHeroJourneyRewards(student.id, rewardsQuery)]);
      setProgress(normalizeHeroJourneyProgress(nextProgress));
      setRewards(normalizeHeroJourneyRewards(nextRewards));
    } catch (caught) {
      if (isStudentEnrollmentNotFoundError(caught)) setIsEnrollmentMissing(true);
      else setError(loadError);
    }
    finally { setLoading(false); }
  }, [loadError, query, rewardsQuery, student.id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const canGrantXp = isPermissionsReady && hasPermission("reinforcement.hero.progress.manage");
  const canAwardBadge = isPermissionsReady && hasPermission("reinforcement.hero.progress.manage");
  const canDownloadFiles = isPermissionsReady && hasPermission("files.downloads.view");
  const missionNames = useMemo(() => new Map(progress.missions.map((mission) => [mission.id, getMissionTitle(mission, locale)])), [locale, progress.missions]);
  const activeProgressId = progress.missions.find((mission) => mission.status.toLowerCase() === "completed" && mission.progressId)?.progressId || "";
  const mutationErrorMessage = (caught: unknown, fallback: string) => {
    if (!isApiError(caught)) return fallback;
    return `${caught.message}${caught.traceId ? ` · ${t("reference")}: ${caught.traceId}` : ""}`;
  };
  const grantXp = async () => {
    if (
      !activeProgressId ||
      !Number.isInteger(Number(amount)) ||
      Number(amount) <= 0
    )
      return;
    try { await grantHeroJourneyXp(activeProgressId, { amount: Number(amount) }); setAmount(""); setIsXpModalOpen(false); await load(); }
    catch (caught) { setError(mutationErrorMessage(caught, t("unableGrant"))); }
  };
  const awardBadge = async () => {
    if (!activeProgressId) return;
    try { await awardHeroJourneyBadge(activeProgressId, {}); await load(); }
    catch (caught) { setError(mutationErrorMessage(caught, t("unableAward"))); }
  };

  if (loading) return <StudentTabSkeleton variant="dashboard" />;
  if (isEnrollmentMissing) return <StudentEnrollmentMissingState />;
  if (error && !progress.missions.length) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><p>{error}</p><Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => void load()}>{t("retry")}</Button></div>;

  const total = Math.max(progress.summary.missionsTotal, 1);
  return <div className="space-y-4">
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-teal-700">{t("title")}</p><h2 className="mt-1 text-3xl font-bold text-gray-900">{progress.summary.completionRate}%</h2><p className="mt-1 text-sm text-gray-500">{t("overallCompletion")} · {t("missionsCount", { count: progress.summary.missionsTotal })}</p><p className="mt-1 text-xs text-gray-500">{t("academicContext", { year: progress.enrollment.academicYearId || academicYearId || "—", term: progress.enrollment.termId || termId || "—" })}</p></div>{canGrantXp || canAwardBadge ? <div><div className="flex flex-wrap gap-2">{canGrantXp ? <Button type="button" onClick={() => setIsXpModalOpen(true)} disabled={!activeProgressId}>{t("grantXp")}</Button> : null}{canAwardBadge ? <Button type="button" variant="secondary" onClick={() => void awardBadge()} disabled={!activeProgressId}>{t("awardBadge")}</Button> : null}</div>{!activeProgressId ? <p className="mt-2 max-w-xs text-xs text-amber-700">{t("completeBeforeRewards")}</p> : null}</div> : null}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["not_started", progress.summary.notStarted, "bg-slate-400"],["in_progress", progress.summary.inProgress, "bg-sky-500"],["completed", progress.summary.completed, "bg-emerald-500"],["cancelled", progress.summary.cancelled, "bg-amber-400"]].map(([status, value, color]) => <div key={String(status)} className="rounded-lg bg-gray-50 p-3"><span className={`inline-block h-2 w-2 rounded-full ${color}`} /><p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p><p className="text-sm text-gray-600">{t(`statuses.${status}`)}</p></div>)}</div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-gray-100">{[[progress.summary.notStarted,"bg-slate-400"],[progress.summary.inProgress,"bg-sky-500"],[progress.summary.completed,"bg-emerald-500"],[progress.summary.cancelled,"bg-amber-400"]].map(([value, color], index) => <div key={index} className={String(color)} style={{ width: `${(Number(value) / total) * 100}%` }} />)}</div>
    </section>
    {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    {progress.missions.length ? <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><section aria-labelledby="hero-journey-missions"><h2 id="hero-journey-missions" className="mb-3 text-lg font-semibold text-gray-900">{t("missions")}</h2><div className="space-y-3">{progress.missions.map((mission) => <MissionCard key={mission.id} mission={mission} locale={locale} canDownloadFiles={canDownloadFiles} />)}</div></section><ActivityFeed events={progress.recentEvents} missionNames={missionNames} locale={locale} /></div> : <div className="rounded-xl border border-gray-200 bg-white p-8 text-center"><Target className="mx-auto h-8 w-8 text-gray-400" /><h2 className="mt-3 font-semibold text-gray-900">{t("noMissions")}</h2><p className="mt-1 text-sm text-gray-500">{t("noMissionsDescription")}</p></div>}
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal-700">{t("rewardsAudit")}</p><h2 className="mt-1 text-xl font-semibold text-gray-900">{t("coverageHistory")}</h2><p className="mt-1 text-sm text-gray-500">{(locale === "ar" ? rewards.student.nameAr || `${rewards.student.firstName || ""} ${rewards.student.lastName || ""}` : `${rewards.student.firstName || ""} ${rewards.student.lastName || ""}`) || t("mission")} · {rewards.student.code || rewards.student.admissionNo || rewards.student.id || "—"}</p></div><p className="text-sm text-gray-500">{t("academicContextLedger")}</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["heroXp", rewards.totalHeroXp, "text-violet-700"],["badgesEarned", rewards.badgesCount, "text-amber-700"],["completedMissions", rewards.summary.completedMissions, "text-slate-800"],["xpCoverage", `${getRewardCoverage(rewards.summary).xp}%`, "text-teal-700"],["badgeCoverage", `${getRewardCoverage(rewards.summary).badges}%`, "text-teal-700"]].map(([label,value,color]) => <div key={String(label)} className="rounded-lg border border-gray-100 bg-gray-50 p-3"><p className="text-xs font-medium text-gray-500">{t(String(label))}</p><p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p></div>)}</div>
    </section>
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-semibold text-gray-900">{t("reconciliation")}</h2><div className="mt-4 space-y-3">{rewards.missions.length ? rewards.missions.map((mission) => { const title = locale === "ar" ? mission.titleAr || mission.titleEn : mission.titleEn || mission.titleAr; const xpStatus = mission.rewardXp <= 0 ? t("notConfigured") : mission.xpGranted ? t("granted") : t("pendingAward"); const badgeStatus = !mission.badgeRewardId ? t("notConfigured") : mission.badgeAwarded ? t("awarded") : t("pendingAward"); return <div key={mission.missionId} className="grid gap-3 rounded-lg border border-gray-100 p-3 md:grid-cols-[1.5fr_repeat(3,1fr)]"><div><p className="font-medium text-gray-900">{title || t("mission")}</p><p className="mt-1 text-xs text-gray-500">{t("completed", { date: mission.completedAt ? new Date(mission.completedAt).toLocaleString(locale) : "—" })}</p></div><div><p className="text-xs text-gray-500">{t("configuredXp")}</p><p className="font-semibold text-gray-900">{mission.rewardXp || "—"}</p><p className="text-xs text-gray-600">{xpStatus}</p></div><div><p className="text-xs text-gray-500">{t("badgeReward")}</p><p className="font-semibold text-gray-900">{mission.badgeRewardId ? t("configured") : "—"}</p><p className="text-xs text-gray-600">{badgeStatus}</p></div><div className="text-xs text-gray-500">{t("progress")}: {mission.progressId || "—"}<br />{t("xpLedger")}: {mission.xpLedgerId || "—"}<br />{t("studentBadge")}: {mission.studentBadgeId || "—"}</div></div>; }) : <p className="py-5 text-sm text-gray-500">{t("noCompletedMissions")}</p>}</div></section>
    <div className="grid gap-4 xl:grid-cols-2"><section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-semibold text-gray-900">{t("xpLedger")}</h2><div className="mt-4 space-y-3">{rewards.xpLedger.length ? rewards.xpLedger.map((entry) => <div key={entry.id} className="rounded-lg bg-violet-50 p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-violet-900">+{entry.amount} XP</p><p className="text-xs text-gray-500">{entry.occurredAt ? new Date(entry.occurredAt).toLocaleString(locale) : "—"}</p></div><p className="mt-1 text-sm text-gray-700">{(locale === "ar" ? entry.reasonAr || entry.reason : entry.reason) || t("noDescription")}</p><p className="mt-2 text-xs text-gray-500">{entry.sourceType || "—"} · {t("mission")}: {missionNames.get(entry.missionId || "") || entry.missionId || "—"} · {entry.actorUserId || "—"} · {entry.policyId || "—"}</p></div>) : <p className="py-5 text-sm text-gray-500">{t("noXpGrants")}</p>}</div></section><section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-semibold text-gray-900">{t("earnedBadges")}</h2><div className="mt-4 space-y-3">{rewards.badges.length ? rewards.badges.map((earned) => { const earnedBadgeName = (locale === "ar" ? earned.badge.nameAr || earned.badge.nameEn : earned.badge.nameEn || earned.badge.nameAr) || earned.badge.slug || t("badge"); return <div key={earned.id} className="flex gap-3 rounded-lg bg-amber-50 p-3"><AuthenticatedFileImage fileId={earned.badge.fileId} fallbackSrc={earned.badge.assetPath} alt={earnedBadgeName} canDownload={canDownloadFiles} unavailableLabel={t("badgeImageUnavailable")} retryLabel={t("retry")} className="h-10 w-10" /><div className="min-w-0"><p className="font-semibold text-amber-900">{earnedBadgeName}</p><p className="mt-1 text-sm text-gray-700">{(locale === "ar" ? earned.badge.descriptionAr || earned.badge.descriptionEn : earned.badge.descriptionEn || earned.badge.descriptionAr) || t("noDescription")}</p><p className="mt-1 text-xs text-gray-500">{t("earned", { date: earned.earnedAt ? new Date(earned.earnedAt).toLocaleString(locale) : "—" })} · {t("mission")}: {missionNames.get(earned.missionId || "") || earned.missionId || "—"}</p></div></div>; }) : <p className="py-5 text-sm text-gray-500">{t("noBadges")}</p>}</div></section></div>
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-semibold text-gray-900">{t("supportingEvents")}</h2><div className="mt-4 space-y-2">{rewards.events.length ? rewards.events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"><span className="font-medium text-gray-900">{t(`events.${event.type}`)}</span><span className="text-gray-600">{missionNames.get(event.missionId || "") || event.missionId || t("heroJourney")}</span><span className="text-xs text-gray-500">{event.occurredAt ? new Date(event.occurredAt).toLocaleString(locale) : "—"} · {event.actorUserId || "—"}</span></div>) : <p className="py-3 text-sm text-gray-500">{t("noSupportingEvents")}</p>}</div></section>
    <Modal isOpen={isXpModalOpen} onClose={() => setIsXpModalOpen(false)} title={t("grantHeroXp")} size="sm" footer={<><Button type="button" variant="secondary" onClick={() => setIsXpModalOpen(false)}>{t("cancel")}</Button><Button type="button" onClick={() => void grantXp()} disabled={!activeProgressId || !Number.isInteger(Number(amount)) || Number(amount) <= 0}>{t("grantXp")}</Button></>}>
      <label htmlFor="profile-hero-xp" className="block text-sm font-medium text-gray-700">{t("xpAmount")}</label>
      <input id="profile-hero-xp" aria-label="XP amount" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
    </Modal>
  </div>;
}

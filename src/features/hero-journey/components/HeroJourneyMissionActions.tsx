"use client";

import { useTranslations } from "next-intl";
import { Archive, PencilLine, Power, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { HeroJourneyMission } from "../types";
import { isHeroMissionEditable } from "../services/heroJourneyMissionContract";

export interface HeroJourneyMissionActionsProps {
  mission: HeroJourneyMission | null;
  canManage: boolean;
  isPublishing: boolean;
  deletingMissionId: string | null;
  onEdit: (missionId: string) => void;
  onDelete: (missionId: string) => void;
  onPublish: (missionId: string) => void;
  onArchive: (missionId: string) => void;
  iconOnly?: boolean;
}

export default function HeroJourneyMissionActions({
  mission,
  canManage,
  isPublishing,
  deletingMissionId,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  iconOnly = false,
}: HeroJourneyMissionActionsProps) {
  const t = useTranslations("heroJourney");

  if (!mission || !canManage) {
    return null;
  }

  return (
    <>
      {isHeroMissionEditable(mission.status) ? (
        <Button
          variant="secondary"
          size={iconOnly ? "sm" : "md"}
          className={iconOnly ? "h-9 w-9 p-0" : ""}
          title={t("actions.edit")}
          aria-label={t("actions.edit")}
          onClick={() => onEdit(mission.id)}
        >
          <PencilLine className="h-4 w-4" />
        </Button>
      ) : null}
      <Button
        variant="danger"
        size={iconOnly ? "sm" : "md"}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
        title={t("actions.delete")}
        aria-label={t("actions.delete")}
        onClick={() => onDelete(mission.id)}
        disabled={deletingMissionId === mission.id}
      >
        <Trash2 className="h-4 w-4" />{" "}
      </Button>
      <Button
        size={iconOnly ? "sm" : "md"}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
        title={t("actions.publish")}
        aria-label={t("actions.publish")}
        onClick={() => onPublish(mission.id)}
        disabled={
          isPublishing ||
          mission.status === "published" ||
          mission.status === "archived"
        }
      >
        <Power className="h-4 w-4" />
      </Button>
      <Button
        size={iconOnly ? "sm" : "md"}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
        title={t("actions.archive")}
        aria-label={t("actions.archive")}
        onClick={() => onArchive(mission.id)}
        disabled={isPublishing || mission.status === "archived"}
      >
        <Archive className="h-4 w-4" />
      </Button>
    </>
  );
}

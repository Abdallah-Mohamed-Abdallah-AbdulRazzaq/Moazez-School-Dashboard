"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { Button, Select } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import type { Classroom } from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetableConflictDisplay } from "../services/timetableConflictNormalization";
import {
  previewLessonTransfer,
  type LessonTransferInput,
} from "../services/timetableLessonTransfer";
import { mergeTimetableEntriesForValidation } from "../services/timetableDragDrop";
import type { TimetableDropTarget } from "../services/timetableDragDrop";
import type { TimetableEntry } from "../types/timetable";
import { formatTimetableTimeRange } from "../services/timetableTimeFormat";

interface LocalizedLessonReference {
  id: string;
  nameAr: string;
  nameEn: string;
}
interface TimetableLessonTransferDialogProps {
  input: Omit<LessonTransferInput, "target" | "createEntryId">;
  subjects: LocalizedLessonReference[];
  teachers: LocalizedLessonReference[];
  configurationName: string;
  scopeName: string;
  locale: string;
  classroomName: (classroom: Classroom) => string;
  checkConflicts: (
    entries: TimetableEntry[],
    destinationEntryId: string,
  ) => Promise<TimetableConflictDisplay[]>;
  onConfirm: (target: TimetableDropTarget) => void;
  onClose: () => void;
}
type DestinationCheck = {
  key: string;
  status: "checking" | "ready" | "blocked" | "failed";
  conflicts: TimetableConflictDisplay[];
};

export default function TimetableLessonTransferDialog(
  props: TimetableLessonTransferDialogProps,
) {
  const t = useTranslations("academics.timetable.transfer");
  const { input } = props;
  const source = input.entries.find((entry) => entry.id === input.sourceId);
  const [classroomId, setClassroomId] = useState(source?.classroomId ?? "");
  const [dayKey, setDayKey] = useState(source?.dayKey ?? "");
  const [periodIndex, setPeriodIndex] = useState("");
  const [check, setCheck] = useState<DestinationCheck | null>(null);
  const checkSequence = useRef(0);
  const classroom = input.classrooms.find(
    (candidate) => candidate.id === classroomId,
  );
  const target = {
    classroomId,
    sectionId: classroom?.sectionId ?? "",
    dayKey,
    periodIndex: Number(periodIndex),
  };
  const complete = Boolean(classroom && dayKey && periodIndex);
  const preview = previewLessonTransfer({
    ...input,
    target,
    createEntryId: () => "temp-transfer-preview",
  });
  const fingerprint = JSON.stringify([input, target]);
  const currentCheck = check?.key === fingerprint ? check : null;
  const checking = currentCheck?.status === "checking";
  const ready =
    currentCheck?.status === "ready" && preview.status === "APPLIED";
  const localizedName = (
    reference: Pick<LocalizedLessonReference, "nameAr" | "nameEn">,
  ) => (props.locale === "ar" ? reference.nameAr : reference.nameEn);
  const nameForId = (
    references: LocalizedLessonReference[],
    id: string | null,
  ) => {
    const reference = references.find((candidate) => candidate.id === id);
    return reference ? localizedName(reference) : t("unassigned");
  };
  const locationLabel = (
    entry: Pick<TimetableEntry, "classroomId" | "dayKey" | "periodIndex">,
  ) => {
    const entryClassroom = input.classrooms.find(
      (candidate) => candidate.id === entry.classroomId,
    );
    const day = input.config.days.find(
      (candidate) => candidate.key === entry.dayKey,
    );
    const period = input.config.periods.find(
      (candidate) => candidate.index === entry.periodIndex,
    );
    return [
      entryClassroom ? props.classroomName(entryClassroom) : "",
      day ? localizedName(day) : "",
      period ? localizedName(period) : "",
    ]
      .filter(Boolean)
      .join(" · ");
  };
  const runConflictCheck = async () => {
    if (!complete || preview.status !== "APPLIED") return;
    const request = ++checkSequence.current;
    setCheck({ key: fingerprint, status: "checking", conflicts: [] });
    try {
      const destination = preview.entries.find(
        (entry) =>
          entry.classroomId === target.classroomId &&
          entry.dayKey === target.dayKey &&
          entry.periodIndex === target.periodIndex &&
          entry.subjectId,
      );
      if (!destination) throw new Error("Transfer destination is missing.");
      const conflicts = await props.checkConflicts(
        preview.entries,
        destination.id,
      );
      if (request !== checkSequence.current) return;
      setCheck({
        key: fingerprint,
        status: conflicts.length ? "blocked" : "ready",
        conflicts,
      });
    } catch {
      if (request === checkSequence.current)
        setCheck({ key: fingerprint, status: "failed", conflicts: [] });
    }
  };
  const destinationEntry = mergeTimetableEntriesForValidation(
    input.allTermEntries,
    input.entries,
  ).find(
    (entry) =>
      entry.classroomId === classroomId &&
      entry.dayKey === dayKey &&
      entry.periodIndex === Number(periodIndex) &&
      (entry.subjectId || entry.slotType === "BREAK"),
  );

  return (
    <Modal
      isOpen
      onClose={props.onClose}
      title={t(input.mode)}
      description={t("chooseDestination")}
      size="lg"
      footer={
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={props.onClose}
          >
            {t("cancel")}
          </Button>

          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => void runConflictCheck()}
            loading={checking}
            disabled={!complete || preview.status !== "APPLIED" || checking}
          >
            {t("checkDestination")}
          </Button>
          <Button
            className="col-span-2 min-h-11"
            onClick={() => props.onConfirm(target)}
            disabled={!ready || checking}
          >
            {t(input.mode === "copy" ? "confirmCopy" : "confirmMove")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-medium">{props.configurationName}</p>
          <p className="mt-1 text-xs">
            {t("scope", { scope: props.scopeName })}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label={t("classroom")}
            value={classroomId}
            onChange={setClassroomId}
            options={input.classrooms.map((candidate) => ({
              value: candidate.id,
              label: props.classroomName(candidate),
            }))}
            searchable
            searchLabel={t("searchClassrooms")}
            searchPlaceholder={t("searchClassrooms")}
            noResultsText={t("noClassrooms")}
          />
          <Select
            label={t("day")}
            value={dayKey}
            onChange={setDayKey}
            options={input.config.days
              .filter((day) => day.isActive)
              .map((day) => ({ value: day.key, label: localizedName(day) }))}
          />
          <div className="sm:col-span-2">
            <Select
              label={t("period")}
              value={periodIndex}
              onChange={setPeriodIndex}
              placeholder={t("selectPeriod")}
              options={input.config.periods
                .filter((period) => period.isInstructional !== false)
                .map((period) => ({
                  value: String(period.index),
                  label: `${localizedName(period)}${period.startTime && period.endTime ? ` · \u2066${formatTimetableTimeRange(period.startTime, period.endTime)}\u2069` : ""}`,
                }))}
            />
          </div>
        </div>
        {source?.subjectId && (
          <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="min-w-0 rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{t("source")}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {locationLabel(source)}
              </p>
              <p className="mt-2 text-sm font-semibold text-primary-800">
                {nameForId(props.subjects, source.subjectId)}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {nameForId(props.teachers, source.teacherId)} ·{" "}
                {nameForId(input.rooms, source.roomId)}
              </p>
            </div>
            <ArrowRight
              className="hidden h-5 w-5 self-center text-gray-400 sm:block rtl:rotate-180"
              aria-hidden="true"
            />
            <div className="min-w-0 rounded-lg border border-primary-200 bg-primary-50 p-3">
              <p className="text-xs text-primary-800">
                {t("destinationPreview")}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {complete ? locationLabel(target) : t("selectDestination")}
              </p>
              {complete && (
                <>
                  <p className="mt-2 text-sm font-semibold text-primary-800">
                    {nameForId(props.subjects, source.subjectId)}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {nameForId(props.teachers, source.teacherId)} ·{" "}
                    {nameForId(input.rooms, source.roomId)}
                  </p>
                  <p className="mt-2 text-xs text-gray-700">
                    {destinationEntry
                      ? t("currentlyOccupied", {
                          subject: nameForId(
                            props.subjects,
                            destinationEntry.subjectId,
                          ),
                        })
                      : t("currentlyEmpty")}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-600">
          {t(input.mode === "copy" ? "copyEffect" : "moveEffect")}
        </p>
        {!source?.roomId && (
          <p className="text-xs text-amber-800">{t("missingRoom")}</p>
        )}
        <div aria-live="polite" aria-atomic="true" className="space-y-2">
          {complete && preview.status === "REJECTED" && (
            <p
              role="alert"
              className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(`rejections.${preview.reason}`)}
            </p>
          )}
          {checking && <p className="text-sm text-gray-600">{t("checking")}</p>}
          {currentCheck?.status === "failed" && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {t("checkFailed")}
            </p>
          )}
          {currentCheck?.status === "blocked" && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              <p className="font-medium">{t("conflictsFound")}</p>
              <ul className="mt-2 list-disc space-y-1 ps-5">
                {currentCheck.conflicts.map((conflict, index) => (
                  <li key={index}>{conflict.message}</li>
                ))}
              </ul>
            </div>
          )}
          {ready && (
            <p className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("ready")}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

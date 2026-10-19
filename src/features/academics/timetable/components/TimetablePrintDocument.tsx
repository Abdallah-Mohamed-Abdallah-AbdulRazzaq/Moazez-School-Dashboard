"use client";

import { useTranslations } from "next-intl";
import type { TimetableEntry } from "../types/timetable";
import type { ResolvedTimetableConfig } from "../types/timetableConfig";
import { formatTimetableTimeRange } from "../services/timetableTimeFormat";
import { timetableSubjectName } from "../services/timetableSubjectDisplay";
import styles from "./TimetablePrint.module.css";

interface PrintReference {
  id: string;
  nameAr: string;
  nameEn: string;
}
export interface TimetablePrintDocumentProps {
  locale: string;
  schoolName: string;
  logoUrl: string;
  contextName: string;
  configurationName: string;
  scopeName: string;
  status: string;
  classrooms: { id: string; label: string }[];
  entries: TimetableEntry[];
  config: ResolvedTimetableConfig;
  subjects: PrintReference[];
  teachers: PrintReference[];
  rooms: PrintReference[];
  layout: "classroom" | "compact";
  showTeachers: boolean;
  showRooms: boolean;
  printedAt: string;
  classroomOffset?: number;
  totalClassrooms?: number;
}

export default function TimetablePrintDocument(
  props: TimetablePrintDocumentProps,
) {
  const t = useTranslations("academics.timetable.printing");
  const tGrid = useTranslations("academics.timetable.grid");
  const days = props.config.days.filter((day) => day.isActive);
  const periods = [...props.config.periods].sort(
    (left, right) => left.index - right.index,
  );
  const localized = (item: { nameAr: string; nameEn: string }) =>
    props.locale === "ar" ? item.nameAr : item.nameEn;
  const name = (references: PrintReference[], id: string | null) => {
    const item = references.find((reference) => reference.id === id);
    return item ? localized(item) : t("unassigned");
  };
  const slots = new Map(
    props.entries.map((entry) => [
      `${entry.classroomId}:${entry.dayKey}:${entry.periodIndex}`,
      entry,
    ]),
  );

  return (
    <article
      className={`${styles.report} ${props.layout === "compact" ? styles.compact : ""}`}
      dir={props.locale === "ar" ? "rtl" : "ltr"}
      lang={props.locale}
    >
      {props.classrooms.map((classroom, index) => (
        <section
          key={classroom.id}
          className={styles.sheet}
          aria-label={classroom.label}
        >
          <header className={styles.header}>
            <div>
              <p className={styles.school}>{props.schoolName}</p>
              <h2>{classroom.label}</h2>
              <p>{props.contextName}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.logoUrl} alt="" className={styles.logo} />
          </header>
          <div className={styles.metadata}>
            <span>{props.configurationName}</span>
            <span>{t("scope", { scope: props.scopeName })}</span>
            <strong>{props.status}</strong>
          </div>
          <table>
            <caption className="sr-only">{classroom.label}</caption>
            <thead>
              <tr>
                <th scope="col" className={styles.period}>
                  {t("period")}
                </th>
                {days.map((day) => (
                  <th scope="col" key={day.key}>
                    {localized(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id}>
                  <th scope="row" className={styles.period}>
                    {localized(period)}
                    {period.startTime && period.endTime && (
                      <bdi className={styles.time}>
                        {formatTimetableTimeRange(
                          period.startTime,
                          period.endTime,
                        )}
                      </bdi>
                    )}
                  </th>
                  {days.map((day) => {
                    const entry = slots.get(
                      `${classroom.id}:${day.key}:${period.index}`,
                    );
                    const isBreak =
                      period.isInstructional === false ||
                      entry?.slotType === "BREAK";
                    return (
                      <td
                        key={day.key}
                        className={isBreak ? styles.break : undefined}
                      >
                        {isBreak ? (
                          (entry?.slotType === "BREAK"
                            ? props.locale === "ar"
                              ? entry.breakLabelAr
                              : entry.breakLabelEn
                            : localized(period)) || t("break")
                        ) : entry?.subjectId ? (
                          <>
                            <strong>
                              {timetableSubjectName(entry, props.subjects.find((subject) => subject.id === entry.subjectId), props.locale) || tGrid("unavailableSubject")}
                            </strong>
                            {!props.subjects.some((subject) => subject.id === entry.subjectId) && (
                              <span>{tGrid("unavailableSubject")}</span>
                            )}
                            {props.showTeachers && (
                              <span>
                                {name(props.teachers, entry.teacherId)}
                              </span>
                            )}
                            {props.showRooms && entry.roomId && (
                              <span>
                                {t("room", {
                                  room: name(props.rooms, entry.roomId),
                                })}
                              </span>
                            )}
                          </>
                        ) : (
                          <span aria-label={t("empty")}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <footer className={styles.footer}>
            <span>{t("printedAt", { time: props.printedAt })}</span>
            <span>
              {t("classroomCount", {
                current: (props.classroomOffset ?? 0) + index + 1,
                total: props.totalClassrooms ?? props.classrooms.length,
              })}
            </span>
          </footer>
        </section>
      ))}
    </article>
  );
}

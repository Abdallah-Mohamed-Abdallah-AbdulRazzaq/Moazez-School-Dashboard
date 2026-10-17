"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

interface ClassroomItem {
  id: string;
  label: string;
}

interface Props {
  classrooms: ClassroomItem[];
  scrollRef: RefObject<HTMLDivElement | null>;
  activeDrag: boolean;
  revealClassroomId?: string;
  revealRequest: unknown;
  printing: boolean;
  children: (classroomId: string) => ReactNode;
}

export default function TimetableClassroomList({
  classrooms,
  scrollRef,
  activeDrag,
  revealClassroomId,
  revealRequest,
  printing,
  children,
}: Props) {
  const t = useTranslations("academics.timetable.classroomList");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [lastReveal, setLastReveal] = useState({
    id: revealClassroomId,
    request: revealRequest,
  });

  if (
    lastReveal.id !== revealClassroomId ||
    lastReveal.request !== revealRequest
  ) {
    setLastReveal({ id: revealClassroomId, request: revealRequest });
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (revealClassroomId) next.delete(revealClassroomId);
      return next;
    });
  }

  const toggle = (id: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      {classrooms.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 print:hidden">
          <p className="text-sm font-medium text-gray-700">
            {t("count", { count: classrooms.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="min-h-11 focus-visible:ring-2 focus-visible:ring-primary"
              disabled={
                activeDrag || !classrooms.some((item) => collapsed.has(item.id))
              }
              onClick={() => setCollapsed(new Set())}
            >
              {t("expandAll")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="min-h-11 focus-visible:ring-2 focus-visible:ring-primary"
              disabled={
                activeDrag || classrooms.every((item) => collapsed.has(item.id))
              }
              onClick={() =>
                setCollapsed(new Set(classrooms.map((item) => item.id)))
              }
            >
              {t("collapseAll")}
            </Button>
          </div>
        </div>
      )}
      {classrooms.map((classroom, index) => (
        <ClassroomTimetable
          key={classroom.id}
          classroom={classroom}
          scrollRef={scrollRef}
          initiallyLoaded={index < 2}
          collapsed={collapsed.has(classroom.id)}
          showHeader={classrooms.length > 1}
          forceLoaded={
            printing ||
            classrooms.length === 1 ||
            classroom.id === revealClassroomId
          }
          printing={printing}
          activeDrag={activeDrag}
          onToggle={() => toggle(classroom.id)}
          onDragEnter={() => {
            if (activeDrag && collapsed.has(classroom.id)) toggle(classroom.id);
          }}
        >
          {() => children(classroom.id)}
        </ClassroomTimetable>
      ))}
    </div>
  );
}

interface ClassroomTimetableProps {
  classroom: ClassroomItem;
  scrollRef: Props["scrollRef"];
  initiallyLoaded: boolean;
  collapsed: boolean;
  showHeader: boolean;
  forceLoaded: boolean;
  printing: boolean;
  activeDrag: boolean;
  onToggle: () => void;
  onDragEnter: () => void;
  children: () => ReactNode;
}

function ClassroomTimetable({
  classroom,
  scrollRef,
  initiallyLoaded,
  collapsed,
  showHeader,
  forceLoaded,
  printing,
  activeDrag,
  onToggle,
  onDragEnter,
  children,
}: ClassroomTimetableProps) {
  const t = useTranslations("academics.timetable.classroomList");
  const contentId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(initiallyLoaded);
  const expanded = printing || !showHeader || !collapsed;

  useEffect(() => {
    if (loaded || !expanded || !sectionRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { root: scrollRef.current, rootMargin: "800px 0px" },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [expanded, loaded, scrollRef]);

  return (
    <section
      ref={sectionRef}
      aria-label={classroom.label}
      className="relative space-y-3"
    >
      {showHeader && (
        <h3
          onPointerEnter={onDragEnter}
          className="rounded-lg border border-gray-200 bg-white print:rounded-none print:border-x-0"
        >
          <Button
            variant="ghost"
            disabled={activeDrag}
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={onToggle}
            rightIcon={
              <span className="print:hidden">
                {expanded ? (
                  <ChevronUp size={18} aria-hidden />
                ) : (
                  <ChevronDown size={18} aria-hidden />
                )}
              </span>
            }
            className="min-h-12 w-full justify-between! text-start text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary [&>span:last-child]:shrink-0"
          >
            {classroom.label}
          </Button>
        </h3>
      )}
      <div id={contentId} hidden={!expanded}>
        {expanded &&
          (loaded || forceLoaded ? (
            children()
          ) : (
            <div className="flex min-h-[600px] items-start justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 pt-12">
              <Button variant="secondary" onClick={() => setLoaded(true)}>
                {t("load")}
              </Button>
            </div>
          ))}
      </div>
    </section>
  );
}

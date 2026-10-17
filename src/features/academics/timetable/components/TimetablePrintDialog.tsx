"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { Button, Select } from "@/components/ui";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Modal from "@/components/ui/modal/Modal";
import { usePrint } from "@/components/print";
import TimetablePrintDocument, {
  type TimetablePrintDocumentProps,
} from "./TimetablePrintDocument";
import styles from "./TimetablePrint.module.css";

interface Props extends Omit<
  TimetablePrintDocumentProps,
  "classrooms" | "layout" | "showTeachers" | "showRooms" | "printedAt"
> {
  open: boolean;
  onClose: () => void;
  classrooms: TimetablePrintDocumentProps["classrooms"];
  visibleClassroomIds: string[];
}

export default function TimetablePrintDialog(props: Props) {
  const t = useTranslations("academics.timetable.printing");
  const [layout, setLayout] = useState<"classroom" | "compact">("classroom");
  const [scope, setScope] = useState("visible");
  const [previewId, setPreviewId] = useState("");
  const [showTeachers, setShowTeachers] = useState(true);
  const [showRooms, setShowRooms] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [printedAt, setPrintedAt] = useState("");
  const [error, setError] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const printDocument = usePrint({
    contentRef: printRef,
    title: `${props.schoolName} - ${props.configurationName}`,
  });
  const classrooms =
    scope === "all"
      ? props.classrooms
      : props.classrooms.filter((item) =>
          props.visibleClassroomIds.includes(item.id),
        );
  const preview =
    classrooms.find((item) => item.id === previewId) ?? classrooms[0];

  const documentProps = {
    ...props,
    classrooms,
    layout,
    showTeachers,
    showRooms,
    printedAt,
  };

  useEffect(() => {
    const beforePrint = () =>
      flushSync(() => {
        setPrintedAt(printTimestamp(props.locale));
        setPreparing(true);
      });
    const afterPrint = () => setPreparing(false);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [props.locale]);

  const print = async () => {
    setError(false);
    flushSync(() => {
      setPrintedAt(printTimestamp(props.locale));
      setPreparing(true);
    });
    try {
      await printDocument();
    } catch {
      setError(true);
    } finally {
      setPreparing(false);
    }
  };

  return (
    <>
      {preparing &&
        createPortal(
          <div ref={printRef} className={styles.source}>
            <TimetablePrintDocument {...documentProps} />
          </div>,
          document.body,
        )}
      <Modal
        isOpen={props.open}
        onClose={props.onClose}
        title={t("title")}
        description={t("description")}
        size="full"
        closeOnOverlayClick={false}
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button
              variant="secondary"
              disabled={preparing}
              onClick={props.onClose}
            >
              {t("cancel")}
            </Button>
            <Button
              leftIcon={<Printer size={18} aria-hidden />}
              loading={preparing}
              disabled={!classrooms.length}
              onClick={() => void print()}
            >
              {t("print", { count: classrooms.length })}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label={t("layout")}
              value={layout}
              onChange={(value) => setLayout(value as "classroom" | "compact")}
              options={[
                { value: "classroom", label: t("onePerPage") },
                { value: "compact", label: t("compact") },
              ]}
            />
            <Select
              label={t("classrooms")}
              value={scope}
              onChange={setScope}
              options={[
                {
                  value: "visible",
                  label: t("visible", {
                    count: props.visibleClassroomIds.length,
                  }),
                },
                {
                  value: "all",
                  label: t("all", { count: props.classrooms.length }),
                },
              ]}
            />
            <Checkbox
              label={t("teachers")}
              checked={showTeachers}
              onChange={(event) => setShowTeachers(event.target.checked)}
            />
            <Checkbox
              label={t("rooms")}
              checked={showRooms}
              onChange={(event) => setShowRooms(event.target.checked)}
            />
          </div>
          <p className="text-sm text-gray-600">
            {t(layout === "compact" ? "compactHint" : "pageHint")}
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {t("failed")}
            </p>
          )}
          {preview && (
            <>
              <Select
                label={t("previewClassroom")}
                value={preview.id}
                onChange={setPreviewId}
                options={classrooms.map((item) => ({
                  value: item.id,
                  label: item.label,
                }))}
                searchable
                searchLabel={t("previewClassroom")}
              />
              <div
                className={styles.preview}
                role="region"
                aria-label={t("preview")}
                tabIndex={0}
              >
                <TimetablePrintDocument
                  {...documentProps}
                  classrooms={
                    layout === "compact"
                      ? classrooms.slice(
                          classrooms.indexOf(preview),
                          classrooms.indexOf(preview) + 2,
                        )
                      : [preview]
                  }
                  classroomOffset={classrooms.indexOf(preview)}
                  totalClassrooms={classrooms.length}
                  printedAt={printedAt || printTimestamp(props.locale)}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

function printTimestamp(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

"use client";

import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import { useTranslations } from "next-intl";
import type { RoomSchedulingUiError } from "@/features/academics/rooms/services/roomSchedulingErrors";

export default function RoomDependencyDialog({ error, onClose }: { error: RoomSchedulingUiError | null; onClose: () => void }) {
  const t = useTranslations("academics.timetable.rooms.dependency");
  return (
    <Modal isOpen={Boolean(error)} onClose={onClose} title={error?.message} size="sm" footer={<Button onClick={onClose}>{t("close")}</Button>}>
      <dl className="space-y-2 text-sm text-gray-700">
        {error?.operation && <div><dt className="font-medium">{t("operation")}</dt><dd>{error.operation}</dd></div>}
        {Object.entries(error?.dependencyCounts ?? {}).map(([label, count]) => <div key={label}><dt className="font-medium">{label}</dt><dd>{count}</dd></div>)}
        {error?.traceId && <div><dt className="font-medium">{t("traceId")}</dt><dd>{error.traceId}</dd></div>}
      </dl>
    </Modal>
  );
}

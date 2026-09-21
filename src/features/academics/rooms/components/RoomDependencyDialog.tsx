"use client";

import { Button } from "@/components/ui";
import Modal from "@/components/ui/modal/Modal";
import { useTranslations } from "next-intl";
import type {
  RoomSchedulingDetail,
  RoomSchedulingUiError,
} from "@/features/academics/rooms/services/roomSchedulingErrors";

interface RoomDependencyDialogProps {
  error: RoomSchedulingUiError | null;
  onClose: () => void;
}

export default function RoomDependencyDialog({
  error,
  onClose,
}: RoomDependencyDialogProps) {
  const t = useTranslations("academics.timetable.rooms.dependency");
  return (
    <Modal
      isOpen={Boolean(error)}
      onClose={onClose}
      title={t("title")}
      size="sm"
      footer={<Button onClick={onClose}>{t("close")}</Button>}
    >
      <p className="mb-4 text-sm text-gray-700">
        {error?.reason ? t(`reasons.${error.reason}`) : t("description")}
      </p>
      <dl className="space-y-2 text-sm text-gray-700">
        {Object.entries(error?.details ?? {}).map(([detailName, count]) => (
          <div key={detailName}>
            <dt className="font-medium">
              {t(`details.${detailName as RoomSchedulingDetail}`)}
            </dt>
            <dd>{count}</dd>
          </div>
        ))}
        {error?.traceId && (
          <div>
            <dt className="font-medium">{t("traceId")}</dt>
            <dd>{error.traceId}</dd>
          </div>
        )}
      </dl>
    </Modal>
  );
}

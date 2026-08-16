"use client";

import { useCallback } from "react";
import { searchClassrooms } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search"> & {
  academicYearId?: string;
  termId?: string;
  sectionId?: string;
};

export default function ClassroomSelect({ academicYearId, sectionId, termId, ...props }: Props) {
  const search = useCallback(
    (query: string) => searchClassrooms(query, academicYearId, termId, sectionId),
    [academicYearId, sectionId, termId],
  );
  return <CommunicationEntitySelect {...props} search={search} disabled={props.disabled} />;
}

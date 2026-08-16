"use client";

import { useCallback } from "react";
import { searchSections } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search"> & {
  academicYearId?: string;
  termId?: string;
  gradeId?: string;
};

export default function SectionSelect({ academicYearId, gradeId, termId, ...props }: Props) {
  const search = useCallback(
    (query: string) => searchSections(query, academicYearId, termId, gradeId),
    [academicYearId, gradeId, termId],
  );
  return <CommunicationEntitySelect {...props} search={search} disabled={props.disabled} />;
}

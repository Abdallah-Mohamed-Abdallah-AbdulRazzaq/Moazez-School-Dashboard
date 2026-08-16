"use client";

import { useCallback } from "react";
import { searchGrades } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search"> & {
  academicYearId?: string;
  termId?: string;
  stageId?: string;
};

export default function GradeSelect({ academicYearId, stageId, termId, ...props }: Props) {
  const search = useCallback(
    (query: string) => searchGrades(query, academicYearId, termId, stageId),
    [academicYearId, stageId, termId],
  );
  return <CommunicationEntitySelect {...props} search={search} disabled={props.disabled} />;
}

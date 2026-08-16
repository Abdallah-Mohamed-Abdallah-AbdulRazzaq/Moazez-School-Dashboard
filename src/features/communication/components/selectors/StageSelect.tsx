"use client";

import { useCallback } from "react";
import { searchStages } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search"> & {
  academicYearId?: string;
  termId?: string;
};

export default function StageSelect({ academicYearId, termId, ...props }: Props) {
  const search = useCallback(
    (query: string) => searchStages(query, academicYearId, termId),
    [academicYearId, termId],
  );
  return <CommunicationEntitySelect {...props} search={search} disabled={props.disabled} />;
}

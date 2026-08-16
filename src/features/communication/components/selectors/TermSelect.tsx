"use client";

import { useCallback } from "react";
import { searchTerms } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search"> & {
  academicYearId?: string;
};

export default function TermSelect({ academicYearId, ...props }: Props) {
  const search = useCallback(
    (query: string) => searchTerms(query, academicYearId),
    [academicYearId],
  );
  return <CommunicationEntitySelect {...props} search={search} disabled={props.disabled || !academicYearId} />;
}

"use client";

import { useCallback } from "react";
import { searchAcademicYears } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function AcademicYearSelect(props: Props) {
  const search = useCallback((query: string) => searchAcademicYears(query), []);
  return <CommunicationEntitySelect {...props} search={search} />;
}

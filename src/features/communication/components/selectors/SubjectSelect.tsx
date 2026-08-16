"use client";

import { useCallback } from "react";
import { searchSubjects } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function SubjectSelect(props: Props) {
  const search = useCallback((query: string) => searchSubjects(query), []);
  return <CommunicationEntitySelect {...props} search={search} />;
}

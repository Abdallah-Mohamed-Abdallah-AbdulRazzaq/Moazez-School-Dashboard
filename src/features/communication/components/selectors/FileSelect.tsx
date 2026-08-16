"use client";

import { useCallback } from "react";
import { searchFiles } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function FileSelect(props: Props) {
  const search = useCallback((query: string) => searchFiles(query), []);
  return <CommunicationEntitySelect {...props} search={search} />;
}

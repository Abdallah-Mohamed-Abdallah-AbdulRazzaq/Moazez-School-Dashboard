"use client";

import { useCallback } from "react";
import { searchAnnouncements } from "@/features/communication/api/communication-selectors.service";
import CommunicationEntitySelect, { type CommunicationEntitySelectProps } from "./CommunicationEntitySelect";

type Props = Omit<CommunicationEntitySelectProps, "search">;

export default function AnnouncementSearchSelect(props: Props) {
  const search = useCallback((query: string) => searchAnnouncements(query), []);
  return <CommunicationEntitySelect {...props} search={search} />;
}

"use client";

import { useEffect, useState } from "react";
import type { AcademicStructureTree } from "@/features/academics/services/academicStructureApiService";
import { loadCommunicationStructure } from "@/features/communication/api/communication-selectors.service";

export function useAnnouncementAudienceStructure() {
  const [structure, setStructure] = useState<AcademicStructureTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void loadCommunicationStructure().then(
      (loadedStructure) => {
        if (!active) return;
        setStructure(loadedStructure);
        setIsLoading(false);
      },
      () => {
        if (!active) return;
        setLoadFailed(true);
        setIsLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return { structure, isLoading, loadFailed };
}

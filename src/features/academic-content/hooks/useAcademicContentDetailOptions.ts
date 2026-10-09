"use client";

import { useEffect, useState } from "react";
import { academicContentUiError } from "../services/academicContentErrors";
import {
  loadAcademicContentDetailOptions,
  type AcademicContentDetailOptions,
} from "../services/academicContentDetailOptions";
import type { AcademicContentDetail } from "../types/contracts";

export function useAcademicContentDetailOptions(
  content: AcademicContentDetail,
) {
  const [state, setState] = useState<{
    options: AcademicContentDetailOptions | null;
    error: string | null;
  }>({ options: null, error: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    void loadAcademicContentDetailOptions(content)
      .then((options) => active && setState({ options, error: null }))
      .catch((error: unknown) => {
        if (active) {
          setState({
            options: null,
            error: academicContentUiError(error).message,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [content, retryKey]);

  return {
    ...state,
    retry: () => {
      setState({ options: null, error: null });
      setRetryKey((key) => key + 1);
    },
  };
}

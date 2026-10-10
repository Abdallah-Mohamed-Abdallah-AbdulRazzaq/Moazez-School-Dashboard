"use client";

import { useRef, useState } from "react";
import { downloadAcademicContentAsset } from "../services/downloadAcademicContentAsset";
import { academicContentUiError } from "../services/academicContentErrors";
import type { AcademicContentAsset } from "../types/contracts";

export interface AcademicContentDownloadState {
  name: string;
  phase: "preparing" | "downloading" | "started" | "error";
  percent: number | null;
  error?: string;
}

export function useAcademicContentDownload() {
  const active = useRef(false);
  const [state, setState] = useState<AcademicContentDownloadState | null>(null);
  const requestDownload = async (asset: AcademicContentAsset) => {
    if (active.current) return;
    active.current = true;
    setState({ name: asset.originalName, phase: "preparing", percent: null });
    try {
      await downloadAcademicContentAsset(asset, (progress) => {
        const percent = progress.total && progress.total > 0
          ? Math.min(100, Math.round(progress.loaded / progress.total * 100))
          : null;
        setState({ name: asset.originalName, phase: "downloading", percent });
      });
      setState({ name: asset.originalName, phase: "started", percent: null });
    } catch (error) {
      setState({ name: asset.originalName, phase: "error", percent: null,
        error: academicContentUiError(error).message });
    } finally {
      active.current = false;
    }
  };
  const isDownloading = state?.phase === "preparing" || state?.phase === "downloading";
  return { state, isDownloading, requestDownload };
}

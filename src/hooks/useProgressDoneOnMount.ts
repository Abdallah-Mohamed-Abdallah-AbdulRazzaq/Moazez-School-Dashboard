"use client";

import { useEffect } from "react";
import { useProgressBar } from "@/providers/ProgressBarProvider";

/**
 * Hook to automatically complete progress bar when component mounts
 * Useful for page shells that want to signal completion
 * 
 * @example
 * function PageShell() {
 *   useProgressDoneOnMount();
 *   return <div>...</div>;
 * }
 */
export function useProgressDoneOnMount() {
  const progress = useProgressBar();

  useEffect(() => {
    progress.done();
  }, [progress]);
}

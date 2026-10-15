"use client";

import type { ReactNode } from "react";
import { Tooltip } from "@mui/material";

export default function TimetableLessonDetails({
  details,
  readOnly,
  children,
}: {
  details: string;
  readOnly: boolean;
  children: ReactNode;
}) {
  if (!details) return children;
  return (
    <Tooltip
      title={details}
      describeChild
      arrow
      disableInteractive
      enterDelay={200}
      slotProps={{
        popper: { sx: { "@media print": { display: "none" } } },
        tooltip: {
          sx: {
            fontFamily: "var(--font-somar), sans-serif",
            fontSize: 13,
            lineHeight: 1.7,
            maxWidth: 320,
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none !important",
              animation: "none !important",
            },
          },
        },
      }}
    >
      <span
        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
        tabIndex={readOnly ? 0 : undefined}
        aria-label={readOnly ? details : undefined}
      >
        {children}
      </span>
    </Tooltip>
  );
}

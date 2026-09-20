"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import styles from "./OverflowMarquee.module.css";

export interface OverflowMarqueeProps {
  className?: string;
  isRTL?: boolean;
  label: string;
}

export function OverflowMarquee({
  className = "",
  isRTL = false,
  label,
}: OverflowMarqueeProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  const measureOverflow = () => {
    const labelElement = labelRef.current;
    if (!labelElement) return 0;

    const measuredDistance = Math.max(
      0,
      labelElement.scrollWidth - labelElement.clientWidth,
    );
    setOverflowDistance(measuredDistance);
    return measuredDistance;
  };

  useEffect(() => {
    measureOverflow();

    if (!labelRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(labelRef.current);
    return () => resizeObserver.disconnect();
  }, [label]);

  const translateDistance = isRTL ? overflowDistance : -overflowDistance;
  const marqueeStyle = {
    "--sidebar-label-overflow": `${translateDistance}px`,
  } as CSSProperties;

  return (
    <span
      ref={labelRef}
      className={`${styles.label} min-w-0 overflow-hidden ${className}`.trim()}
      style={marqueeStyle}
    >
      <span className={`${styles.text} inline-block whitespace-nowrap`}>
        {label}
      </span>
    </span>
  );
}

export default OverflowMarquee;

"use client";

interface PanelResizeHandleProps {
  onResizeStart: () => void;
  onResizeBy: (delta: number) => void;
  ariaLabel: string;
  isRTL?: boolean;
}

export default function PanelResizeHandle({
  onResizeStart,
  onResizeBy,
  ariaLabel,
  isRTL = false,
}: PanelResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        onResizeStart();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const direction = e.key === "ArrowRight" ? 1 : -1;
          onResizeBy(direction * (isRTL ? -16 : 16));
        }
      }}
      className={`
        relative w-1 bg-transparent hover:bg-primary/20 active:bg-primary/30
        cursor-col-resize transition-colors group
        flex-shrink-0 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-primary/40 focus-visible:bg-primary/20
      `}
      style={{
        touchAction: "none",
      }}
    >
      <div className="absolute inset-y-0 -inset-x-2" />

      <div
        className={`
          absolute inset-y-0 ${isRTL ? "right-0" : "left-0"}
          w-1 bg-primary/0 group-hover:bg-primary/40 group-active:bg-primary/60
          transition-colors
        `}
      />
    </div>
  );
}

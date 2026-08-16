"use client";

import type { PropsWithChildren, ReactNode } from "react";
import AttendanceDataPanel from "./AttendanceDataPanel";
import AttendanceMobileActions from "./AttendanceMobileActions";
import AttendanceStatePanel from "./AttendanceStatePanel";

type WorkspaceColumns = "8/4" | "9/3";

interface AttendanceWorkspaceShellProps extends PropsWithChildren {
  readOnlyBanner?: ReactNode;
  className?: string;
  contentClassName?: string;
  scrollable?: boolean;
}

export function AttendanceWorkspaceShell({
  children,
  readOnlyBanner,
  className = "",
  contentClassName = "",
  scrollable = false,
}: AttendanceWorkspaceShellProps) {
  const scrollClassName = scrollable ? "overflow-auto" : "overflow-hidden";

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}>
      {readOnlyBanner}
      <div
        className={`flex min-h-0 flex-1 flex-col gap-4 p-4 ${scrollClassName} ${contentClassName}`.trim()}
        style={{ backgroundColor: "var(--background)" }}
      >
        {children}
      </div>
    </div>
  );
}

export function AttendanceWorkspaceHeader({ children }: PropsWithChildren) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

interface AttendanceWorkspaceSplitProps {
  main: ReactNode;
  details: ReactNode;
  columns?: WorkspaceColumns;
  className?: string;
}

export function AttendanceWorkspaceSplit({
  main,
  details,
  columns = "8/4",
  className = "",
}: AttendanceWorkspaceSplitProps) {
  const mainClassName = columns === "9/3" ? "col-span-9" : "col-span-8";
  const detailsClassName = columns === "9/3" ? "col-span-3" : "col-span-4";

  return (
    <div className={`grid min-h-0 flex-1 grid-cols-12 gap-4 ${className}`.trim()}>
      <div className={`${mainClassName} flex min-h-0 flex-col gap-4`}>
        {main}
      </div>
      <div className={`${detailsClassName} min-h-0`}>{details}</div>
    </div>
  );
}

export function AttendanceWorkspaceStack({ children }: PropsWithChildren) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>;
}

interface AttendanceWorkspaceRailProps {
  rail: ReactNode;
  main: ReactNode;
  className?: string;
}

export function AttendanceWorkspaceRail({
  rail,
  main,
  className = "",
}: AttendanceWorkspaceRailProps) {
  return (
    <div className={`flex min-h-0 flex-1 gap-4 ${className}`.trim()}>
      <aside className="hidden w-80 shrink-0 lg:flex">{rail}</aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{main}</div>
    </div>
  );
}

interface AttendanceWorkspaceMobileActionsProps extends PropsWithChildren {
  columns?: 1 | 2;
  className?: string;
}

export function AttendanceWorkspaceMobileActions({
  children,
  columns = 1,
  className = "",
}: AttendanceWorkspaceMobileActionsProps) {
  return (
    <AttendanceMobileActions columns={columns} className={className}>
      {children}
    </AttendanceMobileActions>
  );
}

interface AttendanceWorkspaceContentPanelProps extends PropsWithChildren {
  loading?: boolean;
  className?: string;
  loaderClassName?: string;
}

export function AttendanceWorkspaceContentPanel({
  children,
  loading = false,
  className = "",
  loaderClassName = "flex h-full items-center justify-center",
}: AttendanceWorkspaceContentPanelProps) {
  return (
    <AttendanceDataPanel
      loading={loading}
      className={`flex-1 rounded-lg border overflow-hidden min-h-0 ${className}`.trim()}
      loaderClassName={loaderClassName}
    >
      {children}
    </AttendanceDataPanel>
  );
}

interface AttendanceWorkspaceStateProps {
  title: string;
  description?: string;
  compact?: boolean;
  action?: ReactNode;
}

export function AttendanceWorkspaceState({
  title,
  description,
  compact = false,
  action,
}: AttendanceWorkspaceStateProps) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center">
      <AttendanceStatePanel
        title={title}
        description={description}
        compact={compact}
        action={action}
      />
    </div>
  );
}

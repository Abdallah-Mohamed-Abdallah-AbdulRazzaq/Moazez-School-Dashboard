/**
 * Attendance Status Styling Utilities
 * 
 * Centralized token-based styling for all attendance status indicators
 * Used across Roll Call, Absences, Late/Early, and Excuses tabs
 */

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "EARLY_LEAVE" | "UNMARKED";
export type ExcuseStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SessionStatus = "DRAFT" | "SUBMITTED";

export interface StatusStyle {
  bg: string;
  fg: string;
  border?: string;
  iconBg?: string;
  iconFg?: string;
}

/**
 * Get styling for attendance status (PRESENT, ABSENT, etc.)
 */
export function getAttendanceStatusStyle(status: AttendanceStatus): StatusStyle {
  switch (status) {
    case "PRESENT":
      return {
        bg: "var(--color-primary-50)",
        fg: "var(--color-primary-700)",
        border: "var(--color-primary-200)",
        iconBg: "var(--color-primary-100)",
        iconFg: "var(--color-primary-600)",
      };
    case "ABSENT":
      return {
        bg: "#fef2f2", // red-50
        fg: "#991b1b", // red-800
        border: "#fecaca", // red-200
        iconBg: "#fee2e2", // red-100
        iconFg: "#dc2626", // red-600
      };
    case "LATE":
      return {
        bg: "#fef3c7", // amber-100
        fg: "#78350f", // amber-900
        border: "#fde68a", // amber-200
        iconBg: "#fef3c7", // amber-100
        iconFg: "#d97706", // amber-600
      };
    case "EXCUSED":
      return {
        bg: "#dcfce7", // green-100
        fg: "#14532d", // green-900
        border: "#bbf7d0", // green-200
        iconBg: "#dcfce7", // green-100
        iconFg: "#16a34a", // green-600
      };
    case "EARLY_LEAVE":
      return {
        bg: "#ffedd5", // orange-100
        fg: "#7c2d12", // orange-900
        border: "#fed7aa", // orange-200
        iconBg: "#ffedd5", // orange-100
        iconFg: "#ea580c", // orange-600
      };
    case "UNMARKED":
      return {
        bg: "var(--color-neutral-50)",
        fg: "var(--color-neutral-500)",
        border: "var(--color-neutral-200)",
        iconBg: "var(--color-neutral-100)",
        iconFg: "var(--color-neutral-400)",
      };
    default:
      return {
        bg: "var(--color-neutral-50)",
        fg: "var(--color-neutral-500)",
        border: "var(--color-neutral-200)",
      };
  }
}

/**
 * Get styling for excuse request status (PENDING, APPROVED, REJECTED)
 */
export function getExcuseStatusStyle(status: ExcuseStatus): StatusStyle {
  switch (status) {
    case "PENDING":
      return {
        bg: "#fef3c7", // amber-100
        fg: "#78350f", // amber-900
        border: "#fde68a", // amber-200
        iconBg: "#fef3c7",
        iconFg: "#d97706",
      };
    case "APPROVED":
      return {
        bg: "#dcfce7", // green-100
        fg: "#14532d", // green-900
        border: "#bbf7d0", // green-200
        iconBg: "#dcfce7",
        iconFg: "#16a34a",
      };
    case "REJECTED":
      return {
        bg: "#fef2f2", // red-50
        fg: "#991b1b", // red-800
        border: "#fecaca", // red-200
        iconBg: "#fee2e2",
        iconFg: "#dc2626",
      };
    default:
      return {
        bg: "var(--color-neutral-50)",
        fg: "var(--color-neutral-500)",
        border: "var(--color-neutral-200)",
      };
  }
}

/**
 * Get styling for session status (DRAFT, SUBMITTED)
 */
export function getSessionStatusStyle(status: SessionStatus): StatusStyle {
  switch (status) {
    case "DRAFT":
      return {
        bg: "var(--color-neutral-100)",
        fg: "var(--color-neutral-800)",
        border: "var(--color-neutral-200)",
      };
    case "SUBMITTED":
      return {
        bg: "#dcfce7", // green-100
        fg: "#14532d", // green-900
        border: "#bbf7d0", // green-200
      };
    default:
      return {
        bg: "var(--color-neutral-100)",
        fg: "var(--color-neutral-800)",
        border: "var(--color-neutral-200)",
      };
  }
}

/**
 * Get KPI icon styling based on state
 */
export function getKpiIconStyle(variant: "primary" | "success" | "warning" | "danger" | "neutral"): StatusStyle {
  switch (variant) {
    case "primary":
      return {
        bg: "var(--color-primary-50)",
        fg: "var(--color-primary-600)",
        iconBg: "var(--color-primary-100)",
        iconFg: "var(--color-primary-700)",
      };
    case "success":
      return {
        bg: "#dcfce7", // green-100
        fg: "#16a34a", // green-600
        iconBg: "#dcfce7",
        iconFg: "#16a34a",
      };
    case "warning":
      return {
        bg: "#ffedd5", // orange-100
        fg: "#ea580c", // orange-600
        iconBg: "#ffedd5",
        iconFg: "#ea580c",
      };
    case "danger":
      return {
        bg: "#fef2f2", // red-50
        fg: "#dc2626", // red-600
        iconBg: "#fee2e2",
        iconFg: "#ef4444",
      };
    case "neutral":
      return {
        bg: "var(--color-neutral-100)",
        fg: "var(--color-neutral-500)",
        iconBg: "var(--color-neutral-100)",
        iconFg: "var(--color-neutral-400)",
      };
    default:
      return {
        bg: "var(--color-neutral-100)",
        fg: "var(--color-neutral-500)",
        iconBg: "var(--color-neutral-100)",
        iconFg: "var(--color-neutral-400)",
      };
  }
}

/**
 * Get coverage percentage styling (for policy KPIs)
 */
export function getCoverageStyle(percent: number): StatusStyle {
  if (percent === 100) {
    return {
      bg: "#dcfce7", // green-100
      fg: "#16a34a", // green-600
      border: "#bbf7d0",
    };
  }
  if (percent >= 50) {
    return {
      bg: "#fef3c7", // amber-100
      fg: "#d97706", // amber-600
      border: "#fde68a",
    };
  }
  return {
    bg: "#fef2f2", // red-50
    fg: "#dc2626", // red-600
    border: "#fecaca",
  };
}

import type { CSSProperties } from "react";
import { colors } from "@/design/tokens";
import type { GradeItemStatus } from "../types";

export const gradebookStatusStyles: Record<GradeItemStatus, CSSProperties> = {
  entered: {
    borderColor: `color-mix(in oklab, ${colors.success.DEFAULT} 38%, white)`,
    backgroundColor: `color-mix(in oklab, ${colors.success.light} 52%, white)`,
    color: colors.success.dark,
  },
  missing: {
    borderColor: `color-mix(in oklab, ${colors.warning.DEFAULT} 38%, white)`,
    backgroundColor: `color-mix(in oklab, ${colors.warning.light} 52%, white)`,
    color: colors.warning.dark,
  },
  absent: {
    borderColor: `color-mix(in oklab, ${colors.error.DEFAULT} 38%, white)`,
    backgroundColor: `color-mix(in oklab, ${colors.error.light} 52%, white)`,
    color: colors.error.dark,
  },
};

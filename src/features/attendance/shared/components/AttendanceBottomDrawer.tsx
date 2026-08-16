import type { PropsWithChildren } from "react";
import { Drawer, type DrawerProps } from "@mui/material";

interface AttendanceBottomDrawerProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  heightClassName?: string;
  anchor?: DrawerProps["anchor"];
  disableEnforceFocus?: boolean;
}

export default function AttendanceBottomDrawer({
  isOpen,
  onClose,
  heightClassName = "h-[80vh]",
  anchor = "bottom",
  disableEnforceFocus = false,
  children,
}: AttendanceBottomDrawerProps) {
  return (
    <Drawer
      anchor={anchor}
      open={isOpen}
      onClose={onClose}
      ModalProps={{ disableEnforceFocus }}
    >
      <div className={heightClassName}>{children}</div>
    </Drawer>
  );
}

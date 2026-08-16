"use client";

import { useState, type MouseEvent } from "react";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Archive,
  CircleCheck,
  Download,
  EllipsisVertical,
  Trash2,
} from "lucide-react";

interface CurriculumActionsMenuProps {
  labels: {
    menu: string;
    export: string;
    activate: string;
    archive: string;
    delete: string;
  };
  onExport: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  canExport: boolean;
  canActivate: boolean;
  canArchive: boolean;
  canDelete: boolean;
}

export default function CurriculumActionsMenu(
  props: CurriculumActionsMenuProps,
) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const runAction = (action: () => void) => {
    setAnchorElement(null);
    action();
  };

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget);
  };

  return (
    <>
      <IconButton
        aria-label={props.labels.menu}
        onClick={openMenu}
        size="small"
      >
        <EllipsisVertical className="h-7 w-7" />
      </IconButton>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
      >
        <MenuItem
          disabled={!props.canExport}
          onClick={() => runAction(props.onExport)}
        >
          <ListItemIcon>
            <Download className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText>{props.labels.export}</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!props.canActivate}
          onClick={() => runAction(props.onActivate)}
        >
          <ListItemIcon>
            <CircleCheck className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText>{props.labels.activate}</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!props.canArchive}
          onClick={() => runAction(props.onArchive)}
        >
          <ListItemIcon>
            <Archive className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText>{props.labels.archive}</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!props.canDelete}
          onClick={() => runAction(props.onDelete)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <Trash2 className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText>{props.labels.delete}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

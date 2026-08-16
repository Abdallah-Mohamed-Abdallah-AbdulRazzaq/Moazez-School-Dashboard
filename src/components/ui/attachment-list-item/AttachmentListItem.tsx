"use client";

import { useState } from "react";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { MoreVertical } from "lucide-react";

export interface AttachmentAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  color?: "default" | "error";
  hidden?: boolean;
}

export interface AttachmentListItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  actions?: AttachmentAction[];
  disabled?: boolean;
}

export default function AttachmentListItem({
  icon,
  title,
  subtitle,
  onClick,
  actions = [],
  disabled = false,
}: AttachmentListItemProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: AttachmentAction) => {
    action.onClick();
    handleMenuClose();
  };

  const visibleActions = actions.filter((a) => !a.hidden);

  return (
    <>
      <ListItem
        disablePadding
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          mb: 1,
          overflow: "hidden",
        }}
        secondaryAction={
          visibleActions.length > 0 && (
            <IconButton
              edge="end"
              onClick={handleMenuOpen}
              disabled={disabled}
              sx={{ mr: 1 }}
            >
              <MoreVertical className="w-4 h-4" />
            </IconButton>
          )
        }
      >
        <ListItemButton
          onClick={onClick}
          disabled={disabled || !onClick}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={title}
            secondary={subtitle}
            primaryTypographyProps={{
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
            secondaryTypographyProps={{
              fontSize: "0.75rem",
              sx: {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
        </ListItemButton>
      </ListItem>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {visibleActions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action)}
            sx={action.color === "error" ? { color: "error.main" } : {}}
          >
            {action.icon && (
              <span className="mr-2 inline-flex">{action.icon}</span>
            )}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

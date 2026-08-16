"use client";

import {
  ExternalLink,
  KeyRound,
  MailPlus,
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
} from "lucide-react";
import DropdownMenu, {
  type DropdownItem,
} from "@/components/ui/dropdown/DropdownMenu";
import type { SettingsUserRecord } from "@/features/settings/types";

interface SettingsUserActionsProps {
  user: SettingsUserRecord;
  isTeacher: boolean;
  canManageUsers: boolean;
  canDeliverCredentials: boolean;
  canViewTeachers: boolean;
  labels: {
    edit: string;
    activate: string;
    deactivate: string;
    openMenu: string;
    manageCredentials: string;
    viewCredentials: string;
    deliverCredentials: string;
    manageTeacher: string;
  };
  onEdit: () => void;
  onToggleStatus: () => void;
  onManageCredentials: () => void;
  onDeliverCredentials: () => void;
  onManageTeacher: () => void;
}

export default function SettingsUserActions({
  user,
  isTeacher,
  canManageUsers,
  canDeliverCredentials,
  canViewTeachers,
  labels,
  onEdit,
  onToggleStatus,
  onManageCredentials,
  onDeliverCredentials,
  onManageTeacher,
}: SettingsUserActionsProps) {
  const credentialLabel = canManageUsers
    ? labels.manageCredentials
    : labels.viewCredentials;
  const actionItems: DropdownItem[] = [
    ...(!isTeacher && canManageUsers
      ? [
          {
            value: "edit",
            label: labels.edit,
            icon: <Pencil className="h-4 w-4 text-info" />,
            onClick: onEdit,
          },
        ]
      : []),
    {
      value: "credentials",
      label: credentialLabel,
      icon: <KeyRound className="h-4 w-4 text-primary" />,
      onClick: onManageCredentials,
    },
    ...(user.status === "invited" && canDeliverCredentials
      ? [
          {
            value: "deliver-credentials",
            label: labels.deliverCredentials,
            icon: <MailPlus className="h-4 w-4 text-primary" />,
            onClick: onDeliverCredentials,
          },
        ]
      : []),
    ...(isTeacher && canViewTeachers
      ? [
          {
            value: "manage-teacher",
            label: labels.manageTeacher,
            icon: <ExternalLink className="h-4 w-4 text-info" />,
            onClick: onManageTeacher,
          },
        ]
      : []),
    ...(!isTeacher && canManageUsers
      ? [
          {
            value: user.status === "inactive" ? "activate" : "deactivate",
            label:
              user.status === "inactive" ? labels.activate : labels.deactivate,
            icon:
              user.status === "inactive" ? (
                <UserCheck className="h-4 w-4 text-green-700" />
              ) : (
                <UserX className="h-4 w-4 text-red-600" />
              ),
            onClick: onToggleStatus,
          },
        ]
      : []),
  ];

  return (
    <div data-row-action onClick={(event) => event.stopPropagation()}>
      <DropdownMenu
        width="w-56"
        trigger={
          <button
            type="button"
            title={labels.openMenu}
            aria-label={labels.openMenu}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:h-10 sm:w-10"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        }
        items={actionItems}
      />
    </div>
  );
}

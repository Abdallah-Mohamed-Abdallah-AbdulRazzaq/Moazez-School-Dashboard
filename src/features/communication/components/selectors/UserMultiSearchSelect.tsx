"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import UserSearchSelect from "./UserSearchSelect";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";

const EMPTY_OPTIONS: CommunicationSelectorOption[] = [];

export interface UserMultiSearchSelectProps {
  label: string;
  value: string[];
  selectedOptions?: CommunicationSelectorOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  initialQuery?: string;
  onChange: (value: string[]) => void;
}

export default function UserMultiSearchSelect({
  disabled,
  error,
  helperText,
  initialQuery,
  label,
  onChange,
  placeholder,
  selectedOptions = EMPTY_OPTIONS,
  value,
}: UserMultiSearchSelectProps) {
  const t = useTranslations("user_select");
  const [pendingUserId, setPendingUserId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<
    Record<string, { label: string; description?: string }>
  >(() =>
    Object.fromEntries(
      selectedOptions.map((option) => [
        option.id,
        { label: option.label, description: option.description },
      ]),
    ),
  );
  const rememberLoadedUsers = useCallback(
    (options: CommunicationSelectorOption[]) => {
      setSelectedUsers((current) => {
        const usersById = { ...current };
        options.forEach((option) => {
          usersById[option.id] = {
            label: option.label,
            description: option.description,
          };
        });
        return usersById;
      });
    },
    [],
  );

  const selectedUserLabels = selectedOptions.reduce(
    (labels, option) => ({
      ...labels,
      [option.id]: {
        label: option.label,
        description: option.description,
      },
    }),
    selectedUsers,
  );

  const addUser = (userId: string) => {
    setPendingUserId(userId);
    if (!userId || value.includes(userId)) return;
    onChange([...value, userId]);
    setPendingUserId("");
  };

  const removeUser = (userId: string) => {
    onChange(value.filter((selectedUserId) => selectedUserId !== userId));
    setSelectedUsers((current) => {
      const nextUsers = { ...current };
      delete nextUsers[userId];
      return nextUsers;
    });
  };

  const rememberUserLabel = (option: CommunicationSelectorOption | null) => {
    if (!option) return;
    setSelectedUsers((current) => ({
      ...current,
      [option.id]: {
        label: option.label,
        description: option.description,
      },
    }));
  };

  return (
    <div className="space-y-2">
      <UserSearchSelect
        label={label}
        value={pendingUserId}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        disabled={disabled}
        loadOnMount
        initialQuery={initialQuery}
        onChange={addUser}
        onOptionChange={rememberUserLabel}
        onOptionsChange={rememberLoadedUsers}
      />
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((userId) => (
            <span
              key={userId}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              <span>
                {selectedUserLabels[userId]?.label || t("loading_selected")}
                {selectedUserLabels[userId]?.description ? (
                  <span className="text-slate-500">
                    {` · ${selectedUserLabels[userId].description}`}
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-5 px-1 py-0"
                aria-label={`${t("remove")} ${
                  selectedUserLabels[userId]?.label || t("loading_selected")
                }`}
                disabled={disabled}
                onClick={() => removeUser(userId)}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

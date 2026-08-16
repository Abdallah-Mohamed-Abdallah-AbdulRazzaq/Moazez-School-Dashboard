"use client";

import { useState } from "react";
import { Edit, MoreVertical, Trash2 } from "lucide-react";

export interface MessageActionsMenuLabels {
  edit: string;
  delete: string;
}

export interface MessageActionsMenuProps {
  labels: MessageActionsMenuLabels;
  disabled?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MessageActionsMenu({
  allowDelete = true,
  allowEdit = true,
  disabled,
  labels,
  onDelete,
  onEdit,
}: MessageActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActions = allowEdit || allowDelete;

  const run = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  if (!hasActions) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Message actions"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen ? (
        <div className="absolute end-0 z-30 mt-1 min-w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
        {allowEdit ? (
          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-start text-sm text-slate-700 transition-colors hover:bg-slate-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(onEdit)}
          >
            <Edit className="me-2 h-4 w-4" />
            {labels.edit}
          </button>
        ) : null}
        {allowDelete ? (
          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-start text-sm text-rose-700 transition-colors hover:bg-rose-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(onDelete)}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {labels.delete}
          </button>
        ) : null}
        </div>
      ) : null}
    </div>
  );
}

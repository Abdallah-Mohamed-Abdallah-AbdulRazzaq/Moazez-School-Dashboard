"use client";

import { useId, useState } from "react";

interface ReservedUsernamesInputProps {
  label: string;
  helperText: string;
  placeholder: string;
  values: string[];
  disabled?: boolean;
  error?: string;
  onChange: (values: string[]) => void;
  onBlur?: () => void;
}

function normalizeTags(rawValue: string): string[] {
  return rawValue
    .split(",")
    .map((username) => username.trim().toLowerCase())
    .filter(Boolean);
}

export default function ReservedUsernamesInput({
  label,
  helperText,
  placeholder,
  values,
  disabled = false,
  error,
  onChange,
  onBlur,
}: ReservedUsernamesInputProps) {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const nextTags = normalizeTags(draft);
    if (nextTags.length === 0) return;
    onChange(Array.from(new Set([...values, ...nextTags])));
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="rounded-xl border border-gray-200 bg-white p-3 focus-within:ring-2 focus-within:ring-primary">
        {values.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {values.map((username) => (
              <span
                key={username}
                className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
              >
                <span dir="ltr">{username}</span>
              </span>
            ))}
          </div>
        ) : null}
        {!disabled ? (
          <input
            id={inputId}
            dir="ltr"
            value={draft}
            placeholder={placeholder}
            aria-describedby={descriptionId}
            aria-invalid={Boolean(error)}
            className="w-full border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitDraft();
              }
            }}
            onBlur={() => {
              commitDraft();
              onBlur?.();
            }}
          />
        ) : null}
      </div>
      <p
        id={descriptionId}
        role={error ? "alert" : undefined}
        className={`mt-1 text-xs ${error ? "text-red-600" : "text-gray-600"}`}
      >
        {error || helperText}
      </p>
    </div>
  );
}

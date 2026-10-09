"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;

    return (
      <label
        htmlFor={inputId}
        className={`flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 ${className}`}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-label={label}
          aria-describedby={descriptionId}
          className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          {...props}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-800">{label}</span>
          {description ? (
            <span id={descriptionId} className="mt-1 block text-xs leading-5 text-gray-600">
              {description}
            </span>
          ) : null}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;

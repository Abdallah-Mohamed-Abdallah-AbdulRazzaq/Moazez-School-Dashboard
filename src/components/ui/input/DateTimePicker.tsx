"use client";

import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AlertCircle } from "lucide-react";
import { useLocale } from "next-intl";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/en";

export interface DateTimePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  name?: string;
  minDateTime?: Date;
  maxDateTime?: Date;
  disabled?: boolean;
  required?: boolean;
  format?: string;
  className?: string;
}

export default function DateTimePicker({
  className = "",
  disabled = false,
  error,
  format,
  helperText,
  label,
  maxDateTime,
  minDateTime,
  name,
  onChange,
  placeholder,
  required = false,
  value,
}: DateTimePickerProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resolvedValue = value ? dayjs(value) : null;
  const dateTimeFormat =
    format ?? (isRTL ? "DD/MM/YYYY HH:mm" : "MM/DD/YYYY hh:mm A");

  const changeDateTime = (nextValue: Dayjs | null) => {
    onChange?.(nextValue ? nextValue.toDate() : null);
  };

  return (
    <div className="w-full" dir={isRTL ? "rtl" : "ltr"}>
      {label ? (
        <label
          className={`mb-1 block text-sm font-medium text-gray-700 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}

      <input
        type="hidden"
        name={name}
        value={resolvedValue ? resolvedValue.toISOString() : ""}
      />

      <div
        className={`rounded-lg border px-2 py-1 transition-colors ${
          error
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500"
            : "border-gray-200 bg-white focus-within:border-transparent focus-within:ring-2 focus-within:ring-primary"
        } ${disabled ? "bg-gray-100 opacity-60" : ""} ${className}`}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
          <MuiDateTimePicker
            value={resolvedValue}
            onChange={changeDateTime}
            disabled={disabled}
            minDateTime={minDateTime ? dayjs(minDateTime) : undefined}
            maxDateTime={maxDateTime ? dayjs(maxDateTime) : undefined}
            format={dateTimeFormat}
            slotProps={{
              textField: {
                placeholder,
                fullWidth: true,
                variant: "standard",
                InputProps: {
                  disableUnderline: true,
                  className: "px-4 py-2.5 text-sm",
                },
                sx: {
                  "& .MuiInputBase-root": {
                    fontFamily: "inherit",
                    direction: isRTL ? "rtl" : "ltr",
                  },
                  "& .MuiInputBase-input": {
                    padding: 0,
                    color: "#111827",
                    "&::placeholder": { color: "#9ca3af", opacity: 1 },
                  },
                  "& .MuiIconButton-root": {
                    color: error ? "#ef4444" : "#9ca3af",
                  },
                },
              },
              layout: {
                sx: { direction: isRTL ? "rtl" : "ltr" },
              },
            }}
          />
        </LocalizationProvider>
      </div>

      {helperText || error ? (
        <div
          className={`mt-1 flex items-start gap-1 text-xs ${
            error ? "text-red-600" : "text-gray-500"
          } ${isRTL ? "text-right" : "text-left"}`}
        >
          {error ? <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> : null}
          <span>{error || helperText}</span>
        </div>
      ) : null}
    </div>
  );
}

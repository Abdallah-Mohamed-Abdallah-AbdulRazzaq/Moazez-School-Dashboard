"use client";

import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AlertCircle } from "lucide-react";
import { useLocale } from "next-intl";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/en";

export interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  inputSize?: "sm" | "md" | "lg";
  disabled?: boolean;
  required?: boolean;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  name?: string;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  shouldDisableDate?: (date: Date) => boolean;
  format?: string;
  className?: string;
}

export default function DatePicker({
  label,
  error,
  helperText,
  placeholder,
  fullWidth = true,
  variant = "default",
  inputSize = "md",
  disabled = false,
  required = false,
  value,
  onChange,
  name,
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  shouldDisableDate,
  format,
  className = "",
}: DatePickerProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  // Set dayjs locale
  dayjs.locale(locale);

  // Default format based on locale
  const dateFormat = format || (locale === "ar" ? "DD/MM/YYYY" : "MM/DD/YYYY");

  const resolvedValue = value ? dayjs(value) : null;

  const handleChange = (newValue: Dayjs | null) => {
    if (onChange) {
      onChange(newValue ? newValue.toDate() : null);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
  };

  // Variant classes for the wrapper
  const variantClasses = {
    default: "bg-white border border-gray-200",
    filled: "bg-gray-50 border border-transparent",
    outlined: "bg-transparent border-2 border-gray-300",
  };

  // Focus classes
  const focusClasses =
    variant === "outlined"
      ? "focus-within:border-primary"
      : "focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent";

  // Error classes
  const errorClasses = error
    ? "border-red-500 focus-within:ring-red-500 focus-within:border-red-500"
    : "";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Label */}
      {label && (
        <label
          className={`block text-sm font-medium text-gray-700 mb-1 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={resolvedValue ? resolvedValue.format("YYYY-MM-DD") : ""}
      />

      {/* DatePicker Container */}
      <div
        className={`
          ${variantClasses[variant]}
          ${focusClasses}
          ${errorClasses}
          ${disabled ? "bg-gray-100 opacity-60" : ""}
          rounded-lg
          transition-colors
          ${className}
          px-2
          py-1
        `}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
          <MuiDatePicker
            value={resolvedValue}
            onChange={handleChange}
            disabled={disabled}
            minDate={minDate ? dayjs(minDate) : undefined}
            maxDate={maxDate ? dayjs(maxDate) : undefined}
            disablePast={disablePast}
            disableFuture={disableFuture}
            shouldDisableDate={
              shouldDisableDate
                ? (date) => shouldDisableDate(date.toDate())
                : undefined
            }
            format={dateFormat}
            slotProps={{
              popper: {
                sx: { zIndex: 1500 },
              },
              textField: {
                error: Boolean(error),
                placeholder: placeholder,
                fullWidth: true,
                variant: "standard",
                InputProps: {
                  disableUnderline: true,
                  className: `${sizeClasses[inputSize]} px-4 py-2.5`,
                },
                sx: {
                  "& .MuiInputBase-root": {
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    direction: isRTL ? "rtl" : "ltr",
                  },
                  "& .MuiInputBase-input": {
                    padding: 0,
                    color: "#111827",
                    "&::placeholder": {
                      color: "#9ca3af",
                      opacity: 1,
                    },
                  },
                  "& .MuiIconButton-root": {
                    color: error ? "#ef4444" : "#9ca3af",
                  },
                },
              },
              layout: {
                sx: {
                  direction: isRTL ? "rtl" : "ltr",
                  "& .MuiPickersCalendarHeader-root": {
                    direction: isRTL ? "rtl" : "ltr",
                  },
                  "& .MuiPickersCalendarHeader-labelContainer": {
                    direction: isRTL ? "rtl" : "ltr",
                  },
                  "& .MuiDayCalendar-header": {
                    direction: isRTL ? "rtl" : "ltr",
                  },
                  "& .MuiDayCalendar-weekContainer": {
                    direction: isRTL ? "rtl" : "ltr",
                  },
                  "& .MuiPickersArrowSwitcher-root": {
                    direction: isRTL ? "rtl" : "ltr",
                    "& .MuiIconButton-root:first-of-type": {
                      order: isRTL ? 2 : 1,
                    },
                    "& .MuiIconButton-root:last-of-type": {
                      order: isRTL ? 1 : 2,
                    },
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <div
          role={error ? "alert" : undefined}
          className={`flex items-start gap-1 mt-1 text-xs ${
            error ? "text-red-600" : "text-gray-500"
          } ${isRTL ? "text-right" : "text-left"}`}
        >
          {error && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
}

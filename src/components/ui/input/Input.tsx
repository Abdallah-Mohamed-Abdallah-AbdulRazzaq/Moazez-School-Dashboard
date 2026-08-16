"use client";

import {
  ChangeEvent,
  forwardRef,
  InputHTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Select, { SelectOption } from "./Select";
import {
  defaultPhoneCountryCode,
  phoneCountries,
  PhoneCountry,
} from "./phoneCountries";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  inputSize?: "sm" | "md" | "lg";
}

function getCountryFlagSource(country: PhoneCountry): string {
  const countryCode = country.flagCode || country.code;
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function getPhoneCountry(phone: string): PhoneCountry | undefined {
  return [...phoneCountries]
    .sort((first, second) => second.dialCode.length - first.dialCode.length)
    .find((country) => phone.startsWith(country.dialCode));
}

function getLocalPhoneNumber(phone: string, country: PhoneCountry): string {
  return phone.startsWith(country.dialCode)
    ? phone.slice(country.dialCode.length)
    : phone;
}

function toInternationalPhoneNumber(country: PhoneCountry, phone: string): string {
  const normalizedPhone = phone.replace(/[^\d+]/g, "");
  if (!normalizedPhone) return "";

  if (normalizedPhone.startsWith("+")) {
    return `+${normalizedPhone.slice(1).replace(/\D/g, "")}`;
  }

  return `${country.dialCode}${normalizedPhone.replace(/^0+/, "")}`;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      variant = "default",
      inputSize = "md",
      className = "",
      disabled,
      required,
      dir,
      id,
      type,
      value,
      onChange,
      onBlur,
      onInvalid,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const locale = useLocale();
    const t = useTranslations("phoneInput");
    const isRTL = locale === "ar";
    const generatedId = useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-description`;
    const phoneValue = typeof value === "string" ? value : "";
    const detectedPhoneCountry = getPhoneCountry(phoneValue);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const [hasBlurredPhoneInput, setHasBlurredPhoneInput] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState(
      detectedPhoneCountry?.code || defaultPhoneCountryCode,
    );
    const selectedPhoneCountry = phoneCountries.find(
      (country) => country.code === selectedCountryCode,
    ) || phoneCountries[0];
    const phoneCountryOptions: SelectOption[] = phoneCountries.map((country) => ({
      value: country.code,
      label: country.name,
      triggerLabel: country.dialCode,
      ariaLabel: `${country.name} ${country.dialCode}`,
      searchText: `${country.name} ${country.dialCode}`,
      leadingContent: (
        <Image
          src={getCountryFlagSource(country)}
          alt={`${country.name} flag`}
          width={20}
          height={15}
          style={{ width: 20, height: "auto" }}
          className="rounded-sm"
        />
      ),
      trailingContent: (
        <span dir="ltr" className="text-gray-500">
          {country.dialCode}
        </span>
      ),
    }));

    useEffect(() => {
      if (detectedPhoneCountry) {
        setSelectedCountryCode(detectedPhoneCountry.code);
      }
    }, [detectedPhoneCountry]);

    const phoneValidationError =
      phoneValue && !isValidPhoneNumber(phoneValue) ? t("invalid") : undefined;
    const resolvedError =
      error || (hasBlurredPhoneInput ? phoneValidationError : undefined);

    useEffect(() => {
      phoneInputRef.current?.setCustomValidity(phoneValidationError || "");
    }, [phoneValidationError]);

    const describedBy = [
      ariaDescribedBy,
      helperText || resolvedError ? descriptionId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };

    // Variant classes
    const variantClasses = {
      default: "bg-white border border-gray-200",
      filled: "bg-gray-50 border border-transparent",
      outlined: "bg-transparent border-2 border-gray-300",
    };

    // Focus classes
    const focusClasses =
      variant === "outlined"
        ? "focus:border-primary"
        : "focus:ring-2 focus:ring-primary focus:border-transparent outline-none";

    // Error classes
    const errorClasses = resolvedError
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";

    // Disabled classes
    const disabledClasses = disabled
      ? "bg-gray-100 cursor-not-allowed opacity-60"
      : "";

    // Icon padding
    const iconPaddingLeft = leftIcon ? (isRTL ? "pr-10" : "pl-10") : "";
    const iconPaddingRight = rightIcon || resolvedError ? (isRTL ? "pl-10" : "pr-10") : "";
    const isPhoneInput = type === "tel";

    const notifyPhoneChange = (phone: string) => {
      onChange?.({
        target: { value: phone },
        currentTarget: { value: phone },
      } as ChangeEvent<HTMLInputElement>);
    };

    const changePhoneCountry = (countryCode: string) => {
      const nextCountry = phoneCountries.find(
        (country) => country.code === countryCode,
      );
      if (!nextCountry) return;

      setSelectedCountryCode(nextCountry.code);
      const localPhoneNumber = getLocalPhoneNumber(phoneValue, selectedPhoneCountry);
      notifyPhoneChange(toInternationalPhoneNumber(nextCountry, localPhoneNumber));
    };

    const setPhoneInputReference = (element: HTMLInputElement | null) => {
      phoneInputRef.current = element;

      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isRTL ? "right-3" : "left-3"
              } text-gray-400`}
            >
              {leftIcon}
            </div>
          )}

          {isPhoneInput ? (
            <div
              className={`
                ${fullWidth ? "w-full" : ""}
                ${variantClasses[variant]}
                ${errorClasses}
                ${disabledClasses}
                flex rounded-lg border transition-colors
                focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent
                ${className}
              `}
            >
              <div className="shrink-0 border-e border-gray-200 bg-gray-50">
                <Select
                  value={selectedPhoneCountry.code}
                  onChange={changePhoneCountry}
                  options={phoneCountryOptions}
                  fullWidth={false}
                  searchable
                  triggerAriaLabel="Country code"
                  searchLabel={t("searchLabel")}
                  searchPlaceholder={t("searchPlaceholder")}
                  menuLabel="Country code options"
                  className="h-full rounded-s-lg border-0 bg-gray-50 px-2 hover:shadow-none focus:ring-0"
                />
              </div>
              <input
                ref={setPhoneInputReference}
                id={inputId}
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={getLocalPhoneNumber(phoneValue, selectedPhoneCountry)}
                disabled={disabled}
                required={required}
                aria-describedby={describedBy}
                aria-invalid={ariaInvalid ?? Boolean(resolvedError)}
                onChange={(event) => {
                  const nextPhone = toInternationalPhoneNumber(
                    selectedPhoneCountry,
                    event.target.value,
                  );
                  const typedCountry = getPhoneCountry(nextPhone);
                  if (typedCountry) setSelectedCountryCode(typedCountry.code);
                  notifyPhoneChange(nextPhone);
                }}
                onBlur={(event) => {
                  setHasBlurredPhoneInput(true);
                  onBlur?.(event);
                }}
                onInvalid={(event) => {
                  setHasBlurredPhoneInput(true);
                  onInvalid?.(event);
                }}
                className={`
                  min-w-0 flex-1 border-0 bg-transparent ${sizeClasses[inputSize]}
                  outline-none placeholder:text-gray-400
                `}
                {...props}
              />
            </div>
          ) : (
            <input
              ref={ref}
              id={inputId}
              type={type}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              onInvalid={onInvalid}
              dir={dir || (isRTL ? "rtl" : "ltr")}
              disabled={disabled}
              required={required}
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid ?? Boolean(resolvedError)}
              className={`
                ${fullWidth ? "w-full" : ""}
                ${sizeClasses[inputSize]}
                ${variantClasses[variant]}
                ${focusClasses}
                ${errorClasses}
                ${disabledClasses}
                ${iconPaddingLeft}
                ${iconPaddingRight}
                rounded-lg
                transition-colors
                placeholder:text-gray-400
                ${className}
              `}
              {...props}
            />
          )}

          {/* Right Icon or Error Icon */}
          {(rightIcon || resolvedError) && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isRTL ? "left-3" : "right-3"
              } ${resolvedError ? "text-red-500 pointer-events-none" : "text-gray-400"}`}
            >
              {resolvedError ? <AlertCircle className="w-5 h-5" /> : rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {(helperText || resolvedError) && (
          <div
            id={descriptionId}
            role={resolvedError ? "alert" : undefined}
            className={`flex items-start gap-1 mt-1 text-xs ${
              resolvedError ? "text-red-600" : "text-gray-500"
            } ${isRTL ? "text-right" : "text-left"}`}
          >
            {resolvedError && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
            <span>{resolvedError || helperText}</span>
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;

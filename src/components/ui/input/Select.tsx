"use client";

import {
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ChevronDown, Search } from "lucide-react";
import { useLocale } from "next-intl";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  searchText?: string;
  leadingContent?: ReactNode;
  trailingContent?: ReactNode;
  triggerLabel?: string;
  ariaLabel?: string;
}

export interface SelectProps {
  id?: string;
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  selectSize?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchLabel?: string;
  menuLabel?: string;
  triggerAriaLabel?: string;
  noOptionsText?: string;
  noResultsText?: string;
  searchMode?: "client" | "server";
  onSearchChange?: (query: string) => void;
  menuFooter?: ReactNode;
  onOpen?: () => void;
  onEndReached?: () => void;
}

const MENU_GAP = 8;
const MENU_MAX_HEIGHT = 240;

export default function Select({
  id,
  label,
  error,
  helperText,
  options = [],
  placeholder = "Select an option",
  fullWidth = true,
  variant = "default",
  selectSize = "md",
  className = "",
  disabled = false,
  required = false,
  value,
  onChange,
  name,
  searchable = false,
  searchPlaceholder = "Search...",
  searchLabel,
  menuLabel,
  triggerAriaLabel,
  noOptionsText = "No options available",
  noResultsText = "No matching results",
  searchMode = "client",
  onSearchChange,
  menuFooter,
  onOpen,
  onEndReached,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const messageId = `${triggerId}-message`;
  const menuId = `${triggerId}-menu`;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState({
    top: null as number | null,
    bottom: null as number | null,
    left: 0,
    width: 0,
    maxHeight: MENU_MAX_HEIGHT,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const canUseDOM = typeof document !== "undefined";

  const updateSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange],
  );

  const updateMenuPosition = useCallback(() => {
    const trigger = dropdownRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const shouldOpenAbove =
      spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
    setMenuPosition({
      top: shouldOpenAbove ? null : rect.bottom + MENU_GAP,
      bottom: shouldOpenAbove
        ? viewportHeight - rect.top + MENU_GAP
        : null,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(
        MENU_MAX_HEIGHT,
        shouldOpenAbove ? spaceAbove : spaceBelow,
      ),
    });
  }, []);

  // Use controlled value if provided, otherwise use internal state
  const selectedValue = value || "";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        updateSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, updateSearchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    setIsOpen(false);
    updateSearchQuery("");

    if (onChange) {
      onChange(option.value);
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (
      searchMode === "server" ||
      !searchable ||
      !normalizedSearchQuery
    ) {
      return options;
    }

    return options.filter((option) => {
      const haystack =
        `${option.label} ${option.searchText || ""}`.toLowerCase();
      return haystack.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, options, searchable, searchMode]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = selectedOption?.triggerLabel || selectedOption?.label || placeholder;

  const menu = isOpen ? (
    <div
      id={menuId}
      ref={menuRef}
      className="fixed z-[9999] flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn hover:shadow-xl transition-shadow duration-200"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        top: menuPosition.top ?? undefined,
        bottom: menuPosition.bottom ?? undefined,
        left: menuPosition.left,
        width: fullWidth ? menuPosition.width : undefined,
        minWidth: menuPosition.width,
        maxHeight: menuPosition.maxHeight,
      }}
    >
      {searchable && (
        <div className="border-b border-gray-200 px-3 py-2">
          <div className="relative">
            <Search
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ${
                isRTL ? "right-3" : "left-3"
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              aria-label={searchLabel}
              value={searchQuery}
              onChange={(event) => updateSearchQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              className={`w-full rounded-md border border-gray-200 bg-white py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary ${
                isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"
              }`}
            />
          </div>
        </div>
      )}
      <ul
        aria-label={menuLabel}
        className="min-h-0 flex-1 py-1 overflow-y-auto"
        onScroll={(event) => {
          const list = event.currentTarget;
          if (list.scrollHeight - list.scrollTop - list.clientHeight <= 40) {
            onEndReached?.();
          }
        }}
      >
        {options.length === 0 ? (
          <li className="px-4 py-2.5 text-sm text-gray-400 text-center">
            {noOptionsText}
          </li>
        ) : filteredOptions.length === 0 ? (
          <li className="px-4 py-2.5 text-sm text-gray-400 text-center">
            {noResultsText}
          </li>
        ) : (
          filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className="animate-slideIn"
              style={{
                animationDelay: `${index * 0.03}s`,
              }}
            >
              <button
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                aria-label={option.ariaLabel}
                className={`group w-full flex items-center px-4 py-2.5 text-sm ${isRTL ? "text-right" : "text-left"} transition-all duration-200 ${
                  option.disabled
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : selectedValue === option.value
                      ? `bg-blue-50 text-primary font-medium ${isRTL ? "border-r-2 border-primary-500" : "border-l-2 border-primary-500"}`
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
                }`}
              >
                {option.leadingContent ? (
                  <span className="me-3 flex shrink-0 items-center">
                    {option.leadingContent}
                  </span>
                ) : null}
                <span dir="auto" className="min-w-0 flex-1">
                  {option.label}
                </span>
                {option.trailingContent ? (
                  <span className="ms-3 shrink-0">{option.trailingContent}</span>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
      {menuFooter ? (
        <div className="shrink-0 border-t border-gray-200 bg-white">
          {menuFooter}
        </div>
      ) : null}
    </div>
  ) : null;

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
      : "focus:ring-2 focus:ring-primary focus:border-transparent";

  // Error classes
  const errorClasses = error
    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
    : "";

  // Disabled classes
  const disabledClasses = disabled
    ? "bg-gray-100 cursor-not-allowed opacity-60"
    : "cursor-pointer";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={triggerId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div ref={dropdownRef} className="relative">
        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={selectedValue} />

        {/* Trigger Button */}
        <button
          id={triggerId}
          type="button"
          aria-controls={isOpen ? menuId : undefined}
          aria-describedby={helperText || error ? messageId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={triggerAriaLabel}
          onClick={() => {
            if (disabled) return;
            if (isOpen) {
              setIsOpen(false);
              updateSearchQuery("");
              return;
            }
            updateMenuPosition();
            onOpen?.();
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (
              !searchable ||
              event.key.length !== 1 ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            ) {
              return;
            }

            event.preventDefault();
            updateMenuPosition();
            onOpen?.();
            updateSearchQuery(event.key);
            setIsOpen(true);
          }}
          disabled={disabled}
          className={`
            ${fullWidth ? "w-full" : ""}
            ${sizeClasses[selectSize]}
            ${variantClasses[variant]}
            ${focusClasses}
            ${errorClasses}
            ${disabledClasses}
            ${isRTL ? "text-right" : "text-left"}
            rounded-lg
            transition-all duration-200
            hover:shadow-sm
            ${!disabled && !error ? "hover:border-gray-300" : ""}
            flex items-center justify-between
            ${className}
          `}
        >
          <span className={`flex min-w-0 items-center ${!selectedOption ? "text-gray-400" : "text-gray-900"}`}>
            {selectedOption?.leadingContent ? (
              <span className="me-2 flex shrink-0 items-center">
                {selectedOption.leadingContent}
              </span>
            ) : null}
            <span dir="auto" className="truncate">
              {displayLabel}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 ${error ? "text-red-500" : "text-gray-400"} transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isRTL ? "mr-2" : "ml-2"}`}
          />
        </button>

        {canUseDOM && menu ? createPortal(menu, document.body) : null}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <div
          id={messageId}
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

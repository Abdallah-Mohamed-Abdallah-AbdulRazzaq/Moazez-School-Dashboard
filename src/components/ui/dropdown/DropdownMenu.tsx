"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useCallback,
  type KeyboardEvent,
  ReactElement,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { getFocusableElements } from "@/lib/accessibility/focusTrap";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "default" | "danger";
}

export interface DropdownMenuProps {
  trigger?: ReactNode;
  label?: string;
  items: DropdownItem[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
  width?: string;
  disabled?: boolean;
}

const MENU_GAP = 8;
const MENU_MAX_HEIGHT = 240;

export default function DropdownMenu({
  trigger,
  label,
  items,
  onSelect,
  placeholder = "Select an option",
  className = "",
  width = "w-48",
  disabled = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const menuId = useId();
  const [openingEdge, setOpeningEdge] = useState<"first" | "last">("first");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const canUseDOM = typeof document !== "undefined";

  const setMenuPositionFromTrigger = useCallback(
    (trigger: HTMLElement, measuredMenuWidth?: number) => {
      const rect = trigger.getBoundingClientRect();
      const fallbackWidth = measuredMenuWidth || rect.width || 192;
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = viewportHeight - rect.bottom - MENU_GAP;
      const spaceAbove = rect.top - MENU_GAP;
      const shouldOpenAbove =
        spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
      const availableHeight = Math.max(
        80,
        shouldOpenAbove ? spaceAbove : spaceBelow,
      );
      setMenuPosition({
        top: shouldOpenAbove
          ? Math.max(
              MENU_GAP,
              rect.top - Math.min(MENU_MAX_HEIGHT, availableHeight) - MENU_GAP,
            )
          : rect.bottom + MENU_GAP,
        left: Math.max(
          MENU_GAP,
          Math.min(
            isRTL ? rect.left : rect.right - fallbackWidth,
            viewportWidth - fallbackWidth - MENU_GAP,
          ),
        ),
        width: rect.width || 192,
      });
    },
    [isRTL],
  );

  const updateMenuPosition = useCallback(() => {
    const trigger = dropdownRef.current;
    if (!trigger) return;

    setMenuPositionFromTrigger(trigger, menuRef.current?.offsetWidth);
  }, [setMenuPositionFromTrigger]);

  const focusTrigger = () =>
    dropdownRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  const enabledMenuItems = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const options = enabledMenuItems();
    (openingEdge === "last" ? options.at(-1) : options[0])?.focus();
  }, [isOpen, openingEdge, updateMenuPosition]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      if (event.key === "Escape") event.stopPropagation();
      setIsOpen(false);
      if (event.key === "Tab") focusAdjacentControl(event.shiftKey ? -1 : 1);
      else focusTrigger();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = enabledMenuItems();
    if (options.length === 0) return;
    const current = options.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : (current + (event.key === "ArrowUp" ? -1 : 1) + options.length) %
            options.length;
    options[next]?.focus();
  };

  const focusAdjacentControl = (direction: -1 | 1) => {
    const trigger =
      dropdownRef.current?.querySelector<HTMLButtonElement>("button");
    if (!trigger) return;
    const scope =
      trigger.closest<HTMLElement>('[role="dialog"]') ?? document.body;
    const controls = getFocusableElements(scope).filter(
      (control) =>
        control.tabIndex >= 0 &&
        !menuRef.current?.contains(control) &&
        !control.closest('[inert], [aria-hidden="true"]'),
    );
    const index = controls.indexOf(trigger);
    (index >= 0 ? (controls[index + direction] ?? trigger) : trigger).focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (disabled || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    setOpeningEdge(event.key === "ArrowUp" ? "last" : "first");
    setIsOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;

    setSelectedValue(item.value);
    setIsOpen(false);
    focusTrigger();

    if (item.onClick) {
      item.onClick();
    }

    if (onSelect) {
      onSelect(item.value);
    }
  };

  const selectedItem = items.find((item) => item.value === selectedValue);
  const displayLabel = selectedItem?.label || placeholder;

  const toggleOpen = (trigger: HTMLElement) => {
    if (disabled) return;
    if (!isOpen) {
      setOpeningEdge("first");
      setMenuPositionFromTrigger(trigger);
    }
    setIsOpen((value) => !value);
  };

  const resolvedTriggerId = isValidElement(trigger)
    ? ((trigger.props as React.HTMLAttributes<HTMLElement>).id ?? triggerId)
    : triggerId;

  const triggerElement = (() => {
    if (!trigger || !isValidElement(trigger)) return trigger;
    const element = trigger as ReactElement<React.HTMLAttributes<HTMLElement>>;
    return cloneElement(element, {
      id: resolvedTriggerId,
      onClick: (event) => {
        element.props.onClick?.(event);
        toggleOpen(event.currentTarget);
      },
      "aria-haspopup": "menu",
      "aria-expanded": isOpen,
      "aria-controls": isOpen ? menuId : undefined,
      onKeyDown: (event) => {
        element.props.onKeyDown?.(event);
        if (!event.defaultPrevented) onTriggerKeyDown(event);
      },
    });
  })();

  const menu = isOpen ? (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-labelledby={resolvedTriggerId}
      onKeyDown={onMenuKeyDown}
      className={`${width} fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn hover:shadow-xl transition-shadow duration-200 motion-reduce:animate-none motion-reduce:transition-none`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        minWidth: menuPosition.width,
        maxWidth: "calc(100vw - 16px)",
      }}
    >
      <ul
        className="py-1 overflow-y-auto"
        style={{ maxHeight: MENU_MAX_HEIGHT }}
      >
        {items.map((item, index) => (
          <li
            key={item.value}
            className="animate-slideIn motion-reduce:animate-none"
            style={{
              animationDelay: `${index * 0.03}s`,
            }}
          >
            <button
              role="menuitem"
              type="button"
              tabIndex={-1}
              onClick={() => handleSelect(item)}
              disabled={item.disabled}
              className={`group w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isRTL ? "text-right" : "text-left"} transition-all duration-200 ${
                item.disabled
                  ? "text-gray-400 cursor-not-allowed opacity-50"
                  : selectedValue === item.value
                    ? `bg-blue-50 text-primary-600 font-medium ${isRTL ? "border-r-2 border-primary-500" : "border-l-2 border-primary-500"}`
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
              }`}
            >
              {item.icon && (
                <span className="shrink-0 transition-all duration-200 group-hover:scale-105">
                  {item.icon}
                </span>
              )}
              <span
                className={
                  item.tone === "danger" && !item.disabled
                    ? "text-red-700"
                    : undefined
                }
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {trigger ? (
        triggerElement
      ) : (
        <button
          id={triggerId}
          type="button"
          onClick={(event) => toggleOpen(event.currentTarget)}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onKeyDown={onTriggerKeyDown}
          className={`${width} flex items-center justify-between px-4 py-2.5 bg-white border border-border rounded-lg hover:border-hover hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="flex items-center gap-2 text-sm text-black">
            {selectedItem?.icon && <span>{selectedItem.icon}</span>}
            {label && <span className="font-medium">{label}:</span>}
            <span className={selectedItem ? "" : "text-black"}>
              {displayLabel}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {canUseDOM && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

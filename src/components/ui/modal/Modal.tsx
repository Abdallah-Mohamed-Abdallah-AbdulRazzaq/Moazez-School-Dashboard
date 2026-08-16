"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Info } from "lucide-react";
import { useLocale } from "next-intl";
import { createFocusTrap } from "@/lib/accessibility/focusTrap";
import {
  generateAriaId,
  createAriaModal,
} from "@/lib/accessibility/ariaHelpers";

let openModalCount = 0;
let initialBodyOverflow = "";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
  // New optional props for confirm-style modals
  icon?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "confirm" | "danger";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = "",
  icon,
  description,
  variant = "default",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useMemo(() => generateAriaId("modal-title"), []);
  const descriptionId = useMemo(() => generateAriaId("modal-description"), []);
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Store the element that triggered the modal
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus trap and focus restoration
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const cleanup = createFocusTrap(modalRef.current);

    return () => {
      cleanup();
      // Restore focus to the element that opened the modal
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    if (openModalCount === 0) {
      initialBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    openModalCount += 1;

    return () => {
      openModalCount -= 1;

      if (openModalCount === 0) {
        document.body.style.overflow = initialBodyOverflow;
      }
    };
  }, [isOpen]);

  // Require a deliberate double-click outside the modal before closing it.
  const handleOverlayDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (typeof document === "undefined") return null;

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    full: "max-w-full mx-4",
  };

  // Default icon if none provided but title exists
  const shouldShowIcon = icon !== undefined || (title && description);
  const displayIcon = icon || <Info className="w-6 h-6" />;

  // Icon background color based on variant
  const iconBgColor =
    variant === "danger"
      ? "bg-red-100"
      : variant === "confirm"
        ? "bg-primary-100"
        : "bg-[var(--color-primary-100)]";

  const iconColor =
    variant === "danger"
      ? "text-red-600"
      : variant === "confirm"
        ? "text-primary-600"
        : "text-[var(--primary-color)]";

  // Create ARIA props
  const ariaProps = createAriaModal(
    title ? titleId : undefined,
    description ? descriptionId : undefined,
    variant === "danger",
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onDoubleClick={handleOverlayDoubleClick}
      dir={isRTL ? "rtl" : "ltr"}
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl
          transition-all ${className}
          max-h-[calc(100vh-2rem)]
          flex flex-col overflow-hidden
        `}
        style={{
          animation: "modalFadeIn 0.2s ease-out",
          fontFamily: "var(--font-somar), sans-serif",
        }}
        {...ariaProps}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="shrink-0 px-6 pt-6 pb-4 bg-white">
            <div className="flex items-start gap-4">
              {/* Icon Circle */}
              {shouldShowIcon && (
                <div
                  className={`shrink-0 w-12 h-12 rounded-full ${iconBgColor} ${iconColor} flex items-center justify-center`}
                >
                  {displayIcon}
                </div>
              )}

              {/* Title and Description */}
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    id={titleId}
                    className="text-xl font-bold text-gray-900 mb-1"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descriptionId}
                    className="text-sm text-gray-600 leading-relaxed"
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Close Button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={`shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
                    isRTL ? "ml-auto" : "mr-0"
                  }`}
                  style={{
                    position: title || shouldShowIcon ? "relative" : "absolute",
                    top: title || shouldShowIcon ? "0" : "1rem",
                    [isRTL ? "left" : "right"]:
                      title || shouldShowIcon ? "0" : "1rem",
                  }}
                  aria-label={locale === "ar" ? "إغلاق" : "Close modal"}
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
          {children}
        </div>

        {/* Footer */}
        {closeOnOverlayClick && (
          <div className="shrink-0 px-6 py-2 text-center text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
            {locale === "ar"
              ? "انقر نقرتين خارج النافذة لإغلاقها"
              : "Double-click outside this window to close it"}
          </div>
        )}

        {footer && (
          <div
            className={`shrink-0 flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-white ${
              isRTL ? "justify-start" : "justify-end"
            }`}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}

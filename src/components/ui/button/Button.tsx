"use client";
import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-gradient-to-r from-primary to-hover hover:bg-hover text-white focus:ring-[var(--primary-color)]",
      secondary:
        "bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
      outline:
        "bg-transparent border-2 border-primary hover:bg-primary text-primary hover:text-white focus:ring-primary",
      ghost:
        "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      success:
        "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    const combinedClassName =
      `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span>{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
export { Button };

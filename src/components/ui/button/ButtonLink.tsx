import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./Button";

export interface ButtonLinkProps
  extends Omit<ComponentProps<typeof Link>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {leftIcon ? <span>{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span>{rightIcon}</span> : null}
    </Link>
  );
}

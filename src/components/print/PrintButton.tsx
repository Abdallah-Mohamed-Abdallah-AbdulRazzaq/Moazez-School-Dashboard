"use client";

import { Printer } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface PrintButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export default function PrintButton({
  onClick,
  disabled = false,
  label = "Print",
}: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      leftIcon={<Printer className="h-4 w-4" />}
    >
      {label}
    </Button>
  );
}

"use client";

import { Menu } from "lucide-react";

interface MenuToggleProps {
  onClick: () => void;
}

export default function MenuToggle({ onClick }: MenuToggleProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      aria-label="Toggle menu"
    >
      <Menu className="w-6 h-6 text-gray-700" />
    </button>
  );
}

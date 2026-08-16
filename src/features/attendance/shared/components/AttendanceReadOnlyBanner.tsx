"use client";

import { AlertCircle } from "lucide-react";

interface AttendanceReadOnlyBannerProps {
  message: string;
}

export default function AttendanceReadOnlyBanner({
  message,
}: AttendanceReadOnlyBannerProps) {
  return (
   <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{message}</span>
        </div>
  );
}

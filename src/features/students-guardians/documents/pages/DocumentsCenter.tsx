"use client";

import { FileText } from "lucide-react";

export default function DocumentsCenter() {
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-6 w-6 text-gray-500" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Documents Center Coming Soon
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
          Global student document list and stats endpoints are not confirmed in
          the backend yet. This page will remain unavailable until those
          contracts exist.
        </p>
      </div>
    </div>
  );
}

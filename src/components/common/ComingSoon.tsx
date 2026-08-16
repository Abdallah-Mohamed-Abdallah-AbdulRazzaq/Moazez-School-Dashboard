"use client";

import { useTranslations } from "next-intl";
import { Rocket } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-6 py-12 max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Rocket className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        
        <p className="text-lg text-gray-600 mb-2">{t("coming_soon")}</p>
        
        {description && (
          <p className="text-sm text-gray-500 mt-4">{description}</p>
        )}
      </div>
    </div>
  );
}

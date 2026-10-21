"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import { isValidHttpsUrl } from "../utils/validation";

interface QuestionImageFieldProps {
  url: string;
  isReadOnly: boolean;
  error?: string;
  onChange: (url: string) => void;
}

function QuestionImagePreview({ url }: { url: string }) {
  const t = useTranslations("academics.curriculum.questions");
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p role="status" className="text-sm text-red-600">{t("image_load_failed")}</p>
  ) : (
    <Image src={url} alt={t("question_image")} width={640} height={360} unoptimized
      referrerPolicy="no-referrer" onError={() => setFailed(true)}
      className="max-h-72 w-auto max-w-full rounded-lg object-contain" />
  );
}

export default function QuestionImageField({ url, isReadOnly, error, onChange }: QuestionImageFieldProps) {
  const t = useTranslations("academics.curriculum.questions");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imageUrl = url.trim();
  const canPreview = isValidHttpsUrl(imageUrl) && !error;
  return (
    <div className="space-y-3">
      <Input label={t("question_image_url")} value={url} dir="ltr" type="url"
        maxLength={2000} placeholder="https://" disabled={isReadOnly} error={error}
        helperText={t("question_image_help")} onChange={(event) => { setPreviewUrl(""); onChange(event.target.value); }} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={!canPreview}
          onClick={() => setPreviewUrl(imageUrl)}>{t("preview_image")}</Button>
        {!isReadOnly && imageUrl && (
          <Button type="button" variant="secondary" size="sm" onClick={() => { onChange(""); setPreviewUrl(""); }}>
            {t("remove_image")}
          </Button>
        )}
      </div>
      {canPreview && (previewUrl === null || previewUrl === imageUrl) && (
        <QuestionImagePreview key={imageUrl} url={imageUrl} />
      )}
    </div>
  );
}

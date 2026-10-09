"use client";

import { ButtonWithTooltip } from "@mdxeditor/editor";
import { Link2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";

interface RichTextLinkControlProps {
  onInsertLink: (markdown: string) => void;
}

const LINK_COPY = {
  en: {
    trigger: "Create link",
    title: "Create link",
    text: "Link text",
    url: "URL",
    cancel: "Cancel",
    insert: "Insert link",
    invalidUrl: "Enter a valid HTTP or HTTPS URL.",
  },
  ar: {
    trigger: "إنشاء رابط",
    title: "إنشاء رابط",
    text: "نص الرابط",
    url: "الرابط",
    cancel: "إلغاء",
    insert: "إضافة الرابط",
    invalidUrl: "أدخل رابط HTTP أو HTTPS صالحًا.",
  },
} as const;

function isWebUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeLinkText(text: string): string {
  return text.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function markdownLink(text: string, url: string): string {
  const safeUrl = url.replaceAll("(", "%28").replaceAll(")", "%29");
  return `[${escapeLinkText(text || url)}](${safeUrl})`;
}

export default function RichTextLinkControl({
  onInsertLink,
}: RichTextLinkControlProps) {
  const locale = useLocale();
  const copy = LINK_COPY[locale === "ar" ? "ar" : "en"];
  const formId = `${useId()}-rich-text-link-form`;
  const [isOpen, setIsOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string>();

  const closeDialog = () => {
    setIsOpen(false);
    setLinkText("");
    setUrl("");
    setUrlError(undefined);
  };

  const insertLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUrl = url.trim();
    if (!isWebUrl(normalizedUrl)) {
      setUrlError(copy.invalidUrl);
      return;
    }

    onInsertLink(markdownLink(linkText.trim(), normalizedUrl));
    closeDialog();
  };

  return (
    <>
      <ButtonWithTooltip
        type="button"
        title={copy.trigger}
        aria-label={copy.trigger}
        onClick={() => setIsOpen(true)}
      >
        <Link2 aria-hidden="true" className="size-4" />
      </ButtonWithTooltip>
      <Modal
        isOpen={isOpen}
        onClose={closeDialog}
        title={copy.title}
        size="sm"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeDialog}>
              {copy.cancel}
            </Button>
            <Button type="submit" form={formId}>
              {copy.insert}
            </Button>
          </>
        }
      >
        <form
          id={formId}
          className="space-y-4 py-2"
          onSubmit={insertLink}
        >
          <Input
            label={copy.text}
            value={linkText}
            onChange={(event) => setLinkText(event.target.value)}
          />
          <Input
            label={copy.url}
            type="url"
            inputMode="url"
            dir="ltr"
            value={url}
            error={urlError}
            required
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError(undefined);
            }}
          />
        </form>
      </Modal>
    </>
  );
}

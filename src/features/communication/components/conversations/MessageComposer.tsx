"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";

export interface MessageComposerProps {
  placeholder: string;
  sendLabel: string;
  maxLengthLabel?: string;
  disabled?: boolean;
  maxLength?: number;
  onTyping: () => void;
  onStopTyping: () => void;
  onSend: (body: string) => Promise<void> | void;
}

export default function MessageComposer({
  disabled,
  maxLength,
  maxLengthLabel,
  onSend,
  onStopTyping,
  onTyping,
  placeholder,
  sendLabel,
}: MessageComposerProps) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const trimmedLength = body.trim().length;
  const isTooLong = Boolean(maxLength && trimmedLength > maxLength);
  const validationMessage =
    isTooLong && maxLengthLabel
      ? maxLengthLabel
          .replace("{count}", String(trimmedLength))
          .replace("{max}", String(maxLength))
      : null;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [body]);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || isTooLong) return;
    setBody("");
    onStopTyping();
    await onSend(trimmed);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <TextArea
        ref={textareaRef}
        value={body}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        resize="none"
        className="max-h-[140px] overflow-y-auto"
        style={{ maxHeight: "140px" }}
        onChange={(event) => {
          setBody(event.target.value);
          onTyping();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs">
          {validationMessage ? (
            <span className="text-red-600">{validationMessage}</span>
          ) : maxLength ? (
            <span className="text-slate-500">
              {trimmedLength}/{maxLength}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          disabled={disabled || trimmedLength === 0 || isTooLong}
          onClick={() => void submit()}
          leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
        >
          {sendLabel}
        </Button>
      </div>
    </div>
  );
}

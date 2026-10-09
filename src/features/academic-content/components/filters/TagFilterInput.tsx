"use client";

import { Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Input from "@/components/ui/input/Input";

interface TagFilterInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function TagFilterInput({
  label,
  value,
  onChange,
}: TagFilterInputProps) {
  const [draft, setDraft] = useState({ applied: value, text: value });
  const applyTag = useDebouncedCallback(onChange, 350);

  if (draft.applied !== value) {
    setDraft({ applied: value, text: value });
  }

  useEffect(() => () => applyTag.cancel(), [value, applyTag]);

  return (
    <Input
      label={label}
      aria-label={label}
      value={draft.text}
      maxLength={80}
      leftIcon={<Tag aria-hidden="true" className="size-4" />}
      onChange={(event) => {
        const nextTag = event.target.value.slice(0, 80);
        setDraft({ applied: value, text: nextTag });
        applyTag(nextTag);
      }}
      onBlur={() => applyTag.flush()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          applyTag.flush();
        }
      }}
    />
  );
}

"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";

interface OrderedTextListProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  maximumItems?: number;
  maximumLength?: number;
}

function singularLabel(label: string): string {
  const normalized = label.trim().toLowerCase();
  return normalized.endsWith("ies")
    ? `${normalized.slice(0, -3)}y`
    : normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
}

export default function OrderedTextList({
  label,
  values,
  onChange,
  disabled = false,
  maximumItems = 50,
  maximumLength = 500,
}: OrderedTextListProps) {
  const itemLabel = singularLabel(label);

  const updateItem = (index: number, value: string) => {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= values.length) return;
    const reorderedValues = [...values];
    [reorderedValues[index], reorderedValues[destination]] = [
      reorderedValues[destination],
      reorderedValues[index],
    ];
    onChange(reorderedValues);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      {values.map((value, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Input
              aria-label={`${label} ${index + 1}`}
              value={value}
              maxLength={maximumLength}
              disabled={disabled}
              onChange={(event) => updateItem(index, event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Move ${itemLabel} ${index + 1} up`}
            disabled={disabled || index === 0}
            onClick={() => moveItem(index, -1)}
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Move ${itemLabel} ${index + 1} down`}
            disabled={disabled || index === values.length - 1}
            onClick={() => moveItem(index, 1)}
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Remove ${itemLabel} ${index + 1}`}
            disabled={disabled}
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<Plus aria-hidden="true" className="size-4" />}
        disabled={disabled || values.length >= maximumItems}
        onClick={() => onChange([...values, ""])}
      >
        Add {itemLabel}
      </Button>
    </fieldset>
  );
}

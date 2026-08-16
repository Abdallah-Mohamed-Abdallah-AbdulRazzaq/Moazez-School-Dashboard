"use client";

import { useState } from "react";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import type {
  EmailTemplate,
  EmailTemplateSocialLinks,
  UpdateEmailTemplateRequest,
} from "@/features/settings/email/templates/types";

export interface TemplateEditorValues {
  subject: string;
  preheader: string;
  title: string;
  subtitle: string;
  bodyHtml: string;
  bodyText: string;
  footerHtml: string;
  supportEmail: string;
  supportPhone: string;
  website: string;
  facebook: string;
  instagram: string;
  x: string;
  isActive: boolean;
}

export type TemplateEditorErrors = Partial<Record<keyof TemplateEditorValues, string>>;

interface TemplateEditorProps {
  values: TemplateEditorValues;
  errors?: TemplateEditorErrors;
  canManage: boolean;
  allowedVariables: string[];
  onChange: <K extends keyof TemplateEditorValues>(
    field: K,
    value: TemplateEditorValues[K],
  ) => void;
  labels: {
    subject: string;
    preheader: string;
    title: string;
    subtitle: string;
    bodyHtml: string;
    bodyText: string;
    footerHtml: string;
    supportEmail: string;
    supportPhone: string;
    website: string;
    facebook: string;
    instagram: string;
    x: string;
    isActive: string;
    allowedVariables: string;
    noVariables: string;
    credentialSafety: string;
    htmlTab: string;
    textTab: string;
    variableHelp: string;
    insertVariable: string;
  };
}

export function toTemplateEditorValues(
  template: EmailTemplate,
): TemplateEditorValues {
  const socialLinks = template.socialLinks || {};
  return {
    subject: template.subject || "",
    preheader: template.preheader || "",
    title: template.title || "",
    subtitle: template.subtitle || "",
    bodyHtml: template.bodyHtml || "",
    bodyText: template.bodyText || "",
    footerHtml: template.footerHtml || "",
    supportEmail: template.supportEmail || "",
    supportPhone: template.supportPhone || "",
    website: socialLinks.website || "",
    facebook: socialLinks.facebook || "",
    instagram: socialLinks.instagram || "",
    x: socialLinks.x || "",
    isActive: template.isActive,
  };
}

export function toUpdateTemplateRequest(
  values: TemplateEditorValues,
): UpdateEmailTemplateRequest {
  const socialLinks: EmailTemplateSocialLinks = {
    website: values.website.trim() || undefined,
    facebook: values.facebook.trim() || undefined,
    instagram: values.instagram.trim() || undefined,
    x: values.x.trim() || undefined,
  };

  return {
    subject: values.subject.trim(),
    preheader: values.preheader.trim() || null,
    title: values.title.trim() || null,
    subtitle: values.subtitle.trim() || null,
    bodyHtml: values.bodyHtml,
    bodyText: values.bodyText.trim() || null,
    footerHtml: values.footerHtml.trim() || null,
    supportEmail: values.supportEmail.trim() || null,
    supportPhone: values.supportPhone.trim() || null,
    socialLinks,
    isActive: values.isActive,
  };
}

export function validateTemplateEditor(
  values: TemplateEditorValues,
  messages: {
    subjectRequired: string;
    bodyHtmlRequired: string;
  },
): TemplateEditorErrors {
  const errors: TemplateEditorErrors = {};
  if (!values.subject.trim()) {
    errors.subject = messages.subjectRequired;
  }
  if (!values.bodyHtml.trim()) {
    errors.bodyHtml = messages.bodyHtmlRequired;
  }
  return errors;
}

export default function TemplateEditor({
  values,
  errors,
  canManage,
  allowedVariables,
  onChange,
  labels,
}: TemplateEditorProps) {
  const [activeBody, setActiveBody] = useState<"html" | "text">("html");
  const activeBodyField = activeBody === "html" ? "bodyHtml" : "bodyText";

  const insertVariable = (variable: string) => {
    const token = `{{${variable}}}`;
    const currentValue = values[activeBodyField];
    onChange(
      activeBodyField,
      `${currentValue}${currentValue && !currentValue.endsWith(" ") ? " " : ""}${token}`,
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {labels.credentialSafety}
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm font-semibold text-gray-900">
          {labels.allowedVariables}
        </p>
        <p className="mt-1 text-xs text-gray-500">{labels.variableHelp}</p>
        {allowedVariables.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {allowedVariables.map((variable) => (
              <button
                key={variable}
                type="button"
                disabled={!canManage}
                aria-label={labels.insertVariable.replace(
                  "{variable}",
                  `{{${variable}}}`,
                )}
                className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-xs text-gray-700 transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => insertVariable(variable)}
              >
                {`{{${variable}}}`}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">{labels.noVariables}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label={labels.subject}
          value={values.subject}
          disabled={!canManage}
          onChange={(event) => onChange("subject", event.target.value)}
          error={errors?.subject}
        />
        <Input
          label={labels.preheader}
          value={values.preheader}
          disabled={!canManage}
          onChange={(event) => onChange("preheader", event.target.value)}
          error={errors?.preheader}
        />
        <Input
          label={labels.title}
          value={values.title}
          disabled={!canManage}
          onChange={(event) => onChange("title", event.target.value)}
          error={errors?.title}
        />
        <Input
          label={labels.subtitle}
          value={values.subtitle}
          disabled={!canManage}
          onChange={(event) => onChange("subtitle", event.target.value)}
          error={errors?.subtitle}
        />
      </div>
      <div className="space-y-3">
        <div
          role="tablist"
          aria-label={labels.bodyHtml}
          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
        >
          {(["html", "text"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeBody === tab}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                activeBody === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => setActiveBody(tab)}
            >
              {tab === "html" ? labels.htmlTab : labels.textTab}
            </button>
          ))}
        </div>
        {activeBody === "html" ? (
          <TextArea
            label={labels.bodyHtml}
            rows={10}
            value={values.bodyHtml}
            disabled={!canManage}
            dir="ltr"
            onChange={(event) => onChange("bodyHtml", event.target.value)}
            error={errors?.bodyHtml}
          />
        ) : (
          <TextArea
            label={labels.bodyText}
            rows={10}
            value={values.bodyText}
            disabled={!canManage}
            onChange={(event) => onChange("bodyText", event.target.value)}
            error={errors?.bodyText}
          />
        )}
      </div>
      <TextArea
        label={labels.footerHtml}
        rows={5}
        value={values.footerHtml}
        disabled={!canManage}
        dir="ltr"
        onChange={(event) => onChange("footerHtml", event.target.value)}
        error={errors?.footerHtml}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label={labels.supportEmail}
          type="email"
          value={values.supportEmail}
          disabled={!canManage}
          onChange={(event) => onChange("supportEmail", event.target.value)}
          error={errors?.supportEmail}
        />
        <Input
          type="tel"
          label={labels.supportPhone}
          value={values.supportPhone}
          disabled={!canManage}
          onChange={(event) => onChange("supportPhone", event.target.value)}
          error={errors?.supportPhone}
        />
        <Input
          label={labels.website}
          value={values.website}
          disabled={!canManage}
          onChange={(event) => onChange("website", event.target.value)}
          error={errors?.website}
        />
        <Input
          label={labels.facebook}
          value={values.facebook}
          disabled={!canManage}
          onChange={(event) => onChange("facebook", event.target.value)}
          error={errors?.facebook}
        />
        <Input
          label={labels.instagram}
          value={values.instagram}
          disabled={!canManage}
          onChange={(event) => onChange("instagram", event.target.value)}
          error={errors?.instagram}
        />
        <Input
          label={labels.x}
          value={values.x}
          disabled={!canManage}
          onChange={(event) => onChange("x", event.target.value)}
          error={errors?.x}
        />
      </div>
      <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300"
          checked={values.isActive}
          disabled={!canManage}
          onChange={(event) => onChange("isActive", event.target.checked)}
        />
        <span>{labels.isActive}</span>
      </label>
    </div>
  );
}

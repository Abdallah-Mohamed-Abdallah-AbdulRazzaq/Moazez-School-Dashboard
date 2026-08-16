"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import { SchoolBrandingEditor } from "@/features/settings/branding/components/SchoolBrandingEditor";
import type { SchoolBrandingFormCopy } from "@/features/settings/branding/components/SchoolBrandingEditor";
import { useSchoolBrandingEditor } from "@/features/settings/branding/hooks/useSchoolBrandingEditor";
import {
  calculateBrandingProfileCompleteness,
  getEmptyBrandingProfile,
  updateBrandingProfile,
} from "@/features/settings/services/brandingService";
import type { SchoolProfileSettings } from "@/features/settings/types";

export interface OrganizationSetupStepCopy {
  summary: string;
  savedData: string;
  editBranding: string;
  cancel: string;
  save: string;
  saving: string;
  completeness(percent: number): string;
  noLogo: string;
  noLocation: string;
  editor: SchoolBrandingFormCopy;
}

interface OrganizationSetupStepProps {
  copy: OrganizationSetupStepCopy;
  profile: SchoolProfileSettings | null;
  refreshStep(stepId: "organization"): Promise<void> | void;
}

function createInitialProfile(profile: SchoolProfileSettings | null) {
  return profile ?? getEmptyBrandingProfile();
}

function BrandingSummary({
  copy,
  profile,
}: {
  copy: OrganizationSetupStepCopy;
  profile: SchoolProfileSettings;
}) {
  const completeness = calculateBrandingProfileCompleteness(profile);
  const coordinates =
    profile.latitude !== null && profile.longitude !== null
      ? copy.editor.coordinates(
          profile.latitude.toFixed(5),
          profile.longitude.toFixed(5),
        )
      : null;

  return (
    <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-950">
            {copy.savedData}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {copy.completeness(completeness)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {copy.editor.uploadLogo}
          </p>
          {profile.logoUrl ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={profile.schoolName}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-white"
                src={profile.logoUrl}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-950">
                  {profile.schoolName}
                </p>
                <p className="text-sm text-gray-500">{profile.shortName}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">{copy.noLogo}</p>
          )}
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm md:grid-cols-2">
          <SummaryItem label={copy.editor.schoolName} value={profile.schoolName} />
          <SummaryItem label={copy.editor.shortName} value={profile.shortName} />
          <SummaryItem label={copy.editor.timezone} value={profile.timezone} />
          <SummaryItem label={copy.editor.city} value={profile.city} />
          <SummaryItem label={copy.editor.country} value={profile.country} />
          <SummaryItem
            label={copy.editor.footerSignature}
            value={profile.footerSignature}
          />
          <div className="md:col-span-2">
            <SummaryItem
              label={copy.editor.selectedLocation}
              value={profile.formattedAddress || copy.noLocation}
            />
            {coordinates ? (
              <p className="mt-1 text-xs text-gray-500">{coordinates}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export function OrganizationSetupStep({
  copy,
  profile,
  refreshStep,
}: OrganizationSetupStepProps) {
  const [savedProfile, setSavedProfile] = useState(() =>
    createInitialProfile(profile),
  );
  const [isEditing, setIsEditing] = useState(profile === null);
  const previousProfileRef = useRef(profile);

  useEffect(() => {
    if (previousProfileRef.current === profile) {
      return;
    }
    previousProfileRef.current = profile;

    void Promise.resolve().then(() => {
      setSavedProfile(createInitialProfile(profile));
    });
    void Promise.resolve().then(() => setIsEditing(profile === null));
  }, [profile]);

  const editor = useSchoolBrandingEditor({
    initialProfile: savedProfile,
    copy: copy.editor,
    onSave: async (draft) => {
      const saved = await updateBrandingProfile(draft);
      setSavedProfile(saved);
      await refreshStep("organization");
      setIsEditing(false);
      return saved;
    },
  });

  if (isEditing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{copy.summary}</p>
        <SchoolBrandingEditor copy={copy.editor} editor={editor} />
        <div className="flex flex-wrap justify-end gap-2">
          {profile ? (
            <Button
              disabled={editor.isSaving}
              onClick={() => {
                editor.cancel();
                setIsEditing(false);
              }}
              type="button"
              variant="secondary"
            >
              {copy.cancel}
            </Button>
          ) : null}
          <Button
            disabled={editor.isSaving}
            loading={editor.isSaving}
            onClick={() => void editor.save()}
            type="button"
          >
            {editor.isSaving ? copy.saving : copy.save}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      <BrandingSummary copy={copy} profile={editor.profile} />
      <Button
        onClick={() => setIsEditing(true)}
        type="button"
        variant="secondary"
      >
        {copy.editBranding}
      </Button>
    </div>
  );
}

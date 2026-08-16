"use client";

import { useState } from "react";
import { ImagePlus, MapPin, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { timezones } from "../../constants/timezones";
import SchoolLocationPickerModal from "../../components/SchoolLocationPickerModal";
import type {
  ResolvedSchoolLocation,
  SchoolProfileSettings,
} from "../../types";
import type {
  SchoolBrandingEditorCopy,
  SchoolBrandingEditorState,
} from "../hooks/useSchoolBrandingEditor";

export interface SchoolBrandingFormCopy extends SchoolBrandingEditorCopy {
  schoolName: string;
  shortName: string;
  timezone: string;
  address: string;
  city: string;
  country: string;
  footerSignature: string;
  uploadLogo: string;
  uploadHint: string;
  removeLogo: string;
  removeLogoTitle: string;
  removeLogoDescription: string;
  confirmRemoveLogo: string;
  cancel: string;
  pickFromMap: string;
  clearLocation: string;
  selectedLocation: string;
  noLocation: string;
  locationStale: string;
  coordinates(lat: string, lng: string): string;
}

interface SchoolBrandingEditorProps {
  editor: SchoolBrandingEditorState;
  copy: SchoolBrandingFormCopy;
  disabled?: boolean;
}

function profileToLocation(
  profile: SchoolProfileSettings,
): ResolvedSchoolLocation | null {
  if (
    profile.latitude === null ||
    profile.longitude === null ||
    !profile.formattedAddress.trim()
  ) {
    return null;
  }

  return {
    label:
      profile.mapPlaceLabel.trim() ||
      profile.schoolName ||
      profile.shortName ||
      profile.city,
    formattedAddress: profile.formattedAddress,
    addressLine: profile.addressLine,
    city: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
  };
}

export function SchoolBrandingEditor({
  editor,
  copy,
  disabled = false,
}: SchoolBrandingEditorProps) {
  const { profile, errors } = editor;
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const confirmLogoRemoval = async () => {
    if (await editor.deleteLogo()) setIsRemoveDialogOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
        <h4 className="font-semibold text-gray-950">{copy.uploadLogo}</h4>
        {profile.logoUrl ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex min-w-0 items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={profile.schoolName}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
                src={profile.logoUrl}
              />
              <p className="min-w-0 text-sm font-semibold text-gray-900">
                {profile.schoolName}
              </p>
            </div>
            <Button
              aria-label={copy.removeLogo}
              disabled={disabled || editor.isUploadingLogo}
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setIsRemoveDialogOpen(true)}
              type="button"
              variant="danger"
            >
              {copy.removeLogo}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-gray-400">
            <ImagePlus aria-hidden className="h-4 w-4" />
          </div>
        )}

        <DragDropUploadArea
          accept="image/png,image/jpeg"
          buttonLabel={copy.uploadLogo}
          disabled={disabled || editor.isUploadingLogo}
          helperText={copy.uploadHint}
          maxSizeBytes={5 * 1024 * 1024}
          multiple={false}
          onFilesSelected={editor.uploadLogo}
          subtitle={copy.uploadHint}
          title={copy.uploadLogo}
          isUploading={editor.isUploadingLogo}
        />
        {errors.logoUrl ? (
          <p className="text-sm text-red-700" role="alert">{errors.logoUrl}</p>
        ) : null}
        {editor.logoError ? (
          <p className="text-sm text-red-700" role="alert">{editor.logoError}</p>
        ) : null}
        {editor.logoStatus ? (
          <p aria-live="polite" className="text-sm font-medium text-emerald-700">
            {editor.logoStatus}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            disabled={disabled}
            error={errors.schoolName}
            label={copy.schoolName}
            onChange={(event) =>
              editor.changeText("schoolName", event.target.value)
            }
            value={profile.schoolName}
          />
          <Input
            disabled={disabled}
            error={errors.shortName}
            label={copy.shortName}
            onChange={(event) =>
              editor.changeText("shortName", event.target.value)
            }
            value={profile.shortName}
          />
          <Select
            disabled={disabled}
            error={errors.timezone}
            label={copy.timezone}
            onChange={(value) => editor.changeText("timezone", value)}
            options={timezones.map((timezone) => ({
              value: timezone,
              label: timezone,
            }))}
            value={profile.timezone}
          />
          <Input
            disabled={disabled}
            error={errors.city}
            label={copy.city}
            onChange={(event) => editor.changeText("city", event.target.value)}
            value={profile.city}
          />
          <div className="space-y-3 md:col-span-2">
            <Input
              disabled={disabled}
              error={errors.addressLine}
              helperText={editor.locationWasEdited ? copy.locationStale : undefined}
              label={copy.address}
              onChange={(event) =>
                editor.changeText("addressLine", event.target.value)
              }
              value={profile.addressLine}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={disabled}
                onClick={editor.openLocationModal}
                type="button"
                variant="secondary"
              >
                <MapPin aria-hidden className="h-4 w-4" />
                {copy.pickFromMap}
              </Button>
              <Button
                disabled={disabled || !profile.formattedAddress}
                onClick={editor.clearLocation}
                type="button"
                variant="ghost"
              >
                {copy.clearLocation}
              </Button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <div className="font-semibold text-gray-900">
                {copy.selectedLocation}
              </div>
              {profile.formattedAddress ? (
                <>
                  <div className="mt-1">
                    {profile.mapPlaceLabel || profile.schoolName}
                  </div>
                  <div className="mt-1 text-gray-500">
                    {profile.formattedAddress}
                  </div>
                  {profile.latitude !== null && profile.longitude !== null ? (
                    <div className="mt-2 text-xs text-gray-500">
                      {copy.coordinates(
                        profile.latitude.toFixed(5),
                        profile.longitude.toFixed(5),
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-1 text-gray-500">{copy.noLocation}</div>
              )}
            </div>
          </div>
          <Input
            disabled={disabled}
            error={errors.country}
            label={copy.country}
            onChange={(event) =>
              editor.changeText("country", event.target.value)
            }
            value={profile.country}
          />
          <Input
            disabled={disabled}
            error={errors.footerSignature}
            label={copy.footerSignature}
            onChange={(event) =>
              editor.changeText("footerSignature", event.target.value)
            }
            value={profile.footerSignature}
          />
        </div>
      </section>

      <SchoolLocationPickerModal
        initialLocation={profileToLocation(profile)}
        initialQuery={
          profile.formattedAddress || profile.addressLine || profile.city
        }
        isOpen={editor.isLocationModalOpen}
        onClose={editor.closeLocationModal}
        onConfirm={editor.confirmLocation}
      />
      <ConfirmDialog
        cancelLabel={copy.cancel}
        confirmLabel={copy.confirmRemoveLogo}
        description={copy.removeLogoDescription}
        isOpen={isRemoveDialogOpen}
        loading={editor.isUploadingLogo}
        onClose={() => setIsRemoveDialogOpen(false)}
        onConfirm={() => void confirmLogoRemoval()}
        severity="danger"
        title={copy.removeLogoTitle}
      />
    </div>
  );
}

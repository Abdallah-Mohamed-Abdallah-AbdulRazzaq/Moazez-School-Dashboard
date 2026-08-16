"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getEmptyBrandingProfile } from "../../services/brandingService";
import type {
  ResolvedSchoolLocation,
  SchoolProfileSettings,
} from "../../types";
import {
  deleteBrandingLogo,
  uploadBrandingLogo,
} from "../../services/brandingService";

export interface SchoolBrandingEditorCopy {
  logoUploadFailed: string;
  logoDeleteFailed: string;
  logoUploaded: string;
  logoRemoved: string;
  validation: Partial<Record<keyof SchoolProfileSettings, string>>;
}

interface UseSchoolBrandingEditorOptions {
  initialProfile: SchoolProfileSettings;
  copy: SchoolBrandingEditorCopy;
  onSave(profile: SchoolProfileSettings): Promise<SchoolProfileSettings>;
  onError?(): void;
}

function cloneProfile(profile: SchoolProfileSettings): SchoolProfileSettings {
  return { ...profile };
}

export function useSchoolBrandingEditor({
  initialProfile,
  copy,
  onSave,
  onError,
}: UseSchoolBrandingEditorOptions) {
  const [profile, setProfile] = useState(() => cloneProfile(initialProfile));
  const [savedProfile, setSavedProfile] = useState(() =>
    cloneProfile(initialProfile),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof SchoolProfileSettings, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationWasEdited, setLocationWasEdited] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [logoStatus, setLogoStatus] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const previousInitialProfileRef = useRef(initialProfile);

  useEffect(() => {
    if (previousInitialProfileRef.current === initialProfile) {
      return;
    }
    previousInitialProfileRef.current = initialProfile;
    void Promise.resolve().then(() => {
      setProfile(cloneProfile(initialProfile));
      setSavedProfile(cloneProfile(initialProfile));
      setErrors({});
      setLocationWasEdited(false);
      setLogoError("");
      setLogoStatus("");
      setIsUploadingLogo(false);
    });
  }, [initialProfile]);

  const isDirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(savedProfile),
    [profile, savedProfile],
  );

  const changeText = (key: keyof SchoolProfileSettings, value: string) => {
    setProfile((current) => {
      if (key === "addressLine") {
        return {
          ...current,
          addressLine: value,
          formattedAddress: "",
          mapPlaceLabel: "",
          latitude: null,
          longitude: null,
        };
      }

      return { ...current, [key]: value };
    });
    if (key === "addressLine") {
      setLocationWasEdited(true);
    }
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (key === "logoUrl") {
      setLogoError("");
      setLogoStatus("");
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof SchoolProfileSettings, string>> = {};
    const requiredTextFields: Array<keyof SchoolProfileSettings> = [
      "schoolName",
      "shortName",
      "timezone",
      "addressLine",
      "city",
      "country",
      "footerSignature",
      "logoUrl",
    ];

    requiredTextFields.forEach((key) => {
      const value = profile[key];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[key] = copy.validation[key];
      }
    });

    if (profile.latitude === null || profile.longitude === null) {
      nextErrors.addressLine = copy.validation.addressLine;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      return null;
    }

    setIsSaving(true);
    try {
      const saved = await onSave(cloneProfile(profile));
      const normalized = cloneProfile(saved);
      setProfile(normalized);
      setSavedProfile(normalized);
      setErrors({});
      setLocationWasEdited(false);
      return normalized;
    } catch {
      onError?.();
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = () => {
    setProfile(cloneProfile(savedProfile));
    setErrors({});
    setLocationWasEdited(false);
    setLogoError("");
    setLogoStatus("");
    setIsUploadingLogo(false);
  };

  const reset = () => {
    setProfile(getEmptyBrandingProfile());
    setErrors({});
    setLocationWasEdited(false);
    setLogoError("");
    setLogoStatus("");
    setIsUploadingLogo(false);
  };

  const uploadLogo = async (files: File[]) => {
    const [file] = files;
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoError("");
    setLogoStatus("");
    try {
      const uploadedProfile = await uploadBrandingLogo(file);
      setProfile(uploadedProfile);
      setSavedProfile(uploadedProfile);
      setErrors((current) => ({ ...current, logoUrl: undefined }));
      setLogoStatus(copy.logoUploaded);
    } catch {
      setLogoError(copy.logoUploadFailed);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const deleteLogo = async (): Promise<boolean> => {
    setIsUploadingLogo(true);
    setLogoError("");
    setLogoStatus("");
    try {
      await deleteBrandingLogo();
      const updatedProfile = { ...profile, logoUrl: "" };
      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setLogoStatus(copy.logoRemoved);
      return true;
    } catch {
      setLogoError(copy.logoDeleteFailed);
      return false;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const confirmLocation = (location: ResolvedSchoolLocation) => {
    setProfile((current) => ({
      ...current,
      addressLine: location.addressLine,
      formattedAddress: location.formattedAddress,
      city: location.city,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      mapPlaceLabel: location.label,
    }));
    setErrors((current) => ({
      ...current,
      addressLine: undefined,
      city: undefined,
      country: undefined,
    }));
    setLocationWasEdited(false);
    setIsLocationModalOpen(false);
  };

  const clearLocation = () => {
    setProfile((current) => ({
      ...current,
      addressLine: "",
      formattedAddress: "",
      mapPlaceLabel: "",
      latitude: null,
      longitude: null,
    }));
    setLocationWasEdited(false);
  };

  return {
    profile,
    errors,
    isDirty,
    isSaving: isSaving || isUploadingLogo,
    isUploadingLogo,
    isLocationModalOpen,
    locationWasEdited,
    logoError,
    logoStatus,
    changeText,
    uploadLogo,
    deleteLogo,
    confirmLocation,
    clearLocation,
    openLocationModal: () => setIsLocationModalOpen(true),
    closeLocationModal: () => setIsLocationModalOpen(false),
    save,
    cancel,
    reset,
  };
}

export type SchoolBrandingEditorState = ReturnType<
  typeof useSchoolBrandingEditor
>;

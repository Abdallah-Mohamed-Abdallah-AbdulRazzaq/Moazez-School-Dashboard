"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import {
  GoogleLocationPicker,
  type GoogleLocationPickerLabels,
  type GoogleLocationValue,
} from "@/components/ui/google-location-picker";
import Modal from "@/components/ui/modal/Modal";
import type { ResolvedSchoolLocation } from "@/features/settings/types";

interface SchoolLocationPickerModalProps {
  isOpen: boolean;
  initialQuery: string;
  initialLocation: ResolvedSchoolLocation | null;
  onClose: () => void;
  onConfirm: (location: ResolvedSchoolLocation) => void;
}

function toPickerValue(
  location: ResolvedSchoolLocation | null,
  fallbackAddress: string,
): GoogleLocationValue | null {
  if (!location) return null;
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    label: location.label,
    formattedAddress: location.formattedAddress || fallbackAddress,
  };
}

export default function SchoolLocationPickerModal({
  isOpen,
  initialQuery,
  initialLocation,
  onClose,
  onConfirm,
}: SchoolLocationPickerModalProps) {
  const t = useTranslations("settings.branding.location_picker");
  const tCommon = useTranslations("common");
  const [location, setLocation] = useState<GoogleLocationValue | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setLocation(toPickerValue(initialLocation, initialQuery));
      setIsValid(true);
    });
  }, [initialLocation, initialQuery, isOpen]);

  const labels: GoogleLocationPickerLabels = {
    searchLabel: t("search_label"),
    searchPlaceholder: t("search_placeholder"),
    results: t("results"),
    mapTitle: t("map_title"),
    selectedLocation: t("selected_location"),
    noResults: t("no_results"),
    emptyState: t("empty_state"),
    loadingMaps: t("loading_maps"),
    searching: t("searching"),
    resolving: t("resolving"),
    currentLocation: t("current_location"),
    locating: t("locating"),
    manualCoordinates: t("manual_coordinates"),
    latitude: t("latitude"),
    longitude: t("longitude"),
    errors: {
      api_key_missing: t("errors.api_key_missing"),
      maps_load_failed: t("errors.maps_load_failed"),
      geolocation_not_supported: t("errors.geolocation_not_supported"),
      geolocation_permission_denied: t("errors.geolocation_permission_denied"),
      geolocation_unavailable: t("errors.geolocation_unavailable"),
      geolocation_timeout: t("errors.geolocation_timeout"),
      search_failed: t("errors.search_failed"),
      resolve_failed: t("errors.resolve_failed"),
      coordinate_pair_required: t("errors.coordinate_pair_required"),
      latitude_invalid: t("errors.latitude_invalid"),
      latitude_out_of_range: t("errors.latitude_out_of_range"),
      longitude_invalid: t("errors.longitude_invalid"),
      longitude_out_of_range: t("errors.longitude_out_of_range"),
    },
  };

  const confirmLocation = () => {
    if (!location || !isValid) return;
    const retainsInitialMetadata =
      initialLocation?.latitude === location.latitude &&
      initialLocation.longitude === location.longitude;
    onConfirm({
      ...location,
      addressLine: retainsInitialMetadata
        ? initialLocation.addressLine
        : location.formattedAddress.split(",").slice(0, 2).join(",").trim(),
      city: retainsInitialMetadata ? initialLocation.city : "",
      country: retainsInitialMetadata ? initialLocation.country : "",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("description")}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={!location || !isValid}
            onClick={confirmLocation}
          >
            {t("confirm")}
          </Button>
        </>
      }
    >
      <GoogleLocationPicker
        value={location}
        labels={labels}
        onChange={setLocation}
        onValidityChange={setIsValid}
      />
    </Modal>
  );
}

import type { GooglePlaceResult } from "./googleMapsApi";

export interface GoogleLocationValue {
  latitude: number;
  longitude: number;
  label: string;
  formattedAddress: string;
}

export interface CoordinateDraft {
  latitude: string;
  longitude: string;
}

export type CoordinateValidation =
  | {
      valid: true;
      value: Pick<GoogleLocationValue, "latitude" | "longitude"> | null;
    }
  | {
      valid: false;
      reason:
        | "coordinate_pair_required"
        | "latitude_invalid"
        | "latitude_out_of_range"
        | "longitude_invalid"
        | "longitude_out_of_range";
    };

export function validateCoordinateDraft(
  draft: CoordinateDraft,
): CoordinateValidation {
  const latitudeText = draft.latitude.trim();
  const longitudeText = draft.longitude.trim();

  if (!latitudeText && !longitudeText) {
    return { valid: true, value: null };
  }

  if (!latitudeText || !longitudeText) {
    return { valid: false, reason: "coordinate_pair_required" };
  }

  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (!Number.isFinite(latitude)) {
    return { valid: false, reason: "latitude_invalid" };
  }
  if (latitude < -90 || latitude > 90) {
    return { valid: false, reason: "latitude_out_of_range" };
  }
  if (!Number.isFinite(longitude)) {
    return { valid: false, reason: "longitude_invalid" };
  }
  if (longitude < -180 || longitude > 180) {
    return { valid: false, reason: "longitude_out_of_range" };
  }

  return { valid: true, value: { latitude, longitude } };
}

export function placeToLocationValue(
  place: GooglePlaceResult,
): GoogleLocationValue | null {
  const location = place.geometry?.location;
  if (!location) return null;

  const formattedAddress = place.formatted_address ?? "";
  return {
    latitude: Number(location.lat().toFixed(6)),
    longitude: Number(location.lng().toFixed(6)),
    label: place.name || formattedAddress,
    formattedAddress,
  };
}

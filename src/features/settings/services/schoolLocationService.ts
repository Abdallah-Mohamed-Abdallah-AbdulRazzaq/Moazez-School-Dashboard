import type {
  LocationSuggestion,
  ResolvedSchoolLocation,
} from "@/features/settings/types";

export interface SchoolLocationProviderAdapter {
  searchLocations(query: string): Promise<LocationSuggestion[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<ResolvedSchoolLocation>;
}

const EGYPT_BOUNDS = {
  minLat: 22,
  maxLat: 31.7,
  minLng: 24.7,
  maxLng: 36.9,
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const localHelperAdapter: SchoolLocationProviderAdapter = {
  async searchLocations(query: string) {
    if (!normalizeText(query)) {
      return [];
    }

    return [];
  },

  async reverseGeocode(latitude: number, longitude: number) {
    const boundedLatitude = clamp(latitude, EGYPT_BOUNDS.minLat, EGYPT_BOUNDS.maxLat);
    const boundedLongitude = clamp(longitude, EGYPT_BOUNDS.minLng, EGYPT_BOUNDS.maxLng);
    const coordinatesLabel = `${boundedLatitude.toFixed(6)}, ${boundedLongitude.toFixed(6)}`;

    return {
      label: coordinatesLabel,
      formattedAddress: coordinatesLabel,
      addressLine: coordinatesLabel,
      city: "",
      country: "",
      latitude: Number(boundedLatitude.toFixed(6)),
      longitude: Number(boundedLongitude.toFixed(6)),
    };
  },
};

let activeSchoolLocationAdapter: SchoolLocationProviderAdapter =
  localHelperAdapter;

export function setSchoolLocationProviderAdapter(adapter: SchoolLocationProviderAdapter) {
  activeSchoolLocationAdapter = adapter;
}

export function resetSchoolLocationProviderAdapter() {
  activeSchoolLocationAdapter = localHelperAdapter;
}

export async function searchSchoolLocations(query: string) {
  return activeSchoolLocationAdapter.searchLocations(query);
}

export async function reverseGeocodeSchoolLocation(latitude: number, longitude: number) {
  return activeSchoolLocationAdapter.reverseGeocode(latitude, longitude);
}

export function buildSchoolLocationPreviewUrl(latitude: number, longitude: number) {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
}

export function projectCoordinatesToCanvas(latitude: number, longitude: number) {
  const x = ((longitude - EGYPT_BOUNDS.minLng) / (EGYPT_BOUNDS.maxLng - EGYPT_BOUNDS.minLng)) * 100;
  const y = (1 - (latitude - EGYPT_BOUNDS.minLat) / (EGYPT_BOUNDS.maxLat - EGYPT_BOUNDS.minLat)) * 100;
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
}

export function projectCanvasPointToCoordinates(xPercent: number, yPercent: number) {
  const longitude =
    EGYPT_BOUNDS.minLng + (clamp(xPercent, 0, 100) / 100) * (EGYPT_BOUNDS.maxLng - EGYPT_BOUNDS.minLng);
  const latitude =
    EGYPT_BOUNDS.minLat +
    ((100 - clamp(yPercent, 0, 100)) / 100) * (EGYPT_BOUNDS.maxLat - EGYPT_BOUNDS.minLat);

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { useLocale } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import Input from "@/components/ui/input/Input";
import {
  loadGoogleMapsApi,
  type GoogleAutocompleteService,
  type GoogleCircleInstance,
  type GoogleGeocoder,
  type GoogleLatLngLiteral,
  type GoogleMapInstance,
  type GoogleAdvancedMarkerInstance,
  type GooglePlacePrediction,
  type GooglePlacesService,
} from "./googleMapsApi";
import {
  placeToLocationValue,
  validateCoordinateDraft,
  type CoordinateValidation,
  type GoogleLocationValue,
} from "./locationModel";

export interface GoogleLocationPickerLabels {
  searchLabel: string;
  searchPlaceholder: string;
  results: string;
  mapTitle: string;
  selectedLocation: string;
  noResults: string;
  emptyState: string;
  loadingMaps: string;
  searching: string;
  resolving: string;
  currentLocation: string;
  locating: string;
  manualCoordinates: string;
  latitude: string;
  longitude: string;
  errors: Record<
    | "api_key_missing"
    | "maps_load_failed"
    | "geolocation_not_supported"
    | "geolocation_permission_denied"
    | "geolocation_unavailable"
    | "geolocation_timeout"
    | "search_failed"
    | "resolve_failed"
    | "coordinate_pair_required"
    | "latitude_invalid"
    | "latitude_out_of_range"
    | "longitude_invalid"
    | "longitude_out_of_range",
    string
  >;
}

export interface GoogleLocationPickerProps {
  value: GoogleLocationValue | null;
  radiusMeters?: number;
  labels: GoogleLocationPickerLabels;
  disabled?: boolean;
  onChange: (value: GoogleLocationValue | null) => void;
  onValidityChange?: (valid: boolean) => void;
}

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };

function toPosition(value: GoogleLocationValue | null): GoogleLatLngLiteral {
  return value ? { lat: value.latitude, lng: value.longitude } : DEFAULT_CENTER;
}

function geolocationErrorKey(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "geolocation_permission_denied" as const;
  }
  return error.code === error.TIMEOUT
    ? ("geolocation_timeout" as const)
    : ("geolocation_unavailable" as const);
}

export default function GoogleLocationPicker({
  value,
  radiusMeters,
  labels,
  disabled = false,
  onChange,
  onValidityChange,
}: GoogleLocationPickerProps) {
  const locale = useLocale();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleAdvancedMarkerInstance | null>(null);
  const circleRef = useRef<GoogleCircleInstance | null>(null);
  const autocompleteRef = useRef<GoogleAutocompleteService | null>(null);
  const placesServiceRef = useRef<GooglePlacesService | null>(null);
  const geocoderRef = useRef<GoogleGeocoder | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const controlledLatitude = value?.latitude;
  const controlledLongitude = value?.longitude;
  const controlledQuery = value?.formattedAddress || value?.label || "";
  const previousCoordinatesRef = useRef({
    latitude: controlledLatitude,
    longitude: controlledLongitude,
  });
  const previousQueryRef = useRef(controlledQuery);
  const [query, setQuery] = useState(controlledQuery);
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [draft, setDraft] = useState({
    latitude: value ? String(value.latitude) : "",
    longitude: value ? String(value.longitude) : "",
  });
  const [validation, setValidation] = useState<CoordinateValidation>({
    valid: true,
    value: value
      ? { latitude: value.latitude, longitude: value.longitude }
      : null,
  });
  const [isMapsLoading, setIsMapsLoading] = useState(Boolean(apiKey));
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorKey, setErrorKey] = useState<keyof typeof labels.errors | null>(
    apiKey ? null : "api_key_missing",
  );
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      circleRef.current?.setMap(null);
    };
  }, []);

  useEffect(() => {
    const previousCoordinates = previousCoordinatesRef.current;
    if (
      previousCoordinates.latitude === controlledLatitude &&
      previousCoordinates.longitude === controlledLongitude
    ) {
      return;
    }
    previousCoordinatesRef.current = {
      latitude: controlledLatitude,
      longitude: controlledLongitude,
    };

    void Promise.resolve().then(() => {
      setDraft({
        latitude:
          controlledLatitude === undefined ? "" : String(controlledLatitude),
        longitude:
          controlledLongitude === undefined ? "" : String(controlledLongitude),
      });
    });
  }, [controlledLatitude, controlledLongitude]);

  useEffect(() => {
    if (previousQueryRef.current === controlledQuery) {
      return;
    }
    previousQueryRef.current = controlledQuery;
    void Promise.resolve().then(() => setQuery(controlledQuery));
  }, [controlledQuery]);


  const updateMapPosition = useCallback((position: GoogleLatLngLiteral) => {
    if (markerRef.current) markerRef.current.position = position;
    mapRef.current?.setCenter(position);
    circleRef.current?.setCenter(position);
  }, []);

  const applyLocation = useCallback(
    (location: GoogleLocationValue) => {
      setDraft({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      });
      setValidation({
        valid: true,
        value: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      onValidityChange?.(true);
      onChange(location);
      updateMapPosition(toPosition(location));
    },
    [onChange, onValidityChange, updateMapPosition],
  );

  const resolvePosition = useCallback(
    (position: GoogleLatLngLiteral) => {
      const geocoder = geocoderRef.current;
      if (!geocoder) return;
      const requestId = ++requestIdRef.current;
      setIsResolving(true);
      setErrorKey(null);
      geocoder.geocode(
        { location: position, language: locale },
        (results, status) => {
          if (!mountedRef.current || requestId !== requestIdRef.current) return;
          setIsResolving(false);
          const location =
            status === "OK" && results?.[0]
              ? placeToLocationValue({
                  ...results[0],
                  name: results[0].formatted_address,
                })
              : null;
          if (!location) {
            setErrorKey("resolve_failed");
            return;
          }
          setQuery(location.formattedAddress);
          applyLocation(location);
        },
      );
    },
    [applyLocation, locale],
  );

  const applyCurrentPosition = useCallback(
    (geolocation: GeolocationPosition) => {
      if (!mountedRef.current) return;
      setIsLocating(false);
      const position = {
        lat: geolocation.coords.latitude,
        lng: geolocation.coords.longitude,
      };
      updateMapPosition(position);
      mapRef.current?.setZoom(16);
      if (geocoderRef.current) {
        resolvePosition(position);
        return;
      }
      applyLocation({
        latitude: position.lat,
        longitude: position.lng,
        label: "",
        formattedAddress: "",
      });
    },
    [applyLocation, resolvePosition, updateMapPosition],
  );

  const reportGeolocationError = useCallback(
    (error: GeolocationPositionError) => {
      if (!mountedRef.current) return;
      setIsLocating(false);
      setErrorKey(geolocationErrorKey(error));
    },
    [],
  );

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorKey("geolocation_not_supported");
      return;
    }

    setIsLocating(true);
    setErrorKey(null);
    navigator.geolocation.getCurrentPosition(
      applyCurrentPosition,
      reportGeolocationError,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return;
    let active = true;
    setIsMapsLoading(true);
    setErrorKey(null);

    void loadGoogleMapsApi(apiKey, locale)
      .then((googleApi) => {
        if (!active || !mapContainerRef.current) return;
        const position = toPosition(value);
        const map = new googleApi.maps.Map(mapContainerRef.current, {
          center: position,
          zoom: value ? 16 : 12,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        });
        const marker = new googleApi.maps.marker.AdvancedMarkerElement({
          map,
          position,
          gmpDraggable: !disabled,
        });
        map.addListener("click", (event) => {
          if (disabled || !event.latLng) return;
          const next = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          marker.position = next;
          resolvePosition(next);
        });
        marker.addListener("dragend", (event) => {
          if (disabled || !event.latLng) return;
          resolvePosition({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        mapRef.current = map;
        markerRef.current = marker;
        autocompleteRef.current = new googleApi.maps.places.AutocompleteService();
        placesServiceRef.current = new googleApi.maps.places.PlacesService(map);
        geocoderRef.current = new googleApi.maps.Geocoder();
        if (radiusMeters !== undefined) {
          circleRef.current = new googleApi.maps.Circle({
            map,
            center: position,
            radius: radiusMeters,
            fillColor: "#2563eb",
            fillOpacity: 0.12,
            strokeColor: "#2563eb",
            strokeOpacity: 0.7,
            strokeWeight: 2,
          });
        }
      })
      .catch(() => active && setErrorKey("maps_load_failed"))
      .finally(() => active && setIsMapsLoading(false));

    return () => {
      active = false;
      circleRef.current?.setMap(null);
      circleRef.current = null;
      mapRef.current = null;
      markerRef.current = null;
      autocompleteRef.current = null;
      placesServiceRef.current = null;
    };
    // The map is initialized once for this API key and locale. Controlled values
    // are synchronized by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, locale]);

  useEffect(() => {
    if (!value) return;
    const position = toPosition(value);
    updateMapPosition(position);
    mapRef.current?.setZoom(16);
  }, [updateMapPosition, value]);

  useEffect(() => {
    if (radiusMeters === undefined) {
      circleRef.current?.setMap(null);
      circleRef.current = null;
      return;
    }
    circleRef.current?.setRadius(radiusMeters);
  }, [radiusMeters]);

  const search = useDebouncedCallback((input: string) => {
    const autocomplete = autocompleteRef.current;
    if (!input.trim() || !autocomplete) {
      setPredictions([]);
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setErrorKey(null);
    const timeoutId = window.setTimeout(() => {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setIsSearching(false);
      setErrorKey("search_failed");
      setPredictions([]);
    }, 10_000);
    autocomplete.getPlacePredictions(
      { input, language: locale },
      (results, status) => {
        window.clearTimeout(timeoutId);
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setIsSearching(false);
        if (status === "ZERO_RESULTS") {
          setPredictions([]);
          return;
        }
        if (status !== "OK" || !results) {
          setErrorKey("search_failed");
          setPredictions([]);
          return;
        }
        setPredictions(results);
      },
    );
  }, 300);


  const selectPrediction = (prediction: GooglePlacePrediction) => {
    const placesService = placesServiceRef.current;
    if (!placesService) return;
    const requestId = ++requestIdRef.current;
    setIsResolving(true);
    setErrorKey(null);
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["name", "formatted_address", "geometry"],
        language: locale,
      },
      (place, status) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setIsResolving(false);
        const location =
          status === "OK" && place ? placeToLocationValue(place) : null;
        if (!location) {
          setErrorKey("resolve_failed");
          return;
        }
        setQuery(location.formattedAddress);
        setPredictions([]);
        applyLocation(location);
      },
    );
  };

  const updateDraft = (field: "latitude" | "longitude", input: string) => {
    const nextDraft = { ...draft, [field]: input };
    const nextValidation = validateCoordinateDraft(nextDraft);
    setDraft(nextDraft);
    setValidation(nextValidation);
    onValidityChange?.(nextValidation.valid);
    if (!nextValidation.valid) return;
    if (!nextValidation.value) {
      onChange(null);
      return;
    }
    applyLocation({
      ...nextValidation.value,
      label: value?.label ?? "",
      formattedAddress: value?.formattedAddress ?? "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <Input
            label={labels.searchLabel}
            placeholder={labels.searchPlaceholder}
            value={query}
            onChange={(event) => {
              const nextVal = event.target.value;
              setQuery(nextVal);
              search(nextVal);
            }}
            leftIcon={<Search className="h-4 w-4" />}
            disabled={disabled || !apiKey || isMapsLoading}
          />
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={requestCurrentLocation}
            disabled={disabled || isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            {isLocating ? labels.locating : labels.currentLocation}
          </button>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
              {labels.results}
            </div>
            <div className="max-h-48 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {labels.searching}
                </div>
              ) : predictions.length ? (
                predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-start text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => selectPrediction(prediction)}
                    disabled={disabled}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span dir="auto">{prediction.description}</span>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  {labels.noResults}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div className="border-b border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
            {labels.mapTitle}
          </div>
          <div className="relative h-72">
            {isMapsLoading ? (
              <div className="absolute inset-0 z-10 flex animate-pulse items-center justify-center gap-2 bg-gray-100 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.loadingMaps}
              </div>
            ) : null}
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>
        </div>
      </div>

      {errorKey ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {labels.errors[errorKey]}
        </div>
      ) : null}

      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="text-sm font-semibold text-gray-800">
          {labels.manualCoordinates}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            label={labels.latitude}
            value={draft.latitude}
            onChange={(event) => updateDraft("latitude", event.target.value)}
            dir="ltr"
          />
          <Input
            type="number"
            label={labels.longitude}
            value={draft.longitude}
            onChange={(event) => updateDraft("longitude", event.target.value)}
            dir="ltr"
          />
        </div>
        {!validation.valid ? (
          <p className="text-sm text-red-600">
            {labels.errors[validation.reason]}
          </p>
        ) : null}
      </fieldset>

      <div className="rounded-lg border border-gray-200 bg-white px-3 py-3">
        <p className="text-sm font-semibold text-gray-800">
          {labels.selectedLocation}
        </p>
        {isResolving ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {labels.resolving}
          </p>
        ) : value ? (
          <div className="mt-2 text-sm text-gray-600">
            <p dir="auto">{value.formattedAddress || value.label}</p>
            <p className="mt-1 text-xs text-gray-500" dir="ltr">
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{labels.emptyState}</p>
        )}
      </div>
    </div>
  );
}

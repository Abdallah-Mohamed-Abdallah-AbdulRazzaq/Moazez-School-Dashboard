# Nedaa Google Maps Locations Design

## Goal

Replace raw coordinate-only location editing in Nedaa with Google address search and precise map-pin selection for both the school zone and dismissal gates. Preserve the existing dismissal API payloads and provide manual coordinate entry when Maps is unavailable.

## Existing Contracts

- The browser key is supplied through `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- `next.config.ts` already permits the Google Maps resources required by the application.
- School settings persist `schoolLatitude` and `schoolLongitude` through `UpdateDismissalSettingsPayload`.
- Gates persist `latitude` and `longitude` through `CreateDismissalGatePayload` and `UpdateDismissalGatePayload`.
- The allowed school-zone radius remains `allowedRadiusMeters`.

No dismissal backend endpoint or payload shape changes are required.

## Architecture

Extract the Google Maps loading, Places search, place resolution, reverse geocoding, map-click handling, and draggable-marker behavior currently owned by `SchoolLocationPickerModal` into a reusable location picker under `src/components/ui/`. The existing branding picker and both Nedaa surfaces will consume the shared implementation so the page loads one Google Maps script and uses one set of browser API types and error behavior.

The shared picker accepts:

- an optional latitude and longitude;
- an optional address label;
- an optional radius in meters;
- localized labels and error messages;
- an `onChange` callback returning coordinates and resolved address metadata;
- disabled and read-only states.

Address metadata is presentational in Nedaa. Only coordinates and the existing radius are sent to dismissal APIs.

## User Experience

### School Zone

The Nedaa settings view shows an address-search field, an embedded map, a draggable school marker, and a circle representing `allowedRadiusMeters`. Selecting a place, clicking the map, dragging the marker, or editing valid coordinates updates the pending school latitude and longitude. Changing the allowed radius updates the circle immediately without issuing an API request until the user saves settings.

### Gates

The gate create/edit modal replaces the standalone latitude and longitude area with the shared location picker. Place selection, map clicks, marker dragging, and valid manual coordinate changes update the gate form state. Existing coordinates initialize the marker when editing a gate.

### Responsive And RTL Behavior

The search results and map stack vertically on narrow screens. On wider screens they use a two-column layout. Text alignment follows the locale, while addresses and coordinate values retain readable automatic or left-to-right direction. The map has a stable height so loading and result changes do not shift the modal layout.

## Loading And Failure States

The component shows an inline map skeleton while the Google Maps script initializes and an inline progress state while searching or reverse geocoding. It does not replace the entire Nedaa page with the main loader.

If the API key is missing, the script fails, Places returns an error, or reverse geocoding fails, the component displays a localized error and keeps manual latitude and longitude inputs available. A Maps failure must not erase existing coordinates or prevent saving otherwise valid values.

Coordinates are valid only when latitude is between `-90` and `90`, longitude is between `-180` and `180`, and both values are supplied together. Invalid or partially supplied coordinates block the relevant save action and show localized field errors.

## Data Flow

1. The parent initializes the picker from the current school zone or gate location.
2. Google Places selection resolves a place to latitude, longitude, and an address label.
3. A map click or marker drag updates coordinates and requests reverse geocoding for the label.
4. Manual coordinate edits update the marker after both values pass validation.
5. The parent stores the coordinates in its existing local form or pending settings patch.
6. Existing Nedaa service functions submit the unchanged dismissal payload.

The picker must ignore stale asynchronous search and geocoding results after a newer selection or after unmounting.

## Localization

Add English and Arabic Nedaa messages for location search, selected location, map loading, searching, resolving, no results, manual coordinates, invalid coordinates, missing API key, Maps load failure, search failure, and reverse-geocoding failure. Shared low-level labels may reuse existing common or branding location-picker messages only where their wording is domain-neutral.

## Testing

Component tests cover:

- initialization from existing coordinates;
- place selection updating coordinates;
- map click and marker drag synchronization;
- manual coordinate validation and fallback behavior;
- radius-circle updates for the school zone;
- missing-key and Maps-load errors preserving manual editing;
- stale asynchronous result protection;
- English and Arabic message completeness.

Integration tests verify that Nedaa settings still submit `schoolLatitude`, `schoolLongitude`, and `allowedRadiusMeters`, while gate create/edit still submit `latitude` and `longitude`. Type checking, focused tests, linting, and formatting must pass before completion.

## Out Of Scope

- Changing dismissal backend contracts.
- Persisting Google place IDs or formatted addresses in dismissal records.
- Route planning, travel-time calculation, live vehicle tracking, or geofence enforcement changes.
- Requesting the browser's current geolocation; the current permissions policy disables browser geolocation.

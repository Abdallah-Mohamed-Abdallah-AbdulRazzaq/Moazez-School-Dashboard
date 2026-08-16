# Nedaa Google Maps Locations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localized Google Places search, map-click selection, draggable markers, manual coordinate fallback, and a school-radius preview to Nedaa school and gate location forms.

**Architecture:** Extract the existing branding Maps JavaScript loader and browser API types into shared UI modules, then build a controlled `GoogleLocationPicker`. Nedaa settings and gate forms own their existing coordinate state and consume picker changes without changing dismissal API payloads.

**Tech Stack:** Next.js 16, React 19, TypeScript, Google Maps JavaScript API with Places and Geocoder, next-intl, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Use the existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; never commit or print its value.
- Preserve `schoolLatitude`, `schoolLongitude`, `allowedRadiusMeters`, `latitude`, and `longitude` API fields.
- Keep manual coordinate editing available when Google Maps cannot load.
- Accept latitude only from `-90` through `90` and longitude only from `-180` through `180`; require both or neither.
- Do not request browser geolocation.
- Do not add a Google Maps dependency package or modify CSP.
- Keep all user-facing copy localized in English and Arabic.

---

### Task 1: Shared Google Maps Loader And Location Model

**Files:**

- Create: `src/components/ui/google-location-picker/googleMapsApi.ts`
- Create: `src/components/ui/google-location-picker/locationModel.ts`
- Create: `src/components/ui/google-location-picker/__tests__/locationModel.test.ts`

**Interfaces:**

- Produces: `GoogleLocationValue`, `CoordinateDraft`, `validateCoordinateDraft(draft)`, `placeToLocationValue(place)`, `loadGoogleMapsApi(apiKey, language)` and shared Google Maps structural types.

- [ ] **Step 1: Write failing model tests**

```ts
import { describe, expect, it } from "vitest";
import {
  placeToLocationValue,
  validateCoordinateDraft,
} from "../locationModel";

describe("validateCoordinateDraft", () => {
  it("requires both coordinates and rejects out-of-range values", () => {
    expect(
      validateCoordinateDraft({ latitude: "24.7", longitude: "" }),
    ).toEqual({
      valid: false,
      reason: "coordinate_pair_required",
    });
    expect(
      validateCoordinateDraft({ latitude: "91", longitude: "46" }),
    ).toEqual({
      valid: false,
      reason: "latitude_out_of_range",
    });
    expect(
      validateCoordinateDraft({ latitude: "24.7", longitude: "181" }),
    ).toEqual({
      valid: false,
      reason: "longitude_out_of_range",
    });
  });

  it("accepts an empty pair or a valid numeric pair", () => {
    expect(validateCoordinateDraft({ latitude: "", longitude: "" })).toEqual({
      valid: true,
      value: null,
    });
    expect(
      validateCoordinateDraft({ latitude: "24.7136", longitude: "46.6753" }),
    ).toEqual({
      valid: true,
      value: { latitude: 24.7136, longitude: 46.6753 },
    });
  });
});

describe("placeToLocationValue", () => {
  it("normalizes a Google place to six-decimal coordinates", () => {
    expect(
      placeToLocationValue({
        name: "School",
        formatted_address: "Riyadh, Saudi Arabia",
        geometry: {
          location: { lat: () => 24.71361234, lng: () => 46.67531234 },
        },
      }),
    ).toMatchObject({
      latitude: 24.713612,
      longitude: 46.675312,
      label: "School",
      formattedAddress: "Riyadh, Saudi Arabia",
    });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/components/ui/google-location-picker/__tests__/locationModel.test.ts`

Expected: FAIL because `locationModel.ts` does not exist.

- [ ] **Step 3: Implement the model and extract the loader**

Define these exact public contracts:

```ts
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
```

Move the script ID, `window.__moazezGoogleMapsPromise`, structural Maps types, and `loadGoogleMapsApi` from `SchoolLocationPickerModal.tsx` into `googleMapsApi.ts`. Extend its structural API with `maps.Circle`, including `setCenter`, `setRadius`, and `setMap`, for the school-zone preview. Keep the script URL configured with `libraries=places` and `language`.

- [ ] **Step 4: Run the model tests and typecheck**

Run: `npm run test:run -- src/components/ui/google-location-picker/__tests__/locationModel.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the shared primitives**

```bash
git add src/components/ui/google-location-picker/googleMapsApi.ts src/components/ui/google-location-picker/locationModel.ts src/components/ui/google-location-picker/__tests__/locationModel.test.ts
git commit -m "refactor(ui): extract Google Maps location primitives"
```

---

### Task 2: Controlled Google Location Picker

**Files:**

- Create: `src/components/ui/google-location-picker/GoogleLocationPicker.tsx`
- Create: `src/components/ui/google-location-picker/index.ts`
- Create: `src/components/ui/google-location-picker/__tests__/GoogleLocationPicker.test.tsx`
- Modify: `src/features/settings/components/SchoolLocationPickerModal.tsx`

**Interfaces:**

- Consumes: Task 1's `GoogleLocationValue`, coordinate validation, loader, and Maps types.
- Produces: `GoogleLocationPicker` with the props below; branding continues to expose the unchanged `SchoolLocationPickerModal` interface.

```ts
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
  manualCoordinates: string;
  latitude: string;
  longitude: string;
  errors: Record<
    | "api_key_missing"
    | "maps_load_failed"
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
```

- [ ] **Step 1: Write failing picker tests**

Mock `loadGoogleMapsApi` with lightweight `Map`, `Marker`, `Circle`, `AutocompleteService`, `PlacesService`, and `Geocoder` fakes. Test these observable behaviors with Testing Library:

```ts
it("keeps manual coordinates editable when the API key is missing", async () => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
  render(<GoogleLocationPicker value={null} labels={labels} onChange={onChange} />);
  expect(await screen.findByText(labels.errors.api_key_missing)).toBeVisible();
  await user.type(screen.getByLabelText(labels.latitude), "24.7136");
  await user.type(screen.getByLabelText(labels.longitude), "46.6753");
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ latitude: 24.7136, longitude: 46.6753 }),
  );
});

it("updates from place selection and ignores an older search response", async () => {
  // Resolve the second prediction callback before the first.
  // Select its result and assert onChange receives only the second place coordinates.
});

it("updates coordinates from map clicks and marker drag events", async () => {
  // Trigger captured listeners, resolve geocoder output, and assert onChange.
});

it("updates the circle when radiusMeters changes", () => {
  const { rerender } = renderPicker({ radiusMeters: 100 });
  rerender(renderPickerElement({ radiusMeters: 250 }));
  expect(circle.setRadius).toHaveBeenLastCalledWith(250);
});
```

- [ ] **Step 2: Run the picker test and verify RED**

Run: `npm run test:run -- src/components/ui/google-location-picker/__tests__/GoogleLocationPicker.test.tsx`

Expected: FAIL because `GoogleLocationPicker` does not exist.

- [ ] **Step 3: Implement the controlled picker**

Use shared `Input` controls and lucide `Search`, `MapPin`, and `Loader2` icons. Keep coordinate draft strings locally so partial edits render, call `onValidityChange(false)` for invalid drafts, and call `onChange` only for a complete valid pair. For manually entered coordinates, retain the current label/address when coordinates are changed and use empty strings when no prior value exists.

Use incrementing request IDs for Places predictions, place details, and reverse geocoding. Before applying a callback, verify its ID is still current and the component remains mounted. Create one marker and optional circle per mounted map; update them through setters instead of recreating the map on each controlled value change.

- [ ] **Step 4: Refactor the branding modal to consume the picker**

Keep `SchoolLocationPickerModalProps` unchanged. Convert between `ResolvedSchoolLocation` and `GoogleLocationValue` at the modal boundary and pass existing `settings.branding.location_picker` translations into `labels`. Keep confirmation disabled until a location is selected and valid.

- [ ] **Step 5: Run picker and branding tests**

Run: `npm run test:run -- src/components/ui/google-location-picker/__tests__/GoogleLocationPicker.test.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx src/features/settings/branding/__tests__/SettingsBrandingPage.test.tsx && npm run typecheck`

Expected: PASS with no unhandled callback warnings.

- [ ] **Step 6: Commit the reusable picker**

```bash
git add src/components/ui/google-location-picker src/features/settings/components/SchoolLocationPickerModal.tsx
git commit -m "feat(ui): add reusable Google location picker"
```

---

### Task 3: Nedaa School-Zone Integration

**Files:**

- Modify: `src/features/nedaa/views/NedaaSettingsView.tsx`
- Create: `src/features/nedaa/views/__tests__/NedaaSettingsView.test.tsx`

**Interfaces:**

- Consumes: Task 2's `GoogleLocationPicker` and existing `onChange(UpdateDismissalSettingsPayload)`.
- Produces: controlled school location and radius editing without changing `NedaaSettingsPage` service behavior.

- [ ] **Step 1: Write the failing settings integration test**

Mock `GoogleLocationPicker` as a button that invokes `onChange` and assert the existing patch fields:

```ts
it("maps a selected school location to the dismissal settings patch", async () => {
  render(<NedaaSettingsView {...props} onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: "select-test-location" }));
  expect(onChange).toHaveBeenCalledWith({
    schoolLatitude: 24.7136,
    schoolLongitude: 46.6753,
  });
});

it("passes the allowed radius to the school map", () => {
  render(<NedaaSettingsView {...props} />);
  expect(screen.getByTestId("google-location-picker")).toHaveAttribute(
    "data-radius",
    String(props.settings.settings.allowedRadiusMeters),
  );
});
```

- [ ] **Step 2: Run the settings test and verify RED**

Run: `npm run test:run -- src/features/nedaa/views/__tests__/NedaaSettingsView.test.tsx`

Expected: FAIL because the settings view still renders raw coordinate inputs.

- [ ] **Step 3: Integrate the picker**

Construct its controlled value from `settings.settings.schoolZone`; use `schoolZone.label ?? ""` for label/address. Pass `allowedRadiusMeters`, `disabled={!canEdit}`, localized labels, and this callback:

```ts
onChange={(location) =>
  onChange({
    schoolLatitude: location?.latitude ?? null,
    schoolLongitude: location?.longitude ?? null,
  })
}
```

Keep the existing radius input in the same school-zone section and remove only the old duplicate latitude/longitude inputs.

- [ ] **Step 4: Run the settings test and typecheck**

Run: `npm run test:run -- src/features/nedaa/views/__tests__/NedaaSettingsView.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the school-zone integration**

```bash
git add src/features/nedaa/views/NedaaSettingsView.tsx src/features/nedaa/views/__tests__/NedaaSettingsView.test.tsx
git commit -m "feat(nedaa): add Google Maps school zone picker"
```

---

### Task 4: Nedaa Gate Integration And Localization

**Files:**

- Modify: `src/features/nedaa/components/NedaaGateFormModal.tsx`
- Create: `src/features/nedaa/components/__tests__/NedaaGateFormModal.test.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/__tests__/nedaaTranslations.test.ts`

**Interfaces:**

- Consumes: Task 2's controlled picker and existing `CreateDismissalGatePayload` callback.
- Produces: gate payloads with unchanged `latitude` and `longitude` fields plus complete bilingual picker messages.

- [ ] **Step 1: Write failing gate and translation tests**

Mock the picker and assert edit initialization, selection, validation, and submit mapping:

```ts
it("submits coordinates selected in the gate location picker", async () => {
  render(<NedaaGateFormModal {...props} onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText("Gate name"), "North Gate");
  await user.click(screen.getByRole("button", { name: "select-test-location" }));
  await user.click(screen.getByRole("button", { name: "Create gate" }));
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ latitude: 24.7136, longitude: 46.6753 }),
  );
});

it("blocks submission while coordinates are invalid", async () => {
  // Have the picker invoke onValidityChange(false) and assert the submit button is disabled.
});
```

Extend `nedaaTranslations.test.ts` with the exact `nedaa.settings.location_picker` key tree used by both Nedaa consumers, including every error key from `GoogleLocationPickerLabels`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm run test:run -- src/features/nedaa/components/__tests__/NedaaGateFormModal.test.tsx src/messages/__tests__/nedaaTranslations.test.ts`

Expected: FAIL because the gate modal does not render the picker and the translation keys are absent.

- [ ] **Step 3: Integrate gate location state**

Replace separate latitude/longitude string state with:

```ts
const [location, setLocation] = useState<GoogleLocationValue | null>(null);
const [isLocationValid, setIsLocationValid] = useState(true);
```

Initialize it from `initialGate.location` when both coordinates exist. Include `isLocationValid` in `canSubmit`, render `GoogleLocationPicker`, and submit:

```ts
latitude: location?.latitude ?? null,
longitude: location?.longitude ?? null,
```

- [ ] **Step 4: Add English and Arabic messages**

Add `nedaa.settings.location_picker` labels for search, results, map, selected location, progress states, manual coordinates, and all error reasons. English and Arabic must expose identical key paths; retain coordinate values with left-to-right direction in the component.

- [ ] **Step 5: Run all affected tests and static checks**

Run:

```bash
npm run test:run -- src/components/ui/google-location-picker/__tests__/locationModel.test.ts src/components/ui/google-location-picker/__tests__/GoogleLocationPicker.test.tsx src/features/settings/branding/__tests__/SchoolBrandingEditor.test.tsx src/features/settings/branding/__tests__/SettingsBrandingPage.test.tsx src/features/nedaa/views/__tests__/NedaaSettingsView.test.tsx src/features/nedaa/components/__tests__/NedaaGateFormModal.test.tsx src/messages/__tests__/nedaaTranslations.test.ts
npm run typecheck
npx eslint src/components/ui/google-location-picker src/features/settings/components/SchoolLocationPickerModal.tsx src/features/nedaa/views/NedaaSettingsView.tsx src/features/nedaa/components/NedaaGateFormModal.tsx
npx prettier --check src/components/ui/google-location-picker src/features/settings/components/SchoolLocationPickerModal.tsx src/features/nedaa/views/NedaaSettingsView.tsx src/features/nedaa/components/NedaaGateFormModal.tsx src/messages/en.json src/messages/ar.json
```

Expected: all commands exit `0`.

- [ ] **Step 6: Run browser verification**

Start: `npm run dev`

Verify in English and Arabic at desktop and mobile widths:

- Nedaa settings search, marker drag, map click, manual coordinates, and radius circle work without layout overlap.
- Gate create/edit initializes and submits coordinates.
- Missing-key mode displays the localized error and leaves manual inputs usable.
- The browser console contains no Google Maps loader duplication, React warnings, or uncaught callback errors.

- [ ] **Step 7: Commit the Nedaa gate and localization work**

```bash
git add src/features/nedaa/components/NedaaGateFormModal.tsx src/features/nedaa/components/__tests__/NedaaGateFormModal.test.tsx src/messages/en.json src/messages/ar.json src/messages/__tests__/nedaaTranslations.test.ts
git commit -m "feat(nedaa): add Google Maps gate location picker"
```

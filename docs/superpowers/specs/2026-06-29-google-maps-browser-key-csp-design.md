# Google Maps Browser Key and CSP Design

## Goal

Allow the Branding location picker to load the Google Maps JavaScript API, Places library, and browser-side Geocoding service while preserving explicit Content Security Policy restrictions.

## Key Contract

The picker continues to use one public browser key from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. The key must be configured outside source control and restricted in Google Cloud to authorized website referrers.

Because the picker loads `google.maps.Map`, the Places library, and `google.maps.Geocoder` from the Maps JavaScript API, that browser key must authorize Maps JavaScript API, the matching Places API used by the existing legacy Places service, and Geocoding API.

A separate Geocoding key is not added to the frontend. The current browser-side Geocoder does not accept a second key independently from the Maps JavaScript loader, and exposing another key would not solve the loader failure. A separate server-restricted key would require a backend geocoding endpoint and is outside this change.

## Content Security Policy

`next.config.ts` extends the existing CSP using the Google Maps JavaScript API allowlist guidance:

- `script-src` permits HTTPS scripts from Google APIs and Google static asset domains.
- `connect-src` explicitly permits Google APIs, Google static assets, and Google domains used by Maps requests.
- `img-src` permits Google Maps and Google-hosted image domains while retaining the existing image sources.
- `style-src` permits Google Fonts styles, and `font-src` permits Google Fonts assets.
- `frame-src` permits Google-hosted frames used by Maps features.
- `worker-src` permits blob workers used by the Maps runtime.

Existing application sources and directives remain intact. The change does not remove the current restrictions or add a global wildcard source.

## Runtime Behavior

The user must populate `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` locally and restart the Next.js development or production process, because `NEXT_PUBLIC_*` variables are embedded into the client bundle at build time.

The picker retains its existing localized missing-key and load-failure messages. Browser console errors from Google remain the authoritative diagnostic for invalid billing, disabled APIs, or rejected HTTP referrers after CSP and environment configuration are correct.

## Verification

Verification covers:

- The CSP includes the Google Maps script, connection, image, font, frame, and worker sources required by the integration.
- The environment example continues to declare `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` without a value.
- Type checking and the production build accept the updated Next.js configuration.
- No API key value is added to tracked files or command output.

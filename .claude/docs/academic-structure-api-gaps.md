# Academic Structure API Gaps (Live Swagger)

This project is now API-backed for the currently exposed Academic Structure Swagger contract at `https://api.moazez.sa/api/v1/docs#/academics-structure`.

## Remaining missing endpoint

- `POST /academics/structure/carry-over`

## Contract clarifications still worth confirming

- Swagger currently shows `ReorderNodeDto` as an empty object. The current integration assumes `sortOrder` is the effective request field for reorder endpoints.
- Confirm whether `GET /academics/structure/terms` supports `yearId` server-side filtering consistently; the client still filters locally as a safety net.
- Confirm whether create/update responses always return the full node payload including relationship ids and `sortOrder`.
- Confirm whether tree responses may omit empty arrays or nested collections so the adapter can stay resilient without extra fallback logic.

## UI behavior still intentionally disabled

- Carry-over action

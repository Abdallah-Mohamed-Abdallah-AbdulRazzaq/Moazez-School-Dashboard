# Missing API Endpoints

This document lists features that are **UI-ready** but have no corresponding backend API endpoint. These stubs need to be implemented by the backend team before the features can go live.

---

## Admissions — Leads Module

### M1 — Activity Log (per Lead)

The UI has an `ActivityLog` component that displays and creates activities for a specific lead.  
**No backend endpoint exists.**

**Needed:**

```
GET  /api/v1/admissions/leads/:id/activities
POST /api/v1/admissions/leads/:id/activities
```

**POST Payload:**
```json
{
  "type": "Call | WhatsApp | Email | Note",
  "message": "string"
}
```

**GET Response:**
```json
[
  {
    "id": "string",
    "leadId": "string",
    "type": "Call",
    "message": "string",
    "createdAt": "ISO-8601",
    "createdBy": "string (user name)"
  }
]
```

---

### M2 — Notes (per Lead)

The UI has a `NotesPanel` component for adding freeform notes to a lead.  
**No backend endpoint exists.**

**Needed:**

```
GET  /api/v1/admissions/leads/:id/notes
POST /api/v1/admissions/leads/:id/notes
```

**POST Payload:**
```json
{
  "body": "string"
}
```

**GET Response:**
```json
[
  {
    "id": "string",
    "leadId": "string",
    "body": "string",
    "createdAt": "ISO-8601",
    "createdBy": "string"
  }
]
```

---

### M3 — Lead-to-Application Conversion (dedicated endpoint)

Currently handled by `PATCH /api/v1/admissions/leads/:id` with `{ "status": "Converted" }`.  
If a formal `Application` record should be created from a lead, a dedicated endpoint is needed.

**Needed (optional):**

```
POST /api/v1/admissions/leads/:id/convert
```

**Response:**
```json
{
  "applicationId": "string",
  "leadId": "string",
  "status": "Draft"
}
```

---

## Academics — Rooms Module

### M4 — Room Default Assignments

The UI expects a `GET /api/v1/academics/rooms/defaults` endpoint that returns room-to-class default assignments.  
**This endpoint returns 404.**

**Needed:**

```
GET  /api/v1/academics/rooms/defaults
POST /api/v1/academics/rooms/defaults
```

**GET Response:**
```json
[
  {
    "roomId": "string",
    "className": "string",
    "dayOfWeek": "Sunday",
    "period": 1
  }
]
```

---

## Academics — Subjects Module

### M5 — Subject Allocations

The UI supports teacher-to-subject allocation.  
**No backend endpoint exists.**

**Needed:**

```
GET  /api/v1/academics/subjects/:id/allocations
POST /api/v1/academics/subjects/:id/allocations
```

---

### M6 — Carry Over

The UI supports carrying subjects from one term to the next.  
**No backend endpoint exists.**

**Needed:**

```
POST /api/v1/academics/subjects/carry-over
```

**Payload:**
```json
{
  "fromTermId": "string",
  "toTermId": "string",
  "subjectIds": ["string"]
}
```

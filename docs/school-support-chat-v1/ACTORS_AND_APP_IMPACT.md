# Actors and Application Impact

## Actor matrix

| Actor | User type | Surface | Access |
| --- | --- | --- | --- |
| School Admin / permitted school user | `SCHOOL_USER` | School Dashboard | Can view/send/read the current school's support conversation if granted `school.support.*`. |
| Platform Support / Platform Super Admin | `PLATFORM_USER` | Platform Admin / System Dashboard | Can list support inbox, read conversations/messages, reply, mark read, close, and reopen. |
| Teacher | `TEACHER` | None by default | No default School Support Chat access. |
| Parent | `PARENT` | None | No School Support Chat access. |
| Student | `STUDENT` | None | No School Support Chat access. |
| Dismissal Staff | `DISMISSAL_STAFF` | None | No School Support Chat access by default. |

## School Dashboard impact

Directly affected. The School Dashboard Help UI should use:

- `GET /api/v1/school-support/conversation`
- `GET /api/v1/school-support/messages`
- `POST /api/v1/school-support/messages`
- `POST /api/v1/school-support/read`

It should display platform replies as `Moazez Support` and must not expect raw platform operator identity.

## Platform Admin / System Dashboard impact

Directly affected. The System Dashboard support inbox should use:

- `GET /api/v1/platform-admin/support/conversations`
- `GET /api/v1/platform-admin/support/conversations/:conversationId`
- `GET /api/v1/platform-admin/support/conversations/:conversationId/messages`
- `POST /api/v1/platform-admin/support/conversations/:conversationId/messages`
- `POST /api/v1/platform-admin/support/conversations/:conversationId/read`
- `POST /api/v1/platform-admin/support/conversations/:conversationId/close`
- `POST /api/v1/platform-admin/support/conversations/:conversationId/reopen`

The Platform Admin UI should poll/refresh REST for inbox freshness until platform-safe socket room join is implemented.

## Other apps

Parent App, Student App, Teacher App, and Dismissal Staff App are not directly affected by this feature. They do not receive support chat permissions by default and should not integrate these endpoints.

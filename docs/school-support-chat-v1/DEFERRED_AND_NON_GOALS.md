# Deferred Items and Non-Goals

The following are not implemented in School Support Chat V1:

- Support push delivery.
- Email/SMS support messages.
- Attachments.
- Ticket numbers.
- Ticketing workflows.
- Support categories.
- Priority and SLA.
- Assignment to specific support operator.
- Internal notes.
- Multi-ticket history.
- Bot/AI behavior.
- Platform-safe support socket room join.
- Durable realtime replay/outbox.
- Database-level uniqueness for one active support conversation per school.

## Important integration note

Frontend teams must not design UI flows assuming tickets, categories, attachments, or push are available. The V1 product is a text-only support conversation with REST-first state and in-app notifications only.

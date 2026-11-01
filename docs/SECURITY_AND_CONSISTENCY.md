# Security and consistency design

## Boundaries

The catch-all API route is server-only and validates each endpoint's role and ownership. A MEMBER cannot create trainer availability, and a TRAINER cannot access member workout endpoints. Booking and workout IDs are never accepted as proof of ownership. PostgreSQL predicates include the authenticated user's ID; MongoDB reads/updates/deletes include `userId`. Session roles are read from PostgreSQL after verifying the signed token, so a client cannot select a privileged role through a cookie payload.

Registration hashes passwords with bcrypt cost 12 and inserts user + typed profile in one SQL transaction. Passwords are limited to 72 UTF-8 bytes to avoid silent bcrypt truncation. JWT sessions use HS256, issuer/audience checks, eight-hour expiry, HttpOnly, SameSite=Lax and Secure in production. Signing requires SESSION_SECRET of at least 32 characters. Logout clears the cookie. There is no server-side session revocation store; stolen tokens remain valid until expiry unless the secret rotates or the user disappears.

Mutation requests require exact APP_ORIGIN. API JSON bodies have a 64 KiB application limit and Zod validation. SQL uses bound parameters. ObjectIds must be 24-character hex; all workout IDs serialize to hex. Errors map conflicts to 409, invalid inputs to 400, missing owned rows to 404, missing auth to 401 and role/origin failures to 403. Unhandled service failures return generic 503 without SQL text, credentials or stack traces. Browser output uses React escaping.

The login/register throttle is an in-process bounded map keyed by normalized email, 12 attempts/minute. It is not a global production brute-force defense. No payment, email verification, password reset, admin management or public deployment is included.

## Database integrity

Role-discriminated composite foreign keys prevent a member profile for a trainer and vice versa. Availability duration/status/time constraints plus a GiST exclusion enforce valid ranges and prevent trainer overlap across rows. A partial unique booking index enforces one confirmed booking per slot. Both stored function and validation trigger lock the slot to serialize competing reservations; a direct SQL insert still encounters the same unique index. Trigger audit records initial booking and status changes.

Application authorization remains essential: a database login able to call functions directly is a trusted server identity, not an end-user account. The function is SECURITY INVOKER by default. Use a dedicated application database login and least privileges in any deployment; never share its credentials with members. Runtime migrations should be run with a separate migration role in production.

## Hybrid consistency

Only PostgreSQL operations within its transaction are ACID together. MongoDB logs use PostgreSQL UUID strings; MongoDB has no foreign key to the SQL table. The API validates an active authenticated member before a log operation, but a simultaneous administrative SQL deletion could create an orphan. No account deletion endpoint is supplied; future deletion needs an outbox/saga or reconciliation process, not a claim of distributed atomicity. Analytics remain entirely within MongoDB.

Recommendation queries are read-only against PostgreSQL embeddings; goal saving occurs afterward. A failed query leaves the old goal unchanged. Bio updates compute a complete embedding before atomically updating text/vector/model metadata together. Offline reindexing updates each row atomically but is not one transaction across all rows. Exact cosine search is appropriate for the six-exercise demo; approximate HNSW indexing should be introduced only with measured scale/recall requirements.

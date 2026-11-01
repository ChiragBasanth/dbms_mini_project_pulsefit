# Relational schema and normalization

Source of truth: ordered SQL in `database/postgres/migrations/`.

```text
users(id PK, name, email UNIQUE, password_hash, role, created_at, UNIQUE(id,role))
member_profiles(user_id PK, role='MEMBER', fitness_goals,
  FK(user_id,role) -> users(id,role))
trainer_profiles(user_id PK, role='TRAINER', bio, specialties[], experience_years,
  embedding vector(384), embedding_model, location,
  FK(user_id,role) -> users(id,role))
trainer_availability(id PK, trainer_id FK -> trainer_profiles.user_id,
  starts_at, ends_at, status, UNIQUE(id,trainer_id), GiST non-overlap exclusion)
bookings(id PK, member_id FK -> member_profiles.user_id, trainer_id, slot_id,
  status, created_at, FK(slot_id,trainer_id) -> trainer_availability(id,trainer_id))
booking_audit(id PK, booking_id FK -> bookings.id, old_status, new_status, changed_at)
exercises(id PK, name UNIQUE, muscle_group, description, difficulty, category,
  embedding vector(384), embedding_model)
schema_migrations(name PK, checksum, applied_at)
```

## Normalization rationale

User identity appears once; member and trainer properties depend on each profile's key. Availability is independent of reservations so cancellation retains history and releases the partial unique index entry. Names, times and contact data are not duplicated in bookings. Display views join current context.

Core scalar relations follow third normal form: non-key attributes describe the key and do not determine unrelated non-key attributes. `trainer_id` in bookings is deliberately redundant with slot membership to support a composite FK preventing mismatched trainers; it is not claimed to be a fully decomposed 3NF relation. Profile role columns are constrained discriminator redundancy enabling declarative role-specific foreign keys. Specialties use a bounded descriptive PostgreSQL array; this is a practical multivalued attribute, not a claim of strict classical 1NF for that field. A separate specialty relation is an appropriate future change if per-specialty attributes are needed.

## Booking invariant

Capacity is exactly one. `one_confirmed_booking_per_slot` is a partial unique index. `reserve_slot` locks the slot with `FOR UPDATE`, validates its time/status and inserts. Under the default READ COMMITTED isolation, competing calls wait; the unique index independently protects direct insert paths. The GiST exclusion constraint, rather than a cross-row CHECK, prevents overlapping availability for each trainer. Closed slots still occupy their original interval and cannot be reopened through the API; create a different non-overlapping time. Slot time and trainer are immutable after creation.

Cancellation changes an owned future booking to CANCELLED, retaining audit history; a new reservation uses a new booking row. PostgreSQL handles the operation atomically. Contention involving cancellation can cause a deadlock victim to roll back; retry the request after refreshing. No global transaction spans PostgreSQL and MongoDB.

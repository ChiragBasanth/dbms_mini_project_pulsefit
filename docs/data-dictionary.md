# PulseFit data dictionary

| Table | Column | Meaning / rule |
|---|---|---|
| users | id | UUID primary key |
| users | email | Login identity; unique and required |
| users | password_hash | bcrypt hash; never store a plaintext password |
| users | role | MEMBER, TRAINER, or ADMIN |
| trainer_profiles | hourly_rate | Nonnegative numeric session price |
| trainer_profiles | embedding | 128-element pgvector vector used for cosine retrieval |
| trainer_availability | starts_at, ends_at | Valid slot where end is later than start |
| bookings | status | PENDING, CONFIRMED, CANCELLED, REJECTED, COMPLETED |
| bookings | starts_at, ends_at | Confirmed bookings cannot overlap for the same trainer |
| booking_audit | action | Trigger-generated booking creation/status history |
| fitness_goals | embedding | Optional member goal vector |
| exercise_embeddings | embedding | Required exercise description vector |
| exercise_embeddings | metadata | Flexible JSONB exercise details |
| MongoDB workout_logs | exercises | Flexible typed exercise array with set metrics |

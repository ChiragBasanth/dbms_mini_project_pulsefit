# Data dictionary

All columns are NOT NULL unless marked nullable. PostgreSQL UUIDs are serialized as strings; dates use ISO strings at the API and timezone-aware storage. Sources: `001_core.sql`, `002_profile_metadata.sql`, `database/mongo/setup.ts`.

| Table | Columns and types | Rules / meaning |
|---|---|---|
| users | id uuid; name text; email text; password_hash text; role text; created_at timestamptz | Generated UUID PK; name 2–100; lower(trim(email)) unique; hash ≥60 chars; MEMBER or TRAINER; creation now |
| member_profiles | user_id uuid; role text; fitness_goals text | PK and composite role FK; MEMBER only; goals default empty, ≤2000 chars |
| trainer_profiles | user_id uuid; role text; bio text; specialties text[]; experience_years int; embedding vector(384) nullable; embedding_model text nullable; location text | PK and composite role FK; TRAINER only; bio ≤2000; experience 0–80; model metadata; location ≤120 default campus gym |
| trainer_availability | id uuid; trainer_id uuid; starts_at timestamptz; ends_at timestamptz; status text | UUID PK; trainer FK; duration >0 and ≤4h; OPEN/CLOSED; insertion starts within next 90 days; non-overlapping half-open ranges |
| bookings | id uuid; member_id uuid; trainer_id uuid; slot_id uuid; status text; created_at timestamptz | PK; typed member FK; composite slot/trainer FK; CONFIRMED/CANCELLED; one confirmed row per slot; immutable identity |
| booking_audit | id bigint identity; booking_id uuid; old_status text nullable; new_status text; changed_at timestamptz | PK; booking FK; trigger-produced change trail; initial old status null |
| exercises | id uuid; name text; muscle_group text; description text; difficulty text; category text; embedding vector(384) nullable; embedding_model text nullable | PK; unique name; BEGINNER/INTERMEDIATE/ADVANCED; STRENGTH/CARDIO/MOBILITY; null embedding means not indexed |
| schema_migrations | name text; checksum text; applied_at timestamptz | Migration filename PK; SHA-256 prevents edits to applied migrations |

## MongoDB workout_logs

| Field | BSON type | Rules / meaning |
|---|---|---|
| _id | ObjectId | MongoDB identifier; serialized as 24-character hex |
| userId | string | PostgreSQL member UUID; app supplies from authenticated session |
| performedAt | date | Workout timestamp; application rejects future dates |
| createdAt | date | Server insertion timestamp |
| workoutType | string | STRENGTH, CARDIO, MIXED or MOBILITY |
| notes | string optional | ≤2000 characters |
| exercises | array | 1–30 exercise snapshots |
| exercises[].name | string | 1–100 characters |
| exercises[].sets | array | 1–30 sets, each with reps or duration |
| sets[].reps | number optional | Positive integer ≤1000 |
| sets[].weight | number optional | kg, 0–1500; absent for cardio |
| sets[].duration | number optional | seconds, positive ≤86400 |
| sets[].distance | number optional | metres, positive ≤1000000 |

Compound indexes `(userId, performedAt DESC)` and `(userId, workoutType, performedAt DESC)` support history and filters. Analytics use user-scoped aggregation; missing reps/weight contribute zero resistance volume. Session counts occur before unwinding via `$facet`, avoiding counting a multi-set workout as many sessions.

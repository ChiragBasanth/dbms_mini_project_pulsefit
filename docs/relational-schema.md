# PulseFit relational design

- `users(id PK, email UNIQUE, password_hash, full_name, role, is_active, created_at, updated_at)`
- `member_profiles(user_id PK/FK → users.id, phone, date_of_birth, fitness_level)`
- `trainer_profiles(user_id PK/FK → users.id, headline, biography, hourly_rate, years_experience, rating, embedding vector(128))`
- `trainer_specializations(id PK, trainer_id FK → trainer_profiles, name, UNIQUE(trainer_id,name))`
- `trainer_availability(id PK, trainer_id FK, starts_at, ends_at, is_open)`
- `bookings(id PK, member_id FK, trainer_id FK, starts_at, ends_at, status, notes)`
- `booking_audit(id PK, booking_id, actor_id FK, action, old_status, new_status, changed_at)`
- `fitness_goals(id PK, member_id FK, description, embedding vector(128), target_date)`
- `exercise_embeddings(id PK, name UNIQUE, description, category, embedding vector(128), metadata jsonb)`

Booking times use half-open ranges `[start,end)`. PostgreSQL's GiST exclusion constraint rejects overlapping confirmed time ranges for one trainer, including concurrent requests. `create_booking` locks the matching availability row and inserts within the caller's transaction. `booking_audit` is maintained by a trigger. The embedding is deterministic 128-dimensional feature hashing suitable for reproducible demonstrations; it is not a pretrained semantic language model.

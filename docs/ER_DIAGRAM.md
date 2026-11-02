# Entity relationship diagram

```mermaid
erDiagram
 USERS ||--o| MEMBER_PROFILES : "id + role"
 USERS ||--o| TRAINER_PROFILES : "id + role"
 TRAINER_PROFILES ||--o{ TRAINER_AVAILABILITY : offers
 MEMBER_PROFILES ||--o{ BOOKINGS : reserves
 TRAINER_AVAILABILITY ||--o{ BOOKINGS : "slot_id + trainer_id"
 BOOKINGS ||--o{ BOOKING_AUDIT : records
 USERS {
  uuid id PK
  text email UK
  text password_hash
  text role
 }
 MEMBER_PROFILES {
  uuid user_id PK,FK
  text role
  text fitness_goals
 }
 TRAINER_PROFILES {
  uuid user_id PK,FK
  text bio
  text_array specialties
  int experience_years
  vector384 embedding
 }
 TRAINER_AVAILABILITY {
  uuid id PK
  uuid trainer_id FK
  timestamptz starts_at
  timestamptz ends_at
  text status
 }
 BOOKINGS {
  uuid id PK
  uuid member_id FK
  uuid trainer_id FK
  uuid slot_id FK
  text status
 }
 BOOKING_AUDIT {
  bigint id PK
  uuid booking_id FK
  text old_status
  text new_status
 }
 EXERCISES {
  uuid id PK
  text name UK
  text category
  vector384 embedding
 }
```

Logical cross-database reference: `workout_logs.userId` stores the PostgreSQL member UUID as a string. It is not a MongoDB-enforced foreign key. Exercises embedded in logs preserve historical names and measurements even if catalog descriptions change. The optional catalog has no forced relational link to those historical snapshots.

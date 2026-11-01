# PulseFit database architecture

```mermaid
flowchart LR
  Browser --> Next[Next.js App Router]
  Next --> API[Route handlers + validation]
  API --> PG[(PostgreSQL + pgvector)]
  API --> MDB[(MongoDB workout_logs)]
  PG -->|users, roles, availability, bookings, goals| API
  PG -->|vector cosine retrieval| API
  MDB -->|flexible workout analytics| API
```

PostgreSQL owns identity, roles, trainer profiles, time slots, bookings, fitness goals and vectors. Its constraints provide reliable transactions and prevent schedule conflicts. MongoDB stores evolving workout/exercise shapes and uses aggregation pipelines for training analytics. pgvector stores 128D embeddings alongside PostgreSQL metadata and ranks by cosine distance. The current local embedding generator uses deterministic token/bigram feature hashing, requiring no external API key.

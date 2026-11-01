# PulseFit DBMS viva notes

1. **Why PostgreSQL for bookings?** A booking is transactional and needs strict relationships. The GiST exclusion constraint is checked by PostgreSQL itself, so two concurrent requests cannot confirm overlapping ranges for the same trainer.
2. **Why MongoDB for workouts?** Exercises have varying measurements: strength sets use reps and kilograms, cardio uses duration or distance, and mobility may use duration only. A document array represents that variation naturally.
3. **What makes the booking atomic?** `create_booking` locks the availability row and inserts the booking in the same transaction. The exclusion constraint is the final concurrency guard.
4. **What do the trigger and view demonstrate?** The trigger retains an audit history without relying on the UI. The view summarizes trainer workloads for reporting.
5. **How does semantic retrieval work?** Text is transformed into a deterministic 128D feature-hashing vector. pgvector ranks stored vectors using cosine distance. This is reproducible without an external API but weaker than a pretrained embedding model.

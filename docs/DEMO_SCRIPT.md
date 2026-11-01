# Seven-minute live demonstration

Preparation: follow SETUP.md, start the app and seed/embedding steps. Run tests before the presentation. Use two browser profiles or separate cookie jars. All sample accounts are fictitious. Read the locally generated seed password from `.env` privately; never show it on the projector.

| Time | Action | Visible DBMS concept |
|---|---|---|
| 0:00–0:40 | Open landing page; explain trainer double-booking and varied workout data | Meaningful problem; SQL/NoSQL/vector responsibilities |
| 0:40–1:20 | Show ER diagram and migrations; point to typed FKs, CHECKs and GiST exclusion | Relational design and integrity |
| 1:20–2:00 | Sign in as trainer; add a future slot; try overlapping time | Availability API; cross-row exclusion |
| 2:00–3:00 | Sign in as member; discover trainer and reserve; show eight-client test log | Stored function, row locks, partial unique index, conflict 409 |
| 3:00–3:35 | Cancel own booking and reserve again; query booking_audit | Transactional cancellation, trigger, historical record |
| 3:35–4:35 | Save a strength log and a cardio log; edit one; show filtered history | MongoDB flexible documents, validation and ownership |
| 4:35–5:15 | Open Progress; compare known fixture 350 kg×reps and 600 seconds | `$match`, `$unwind`, `$group`, `$facet`; real aggregation |
| 5:15–6:05 | Describe a goal without exact exercise keywords; show ranked exercises and available trainers | Real 384-D sentence embeddings, pgvector cosine distance |
| 6:05–6:40 | Show unauthorized API test, build/test logs and upcoming_bookings view | Security, joins, reproducible evidence |
| 6:40–7:00 | Explain limitations, both students' actual contributions and future work | Honest evaluation and hybrid consistency limits |

Use `npm run test:integration` to demonstrate direct database contention. The test acquires eight independent connections before releasing a shared promise barrier, records exactly one success and seven SQLSTATE 23505 errors, and checks the committed count. Do not describe this proof as complete until its run log shows the assertions passing.

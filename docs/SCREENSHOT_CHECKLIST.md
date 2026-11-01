# Genuine screenshot checklist

Only images actually captured from the running app or real tools belong in `docs/screenshots/`. No simulated terminal images or invented data. Report captions must distinguish seeded fixtures from real users. Do not capture `.env`, cookie tokens, password fields, connection strings or personal data.

| Filename | Capture steps |
|---|---|
| 01-landing.png | Start app, open localhost landing, include the visible product heading |
| 02-member-dashboard.png | Sign in as demo member; show own sessions and navigation |
| 03-trainer-dashboard.png | Sign in as demo trainer in another profile; show appointments or availability |
| 04-booking-confirmed.png | Book an open future slot and capture genuine success notice |
| 05-reservation-conflict.png | Reserve same slot with a second session or show actual API/concurrency output; capture real 409 |
| 06-workout-history.png | Save strength and cardio logs; capture saved history and editor |
| 07-progress.png | Open Progress after logs exist; show actual aggregated values |
| 08-recommendations.png | Submit free-text goal and capture actual ranked results |
| 09-postgres-schema.png | Show migrations/ER in editor or actual psql catalog output |
| 10-function-trigger.png | Show reserve_slot, booking_changes and actual booking_audit rows |
| 11-mongo-aggregation.png | Execute pipeline against owned fixture and show actual output |
| 12-api-build-tests.png | Show API implementation and successful terminal commands, excluding secrets |

## Observed capture status

Ten JPEGs were actually captured for the report: `01-landing-desktop.jpg`, `01-landing-mobile.jpg`, `02-member-dashboard.jpg`, `03-trainer-dashboard.jpg`, `03-trainer-availability.jpg`, `04-booking-history.jpg`, `05-availability-overlap-rejected.jpg`, `06-workout-history.jpg`, `07-progress.jpg` and `08-recommendations.jpg`. These fulfill the corresponding app views above; JPEG is the browser tool's native format. An additional `04-booking-confirmed.jpg` captures the post-booking reserved slot state.

The overlapping availability image is **not** a duplicate-reservation screenshot. Duplicate reservation rejection is currently proved by actual test logs; its dedicated visual capture remains pending, along with PostgreSQL/MongoDB console, source-code and terminal captures. The checklist's PNG filenames are suggested names for those manual captures, not claims that files exist.

Screenshots may be captured using the available browser/computer tool. For remaining console/editor captures, use Windows Snipping Tool manually and save with the descriptive names above. A missing filename is a pending task, not evidence of completion. See the report for images actually captured in this session.

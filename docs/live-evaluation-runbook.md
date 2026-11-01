# Live evaluation runbook

Run these commands from the project root in an unrestricted PowerShell after Docker Desktop is running.

```powershell
Copy-Item .env.example .env
docker compose up -d
Get-Content -Raw database/sql/001_schema.sql | docker compose exec -T postgres psql -U pulsefit -d pulsefit
Get-Content -Raw database/sql/002_seed.sql | docker compose exec -T postgres psql -U pulsefit -d pulsefit
$env:DATABASE_URL = "postgresql://pulsefit:pulsefit_local_only@localhost:5432/pulsefit"
$env:MONGODB_URI = "mongodb://localhost:27017/pulsefit"
$env:SESSION_SECRET = "replace-this-with-a-unique-local-secret-of-at-least-24-characters"
npm run seed:vectors
npx tsc --noEmit
npm test
npm run build
npm run dev
```

Open `http://localhost:3000` and use the demo accounts below after the seed script completes.

| Role | Email | Password |
| --- | --- | --- |
| Member | member.demo@pulsefit.local | PulseFitDemo!2026 |
| Trainer | trainer.maya@pulsefit.local | PulseFitDemo!2026 |

## Live verification checklist

1. Sign in as the trainer and create an availability slot.
2. Sign in as the member, browse trainers, open the trainer profile and book the slot.
3. Attempt a second confirmed booking for the same trainer and overlapping time. PostgreSQL must reject it.
4. View member booking history and cancel a future booking.
5. Log a strength and a cardio workout. Open Analytics and confirm weekly counts, volume and exercise performance.
6. Open Recommendations and test trainer plus exercise matching.
7. Capture screenshots of the landing page, member dashboard, trainer dashboard, discovery, booking result, workout log, analytics, recommendations, PostgreSQL query output and MongoDB aggregation output. Store them under `docs/screenshots/`.

## GitHub push

After the build passes, commit from an unrestricted terminal. `.env`, `.next` and `node_modules` are already ignored.

```powershell
git init -b main
git config user.name "ChiragBasanth"
git config user.email "chiragbasanthb@gmail.com"
git remote add origin https://github.com/ChiragBasanth/dbms_mini_project_pulsefit.git
git add .
git commit -m "feat: complete PulseFit hybrid gym system"
git push -u origin main
```

If a local repository has already been initialized, omit `git init -b main`. Before pushing, run `git ls-remote origin main` to confirm whether the remote has received any teammate commits.

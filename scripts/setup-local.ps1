param([switch]$StartApp)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop is required for the local database stack.' }
docker compose up -d
Get-Content -Raw database/sql/001_schema.sql | docker compose exec -T postgres psql -U pulsefit -d pulsefit
Get-Content -Raw database/sql/002_seed.sql | docker compose exec -T postgres psql -U pulsefit -d pulsefit
Write-Host 'Copy .env.example to .env and set SESSION_SECRET before running vector seeds.'
Write-Host 'Then run: $env:DATABASE_URL="postgresql://pulsefit:pulsefit_local_only@localhost:5432/pulsefit"; npm run seed:vectors'
if ($StartApp) { npm run dev }

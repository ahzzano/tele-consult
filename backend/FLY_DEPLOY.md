# Backend Fly.io Deployment

This folder is deployable as its own Fly.io app from the monorepo.

## 1. Create the Backend App

From the repository root:

```bash
cd backend
fly apps create teleconsult-api-yourname
```

Update `app` in `fly.toml` to match the app name you created.

## 2. Configure Postgres

Cheapest demo option: use a free external Postgres provider, then set `DATABASE_URL` on the Fly backend.

Good low-cost choices:

```text
Neon Free Postgres
Supabase Free Postgres
Railway Free/Trial Postgres
```

Neon is usually the cleanest fit if you only need Postgres. Create a Neon project, copy the pooled or direct connection string, then set it on Fly:

```bash
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require" --app teleconsult-api-yourname
```

Then skip the Fly Postgres create/attach commands and go straight to deploy.

If you specifically want the database inside Fly, you can use Fly Postgres instead. This is more integrated, but usually not the cheapest path.

Create a Fly Postgres app:

```bash
fly postgres create --name teleconsult-db --region sin
```

Attach it to the backend app:

```bash
fly postgres attach teleconsult-db --app teleconsult-api-yourname
```

Fly will set `DATABASE_URL` as an app secret. The backend reads that variable at runtime.

## 3. Deploy Backend

```bash
fly deploy --ha=false
```

The backend machine runs this startup command:

```bash
pnpm db:push && node dist/main
```

This syncs the current Drizzle schema to the database before starting the NestJS server. It intentionally avoids Fly's `release_command` because release commands create a temporary machine during deploy, which can exceed low machine limits on small/free accounts.

The included `fly.toml` is tuned for the cheapest backend deployment:

```text
shared CPU
256 MB RAM
auto-stop enabled
0 minimum running machines
no release-command machine
```

This keeps idle compute cost as low as possible. The tradeoff is that the first request after the backend has been idle may be slower while Fly starts the machine again. For a live judging window, you can keep the backend warm by changing:

```toml
min_machines_running = 1
```

and optionally increasing memory to:

```toml
memory = "512mb"
```

## 4. Seed Demo Data

After the first successful deploy:

```bash
fly ssh console --app teleconsult-api-yourname
pnpm db:seed
exit
```

Seeded demo users use:

```text
Password123!
```

Example accounts:

```text
Doctor:  dr.rafael.cruz@example.com
Patient: leo.reyes@example.com
```

## 5. Test

```bash
curl https://teleconsult-api-yourname.fly.dev
```

Expected response:

```json
{"success":true,"data":"Hello World!"}
```

Use the backend URL as the frontend's backend environment value:

```env
BACKEND_URL=https://teleconsult-api-yourname.fly.dev
NEXT_PUBLIC_BACKEND_URL=https://teleconsult-api-yourname.fly.dev
```

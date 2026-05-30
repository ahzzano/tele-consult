# Backend Fly.io Deployment

This folder is deployable as its own Fly.io app from the monorepo.

## 1. Create the Backend App

From the repository root:

```bash
cd backend
fly apps create teleconsult-api-yourname
```

Update `app` in `fly.toml` to match the app name you created.

## 2. Create or Attach Postgres

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
fly deploy
```

The deployment runs this release command before the new backend starts:

```bash
pnpm db:push
```

This syncs the current Drizzle schema to the attached database.

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

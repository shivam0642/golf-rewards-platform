# Digital Heroes

Digital Heroes is a subscription-based golf performance platform combining Stableford score tracking, charitable contributions, monthly draws, and winner verification.

## Architecture

- `frontend`: React, Vite, React Router, and Framer Motion. It only calls the Express API and receives no service-role credentials.
- `backend`: Express API with custom JWT authentication, bcrypt password hashing, role checks, validation services, and Supabase database access.
- `database/schema.sql`: executable PostgreSQL schema for a fresh Supabase project.
- `backend/src/db/seed.js`: idempotent seed script for charities, admin/demo users, subscriptions, and demo scores.

All production persistence is Supabase PostgreSQL. The removed JSON store is not a fallback.

## Prerequisites

- Node.js 20 or newer
- A Supabase project
- PowerShell, Bash, or another shell able to run npm scripts

## Environment variables

Copy `backend/.env.example` to `backend/.env` and set:

- `PORT`
- `FRONTEND_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional Stripe variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`
- Optional seed credentials: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_EMAIL`, `DEMO_PASSWORD`

Copy `frontend/.env.example` to `frontend/.env` and set only the browser-safe `VITE_API_BASE_URL`.

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable or frontend deployment settings.

## Supabase setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Execute the complete contents of `database/schema.sql`.
4. Configure `backend/.env` with the project URL and service-role key.
5. Run the seed command:

```powershell
Set-Location backend
npm install
npm run db:seed
```

The seed uses valid database-generated UUIDs and upserts by unique email/name. It is safe to run again without uncontrolled duplicate accounts or charities.

## Local startup

Backend:

```powershell
Set-Location backend
npm install
npm run dev
```

Frontend, in a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

The API runs on `http://localhost:4000` and Vite normally runs on `http://localhost:5173`.

## Demo credentials

The default seed credentials are:

- Admin: `admin@digitalheroes.com` / `Admin123!`
- Subscriber: `demo@digitalheroes.com` / `Demo123!`

Change them through environment variables before seeding a production project.

## Database model

The schema creates `charities`, `users`, `subscriptions`, `scores`, `draws`, `winners`, and `payouts` with UUID primary keys and foreign keys. Score dates are unique per user and scores are constrained to 1-45. Subscription status supports `active`, `past_due`, `cancelled`, `expired`, `incomplete`, and `inactive`.

It also creates `donations` for independent charity gifts. Subscription-derived charity contributions and independent donation totals are included in admin reports.

The trusted backend uses the Supabase service-role client. Authorization remains in Express through `requireAuth` and `requireAdmin`; the service-role key is never sent to the browser. RLS is intentionally not used as the application authorization boundary because the backend uses custom JWTs and service-role access.

## API behavior

The existing frontend API response shapes are preserved, including camelCase fields such as `charityId`, `upcomingEvents`, `renewalDate`, and `proofUrl`. Database errors are logged server-side and return generic API messages without credentials, SQL details, stack traces, or password hashes.

`GET /api/health` reports API status and performs a lightweight Supabase connectivity check. It returns `503` when credentials are missing or the database cannot be reached.

Scores enforce validation in both application code and PostgreSQL. A new score is inserted, then the oldest records beyond the newest five are removed. Signup creates an inactive subscription record; the existing demo subscription endpoint activates monthly or yearly plans.

Subscriber-only score and participation routes enforce active subscription status server-side. Draw simulation supports random and score-frequency-weighted algorithmic modes. Publishing compares each active subscriber's latest five Stableford values against the five winning numbers, splits 5/4/3 tier prizes equally, and carries an unclaimed five-match tier into the next draw.

Draw simulation and publishing persist their JSON result metadata. Prize tiers are 40% for five matches, 35% for four, and 25% for three; winners and payout state are stored in relational tables. Winner proof, approval, rejection, and paid transitions are database updates. No money transfer is performed by this application.

## Tests and checks

```powershell
Set-Location backend
npm test -- --runInBand

Set-Location ../frontend
npm run build
npm run lint
```

The authentication integration tests run when Supabase credentials are available. Without credentials, they are skipped and a health test verifies the server refuses to use local persistence. Pure score, charity, draw, and prize rules always run locally.

## Deployment

Frontend deployment targets such as Vercel need `VITE_API_BASE_URL` pointing to the deployed backend. The backend deployment needs all variables from `backend/.env.example`, especially `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and `FRONTEND_URL`.

After creating the Supabase project, running the schema and seed, and adding deployment environment variables, no source edits are required. Deploy the backend as a Node service and the frontend as a Vite static build.

## Stripe status

Stripe configuration is environment-based, but checkout and webhook endpoints intentionally return an explicit not-configured/not-enabled response until a real Stripe integration is connected. The database already has Stripe customer, subscription, and price ID fields so webhook synchronization can be added without another schema migration. No fake checkout URL or payment transfer is claimed.

Winner proof is currently submitted as a URL. Production deployment should connect that URL to Supabase Storage or another controlled upload service; the verification and payout state workflow is already persisted and protected by ownership/admin checks.

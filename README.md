# CodexAPI

## Overview
CodexAPI is a serverless CRM built on Next.js 14 App Router. It integrates Auth.js for authentication, Prisma ORM with a Neon Postgres backend, Vercel Blob for file storage, and Upstash Redis for caching and rate limiting.

## Features
- Multi-tenant organizations
- Contact, company, and deal management
- Pipeline and activity tracking
- File uploads to Vercel Blob
- Auth.js authentication with email and OAuth providers
- Redis-powered rate limiting and caching
- Fully typed API with Zod validation

## Stack
- **Framework:** Next.js 14 App Router & TypeScript
- **UI:** Tailwind CSS & shadcn/ui
- **ORM:** Prisma
- **Database:** Neon Postgres
- **File Storage:** Vercel Blob
- **Authentication:** Auth.js with Prisma adapter
- **Cache & Rate Limiting:** Upstash Redis
- **Testing:** Vitest & Playwright

## Architecture
```
Client (Next.js App Router)
        |
        v
API routes & Server Actions
        |
        +-- Prisma ORM --> Neon Postgres
        +-- Vercel Blob for file uploads
        +-- Upstash Redis for cache/ratelimiting
```

## Folder structure
```
src/
  app/            # App Router routes and API endpoints
  components/     # Reusable React components
  lib/            # Utilities, auth helpers, validators
prisma/           # Prisma schema, migrations, and seed script
e2e/              # Playwright tests
tests/            # Vitest unit tests
```

## Setup
```bash
git clone <repository-url>
cd CodexAPI
npm install
```

## Env vars
Copy `.env.example` to `.env` and fill in the values:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="465"
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"
RESEND_API_KEY=""
RESEND_FROM=""
VERCEL_BLOB_READ_WRITE_TOKEN=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

## DB & Prisma
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (creates migrations if none exist)
npx prisma migrate dev
```
Connect the `DATABASE_URL` to a Neon Postgres instance.

## Run/Build/Test scripts
```bash
# Start development server
npm run dev

# Lint the codebase
npm run lint

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm run start
```

## Seeding
```bash
npx prisma db seed
```
Seeds sample data defined in `prisma/seed.ts`.

## Deployment
1. Push the repository to GitHub.
2. Create a Neon database and set `DATABASE_URL`.
3. Create a Vercel project and link the repo.
4. Configure environment variables on Vercel (Auth.js secrets, Vercel Blob token, Upstash Redis credentials).
5. Deploy via the Vercel dashboard or CLI.

## Security
- Secrets are stored in environment variables.
- All requests validated with Zod schemas.
- Rate limiting and caching with Upstash Redis.
- Authentication handled by Auth.js using secure cookies.

## RBAC
The system uses role-based access control with the following roles:
- `OWNER`
- `ADMIN`
- `REP`

Permissions are enforced in API routes and server actions based on membership role.

## API overview
All endpoints live under `/api` and require authentication unless noted.
```bash
# Example: list companies
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/companies

# Example: create a deal
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"title":"New deal"}' \
     http://localhost:3000/api/deals
```

## Troubleshooting
- Ensure Node.js 18+ is installed.
- Verify all environment variables are set.
- If migrations fail, check the `DATABASE_URL` and run `npx prisma migrate reset`.
- Missing dependencies? Run `npm install`.

## License
MIT License

# serverless-crm

Base Next.js 14 project scaffolded with Tailwind CSS, shadcn/ui, Prisma, and other utilities.

## Environment Variables

The application relies on several environment variables. Copy `.env.example` to `.env` and provide values for:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` (or `RESEND_API_KEY` / `RESEND_FROM`)
- `VERCEL_BLOB_READ_WRITE_TOKEN`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

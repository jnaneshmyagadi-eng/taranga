# TARANGA

**India Creates. World Connects.** Watch. Create. Belong.

India-first video + community platform with Danmu realtime, signed private video storage, communities, and creator studio.

## Stack

- Next.js 16 + TypeScript + Tailwind CSS 4
- Supabase (Auth, Postgres RLS, Realtime, Storage + signed URLs)

## Setup

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY (server only), NEXT_PUBLIC_APP_URL
# Apply supabase/schema.sql then migrations in order
npm run dev
```

Demo fallback is gated by `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK` (keep off in production).

## License

Proprietary

# Cards4Couples — card games for two, made for closeness

A card-game night for two that pulls you off your phones and toward each
other: clear rules, shared scoreboards, and (soon) streaks and badges for
couples. Next.js (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres, Auth, Realtime, RLS).

> The repo folder is still `deuce/` from the original working name; only
> the branding changed.

Branding (name, tagline, logo glyph) lives in `src/config/brand.ts`; colors
live in the `@theme` block of `src/app/globals.css`.

## Local setup

Prerequisites: Node.js 20.9+ (24 LTS recommended), a free
[Supabase](https://supabase.com) account.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [database.new](https://database.new).
   Choose any name/region; save the database password somewhere safe.

3. **Configure env vars**

   ```bash
   cp .env.example .env.local
   ```

   Fill in from your Supabase project's **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` — the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` public key
   - `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` key (server-only;
     never commit, never expose to the client)

4. **Run migrations** (Supabase CLI is a dev dependency, use it via `npx`):

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   The project ref is in your Supabase dashboard URL:
   `https://supabase.com/dashboard/project/<project-ref>`.

   All schema changes are versioned SQL files in `supabase/migrations/` —
   never run ad-hoc DDL against production.

5. **Enable auth providers** in the Supabase dashboard:
   - **Authentication → Providers → Email**: enabled by default.
   - **Authentication → Providers → Google**: add your Google OAuth client
     ID/secret (create one in Google Cloud Console → Credentials; authorized
     redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`).
   - **Authentication → URL Configuration**: set Site URL to
     `http://localhost:3000` for now (your production domain later) and add
     `http://localhost:3000/auth/callback` to Redirect URLs.

6. **Run the app**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Promote your admin account

1. Sign up in the app with your email.
2. Open `scripts/promote-admin.sql`, replace `YOUR_EMAIL_HERE@example.com`
   with that email.
3. Run it once, either in the Supabase dashboard **SQL Editor** (paste →
   Run) or via CLI:

   ```bash
   npx supabase db execute --file scripts/promote-admin.sql
   ```

## Scripts

| Command                | What it does             |
| ---------------------- | ------------------------ |
| `npm run dev`          | Dev server (Turbopack)   |
| `npm run build`        | Production build         |
| `npm run start`        | Serve production build   |
| `npm run lint`         | ESLint                   |
| `npm run format`       | Prettier write           |
| `npx supabase db push` | Apply pending migrations |

## Project layout

```
src/
  app/            # routes (App Router)
  components/     # UI components
  config/brand.ts # all branding in one place
  lib/
    queries/      # ALL Supabase queries live here — no DB calls from components
    supabase/     # client factories (browser / server / public), env guards
    types/        # database types
  proxy.ts        # session refresh + authed-route gating (Next 16 proxy)
supabase/
  migrations/     # versioned SQL migrations (schema + RLS)
scripts/          # one-off operational SQL (admin promotion)
```

## Security model

Authorization is enforced by Postgres Row Level Security — the UI checks are
convenience only. Published games and app settings are publicly readable;
drafts, sessions, profiles, couples, and feedback are gated by ownership,
couple membership, or the admin role. The service-role key is never used in
client code.

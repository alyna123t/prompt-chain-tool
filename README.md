# Prompt Chain Tool

A superadmin-only tool for building and running multi-step AI **prompt chains**.
Create a chain, add ordered steps, reorder them, then run the chain on an input
(text and/or an image) — step 1 receives your input, and each later step receives
the previous step's output. Every run is saved as "generated media" you can browse.

Example chain:

1. Take in an image and describe it in text.
2. Take the output of step 1 and say something funny about it.
3. Take the output of step 2 and write five short, funny captions.

Built with **Next.js 16 (App Router) · Supabase (SSR auth + Postgres + RLS) ·
Tailwind v4 · TypeScript · the Anthropic Claude API** — matching the stack of the
companion `hello_world` (public) and `vibes-admin` (admin) apps.

## What it does

- Google sign-in; access restricted to `profiles.is_superadmin == true`
- Create / update / delete prompt chains
- Create / update / delete prompt chain steps
- Reorder steps (move step 2 to step 1, etc.) with ↑/↓ controls
- Generate media by running the whole chain (real Claude calls, or a labeled mock
  fallback when no API key is configured)
- View the media produced by a specific chain, and a global gallery of all runs
- Dark / Light / System-default theme toggle

Access is enforced in four layers: the `proxy.ts` login wall, the app layout's
superadmin check, an `assertSuperadmin()` call inside every mutating server action,
and Supabase Row Level Security that only lets superadmins read or write the tables.

## Local setup

1. **Install deps**

   ```bash
   npm install
   ```

2. **Run the database migration.** In the Supabase project you share with the other
   apps, open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). It
   is idempotent and only adds things: the `prompt_chains`, `prompt_chain_steps` and
   `generated_media` tables, superadmin-only RLS policies, and (if missing) the
   `profiles.is_superadmin` column + `is_superadmin()` helper. It also grants
   superadmin to `alynatakahashi2006@gmail.com` — edit that line if needed. Your
   account must have signed into one of the apps once so its `profiles` row exists.

3. **Environment variables.** Copy `.env.local.example` to `.env.local` and fill in
   the **same** Supabase values as the other apps:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ANTHROPIC_API_KEY=sk-ant-...   # optional — enables real generation
   ```

   Without `ANTHROPIC_API_KEY` the app still works but produces clearly-labeled
   mock output. Override the model with `ANTHROPIC_MODEL` (default `claude-opus-5-5`).

4. **Google OAuth redirect.** In Supabase → Authentication → URL Configuration, make
   sure your site URL and `.../auth/callback` are allowed for both `localhost:3000`
   and your deployed domain. (Same Google provider the other apps use.)

5. **Run it**

   ```bash
   npm run dev
   ```

## Deploy to Vercel

See the step-by-step guide your assistant provides, or in short:

1. Push to GitHub (`origin` is already `github.com/alyna123t/prompt-chain-tool`).
2. `vercel` → link/create the project.
3. Add the env vars above in the Vercel project settings.
4. Set **Settings → Deployment Protection → Vercel Authentication = Disabled** so the
   page is viewable in Incognito.
5. `vercel --prod` and submit the commit-specific deployment URL.

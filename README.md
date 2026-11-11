# Prep Line

The **content kitchen** for the Restaurant Vibes app. A superadmin-only tool for
building and running multi-step AI **recipes** that turn a dish photo or a few words
into ready-to-use restaurant content — menu descriptions, social captions, specials
blurbs, and more.

Create a recipe, add ordered steps, reorder them, then **cook** it on your
ingredients (text and/or a dish photo) — step 1 receives your ingredients, and each
later step receives the previous step's output. Every run is plated as a **dish** you
can browse.

Example recipe — *dish photo → menu copy → captions*:

1. Describe this dish photo in one vivid, appetizing sentence.
2. Turn that description into a polished two-sentence menu description, no clichés.
3. Spin the menu description into five short, punchy social captions.

Under the hood these are still generic prompt chains, so the same recipe pattern
works for anything the restaurant app needs.

Built with **Next.js 16 (App Router) · Supabase (SSR auth + Postgres + RLS) ·
Tailwind v4 · TypeScript · the Anthropic Claude API** — and it shares the same
Supabase project (the same Google login and `profiles.is_superadmin` flag) as the
companion `hello_world` (public) and `vibes-admin` (admin) apps.

## What it does

- Google sign-in; access restricted to `profiles.is_superadmin == true`
- Create / update / delete recipes (stored in the `prompt_chains` table)
- Create / update / delete recipe steps
- Reorder steps (move step 2 to step 1, etc.) with ↑/↓ controls
- Cook a recipe end-to-end (real Claude calls, or a labeled mock fallback when no API
  key is configured)
- Browse the dishes plated by a specific recipe, and a global gallery of every dish
- Dark / Light / System-default theme toggle

> **Naming note:** "Recipe" and "dish" are the user-facing names for what the database
> still calls `prompt_chains` and `generated_media`. The tables are shared with the
> other apps, so the rebrand is presentation-only — no schema changes.

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

-- =============================================================================
-- Prompt Chain Tool migration — run this ONCE in Supabase > SQL Editor.
--
-- Safe to run against the SAME project as the existing apps (hello_world /
-- vibes-admin): it only ADDS things and is idempotent. It:
--   1. Ensures profiles.is_superadmin and the is_superadmin() helper exist
--      (no-ops if the vibes-admin migration already created them).
--   2. Creates the prompt_chains / prompt_chain_steps / generated_media tables.
--   3. Locks them down with RLS so ONLY superadmins can read or write them.
--   4. Bootstraps the first superadmin (bottom of file).
-- =============================================================================

-- 1. The flag + helper --------------------------------------------------------
alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- 2. Tables -------------------------------------------------------------------
create table if not exists public.prompt_chains (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id          uuid primary key default gen_random_uuid(),
  chain_id    uuid not null references public.prompt_chains (id) on delete cascade,
  position    integer not null,
  name        text not null,
  prompt      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (chain_id, position) deferrable initially deferred
);

create index if not exists prompt_chain_steps_chain_id_idx
  on public.prompt_chain_steps (chain_id, position);

create table if not exists public.generated_media (
  id              uuid primary key default gen_random_uuid(),
  chain_id        uuid not null references public.prompt_chains (id) on delete cascade,
  created_by      uuid references auth.users (id) on delete set null,
  input_type      text not null default 'text' check (input_type in ('text', 'image')),
  input_text      text,
  input_image_url text,
  steps           jsonb not null default '[]'::jsonb,
  final_output    text not null default '',
  used_mock       boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists generated_media_chain_id_idx
  on public.generated_media (chain_id, created_at desc);

-- 3. Row Level Security: superadmins only ------------------------------------
alter table public.prompt_chains       enable row level security;
alter table public.prompt_chain_steps  enable row level security;
alter table public.generated_media     enable row level security;

-- prompt_chains
drop policy if exists "Superadmins manage prompt_chains" on public.prompt_chains;
create policy "Superadmins manage prompt_chains"
  on public.prompt_chains for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- prompt_chain_steps
drop policy if exists "Superadmins manage prompt_chain_steps" on public.prompt_chain_steps;
create policy "Superadmins manage prompt_chain_steps"
  on public.prompt_chain_steps for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- generated_media
drop policy if exists "Superadmins manage generated_media" on public.generated_media;
create policy "Superadmins manage generated_media"
  on public.generated_media for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- app_settings: a single-row table holding the Anthropic API key + model, so the
-- key can be set from the in-app Settings page instead of a Vercel env var. It is
-- superadmin-only via RLS and is only ever read server-side (never sent to the
-- browser — the Settings page shows a masked preview).
create table if not exists public.app_settings (
  id                integer primary key default 1,
  anthropic_api_key text,
  anthropic_model   text,
  updated_at        timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

alter table public.app_settings enable row level security;

drop policy if exists "Superadmins manage app_settings" on public.app_settings;
create policy "Superadmins manage app_settings"
  on public.app_settings for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- keep updated_at fresh -------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompt_chains_touch on public.prompt_chains;
create trigger prompt_chains_touch
  before update on public.prompt_chains
  for each row execute function public.touch_updated_at();

drop trigger if exists prompt_chain_steps_touch on public.prompt_chain_steps;
create trigger prompt_chain_steps_touch
  before update on public.prompt_chain_steps
  for each row execute function public.touch_updated_at();

-- 4. Bootstrap the first superadmin ------------------------------------------
-- The UI requires is_superadmin = true, but nobody can grant it through the
-- locked UI. We grant it here, outside the app, via direct DB access. The
-- account must have signed in at least once so its profiles row exists.
update public.profiles
  set is_superadmin = true
  where email = 'alynatakahashi2006@gmail.com';

-- Sanity check — should list your row:
-- select id, email, is_superadmin from public.profiles where is_superadmin;

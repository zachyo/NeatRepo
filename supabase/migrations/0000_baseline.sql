-- NeatRepo baseline schema (reconstructed from application code).
--
-- This documents the tables the app uses: users, repositories, folders,
-- folder_repos. It should already match your live database; it is written
-- with IF NOT EXISTS so it is harmless to run, and lets a fresh project be
-- created from scratch. Compare against the live schema
-- (Supabase → Database → Tables) and adjust if anything differs.
--
-- Includes the former supabase_phase2_migration.sql (is_pinned, is_favorite,
-- github_access_token, users.is_public).

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  github_id bigint unique not null,
  username text not null,
  email text,
  avatar_url text,
  github_access_token text, -- AES-256-GCM encrypted (see lib/crypto.ts)
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  github_repo_id bigint not null,
  name text not null,
  full_name text not null,
  description text,
  url text not null,
  private boolean not null default false,
  language text,
  stars integer not null default 0,
  forks integer not null default 0,
  is_favorite boolean not null default false,
  updated_at timestamptz,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  icon text default '📁',
  is_pinned boolean not null default false,
  last_opened timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.folder_repos (
  folder_id uuid not null references public.folders(id) on delete cascade,
  repo_id uuid not null references public.repositories(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (folder_id, repo_id)
);

-- Former supabase_phase2_migration.sql
alter table public.folders add column if not exists is_pinned boolean not null default false;
alter table public.repositories add column if not exists is_favorite boolean not null default false;
alter table public.users add column if not exists github_access_token text;
alter table public.users add column if not exists is_public boolean not null default false;

-- The app talks to the database only with the server-side secret key, which
-- bypasses RLS. Enable RLS with no policies so the publishable/anon key
-- cannot read these tables directly.
alter table public.users enable row level security;
alter table public.repositories enable row level security;
alter table public.folders enable row level security;
alter table public.folder_repos enable row level security;

-- Certavo — core content + scoring schema.
-- Hierarchy: themes -> packs -> questions. Adding a category = inserting data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null,                       -- { pt, en, es }
  icon text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists packs (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid references themes(id) on delete cascade,
  slug text not null,
  name jsonb not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (theme_id, slug)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,                    -- stable id from the generators
  pack_id uuid references packs(id) on delete cascade,
  media_type text not null default 'none',    -- none|flag|image|emoji
  media_value text,
  prompt jsonb not null,                       -- { pt, en, es }
  options jsonb not null,                      -- { pt:[4], en:[4], es:[4] }
  option_media jsonb,                          -- optional per-option media
  correct_index int not null check (correct_index between 0 and 3),
  difficulty int not null default 1,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Players (optional — the game runs without login)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Scores / ranking
-- ---------------------------------------------------------------------------
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- null = anon
  anon_id text,
  mode text not null,                          -- daily|time_attack|sudden_death
  theme_slug text,
  challenge_date date,
  score int not null,
  streak int,
  details jsonb,                               -- answers, for validation/grid
  created_at timestamptz default now()
);

create index if not exists scores_mode_date_idx on scores (mode, challenge_date);
create index if not exists scores_mode_theme_idx on scores (mode, theme_slug, created_at);

-- One daily submission per anonymous player.
create unique index if not exists scores_daily_anon_uniq
  on scores (anon_id, challenge_date)
  where mode = 'daily' and anon_id is not null;

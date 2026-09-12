-- Optional backend schema for Pipkin (Supabase / Postgres).
-- The app runs fully offline without this; apply it to enable sign-in, sync and real friends.

create table if not exists public.user_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_backups enable row level security;
create policy "own backup" on public.user_backups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  friend_code text unique not null,
  display_name text not null,
  pet_name text not null,
  species text not null,
  level int not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.public_profiles enable row level security;
create policy "profiles are readable" on public.public_profiles for select using (true);
create policy "edit own profile" on public.public_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.encouragements (
  id bigint generated always as identity primary key,
  from_user uuid default auth.uid(),
  to_code text not null,
  message text not null,
  kind text not null default 'message',
  created_at timestamptz not null default now()
);
alter table public.encouragements enable row level security;
create policy "send encouragement" on public.encouragements for insert with check (auth.uid() = from_user);
create policy "read mine" on public.encouragements for select using (
  to_code in (select friend_code from public.public_profiles where user_id = auth.uid())
);

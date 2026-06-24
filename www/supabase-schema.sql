create extension if not exists pgcrypto;

create table if not exists public.vegetable_merge_scores (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null default '匿名玩家',
  score integer not null check (score >= 0),
  best_combo integer not null default 0 check (best_combo >= 0),
  best_level integer not null default 1 check (best_level between 1 and 10),
  created_at timestamptz not null default now()
);

create index if not exists vegetable_merge_scores_score_idx
  on public.vegetable_merge_scores (score desc, created_at asc);

create index if not exists vegetable_merge_scores_combo_idx
  on public.vegetable_merge_scores (best_combo desc, score desc, created_at asc);

alter table public.vegetable_merge_scores enable row level security;

drop policy if exists "Anyone can read vegetable leaderboard" on public.vegetable_merge_scores;
create policy "Anyone can read vegetable leaderboard"
  on public.vegetable_merge_scores
  for select
  using (true);

drop policy if exists "Anyone can submit vegetable scores" on public.vegetable_merge_scores;
create policy "Anyone can submit vegetable scores"
  on public.vegetable_merge_scores
  for insert
  with check (
    score >= 0
    and best_combo >= 0
    and best_level between 1 and 10
    and length(player_name) between 1 and 40
  );

create table if not exists public.vegetable_encyclopedia_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 0 and 9),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, level)
);

create index if not exists vegetable_encyclopedia_unlocks_user_level_idx
  on public.vegetable_encyclopedia_unlocks (user_id, level);

alter table public.vegetable_encyclopedia_unlocks enable row level security;

grant select, insert on public.vegetable_encyclopedia_unlocks to authenticated;

drop policy if exists "Players can read their encyclopedia unlocks" on public.vegetable_encyclopedia_unlocks;
create policy "Players can read their encyclopedia unlocks"
  on public.vegetable_encyclopedia_unlocks
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can save their encyclopedia unlocks" on public.vegetable_encyclopedia_unlocks;
create policy "Players can save their encyclopedia unlocks"
  on public.vegetable_encyclopedia_unlocks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create table if not exists public.vegetable_player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  owned_talents text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.vegetable_player_progress enable row level security;

grant select, insert, update on public.vegetable_player_progress to authenticated;

drop policy if exists "Players can read their progress" on public.vegetable_player_progress;
create policy "Players can read their progress"
  on public.vegetable_player_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can insert their progress" on public.vegetable_player_progress;
create policy "Players can insert their progress"
  on public.vegetable_player_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Players can update their progress" on public.vegetable_player_progress;
create policy "Players can update their progress"
  on public.vegetable_player_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

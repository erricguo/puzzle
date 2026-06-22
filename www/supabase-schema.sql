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

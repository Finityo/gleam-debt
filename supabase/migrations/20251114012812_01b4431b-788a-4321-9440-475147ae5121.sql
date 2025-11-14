-- Table: coach_chat_messages (simple history log)
create table if not exists public.coach_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'coach')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists coach_chat_messages_user_created_idx
  on public.coach_chat_messages (user_id, created_at desc);

-- RLS for coach_chat_messages
alter table public.coach_chat_messages enable row level security;

create policy "Users can view their own chat messages"
  on public.coach_chat_messages
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.coach_chat_messages
  for insert
  with check (auth.uid() = user_id);


-- Table: score_history (financial health score snapshots)
create table if not exists public.score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score numeric not null check (score >= 0 and score <= 100),
  label text,
  created_at timestamptz not null default now()
);

create index if not exists score_history_user_created_idx
  on public.score_history (user_id, created_at desc);

-- RLS for score_history
alter table public.score_history enable row level security;

create policy "Users can view their own score history"
  on public.score_history
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own score history"
  on public.score_history
  for insert
  with check (auth.uid() = user_id);


-- Table: share_cards (metadata for social share cards)
create table if not exists public.share_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null check (card_type in ('streak', 'milestone', 'goal', 'generic')),
  title text not null,
  subtitle text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists share_cards_user_created_idx
  on public.share_cards (user_id, created_at desc);

-- RLS for share_cards
alter table public.share_cards enable row level security;

create policy "Users can view their own share cards"
  on public.share_cards
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own share cards"
  on public.share_cards
  for insert
  with check (auth.uid() = user_id);
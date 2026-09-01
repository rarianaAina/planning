-- =====================================================================
--  Planning A/B — schéma Supabase
--  À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Réglages de l'utilisateur
--    anchor_monday : le lundi d'une semaine de référence
--    anchor_week_type : le type (A ou B) de cette semaine de référence
--    Toutes les autres semaines en découlent par alternance.
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  anchor_monday     date not null default (date_trunc('week', now())::date),
  anchor_week_type  text not null default 'A' check (anchor_week_type in ('A', 'B')),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Modèle récurrent : les créneaux de la semaine A et de la semaine B
--    weekday : 1 = lundi ... 7 = dimanche (norme ISO)
-- ---------------------------------------------------------------------
create table if not exists public.template_slots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  week_type   text not null check (week_type in ('A', 'B')),
  weekday     smallint not null check (weekday between 1 and 7),
  start_time  time not null,
  end_time    time not null,
  title       text not null check (length(btrim(title)) > 0),
  location    text,
  color       text not null default 'indigo',
  created_at  timestamptz not null default now(),
  constraint template_slots_time_order check (end_time > start_time)
);

create index if not exists template_slots_lookup_idx
  on public.template_slots (user_id, week_type, weekday, start_time);

-- ---------------------------------------------------------------------
-- 3. Jours personnalisés
--    Si une ligne existe pour une date, le modèle A/B est ignoré ce
--    jour-là et seuls les override_slots rattachés sont affichés.
--    (Un jour personnalisé sans créneau = journée vide, volontairement.)
-- ---------------------------------------------------------------------
create table if not exists public.day_overrides (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  created_at  timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists day_overrides_range_idx
  on public.day_overrides (user_id, day);

create table if not exists public.override_slots (
  id           uuid primary key default gen_random_uuid(),
  override_id  uuid not null references public.day_overrides (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  start_time   time not null,
  end_time     time not null,
  title        text not null check (length(btrim(title)) > 0),
  location     text,
  color        text not null default 'indigo',
  created_at   timestamptz not null default now(),
  constraint override_slots_time_order check (end_time > start_time)
);

create index if not exists override_slots_parent_idx
  on public.override_slots (override_id, start_time);

-- ---------------------------------------------------------------------
-- 4. Row Level Security : chacun ne voit que ses propres données
-- ---------------------------------------------------------------------
alter table public.settings        enable row level security;
alter table public.template_slots  enable row level security;
alter table public.day_overrides   enable row level security;
alter table public.override_slots  enable row level security;

drop policy if exists "settings_own" on public.settings;
create policy "settings_own" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "template_slots_own" on public.template_slots;
create policy "template_slots_own" on public.template_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "day_overrides_own" on public.day_overrides;
create policy "day_overrides_own" on public.day_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "override_slots_own" on public.override_slots;
create policy "override_slots_own" on public.override_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. Création automatique des réglages à l'inscription
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

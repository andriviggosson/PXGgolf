-- PXG Golf - Supabase Schema
-- Líma þetta inn í Supabase Dashboard → SQL Editor

-- Kylfur tafla
create table public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  tagline text default '',
  description text default '',
  price integer not null default 0,
  image_url text default '',
  specs jsonb default '{}',
  featured boolean default false,
  in_stock boolean default true,
  created_at timestamptz default now()
);

-- Flokkar tafla
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text default '',
  image_url text default '',
  created_at timestamptz default now()
);

-- Setja inn grunn flokka
insert into public.categories (name, slug, description) values
  ('Driver', 'driver', 'Lengd og nákvæmni'),
  ('Járn', 'iron', 'Nákvæmni í hverri högg'),
  ('Wedge', 'wedge', 'Meistaraleikur í stuttu leiknum'),
  ('Putter', 'putter', 'Sigurinn á putting green'),
  ('Fairway Wood', 'fairway', 'Fjarlægð frá fairway'),
  ('Hybrid', 'hybrid', 'Besta af báðum heimum');

-- RLS (Row Level Security)
alter table public.clubs enable row level security;
alter table public.categories enable row level security;

-- Allir geta lesið
create policy "Allir geta lesið kylfur"
  on public.clubs for select using (true);

create policy "Allir geta lesið flokka"
  on public.categories for select using (true);

-- Aðeins innskráðir geta breytt
create policy "Admin getur bætt við kylfum"
  on public.clubs for insert with check (auth.role() = 'authenticated');

create policy "Admin getur breytt kylfum"
  on public.clubs for update using (auth.role() = 'authenticated');

create policy "Admin getur eytt kylfum"
  on public.clubs for delete using (auth.role() = 'authenticated');

create policy "Admin getur breytt flokkum"
  on public.categories for all using (auth.role() = 'authenticated');

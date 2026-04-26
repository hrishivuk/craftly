create table if not exists public.artisan_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  slug text not null unique,
  display_name text not null,
  bio text,
  story text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisan_profiles(id) on delete cascade,
  title text not null,
  description text,
  price_hint text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisan_profiles(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  occasion text,
  budget_range text,
  details text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.artisan_profiles enable row level security;
alter table public.products enable row level security;
alter table public.custom_requests enable row level security;

drop policy if exists "Artisan profiles are readable by everyone" on public.artisan_profiles;
create policy "Artisan profiles are readable by everyone"
  on public.artisan_profiles
  for select
  using (true);

drop policy if exists "Artisans can upsert own profile" on public.artisan_profiles;
create policy "Artisans can upsert own profile"
  on public.artisan_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
  on public.products
  for select
  using (true);

drop policy if exists "Artisans can manage own products" on public.products;
create policy "Artisans can manage own products"
  on public.products
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.artisan_profiles ap
      where ap.id = products.artisan_id
        and ap.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.artisan_profiles ap
      where ap.id = products.artisan_id
        and ap.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can create custom request" on public.custom_requests;
create policy "Anyone can create custom request"
  on public.custom_requests
  for insert
  with check (true);

drop policy if exists "Artisans can read own custom requests" on public.custom_requests;
create policy "Artisans can read own custom requests"
  on public.custom_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.artisan_profiles ap
      where ap.id = custom_requests.artisan_id
        and ap.user_id = auth.uid()
    )
  );

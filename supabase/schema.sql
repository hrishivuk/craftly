create table if not exists public.artisan_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  slug text not null unique,
  display_name text not null,
  bio text,
  story text,
  avatar_url text,
  hero_headline text,
  hero_subline text,
  trust_note text,
  featured_message text,
  storefront_tone text,
  shop_avatar_url text,
  shop_banner_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now()
);

alter table public.artisan_profiles add column if not exists hero_headline text;
alter table public.artisan_profiles add column if not exists hero_subline text;
alter table public.artisan_profiles add column if not exists trust_note text;
alter table public.artisan_profiles add column if not exists featured_message text;
alter table public.artisan_profiles add column if not exists storefront_tone text;
alter table public.artisan_profiles add column if not exists shop_avatar_url text;
alter table public.artisan_profiles add column if not exists shop_banner_url text;
alter table public.artisan_profiles add column if not exists primary_color text;
alter table public.artisan_profiles add column if not exists secondary_color text;

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

insert into storage.buckets (id, name, public)
values ('storefront-media', 'storefront-media', true)
on conflict (id) do nothing;

drop policy if exists "Storefront media is public readable" on storage.objects;
create policy "Storefront media is public readable"
  on storage.objects
  for select
  using (bucket_id = 'storefront-media');

drop policy if exists "Authenticated users can upload storefront media" on storage.objects;
create policy "Authenticated users can upload storefront media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'storefront-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users can update own storefront media" on storage.objects;
create policy "Authenticated users can update own storefront media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'storefront-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'storefront-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users can delete own storefront media" on storage.objects;
create policy "Authenticated users can delete own storefront media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'storefront-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

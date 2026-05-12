create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  slug text not null unique,
  name text not null,
  description text,
  hero_headline text,
  hero_subline text,
  trust_note text,
  featured_message text,
  storefront_tone text,
  shop_avatar_url text,
  shop_banner_url text,
  primary_color text,
  secondary_color text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.shops add column if not exists hero_headline text;
alter table public.shops add column if not exists hero_subline text;
alter table public.shops add column if not exists trust_note text;
alter table public.shops add column if not exists featured_message text;
alter table public.shops add column if not exists storefront_tone text;
alter table public.shops add column if not exists shop_avatar_url text;
alter table public.shops add column if not exists shop_banner_url text;
alter table public.shops add column if not exists primary_color text;
alter table public.shops add column if not exists secondary_color text;
alter table public.shops add column if not exists onboarding_completed boolean not null default false;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'artisan_profiles'
  ) then
    insert into public.shops (
      id,
      user_id,
      slug,
      name,
      description,
      hero_headline,
      hero_subline,
      trust_note,
      featured_message,
      storefront_tone,
      shop_avatar_url,
      shop_banner_url,
      primary_color,
      secondary_color,
      onboarding_completed,
      created_at
    )
    select
      ap.id,
      ap.user_id,
      ap.slug,
      ap.display_name,
      coalesce(ap.bio, ap.story),
      ap.hero_headline,
      ap.hero_subline,
      ap.trust_note,
      ap.featured_message,
      ap.storefront_tone,
      ap.shop_avatar_url,
      ap.shop_banner_url,
      ap.primary_color,
      ap.secondary_color,
      (
        ap.slug is not null
        and ap.display_name is not null
        and ap.shop_banner_url is not null
        and length(trim(coalesce(ap.bio, ap.story, ''))) > 0
      ),
      ap.created_at
    from public.artisan_profiles ap
    on conflict (user_id) do update
      set slug = excluded.slug,
          name = excluded.name,
          description = excluded.description,
          hero_headline = excluded.hero_headline,
          hero_subline = excluded.hero_subline,
          trust_note = excluded.trust_note,
          featured_message = excluded.featured_message,
          storefront_tone = excluded.storefront_tone,
          shop_avatar_url = excluded.shop_avatar_url,
          shop_banner_url = excluded.shop_banner_url,
          primary_color = excluded.primary_color,
          secondary_color = excluded.secondary_color;
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  description text,
  price_hint text,
  shipping_note text,
  support_note text,
  detail_points text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_url text,
  image_urls text[] not null default '{}',
  thumbnail_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists shop_id uuid;
alter table public.products add column if not exists image_urls text[] not null default '{}';
alter table public.products add column if not exists thumbnail_index integer not null default 0;
alter table public.products add column if not exists shipping_note text;
alter table public.products add column if not exists support_note text;
alter table public.products add column if not exists detail_points text[] not null default '{}';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'artisan_id'
  ) then
    update public.products
    set shop_id = artisan_id
    where shop_id is null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_shop_id_fkey'
  ) then
    alter table public.products
      add constraint products_shop_id_fkey
      foreign key (shop_id) references public.shops(id) on delete cascade;
  end if;
end $$;

drop policy if exists "Artisans can manage own products" on public.products;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'products_artisan_id_fkey'
  ) then
    alter table public.products drop constraint products_artisan_id_fkey;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'shop_id'
  ) and not exists (
    select 1 from public.products where shop_id is null
  ) then
    alter table public.products alter column shop_id set not null;
  end if;
end $$;

alter table public.products drop column if exists artisan_id;

create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null,
  occasion text,
  budget_range text,
  details text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.custom_requests add column if not exists shop_id uuid;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'custom_requests' and column_name = 'artisan_id'
  ) then
    update public.custom_requests
    set shop_id = artisan_id
    where shop_id is null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'custom_requests_shop_id_fkey'
  ) then
    alter table public.custom_requests
      add constraint custom_requests_shop_id_fkey
      foreign key (shop_id) references public.shops(id) on delete cascade;
  end if;
end $$;

drop policy if exists "Artisans can read own custom requests" on public.custom_requests;
drop policy if exists "Artisans can update own custom requests" on public.custom_requests;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'custom_requests_artisan_id_fkey'
  ) then
    alter table public.custom_requests drop constraint custom_requests_artisan_id_fkey;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'custom_requests' and column_name = 'shop_id'
  ) and not exists (
    select 1 from public.custom_requests where shop_id is null
  ) then
    alter table public.custom_requests alter column shop_id set not null;
  end if;
end $$;

alter table public.custom_requests drop column if exists artisan_id;
drop table if exists public.artisan_profiles;

alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.custom_requests enable row level security;

drop policy if exists "Shops are readable by everyone" on public.shops;
create policy "Shops are readable by everyone"
  on public.shops
  for select
  using (true);

drop policy if exists "Owners can manage own shops" on public.shops;
create policy "Owners can manage own shops"
  on public.shops
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
  on public.products
  for select
  using (true);

drop policy if exists "Shop owners can manage own products" on public.products;
create policy "Shop owners can manage own products"
  on public.products
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = products.shop_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = products.shop_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can create custom request" on public.custom_requests;
create policy "Anyone can create custom request"
  on public.custom_requests
  for insert
  with check (true);

drop policy if exists "Shop owners can read own custom requests" on public.custom_requests;
create policy "Shop owners can read own custom requests"
  on public.custom_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = custom_requests.shop_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "Shop owners can update own custom requests" on public.custom_requests;
create policy "Shop owners can update own custom requests"
  on public.custom_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shops s
      where s.id = custom_requests.shop_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = custom_requests.shop_id
        and s.user_id = auth.uid()
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

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

drop policy if exists "Product media is public readable" on storage.objects;
create policy "Product media is public readable"
  on storage.objects
  for select
  using (bucket_id = 'product-media');

drop policy if exists "Authenticated users can upload product media" on storage.objects;
create policy "Authenticated users can upload product media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users can update own product media" on storage.objects;
create policy "Authenticated users can update own product media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users can delete own product media" on storage.objects;
create policy "Authenticated users can delete own product media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

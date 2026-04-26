# Craftly

Craftly is a story-driven marketplace where artisans showcase their work and buyers submit
custom requests around meaningful gifting moments.

## Phase 1 Scope

- Supabase authentication for artisan accounts
- Artisan dashboard for profile and product management
- Dynamic public artisan pages at `/a/:slug`
- Buyer custom request form that writes to `custom_requests`

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.

## Commands

- `npm run dev` - run local app
- `npm run build` - type-check and build
- `npm run lint` - run lint checks
- `npm run preview` - preview production build

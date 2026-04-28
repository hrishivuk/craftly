# Phase 1 Competitor Redesign Execution

## 1) Competitor Flow Audit and Redesign Goals

Based on the supplied competitor screenshots, these anti-patterns are the primary UX risks:

- Navigation is operationally dense (many utility controls before primary outcomes).
- Feature hierarchy is unclear (settings-heavy views overshadow product and inquiry conversion).
- Buyer conversion path is weak (no strong guided path from product impression to intent capture).
- Mobile-first admin metaphors are copied into contexts where web-first clarity would perform better.

Redesign goals for Craftly phase 1:

- Shift from controls-first UI to conversion-first UI.
- Center the core outcome: storefront visit -> structured inquiry.
- Keep artisan setup simple and staged (step-by-step onboarding).
- Make dashboard sections role-explicit and predictable.

## 2) Finalized Phase-1 IA and Navigation Model

Public routes:

- `/` Home
- `/join` Artisan onboarding/auth
- `/a/:slug` Public artisan storefront

Private artisan routes:

- `/dashboard/profile` Brand and profile setup
- `/dashboard/products` Product CRUD and publish state
- `/dashboard/inquiries` Incoming buyer inquiry inbox

Navigation model:

- Public shell: brand on left, auth action on right.
- Dashboard shell: left rail for profile/products/inquiries.
- Per-page primary CTA is singular and explicit.

## 3) Conversion-First Page UX Specs

### Home

- Hero communicates value in one line and supports two actions:
  - Primary: Become an Artisan
  - Secondary: View sample shop
- Story and trust sections reinforce emotional differentiation.

### Join

- Signup includes a true 3-step onboarding flow:
  1. Account basics
  2. Shop details
  3. Publish preview
- Returning artisan login remains fast and direct.

### Storefront (`/a/:slug`)

- Above-the-fold artisan identity + direct inquiry CTA.
- Conversion explainer block clarifies why this flow is better than DMs.
- Sticky inquiry CTA keeps conversion affordance visible on long pages.

### Dashboard

- Products: add/edit/publish workflow with clear state.
- Inquiries: status-filtered inbox for buyer requests.
- Profile: maintain identity/story and public URL.

## 4) Feature Prioritization (Impact vs Cost)

| Priority | Feature | Conversion Impact | Delivery Cost | Decision |
|---|---|---:|---:|---|
| P1 | Storefront inquiry CTA + request form | High | Medium | Ship now |
| P1 | Guided onboarding stepper | High | Medium | Ship now |
| P1 | Dashboard inquiries inbox | High | Medium | Ship now |
| P2 | Policy editor fields with persistence | Medium | Medium | Next iteration |
| P2 | Advanced design customization | Medium | High | Later |
| P3 | Checkout and payment automation | High (long-term) | High | Post phase-1 |

## 5) Mapping to Implemented Code

- Routing and IA:
  - `src/router.tsx`
- Public and dashboard structures:
  - `src/layouts/PublicLayout.tsx`
  - `src/layouts/DashboardLayout.tsx`
  - `src/components/Navbar.tsx`
- Conversion pages:
  - `src/pages/HomePage.tsx`
  - `src/pages/JoinArtisanPage.tsx`
  - `src/pages/ArtisanShopPage.tsx`
  - `src/pages/DashboardProductsPage.tsx`
  - `src/pages/DashboardInquiriesPage.tsx`
  - `src/pages/DashboardProfilePage.tsx`
- Data access:
  - `src/lib/craftlyApi.ts`
- Analytics (mock):
  - `src/lib/analytics.ts`
- Styling system:
  - `src/index.css`

## 6) Success Metrics for Launch

Primary:

- Visitor-to-inquiry rate on `/a/:slug`
- Time-to-first-action on storefront (CTA click delay)
- Join completion rate (`/join` to first dashboard screen)

Secondary:

- Product publish rate in first session
- Inquiry inbox activation rate (artisans receiving first request)
- Return rate to dashboard within 7 days

Instrumentation events currently captured:

- `home_cta_clicked`
- `sample_shop_clicked`
- `join_step_completed`
- `join_auth_success`
- `inquiry_started`
- `inquiry_submitted`
- `product_saved`
- `product_published`

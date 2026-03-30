# PPP Invoice App - Complete Redesign Plan

## Context

The PPP (Price per Pound) app is a professional towing invoice system used by towing companies to create invoices based on vehicle weight and selected recovery services. It's currently hosted on Replit with a Neon PostgreSQL database, Passport.js auth, and Multer file uploads. The UI uses a dark glassmorphism theme that feels AI-generated rather than professional.

**Goals:**
1. Complete UI redesign → clean, professional, mobile-first (operators use this in the field)
2. Migrate Replit → Render hosting
3. Migrate Neon → Supabase (database + auth + file storage)
4. Keep all functionality and pricing data intact
5. Make the app more powerful (dashboard, search, better workflows)

---

## Phase 1: Infrastructure — Supabase Setup & Database Migration

**Swap Neon → Supabase PostgreSQL. No UI changes yet.**

### 1.1 Update dependencies
- Remove: `@neondatabase/serverless`, `ws`
- Add: `@supabase/supabase-js`, `postgres` (postgres.js driver for Drizzle)

### 1.2 Update `server/db.ts`
- Replace Neon client with `postgres` driver connecting to Supabase's PostgreSQL URL
- Drizzle ORM stays — only the underlying driver changes

### 1.3 Update `.env` / `.env.example`
User will create a Supabase project and provide credentials. Template:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

### 1.4 Update `shared/schema.ts`
- Add `authId` (UUID) column to `users` table for Supabase Auth linkage

### 1.5 Run schema migration
- Use `drizzle-kit push` against Supabase DB
- Seed the 19 towing services with correct rates from `client/src/lib/services.ts`

### Key files:
- [server/db.ts](server/db.ts) — driver swap
- [shared/schema.ts](shared/schema.ts) — add authId column
- [drizzle.config.ts](drizzle.config.ts) — update connection
- `package.json` — dependency changes

---

## Phase 2: Auth Migration — Passport.js → Supabase Auth

**Replace session-based auth with Supabase JWT auth.**

### 2.1 Rewrite `server/auth.ts`
- Remove Passport.js, express-session, connect-pg-simple
- New middleware: extract JWT from `Authorization: Bearer <token>`, verify with `supabase.auth.getUser(token)`
- Attach user profile to `req.user`
- Keep `requireAuth` and `requireAdmin` middleware signatures

### 2.2 Update `server/routes.ts`
- Remove `/api/register`, `/api/login`, `/api/logout` routes (handled by Supabase client SDK)
- Add `/api/profile` route to fetch user profile linked by `authId`
- Add a DB trigger or endpoint to create profile row when new user signs up

### 2.3 Rewrite `client/src/hooks/use-auth.tsx`
- Use `supabase.auth.signInWithPassword()`, `signUp()`, `signOut()`
- Switch from username → email-based auth (enables password reset)
- Listen to `onAuthStateChange` for session state

### 2.4 Update `client/src/lib/queryClient.ts`
- All API calls include `Authorization: Bearer <token>` header

### 2.5 Remove old deps
- Remove: `passport`, `passport-local`, `express-session`, `connect-pg-simple`

### Key files:
- [server/auth.ts](server/auth.ts) — complete rewrite
- [server/routes.ts](server/routes.ts) — remove auth routes, add profile
- [client/src/hooks/use-auth.tsx](client/src/hooks/use-auth.tsx) — Supabase client auth
- [client/src/lib/queryClient.ts](client/src/lib/queryClient.ts) — Bearer token
- [client/src/lib/protected-route.tsx](client/src/lib/protected-route.tsx) — use Supabase session

---

## Phase 3: Storage Migration — Multer → Supabase Storage

**Replace disk uploads with Supabase Storage buckets.**

### 3.1 Create two Supabase Storage buckets
- `job-photos` — private, 5MB max, image/* only
- `logos` — private, 5MB max, image/* only

### 3.2 Update backend
- Remove all Multer config from [server/index.ts](server/index.ts)
- Remove `app.use('/uploads', express.static('uploads'))`
- Photo upload routes now accept Supabase Storage paths from the frontend

### 3.3 Update frontend
- [client/src/pages/home.tsx](client/src/pages/home.tsx) — upload photos directly via `supabase.storage.from('job-photos').upload()`
- [client/src/pages/invoice.tsx](client/src/pages/invoice.tsx) — use Supabase signed URLs for photo display
- [client/src/lib/invoice.ts](client/src/lib/invoice.ts) — update PDF generation to use Supabase URLs

### 3.4 Remove old deps
- Remove: `multer`

---

## Phase 4: UI Redesign — Complete Visual Overhaul

**Replace glassmorphism with clean, professional, mobile-first design.**

### 4.1 Design Principles — Bold & Branded (QuickBooks/FreshBooks style)
- **Light mode default** with strong brand presence (operators work outdoors in sunlight)
- **No glassmorphism** — remove all `glass-card`, `gradient-text`, `backdrop-blur` classes
- **Bold color palette** — strong brand blue/teal primary, warm accent colors, confident typography
- **Custom branding prominent** — company logo and name featured, colored header/sidebar
- **Mobile-first** — 44px+ touch targets, large inputs, minimal scrolling per step
- **Leverage shadcn/ui** fully (47 components already installed)
- **Inspired by**: QuickBooks, FreshBooks — professional with visual personality and confidence

### 4.2 Theme overhaul — `client/src/index.css`
- Replace dark-mode CSS variables with bold branded light theme
- Primary: deep teal/blue (#0D6EFD or #2CA5B8), Secondary: warm orange/amber accent
- Strong colored header bar with company branding
- Confident button styles with clear hierarchy (filled primary, outlined secondary)
- Remove all glassmorphism classes (`glass-card`, `glass-button`, `input-modern`, `btn-modern`, `gradient-text`, `gradient-border`, `service-card`, `header-gradient`, `status-dot`, `photo-grid-item`)
- Cards with subtle shadows and colored left borders for visual interest

### 4.3 App shell restructure — `client/src/App.tsx`
- Replace floating gear button + slide-over Sidebar with proper navigation
- Desktop: persistent sidebar nav | Mobile: bottom tab bar
- Add new routes: `/dashboard`, `/jobs`, `/settings`
- Wizard (New Invoice) becomes: `/new` → `/new/services` → `/new/invoice`

### 4.4 Page redesigns

**Auth page** (`auth-page.tsx`)
- Clean centered card, email + password, "Forgot Password" link
- Professional PPP branding (no oversized emojis)

**Dashboard** (NEW — `dashboard.tsx`)
- Default landing page after login
- KPI cards: total jobs, revenue this month, average invoice
- Revenue trend chart (recharts, already installed)
- Recent jobs list
- Big "New Invoice" CTA button

**New Invoice wizard** (`home.tsx` → `services.tsx` → `invoice.tsx`)
- Step indicator: "Step 1 of 3: Job Details"
- Clean form with `Card`, `Input`, `Label` from shadcn/ui
- Photo upload: clean dropzone component
- Services page: services grouped by category (Recovery, Environmental, Travel, Damage)
- Running total displayed as user selects services
- Invoice page: white document layout with proper table, fixed action bar on mobile

**Jobs list** (NEW — `jobs.tsx`)
- Searchable, filterable list of all past jobs
- Search by customer name, invoice #, date range
- Click to view invoice

**Settings** (NEW — `settings.tsx`)
- Replaces Sidebar functionality as a proper page
- Tabs: Company Info, Service Rates, Account

**Admin** (`admin.tsx`)
- Standardize with new theme
- Proper tables for user/company management

### 4.5 New components to create
- `AppLayout.tsx` — main layout with nav + content area
- `MobileNav.tsx` — bottom tab navigation for mobile
- `StepIndicator.tsx` — wizard progress bar
- `PhotoUpload.tsx` — Supabase-integrated dropzone

### 4.6 Remove
- `client/src/components/Sidebar.tsx` — replaced by Settings page

### Key files to modify:
- [client/src/index.css](client/src/index.css) — complete theme rewrite
- [client/src/App.tsx](client/src/App.tsx) — new routing + layout
- All page files in [client/src/pages/](client/src/pages/)
- [tailwind.config.ts](tailwind.config.ts) — theme config

---

## Phase 5: Render Deployment

**Create deployment config and remove Replit-specific code.**

### 5.1 Create `render.yaml`
```yaml
services:
  - type: web
    name: ppp-invoice
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
    healthCheckPath: /api/health
```

### 5.2 Update server for Render
- [server/index.ts](server/index.ts): Use `process.env.PORT || 5000`, remove `reusePort: true`
- [server/routes.ts](server/routes.ts): Add `GET /api/health` endpoint

### 5.3 Remove Replit artifacts
- Remove `.replit` file
- Remove `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-runtime-error-modal` from [vite.config.ts](vite.config.ts) and `package.json`

---

## Phase 6: Power Features

**Add analytics, search, and real-time capabilities.**

### 6.1 Dashboard analytics
- New API endpoints: `/api/analytics/summary`, `/api/analytics/revenue`, `/api/analytics/services`
- Revenue trend chart, top services breakdown, KPI cards

### 6.2 Jobs search & filtering
- Server-side search on customer name, invoice #, vehicle type
- Date range filter, sort options, pagination

### 6.3 Password reset
- Comes free with Supabase Auth — add "Forgot Password" UI flow

---

## Preserved Data — 19 Default Towing Services

These exact rates must be maintained (cents per pound, formula: `cost = weight × rate / 100`):

| # | Service | Rate |
|---|---------|------|
| 1 | Normal Recovery (On or Near Highway) | 4.0 |
| 2 | Contained Recovery/Winching | 4.0 |
| 3 | Salvage/Debris Recovery | 5.5 |
| 4 | Handle Complete Recovery | 6.0 |
| 5 | Total Loss Recovery | 5.0 |
| 6 | Rollover | 4.0 |
| 7 | Inclement Weather | 2.5 |
| 8 | Nights/Weekends/Holidays | 2.5 |
| 9 | Travel Within 50 Miles | 3.5 |
| 10 | Travel Beyond 50 Miles | 6.5 |
| 11 | Wheels Higher than Roof | 2.0 |
| 12 | Embankment or Inclines | 4.5 |
| 13 | Back Doors Open | 2.0 |
| 14 | Tractor from Under Trailer | 2.0 |
| 15 | Major Suspension Damage | 6.0 |
| 16 | 10 MPH Collision Factor | 2.0 |
| 17 | 30 MPH Collision Factor | 3.0 |
| 18 | 50 MPH Collision Factor | 4.0 |
| 19 | 70+ MPH Collision Factor | 5.0 |

---

## Verification

After each phase:
1. **Phase 1**: App connects to Supabase DB, all existing queries work, services are seeded
2. **Phase 2**: Login/register/logout work with Supabase Auth, all protected routes enforce auth
3. **Phase 3**: Photo upload/display works via Supabase Storage, PDF export includes photos
4. **Phase 4**: All pages render with new design, wizard flow works end-to-end, mobile responsive
5. **Phase 5**: App deploys and runs on Render, health check passes
6. **Phase 6**: Dashboard shows analytics, jobs are searchable/filterable

**End-to-end test**: Register → Login → Create new invoice (fill form, upload photo, select services, add subcontractor) → View invoice → Export PDF → View in jobs list → Check dashboard analytics

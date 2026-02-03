# Roadmap: YouTube Thumbnail Factory

## Overview

This roadmap delivers a SaaS web application that enables YouTube creators to generate AI-powered thumbnails. The journey starts with secure authentication and onboarding, builds portrait management, delivers the core generation workflow, adds monetization via Stripe, and concludes with a marketing landing page. Every phase delivers verifiable user capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Auth** - Secure authentication, onboarding, and UI foundation
- [x] **Phase 2: Portraits** - Portrait library management
- [x] **Phase 3: Generation & Gallery** - Core thumbnail generation and results display
- [ ] **Phase 4: Billing & Settings** - Stripe subscriptions and user settings
- [ ] **Phase 5: Landing Page** - Marketing page for user acquisition

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can securely create accounts, complete onboarding with portrait upload, and access the app with proper session management
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ONBD-01, ONBD-02, ONBD-03, ADMN-01, UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-05
**Success Criteria** (what must be TRUE):
  1. User can create account with email/password and receives verification email
  2. User can log in and session persists across browser refresh
  3. User can reset forgotten password via email link
  4. New user is forced through onboarding flow before accessing main app
  5. App displays consistent dark theme with loading states and error messages
**Plans**: 4 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Project & UI foundation (Next.js, Tailwind, shadcn/ui, dark theme)
- [x] 01-02-PLAN.md — Supabase backend setup (clients, schema, storage, admin utility)
- [x] 01-03-PLAN.md — Auth pages & middleware (login, signup, password reset, route protection)
- [x] 01-04-PLAN.md — Onboarding flow (portrait upload, welcome tutorial, dashboard shell)

### Phase 2: Portraits
**Goal**: Users can manage a library of portrait images for use in thumbnail generation
**Depends on**: Phase 1
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05
**Success Criteria** (what must be TRUE):
  1. User can upload multiple portrait images to their library
  2. User can view all portraits in a grid layout with labels
  3. User can set one portrait as "active" (pre-selected in generation form)
  4. User can delete portraits except the last one
**Plans**: 2 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md — Database schema and server actions (portraits table, CRUD operations)
- [x] 02-02-PLAN.md — Portraits page UI (grid layout, upload dialog, card components)

### Phase 3: Generation & Gallery
**Goal**: Users can generate AI thumbnails and view/download results
**Depends on**: Phase 2
**Requirements**: GENR-01, GENR-02, GENR-03, GENR-04, GENR-05, GENR-06, GENR-07, GENR-08, GALR-01, GALR-02, GALR-03, GALR-04, GALR-05, ADMN-02
**Success Criteria** (what must be TRUE):
  1. User can submit generation form with portrait, up to 7 backgrounds, and keywords
  2. System validates inputs and shows quota before generation starts
  3. User sees real-time progress during 3-7 minute generation process
  4. User is notified when generation completes or fails
  5. User can view all past generations with thumbnails in gallery view
  6. User can download individual thumbnails or all at once
**Plans**: 4 plans in 3 waves

Plans:
- [x] 03-01-PLAN.md — Database schema and dependencies (generations/thumbnails tables, jszip, shadcn components)
- [x] 03-02-PLAN.md — Backend infrastructure (server actions, n8n client, callback webhook)
- [x] 03-03-PLAN.md — Generation UI (form, portrait selector, background upload, realtime status)
- [x] 03-04-PLAN.md — Gallery and downloads (list page, detail page, thumbnail grid, ZIP download)

### Phase 4: Billing & Settings
**Goal**: Users can subscribe to paid plans and manage their account settings
**Depends on**: Phase 3
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08, SETT-01, SETT-02, SETT-03, SETT-04, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. User sees current plan and usage (X/Y generations this month)
  2. User can upgrade from Free to Pro or Agency via Stripe Checkout
  3. User is blocked from generating when quota exceeded with upgrade prompt
  4. User can manage subscription via Stripe Customer Portal
  5. Admin user sees unlimited badge and bypasses quota checks
**Plans**: 3 plans in 3 waves

Plans:
- [ ] 04-01-PLAN.md — Billing infrastructure (Stripe SDK, database schema, plan configuration)
- [ ] 04-02-PLAN.md — Webhook and quota enforcement (Stripe webhook, checkout/portal actions, billing period quota)
- [ ] 04-03-PLAN.md — Settings page UI (profile form, plan display, subscription management)

### Phase 5: Landing Page
**Goal**: Public landing page converts visitors into signups
**Depends on**: Phase 4
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. Landing page displays hero with clear value proposition and CTA
  2. Landing page shows features, pricing, and social proof sections
  3. CTA buttons lead to signup flow
**Plans**: TBD

Plans:
- [ ] 05-01: Landing page design and implementation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 4/4 | Complete | 2026-02-03 |
| 2. Portraits | 2/2 | Complete | 2026-02-03 |
| 3. Generation & Gallery | 4/4 | Complete | 2026-02-03 |
| 4. Billing & Settings | 0/3 | Planned | - |
| 5. Landing Page | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-03*
*Last updated: 2026-02-03*

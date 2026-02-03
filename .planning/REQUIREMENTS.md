# Requirements: YouTube Thumbnail Factory

**Defined:** 2026-02-03
**Core Value:** Users can generate high-quality YouTube thumbnails without design skills

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Unauthenticated users are redirected to login page

### Onboarding

- [ ] **ONBD-01**: User must upload first portrait before accessing main app
- [ ] **ONBD-02**: User sees welcome tutorial explaining the generation workflow
- [ ] **ONBD-03**: User is redirected to dashboard after completing onboarding

### Portraits

- [ ] **PORT-01**: User can upload multiple portrait images
- [ ] **PORT-02**: User can set one portrait as "active" (pre-selected in generation form)
- [ ] **PORT-03**: User can delete portraits (except the last one)
- [ ] **PORT-04**: User can add labels to portraits for organization
- [ ] **PORT-05**: User can view all their portraits in a grid layout

### Generation

- [ ] **GENR-01**: User can select a portrait from their library for generation
- [ ] **GENR-02**: User can upload up to 7 background images per generation
- [ ] **GENR-03**: User can enter keywords describing their video topic
- [ ] **GENR-04**: System validates inputs before triggering generation
- [ ] **GENR-05**: System displays quota check before allowing generation
- [ ] **GENR-06**: System triggers n8n workflow with portrait URL, background URLs, and keywords
- [ ] **GENR-07**: User sees real-time progress updates during generation (3-7 minutes)
- [ ] **GENR-08**: User is notified when generation completes or fails

### Gallery

- [ ] **GALR-01**: User can view list of all past generations with status and date
- [ ] **GALR-02**: User can view all thumbnails from a specific generation in grid layout
- [ ] **GALR-03**: User can download individual thumbnail images
- [ ] **GALR-04**: User can download all thumbnails from a generation at once
- [ ] **GALR-05**: User can see which keywords and portrait were used for each generation

### Billing

- [ ] **BILL-01**: Free tier users get 5 generations per month
- [ ] **BILL-02**: Pro tier users (€19/month) get 50 generations per month
- [ ] **BILL-03**: Agency tier users (€49/month) get 200 generations per month
- [ ] **BILL-04**: User can upgrade plan via Stripe Checkout
- [ ] **BILL-05**: User can manage subscription via Stripe Customer Portal
- [ ] **BILL-06**: User sees current plan and usage (X/Y generations this month)
- [ ] **BILL-07**: User is blocked from generating when quota exceeded (with upgrade prompt)
- [ ] **BILL-08**: Quota resets monthly based on Stripe billing cycle

### Settings

- [ ] **SETT-01**: User can view their profile information (name, email)
- [ ] **SETT-02**: User can edit their display name
- [ ] **SETT-03**: User can see their current plan and billing period
- [ ] **SETT-04**: User can access Stripe Customer Portal from settings

### Landing Page

- [ ] **LAND-01**: Landing page displays hero section with value proposition and CTA
- [ ] **LAND-02**: Landing page highlights key features of the product
- [ ] **LAND-03**: Landing page shows pricing for Free/Pro/Agency tiers
- [ ] **LAND-04**: Landing page includes social proof section (testimonials/logos)

### Admin

- [ ] **ADMN-01**: Admin user is identified by ADMIN_EMAIL environment variable
- [ ] **ADMN-02**: Admin user has unlimited generations (no quota check)
- [ ] **ADMN-03**: Admin user sees "Admin — Unlimited" badge instead of quota display
- [ ] **ADMN-04**: Admin user does not see upgrade CTAs

### UI/UX

- [ ] **UIUX-01**: App uses modern dark theme with glass effects and subtle gradients
- [ ] **UIUX-02**: All forms show loading states during submission
- [ ] **UIUX-03**: All pages show appropriate empty states
- [ ] **UIUX-04**: Errors are displayed clearly with actionable messages
- [ ] **UIUX-05**: App is responsive across desktop and tablet sizes

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-V2-01**: User can sign up with Google OAuth
- **AUTH-V2-02**: User can link Google account to existing email account

### Generation

- **GENR-V2-01**: User can preview thumbnails in mock YouTube search results (A/B preview)
- **GENR-V2-02**: User can re-generate variations of existing thumbnails
- **GENR-V2-03**: User can add text overlays to generated thumbnails

### Admin

- **ADMN-V2-01**: Admin can view dashboard with all users and generations
- **ADMN-V2-02**: Admin can view usage metrics and analytics

### Integrations

- **INTG-V2-01**: User can connect YouTube account for direct upload
- **INTG-V2-02**: User can view thumbnail performance analytics

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Team/multi-tenant features | Single-user focus for v1, complexity not justified |
| In-app thumbnail editing | Rely on external tools (Canva, Figma), not core value |
| OAuth providers beyond Google | Email + Google sufficient, each provider adds maintenance |
| Email notifications | In-app status sufficient for v1 |
| Public API | Internal use only, no third-party integrations needed |
| Mobile app | Web-first approach, responsive design covers mobile |
| Video upload/processing | Thumbnail-only focus, video is out of scope |
| Real-time chat support | FAQ/docs sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| ONBD-01 | Phase 1 | Pending |
| ONBD-02 | Phase 1 | Pending |
| ONBD-03 | Phase 1 | Pending |
| PORT-01 | Phase 2 | Pending |
| PORT-02 | Phase 2 | Pending |
| PORT-03 | Phase 2 | Pending |
| PORT-04 | Phase 2 | Pending |
| PORT-05 | Phase 2 | Pending |
| GENR-01 | Phase 3 | Pending |
| GENR-02 | Phase 3 | Pending |
| GENR-03 | Phase 3 | Pending |
| GENR-04 | Phase 3 | Pending |
| GENR-05 | Phase 3 | Pending |
| GENR-06 | Phase 3 | Pending |
| GENR-07 | Phase 3 | Pending |
| GENR-08 | Phase 3 | Pending |
| GALR-01 | Phase 3 | Pending |
| GALR-02 | Phase 3 | Pending |
| GALR-03 | Phase 3 | Pending |
| GALR-04 | Phase 3 | Pending |
| GALR-05 | Phase 3 | Pending |
| BILL-01 | Phase 4 | Pending |
| BILL-02 | Phase 4 | Pending |
| BILL-03 | Phase 4 | Pending |
| BILL-04 | Phase 4 | Pending |
| BILL-05 | Phase 4 | Pending |
| BILL-06 | Phase 4 | Pending |
| BILL-07 | Phase 4 | Pending |
| BILL-08 | Phase 4 | Pending |
| SETT-01 | Phase 4 | Pending |
| SETT-02 | Phase 4 | Pending |
| SETT-03 | Phase 4 | Pending |
| SETT-04 | Phase 4 | Pending |
| LAND-01 | Phase 5 | Pending |
| LAND-02 | Phase 5 | Pending |
| LAND-03 | Phase 5 | Pending |
| LAND-04 | Phase 5 | Pending |
| ADMN-01 | Phase 1 | Pending |
| ADMN-02 | Phase 3 | Pending |
| ADMN-03 | Phase 4 | Pending |
| ADMN-04 | Phase 4 | Pending |
| UIUX-01 | Phase 1 | Pending |
| UIUX-02 | Phase 1 | Pending |
| UIUX-03 | Phase 1 | Pending |
| UIUX-04 | Phase 1 | Pending |
| UIUX-05 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after initial definition*

# YouTube Thumbnail Factory

## What This Is

A SaaS web application that enables YouTube creators to generate professional AI-powered thumbnails. Users upload a portrait and background images, enter keywords describing their video topic, and the system orchestrates AI generation (Gemini for prompts + Kie.ai for images) via an existing n8n workflow. Results appear in a downloadable gallery.

## Core Value

**Users can generate high-quality YouTube thumbnails without design skills.** The form-to-gallery flow must work seamlessly — if thumbnail generation fails, the product fails.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up with email/password or Google OAuth
- [ ] User must upload a portrait during onboarding before accessing the app
- [ ] User can manage multiple portraits (upload, select active, delete)
- [ ] User can submit generation form: portrait + up to 7 backgrounds + keywords
- [ ] System triggers n8n workflow and tracks generation status
- [ ] User sees real-time progress while generation is processing
- [ ] User can view and download generated thumbnails
- [ ] User can browse history of past generations
- [ ] Free users get 5 generations/month, Pro (€19) get 50, Agency (€49) get 200
- [ ] Admin (identified by ADMIN_EMAIL env var) has unlimited generations
- [ ] User can manage subscription via Stripe Customer Portal
- [ ] Quota resets monthly based on Stripe billing cycle

### Out of Scope

- Re-generation / variation of existing results — complexity, defer to v2
- Team/multi-tenant features — single-user focus for v1
- In-app thumbnail editing — rely on external tools
- OAuth providers beyond Google — email + Google sufficient for v1
- Email notifications — in-app status sufficient
- Public API for third-party integrations — internal use only for v1

## Context

**Existing n8n workflow:** A working workflow (`youtube-thumbnail-factory-workflow.json`) already handles the AI generation pipeline:
- Receives webhook with portrait + backgrounds + keywords
- Uses Gemini (via OpenRouter) to generate 3-5 prompts
- Sends images to Kie.ai (nano-banana-pro model) for generation
- Polls until complete (~7 min timeout)
- Currently stores results in Airtable (will be adapted to callback to Next.js app)

**Workflow adaptation needed:** The workflow currently expects Airtable storage and a different payload format. Phase 6 will adapt it to:
- Accept portrait URL + background URLs instead of base64
- Callback to `/api/webhooks/n8n-callback` instead of storing in Airtable
- Return immediate response, process in background

**Target audience:** YouTube creators who want professional thumbnails but lack design skills or time. They value speed and quality over customization.

## Constraints

- **Tech stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS — modern, maintainable, good DX
- **Backend**: Supabase (Auth + PostgreSQL + Storage) — integrated, fast to set up, generous free tier
- **Payments**: Stripe (Subscriptions + Customer Portal) — industry standard, handles complexity
- **AI generation**: Existing n8n workflow — already built and working, adapt rather than rebuild
- **Image limits**: Kie.ai accepts max 8 images per task (1 portrait + 7 backgrounds)
- **Timeout**: n8n workflow has 7-minute execution timeout
- **File size**: 5 MB max per uploaded image (Supabase Storage client limit)
- **Hosting**: Vercel — seamless Next.js deployment
- **Design**: Modern dark theme with glass effects, subtle gradients

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over Firebase | Better PostgreSQL support, RLS, integrated auth | — Pending |
| Frontend-first build order | Can mock n8n responses, adapt workflow once frontend stable | — Pending |
| Admin via env var | More flexible than hardcoding email in SQL trigger | — Pending |
| Callback pattern for n8n | Frontend polls DB, n8n calls back with results — cleaner than direct Supabase writes from n8n | — Pending |
| 7 background limit | Kie.ai constraint (8 images total = 1 portrait + 7 backgrounds) | — Pending |

---
*Last updated: 2025-02-03 after initialization*

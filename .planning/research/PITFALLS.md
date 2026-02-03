# Pitfalls Research

**Domain:** YouTube Thumbnail Factory SaaS
**Tech Stack:** Next.js 15 + Supabase + Stripe + n8n webhook AI generation
**Researched:** 2026-02-03
**Overall Confidence:** HIGH (verified with official docs and multiple sources)

---

## Authentication Pitfalls

### Critical: Session Management Across Client/Server Boundary

**What goes wrong:** Inconsistent authentication states between client and server components in Next.js App Router. Users appear logged in on one side but not the other, leading to hydration errors and broken UI.

**Why it happens:** Manual token management instead of using `@supabase/ssr`. Developers try to handle JWT tokens, refresh tokens, and session storage manually.

**Warning signs:**
- Hydration mismatch errors in console
- Users randomly logged out after page navigation
- Auth state works in development but fails in production

**Prevention strategy:**
1. Use `@supabase/ssr` package exclusively (not deprecated auth-helpers)
2. Create separate Supabase client utilities for client (`createBrowserClient`) and server (`createServerClient`)
3. Implement middleware using `updateSession` to refresh expired tokens
4. Never access `supabase.auth` directly in Server Components

**Phase to address:** Phase 1 (Foundation) - Set up auth infrastructure correctly from day one.

**Sources:** [Supabase Server-Side Auth Docs](https://supabase.com/docs/guides/auth/server-side/nextjs), [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV)

---

### Critical: Middleware Not Protecting Routes

**What goes wrong:** Users can access `/dashboard`, `/generate`, or API routes without authentication because middleware is missing or misconfigured.

**Why it happens:** Forgetting that Next.js middleware is the "bouncer" that must check auth on every protected request. Without `updateSession` call, session tokens expire and app behaves erratically.

**Warning signs:**
- Unauthenticated users seeing dashboard briefly before redirect
- Session expiring mid-use without warning
- 401 errors appearing randomly in production

**Prevention strategy:**
```typescript
// middleware.ts - REQUIRED for Supabase Auth
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

**Phase to address:** Phase 1 (Foundation) - Middleware is non-negotiable for auth.

---

### Moderate: Google OAuth Redirect URL Mismatch

**What goes wrong:** Google OAuth fails with `redirect_uri_mismatch` error, especially when moving from development to production.

**Why it happens:**
- Using wrong OAuth client type (Android instead of Web Application)
- Redirect URLs not matching exactly in Google Cloud Console
- Site URL in Supabase dashboard still pointing to `localhost`
- Using `127.0.0.1` instead of `localhost` or vice versa

**Warning signs:**
- OAuth works locally but fails in preview/production
- Google error page mentioning redirect_uri_mismatch
- Users redirected to `localhost:3000` in production

**Prevention strategy:**
1. Use "Web application" OAuth client type in Google Cloud Console
2. Add BOTH redirect URLs to Google Console:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
   - Your production callback URL
3. Update Supabase Dashboard > URL Configuration:
   - Site URL = production URL (not localhost)
   - Add all redirect URLs (localhost for dev, Vercel preview URLs, production)
4. Use `localhost` consistently (not `127.0.0.1`)

**Phase to address:** Phase 1 (Foundation) - Configure before first OAuth test.

**Sources:** [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

---

## Database Pitfalls

### Critical: RLS Disabled = Database Exposed

**What goes wrong:** All data is publicly accessible via the auto-generated REST API. Anyone with your Supabase URL and anon key (which is in client code) can read/write everything.

**Why it happens:** RLS is disabled by default on new tables. Developers prototype without RLS, then forget to enable it before launch.

**Consequences:**
- CVE-2025-48757 exposed 170+ apps due to missing RLS
- 83% of Supabase security incidents involve RLS misconfigurations
- Attackers can read all user data, thumbnails, generation history

**Warning signs:**
- Supabase Security Advisor showing warnings
- Tables created without immediate policy setup
- Data queries returning all rows instead of user-specific rows

**Prevention strategy:**
1. Enable RLS immediately after creating ANY table:
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```
2. Create at least one policy before inserting data
3. Run Supabase Security Advisor before every deployment
4. Never use `USING (true)` unless data is genuinely public
5. Test RLS with different user roles using Supabase CLI

**Phase to address:** Phase 1 (Foundation) - Every table, every time, no exceptions.

**Sources:** [Supabase RLS Guide](https://vibeappscanner.com/supabase-row-level-security), [Supabase Security Advisory](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/)

---

### Critical: RLS Enabled But No Policies = Deny All

**What goes wrong:** Data queries return empty arrays. App appears broken with no visible errors.

**Why it happens:** Enabling RLS without creating policies defaults to "deny all access" - including to authenticated users.

**Warning signs:**
- Queries returning `[]` for data you know exists
- No error messages, just empty results
- Works with service role key but not anon/authenticated

**Prevention strategy:**
Always create policies immediately after enabling RLS:
```sql
-- Example for user_thumbnails table
CREATE POLICY "Users can read own thumbnails"
ON user_thumbnails FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thumbnails"
ON user_thumbnails FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Phase to address:** Phase 1 (Foundation) - Part of table creation workflow.

---

### Moderate: Complex Business Logic in RLS Policies

**What goes wrong:** Slow queries, hard-to-debug behavior, performance degradation as data grows.

**Why it happens:** Putting subscription validation, quota checks, and multi-table joins inside RLS policies.

**Warning signs:**
- Queries taking >100ms that should be fast
- Difficulty debugging why certain rows are/aren't visible
- RLS policies with multiple subqueries

**Prevention strategy:**
1. Use RLS as final security layer only (verify `user_id = auth.uid()`)
2. Handle business logic (quota checks, subscription validation) in:
   - Application layer (API routes)
   - Supabase Edge Functions
   - Database triggers (for data validation)
3. Add indexes on columns used in RLS policies

**Phase to address:** Phase 2 (Stripe Integration) - When adding subscription-based access.

---

### Moderate: Views Bypass RLS by Default

**What goes wrong:** Creating a view that exposes data RLS should protect.

**Why it happens:** Views in Postgres use `security definer` by default, running as the view creator (usually `postgres` user with full access).

**Prevention strategy:**
For Postgres 15+ (Supabase default):
```sql
CREATE VIEW user_generation_stats
WITH (security_invoker = true) AS
SELECT * FROM generations WHERE ...;
```

**Phase to address:** Phase 3 (Dashboard) - If creating aggregate views for analytics.

**Sources:** [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## Stripe Integration Pitfalls

### Critical: Wrong Webhook Signing Secret (Test vs Live)

**What goes wrong:** Webhook signature verification always fails in production, even with correct code. Payments work but database never updates.

**Why it happens:** Using test mode `whsec_...` secret in production. Stripe signs test and live events with different secrets.

**Warning signs:**
- `Webhook signature verification failed` errors in logs
- Webhooks succeed in Stripe test mode, fail in live
- Customer subscriptions created but app shows "Free" tier

**Prevention strategy:**
1. Use separate environment variables:
   - `STRIPE_WEBHOOK_SECRET_TEST` for development
   - `STRIPE_WEBHOOK_SECRET` for production
2. Verify correct secret is loaded: log first 8 characters on startup
3. Never copy test webhook from Stripe CLI to production

**Phase to address:** Phase 2 (Stripe Integration) - Critical for payment reliability.

**Sources:** [Stripe Webhook Signature Docs](https://docs.stripe.com/webhooks/signature)

---

### Critical: Processing Webhooks Synchronously

**What goes wrong:** Webhook endpoint times out (Vercel 10s limit on Hobby), Stripe retries, duplicate processing, inconsistent state.

**Why it happens:** Doing all work (database updates, sending emails, calling external APIs) inside the webhook handler.

**Consequences:**
- Stripe retries for up to 3 days
- Same subscription created multiple times
- Race conditions between retried webhooks

**Warning signs:**
- 500 errors on webhook endpoint
- Duplicate entries in database
- Webhook retry warnings in Stripe dashboard

**Prevention strategy:**
1. Return 200 immediately after signature verification
2. Queue actual processing for background job
3. Implement idempotency using event ID:
   ```typescript
   // Quick acknowledge
   const event = stripe.webhooks.constructEvent(body, sig, secret);

   // Check if already processed
   const existing = await db.stripe_events.find(event.id);
   if (existing) return new Response('OK', { status: 200 });

   // Queue for async processing
   await queue.add('process-stripe-event', { eventId: event.id });

   return new Response('OK', { status: 200 });
   ```

**Phase to address:** Phase 2 (Stripe Integration) - Build async processing from start.

**Sources:** [Stripe Webhook Best Practices](https://docs.stripe.com/billing/subscriptions/webhooks)

---

### Critical: Using Wrong Webhook Events

**What goes wrong:** Renewals not detected, cancellations not honored, access granted prematurely.

**Why it happens:** Stripe has 100+ event types. Using `payment_intent.succeeded` for subscriptions instead of `invoice.paid`.

**Essential events for SaaS subscriptions:**

| Event | Use For |
|-------|---------|
| `customer.subscription.created` | Grant initial access |
| `customer.subscription.updated` | Plan changes, status changes |
| `customer.subscription.deleted` | Revoke access (fires at actual end, not cancel request) |
| `invoice.paid` | Renew access (the ONLY reliable renewal signal) |
| `invoice.payment_failed` | Warn user, show grace period UI |

**Anti-patterns:**
- `payment_intent.succeeded` - Doesn't indicate which subscription
- `customer.subscription.updated` for renewals - Status might not change

**Phase to address:** Phase 2 (Stripe Integration) - Get event selection right first time.

**Sources:** [Stripe Billing Webhooks](https://medium.com/@nicolas_32131/stripe-billing-webhooks-for-saas-7d835feb30cd)

---

### Moderate: Not Handling Out-of-Order Events

**What goes wrong:** Race condition where `subscription.deleted` processed before `subscription.created`, leaving user in broken state.

**Why it happens:** Stripe doesn't guarantee event delivery order. Network latency can reorder events.

**Prevention strategy:**
1. Always fetch current subscription state from Stripe API after receiving event
2. Use `subscription.current_period_end` for access decisions, not event order
3. Store Stripe subscription object, not derived state

**Phase to address:** Phase 2 (Stripe Integration) - Design data model with this in mind.

---

### Moderate: Confusing Canceled vs Deleted

**What goes wrong:** Revoking access immediately when user cancels, instead of at period end.

**Why it happens:** Misunderstanding Stripe terminology:
- **Canceled at period end:** User clicked cancel, but subscription remains active until billing period ends
- **Deleted (`customer.subscription.deleted`):** Subscription actually ended, time to revoke

**Prevention strategy:**
```typescript
// Check cancel_at_period_end for pending cancellations
if (subscription.cancel_at_period_end) {
  // Show "Your plan ends on {date}" - DON'T revoke yet
}

// Only revoke on deletion event
if (event.type === 'customer.subscription.deleted') {
  await revokeAccess(subscription.customer);
}
```

**Phase to address:** Phase 2 (Stripe Integration) - Handle cancellation flow correctly.

**Sources:** [Stripe Subscription Lifecycle](https://docs.stripe.com/billing/subscriptions/overview)

---

### Moderate: Quota/Credit Tracking Drift

**What goes wrong:** User's local credit balance doesn't match Stripe usage records. Free generations given or legitimate usage blocked.

**Why it happens:**
- Deducting credits before generation completes (generation might fail)
- Not reconciling after webhook failures
- Race conditions between concurrent generation requests

**Prevention strategy:**
1. Deduct credits AFTER successful generation, not before
2. Implement bidirectional sync: local credits validated against Stripe usage records
3. Use database transactions for credit operations
4. Log every credit change with reason and Stripe reference

**Phase to address:** Phase 2 (Stripe Integration) - Credit system architecture.

**Sources:** [Stripe Credit-Based Pricing](https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model)

---

## Async Generation Pitfalls

### Critical: Blocking on 7-Minute AI Generation

**What goes wrong:** API route times out waiting for AI generation. Vercel kills the function, user sees error, but generation continues in background (orphaned).

**Why it happens:**
- Vercel Hobby: 10s timeout (nowhere near 7 minutes)
- Vercel Pro: 60s default (still not enough)
- Treating AI generation like a normal API call

**Warning signs:**
- 504 Gateway Timeout errors
- Generations completing but user never notified
- Inconsistent "success" rates between local and production

**Prevention strategy:**
1. **Never wait for AI generation in an API route**
2. Implement async pattern:
   ```
   POST /api/generate → Queue job → Return job ID immediately (200ms)
   GET /api/status/{jobId} → Poll or SSE for status
   Webhook from n8n → Update job status when complete
   ```
3. Use Vercel `maxDuration` config for polling endpoints only:
   ```typescript
   export const maxDuration = 60; // For SSE status endpoint, not generation
   ```

**Phase to address:** Phase 3 (Generation Flow) - Core architecture decision.

**Sources:** [Vercel Function Duration](https://vercel.com/docs/functions/configuring-functions/duration), [Inngest Next.js Timeouts](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)

---

### Critical: No Idempotency for n8n Webhook Calls

**What goes wrong:** User clicks "Generate" twice, two identical generation tasks created, quota double-charged.

**Why it happens:** No deduplication on the client or server. Network hiccups cause retries.

**Prevention strategy:**
1. Generate idempotency key on client before submission
2. Check for duplicate within time window (e.g., same keywords + images within 5 minutes)
3. Return existing job ID if duplicate detected
4. Disable generate button until response received

**Phase to address:** Phase 3 (Generation Flow) - Prevent duplicate charges.

---

### Critical: Polling Without Timeout/Circuit Breaker

**What goes wrong:** Client polls forever if generation fails silently. User stuck on "Generating..." indefinitely.

**Why it happens:** Assuming n8n always responds. Network issues, n8n downtime, or Kie.ai failures can cause silent failures.

**Prevention strategy:**
1. Client-side timeout: Stop polling after 8 minutes (slightly longer than 7-min workflow timeout)
2. Show clear failure state if timeout reached
3. Server-side: Mark jobs as `failed` if no update after 10 minutes
4. Implement circuit breaker: If 3 consecutive jobs fail, show "Service temporarily unavailable"

**Phase to address:** Phase 3 (Generation Flow) - User experience during failures.

---

### Moderate: Race Condition in Status Updates

**What goes wrong:** UI shows "Complete" briefly, then reverts to "Processing" due to out-of-order status updates.

**Why it happens:** Polling response with older status arrives after newer status was already shown.

**Prevention strategy:**
1. Include timestamp with every status update
2. Only update UI if new status timestamp > current timestamp
3. Use state machine: status can only progress forward (pending → processing → complete/failed)

**Phase to address:** Phase 3 (Generation Flow) - UI state management.

---

### Moderate: Lost Results on Webhook Failure

**What goes wrong:** AI generation completes, n8n webhook to your app fails, results never stored. User charged but no thumbnails.

**Why it happens:** Single point of failure in webhook delivery. Your app might be deploying or experiencing downtime.

**Prevention strategy:**
1. Store results in Airtable FIRST (n8n workflow already does this)
2. Webhook to app is notification only, not primary storage
3. If webhook fails, results still exist in Airtable
4. Add "Sync from Airtable" fallback for missed webhooks
5. Implement webhook retry logic with exponential backoff

**Phase to address:** Phase 3 (Generation Flow) - Reliability architecture.

**Sources:** [Hookdeck Async Webhooks](https://hookdeck.com/webhooks/guides/how-an-asynchronous-approach-mitigates-scalability-concerns)

---

## File Upload Pitfalls

### Critical: Storage RLS Blocking Legitimate Uploads

**What goes wrong:** File uploads fail with "new row violates row-level security policy" even for authenticated users.

**Why it happens:** Supabase Storage uses the `storage.objects` table with RLS. Without proper policies, all uploads are blocked by default.

**Warning signs:**
- 403 Unauthorized on file uploads
- Works with service role, fails with user token
- Empty storage buckets despite successful-looking uploads

**Prevention strategy:**
1. Create explicit storage policies:
   ```sql
   -- Allow authenticated users to upload to their folder
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'thumbnails' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```
2. Use folder structure: `{user_id}/{filename}` for easy RLS
3. Test uploads with actual user tokens, not service role

**Phase to address:** Phase 1 (Foundation) - Storage setup.

**Sources:** [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

---

### Moderate: Missing Server-Side File Validation

**What goes wrong:** Malicious files uploaded, storage filled with garbage, XSS via SVG files.

**Why it happens:** Relying only on client-side validation (easily bypassed).

**Prevention strategy:**
1. Validate on server (API route or Edge Function):
   - File size (enforce 5MB limit server-side)
   - MIME type (check actual bytes, not just extension)
   - Image dimensions (reject > 4096x4096)
2. Sanitize filenames (remove special characters)
3. For user-uploaded images: re-encode through image processing to strip malicious payloads

**Phase to address:** Phase 3 (Generation Flow) - When handling background image uploads.

---

### Moderate: Presigned URL Expiration Issues

**What goes wrong:** User starts upload, gets distracted, returns to find upload failed because presigned URL expired.

**Why it happens:** Default presigned URL expiration is often 15 minutes. Large files or slow connections exceed this.

**Prevention strategy:**
1. Generate presigned URLs with appropriate expiration (1 hour for upload)
2. Show clear error if URL expires: "Upload link expired, please try again"
3. Don't generate URL until user actually clicks upload

**Phase to address:** Phase 3 (Generation Flow) - Upload UX.

---

## Deployment Pitfalls

### Critical: Environment Variables Not Applied

**What goes wrong:** App works locally, fails in production with "undefined" errors for API keys.

**Why it happens:**
- Env vars added to Vercel but deployment not triggered
- Using wrong environment (Preview vs Production)
- `NEXT_PUBLIC_` prefix missing for client-side vars
- Monorepo using wrong app's env file

**Warning signs:**
- `undefined` or empty string for env vars in production logs
- Features working in Preview but not Production
- "Cannot read property of undefined" errors

**Prevention strategy:**
1. After adding/changing env vars, trigger new deployment
2. Verify environment selection in Vercel dashboard (Development/Preview/Production)
3. Use `NEXT_PUBLIC_` prefix ONLY for variables needed client-side:
   - `NEXT_PUBLIC_SUPABASE_URL` - client needs this
   - `STRIPE_SECRET_KEY` - NO prefix, server only
4. Use `vercel env pull --environment=production` to verify
5. Log env var presence (not values) on app startup

**Phase to address:** Phase 1 (Foundation) - Deployment configuration.

**Sources:** [Vercel Environment Variables](https://vercel.com/docs/environment-variables), [Next.js Env Vars Guide](https://meetpan1048.medium.com/how-to-deploy-a-next-js-app-with-environment-variables-common-mistakes-explained-59e52aadd7e0)

---

### Critical: Build-Time vs Runtime Environment Variables

**What goes wrong:** Changing `NEXT_PUBLIC_SUPABASE_URL` in Vercel doesn't take effect until next build. Each environment needs separate build.

**Why it happens:** Next.js inlines `NEXT_PUBLIC_*` variables at build time. They're baked into the JavaScript bundle.

**Warning signs:**
- Env var shows new value in Vercel, but app uses old value
- Same build artifact pointing to different Supabase projects unexpectedly

**Prevention strategy:**
1. Accept that `NEXT_PUBLIC_*` changes require rebuild
2. For truly runtime configuration, use API route that returns config
3. Keep Supabase URL/anon key stable (they rarely need to change)

**Phase to address:** Phase 1 (Foundation) - Understand before deploying.

---

### Moderate: Webhook URL Not Updated for Production

**What goes wrong:** Stripe/n8n webhooks still pointing to localhost or Vercel preview URL. Payments processed but app never notified.

**Why it happens:** Forgetting to update webhook URLs when moving from development to production.

**Webhook URLs to update:**
1. **Stripe Dashboard:** Webhook endpoint URL
2. **n8n Workflow:** Webhook response URL (if using callback)
3. **Supabase Dashboard:** Site URL and redirect URLs

**Prevention strategy:**
1. Create deployment checklist
2. Use environment-specific webhook endpoints
3. Test webhooks in Stripe/n8n test modes before going live
4. Set up monitoring/alerting for webhook failures

**Phase to address:** Phase 2 (Stripe) and Phase 3 (Generation) - Before production launch.

---

### Moderate: Missing Error Monitoring

**What goes wrong:** Users experience errors you never hear about. Silent failures accumulate.

**Why it happens:** Not setting up error tracking before launch.

**Prevention strategy:**
1. Add Sentry or similar before first production user
2. Set up alerts for:
   - Unhandled exceptions
   - API response times > 5s
   - Webhook delivery failures
   - Auth errors spike
3. Add structured logging for debugging

**Phase to address:** Phase 4 (Polish) - Before public launch.

---

## Phase-Specific Warning Summary

| Phase | Critical Pitfall | Mitigation |
|-------|------------------|------------|
| Phase 1: Foundation | RLS disabled on tables | Enable RLS + policies immediately on every table |
| Phase 1: Foundation | Auth session management | Use @supabase/ssr with middleware, not manual tokens |
| Phase 1: Foundation | Google OAuth redirect mismatch | Configure ALL redirect URLs before testing OAuth |
| Phase 2: Stripe | Wrong webhook secret (test/live) | Separate env vars, verify on startup |
| Phase 2: Stripe | Synchronous webhook processing | Queue events, return 200 immediately |
| Phase 2: Stripe | Wrong webhook events | Use invoice.paid for renewals, subscription.deleted for revocation |
| Phase 3: Generation | Blocking on AI generation | Async pattern: queue + poll/SSE, never wait in API route |
| Phase 3: Generation | No generation timeout | Client-side 8-min timeout, server marks stale jobs failed |
| Phase 3: Generation | Lost results on webhook failure | Store in Airtable first, webhook is notification only |
| Phase 4: Polish | No error monitoring | Add Sentry before first real user |

---

## Sources

### Authentication & Database
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase RLS Complete Guide](https://vibeappscanner.com/supabase-row-level-security)
- [Supabase Security Flaw Analysis](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

### Stripe Integration
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe Webhook Signature Verification](https://docs.stripe.com/webhooks/signature)
- [Stripe Credit-Based Pricing](https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model)

### Async Processing & Deployment
- [Vercel Function Duration Limits](https://vercel.com/docs/functions/configuring-functions/duration)
- [Inngest Next.js Timeout Solutions](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Hookdeck Async Webhook Architecture](https://hookdeck.com/webhooks/guides/how-an-asynchronous-approach-mitigates-scalability-concerns)

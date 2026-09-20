# Regis Marie College — Document Request System (Next.js + Supabase)

A Next.js 14 (App Router) + Supabase portal for Regis Marie College document
requests. Role-aware, deep-blue theme, and four portals working end-to-end.

**Student:** dashboard, new request + GCash QR/number + payment proof upload
(with a class list field for Certificate of Enrollment requests), request
history/tracking, payments, profile, messages.
**Registrar:** dashboard, manage requests (status updates, blocked from
releasing Good Moral/Diploma until approved), verify payments, diploma
clearance, reports + CSV export, messages.
**Guidance Department:** dashboard, approve/reject Good Moral Certificate
requests before the registrar can release them, messages.
**Admin:** dashboard, manage users (change role, archive/restore — accounts
are never deleted), approve/reject new registrations, import past records via
CSV, analytics with search/filter across status/document/requestor/course,
reports + CSV export, messages.

Email status updates go out automatically via **EmailJS** (see section 5).
There is **one** email path in the app — everything goes through
`lib/email.ts` — so the credentials only need to be configured once.

## 1. Supabase setup

1. Create a project at https://supabase.com.
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
   This creates all tables, the `profiles` auto-provisioning trigger, Row Level
   Security policies, and a private `payment-proofs` storage bucket.
3. In the SQL Editor, run the remaining migrations **in order**:
   - `supabase/migrations/002_features.sql` — **run the first line
     (`alter type user_role add value ...`) by itself**, then run the rest of
     the file in a second query (Postgres won't let a brand-new enum value be
     used in the same transaction that created it). Adds the `guidance` role,
     Good Moral/Diploma approval columns, and the class-list field.
   - `supabase/migrations/003_security_hardening.sql` — hardens the
     registration trigger and updates the `is_staff()` helper.
   - `supabase/migrations/004_portal_updates.sql` — request `request_events`
     audit trail (with a status-change trigger and backfill), rejection-reason
     enforcement triggers, the `account_rejections` log, and the sequential
     `RMP-YYYY-NNNN` receipt-number trigger. This file is fully additive and
     safe to run in one query after the three files above. It also reclassifies
     legacy auto-verified walk-in payments back to Pending so the registrar can
     approve them (run it once, after your data is loaded).
4. Go to **Project Settings → API** and copy the **Project URL**, **anon
   public key**, and **service role key**. The service role key is a secret —
   it is never committed (see `.env.local.example`) and powers the auth API
   routes (email verification, password reset).
5. Create your first admin/registrar/guidance accounts by registering through
   the app (`/register` currently signs people up as `student`), then in the
   SQL editor run:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
6. **Email verification** is on by default in Supabase: new sign-ups get a
   confirmation email and can't sign in until they click it (the app's
   `/register` page shows a "check your email" screen, and `/auth/confirm`
   handles the confirmation link). To customize it:
   - **Auth → Providers → Email**: toggle "Confirm email" on/off.
   - **Auth → URL Configuration**: add your site's URL (and
     `http://localhost:3000` for local dev) to the redirect allow-list, or
     the confirmation link will fail.
   - **Auth → Email Templates**: edit the "Confirm signup" template if you
     want Regis Marie branding in the email itself.
   - The login page has a "Resend verification email" link that appears if
     someone tries to sign in before confirming.

## 2. Local development

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and the NEXT_PUBLIC_EMAILJS_* values

npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

> `emailjs` works without `@emailjs/browser` — all emails are sent from the
> server via `lib/email.ts` using the REST API, so no public keys ship in the
> browser bundle.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Regis Marie College document request portal"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`node_modules`, `.next`, and `.env.local` are gitignored — secrets never land
in the repo.

## 4. Deploy on Vercel

1. https://vercel.com → **Add New Project** → import the GitHub repo.
2. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
   - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
   - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
3. Deploy. Every push to `main` will auto-redeploy.

## 5. Email status updates (EmailJS)

Whenever a registrar changes a request's **status**, the student gets an
email (plus an in-app notification). Emails only send on an actual change —
updating a request to the status it already has does not fire a duplicate
email.

1. Create a free account at https://www.emailjs.com.
2. **Add a service** (any supported provider) and note its **Service ID**.
3. Create an **Email Template** with `{{to_email}}`, `{{subject}}`, and
   `{{message}}` variables and note its **Template ID**.
4. From **Account → General**, copy your **Public Key**.
5. Put all three into `.env.local` (see `.env.local.example`):
   `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`,
   `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`.
6. Add the same variables in Vercel for production.

That's it — verification, password-reset, approval, and status-change emails
all route through `lib/email.ts`. To change the wording, edit
`lib/email-templates.ts`.

## 6. Fixing Supabase's email rate limit

Supabase's **free built-in email sender** (used for its own verification/reset
links) is capped very low — around 2–4 emails per hour. The app's own
transactional emails bypass this because they use EmailJS, but Supabase's
built-in "Confirm signup" / "Reset password" emails still use it. Connect any
SMTP provider (Resend, Gmail, etc.) in **Authentication → Settings → SMTP
Settings** to lift that limit:
- Host: your provider's SMTP host
- Port: `465` or `587`
- Username / Password: your provider's credentials
- Sender email: an address on a verified domain

## Design notes

- The app is a **portal**: public landing page at `/`, role-aware navigation,
  sticky top bar, notification bell, and a mobile drawer.
- Color scale lives in `tailwind.config.ts` under `brand.50`–`brand.950` with
  an accent `gold` — edit those hex values to shift the whole app's shade in
  one place.
- `app/(dashboard)/layout.tsx` is a server component that loads the signed-in
  user's profile (name + role) and feeds it to the layout shell. Every role's
  pages live under `app/(dashboard)/<role>/...` and automatically get it.
- Shared styles live in `app/globals.css` (`.card`, `.btn-primary`,
  `.btn-outline`, `.input`, `.label`, `.badge`, `.skeleton`).
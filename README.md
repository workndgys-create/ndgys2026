# New Delhi Global Youth Summit 2026

A full-stack event platform for a youth diplomacy summit — public marketing site, a passwordless **delegate dashboard**, and an RBAC **admin console** — with online payments, **QR delegate tickets**, **PDF invoicing**, and transactional email via **Resend**.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind · Prisma/PostgreSQL · Razorpay · jose · Zod**. All money is handled in **paise**.

---

## Stage 3 — live allocations, RBAC, badging & CMS

- **Live portfolio allocations** on the home page (`/api/allocations` + `AllocationsLive`), polling every 30s with committee filters, search and a live "updated Ns ago" indicator. Names are masked (`Aanya R.`). Gated by the **Allocations live** switch.
- **Admin portfolio-assignment editor** (`/admin/allocations`) — pick a committee, assign each PAID delegate a country/role, save inline. This is the data source for the live section.
- **Roles & access per level (RBAC)** — `SUPER_ADMIN` / `ADMIN` / `VIEWER` via a central permission map (`src/lib/permissions.ts`), enforced server-side on every mutation and used to hide nav/actions client-side. Optional per-user `extraPermissions` / `deniedPermissions` overrides. Manage people under **Team & Roles** (`/admin/team`).
- **Settings** (`/admin/settings`) — runtime switches stored in the DB (`Setting` table): home content live, allocations live, registration open. Super-admin only.
- **Delegate badging** — print-ready PDF badges (name, committee, portfolio, delegate ID, check-in QR; committee colour band) via `src/lib/badge.ts`. Delegates download their own from the dashboard; admins bulk-print per committee (`/admin/badges`) or per delegate from the registrations table.
- **Content CMS → home page** — create/edit/publish **Events, Competitions, Event Flow and Speakers** (`/admin/events|competitions|flow|speakers`). Published items appear on the home page immediately (home page is `force-dynamic`), gated by the global **home content live** switch.

## Stage 4 — portfolio selection, 10-minute hold & solo/group competitions

- **Portfolio picker at registration.** After choosing a committee, delegates see that committee's portfolios with live availability (available / on-hold / taken) and must select one before paying. On successful payment the portfolio is **auto-assigned** to them.
- **10-minute hold/lock.** Selecting a portfolio and starting payment places an **atomic hold** (a guarded conditional DB update — no Redis/worker). A visible MM:SS countdown runs during checkout. If payment fails, the modal is dismissed, or the timer lapses, the portfolio **reopens automatically** (expired holds are swept lazily on every availability read; an optional `GET /api/cron/release-holds` is included for a scheduler). The window is configurable via the `portfolio.holdMinutes` setting (env fallback `PORTFOLIO_HOLD_MINUTES`, default 10).
- **Solo / group competitions.** Cultural events (e.g. Solo Singing, Group Dance, Battle of the Bands) accept **solo or group** entries. The registration form at `/competitions/[slug]/register` adapts to each competition's `format` (SOLO / GROUP / BOTH): group entries collect a team name and a dynamic member list bounded by `minTeam…maxTeam`, with the fee computed per participation. Competition payments reuse the same Razorpay verify/webhook via a dispatcher that routes a paid order to either a delegate registration or a competition entry.
- **Admin.** New **Portfolios** manager (CRUD per committee) and **Competition Entries** console (filter by competition / status / solo-group, expand team members, CSV export). The competition CMS gains `format`, team sizes, per-side fees and a registration open/closed toggle. Manual allocation overrides in **Allocations** stay in sync with the portfolio table.

## Stage 5 — growth & delegate-experience features

- **Payment-abandonment nudge.** `GET /api/cron/abandonment-nudge` emails delegates who started checkout (PENDING, unpaid, 1–24h old) a "complete your registration" link, once each (idempotent via `nudgedAt`). Wire it to an hourly scheduler.
- **Promo / early-bird / school codes.** A `PromoCode` model (percent or flat, optional usage cap, expiry, committee scope). Delegates apply a code on the registration form to preview the discount; it's revalidated server-side before the Razorpay order and consumed on payment. Managed under **Admin → Promo Codes**. Seeded samples: `EARLYBIRD` (15%), `SCHOOL25` (25%), `DELHI500` (₹500 off).
- **Delegation (school group) registration.** `/delegation/register` lets one coordinator register and pay for many delegates in a single Razorpay order; on payment every member is marked PAID, gets a delegate id + QR ticket email, and can sign in to their own dashboard. Optional per-delegate portfolios are held atomically and rolled back together if any is taken. Visible under **Admin → Delegations**.
- **Background guides per committee.** Admins upload a PDF per committee under **Admin → Study Guides** (stored in the DB, ≤15MB); every *paid* delegate of that committee can download it from **Dashboard → Study Guides**.
- **Add to calendar.** A valid `.ics` invite is attached to every confirmation email and downloadable from the ticket page.
- **My Schedule + committee roster.** A personalised agenda highlights the delegate's own committee sessions; an opt-in roster shows which portfolios in their committee are filled (names masked, opt-out respected).
- **Real-time announcements.** The dashboard subscribes to `GET /api/delegate/announcements/stream` (Server-Sent Events) for instant updates, falling back to polling where SSE isn't available.
- **PWA + offline ticket.** The app is installable (`manifest.webmanifest` + service worker); the ticket and QR are cached so they open offline at the venue.
- **Self-serve cancellation + waitlist promotion.** Delegates can cancel from their dashboard, which releases their portfolio and — for a paid seat — automatically emails the next waitlisted person an invite to register.

_Wallet note: a fully signed Apple Wallet `.pkpass` / Google Wallet pass needs Apple/Google signing credentials, so this ships with the standards-based `.ics` calendar invite instead; wiring real wallet passes is a drop-in once those certificates are provided._

## Stage 6 — richer intake forms, new competition roster & MUN background guides

- **Expanded registration forms.** Both the MUN and competition forms now collect age, place/city, gender, an emergency contact, "how did you hear about us", and a free-text "anything you'd like us to know". Competition team entries also capture a team name, leader name/email/number, a bounded member list (max set per competition, typically 4–5), and a short past-experience note. (New fields are stored on `Registration` / `CompetitionRegistration`; the Zod schemas keep them optional server-side while the UI marks them required.)
- **MUN still picks committee → portfolio**, unchanged, now inside the richer form.
- **New competition roster (seeded):** Bandish (team), Shaam-e-Mehfil (solo), Solo Singing (solo), Stock Sense (solo), Greenovation Showdown (team), IPL Auction (team), Film Making (registration pending), Marketing Mayhem (solo or team) — plus the Best Delegate recognition. Admins can add more and edit format/fees/team sizes under **Admin → Competitions**. Competition-entry CSV export now includes the new intake columns.
- **MUN background guides with email-on-upload.** A dedicated **Admin → Background Guides** screen: name the guide, choose "All MUN delegates" or a specific committee, attach a PDF, and hit **Upload & send**. The guide is stored and the targeted *paid* MUN delegates are emailed (via Resend) that a new background guide is available; it appears in **Dashboard → Study Guides** under a "Background guides (MUN)" section. (This is separate from the per-committee study guides/guidelines, which remain download-only.)

## Stage 7 — bulk uploads, custom questions, live portfolio board, Cashfree & new dates

- **Bulk portfolio upload.** **Admin → Portfolios → Bulk add** takes a long list at once — either pick one committee and paste names (one per line), or paste mixed `committee, portfolio` rows (committee by slug or name). Duplicates are skipped. Built for 70–80 portfolios across 7–8 committees in seconds.
- **Bulk delegate upload (school delegations).** `/delegation/register` now has a **Bulk add** box: paste `Name, Number, Committee` per line (email optional; tabs/commas/semicolons all parse), and it fills the delegate rows — paste straight from a spreadsheet. Member email/phone fall back to the coordinator's where omitted.
- **Per-competition custom questions.** Each competition can carry custom prompts (set in **Admin → Competitions** as one question per line) that render on its entry form; answers are stored and exported in the entries CSV. Seeded: **Spark Tank** & **Greenovation Showdown** ask "What is your pitch idea?", **Shaam-e-Mehfil** asks "What is your dance form? (short description)". Spark Tank is added to the roster.
- **Live portfolio allocations on the home page.** The homepage now shows an always-live board of every committee's portfolios as chips — dark = allotted, light = open — with a filled/total count. It shows **portfolio names only, never participant names**, and updates as seats are confirmed.
- **Cashfree is the only payment gateway.** Razorpay has been removed entirely. All three payment surfaces (delegate registration, competition entries, school delegations) create Cashfree orders, the client uses the Cashfree JS SDK (`_modal`), payments are confirmed server-side via order status, and `POST /api/payment/cashfree-webhook` runs the same idempotent fulfilment. Adapter: `src/lib/cashfree.ts`; full setup in `docs/CASHFREE.md`. The gateway order id is stored in the `gatewayOrderId` column.
- **Dates & venue updated everywhere:** **22–23 August 2026 · IIT Delhi, New Delhi** (site, metadata, ticket, badge, invoice, emails, calendar invite, countdown, seed defaults).

## Stage 8 — secretariat, sponsors, venue/travel, consent & code of conduct

- **Secretariat / organizing-committee** — admin-managed under **Admin → Secretariat** (name, role, photo URL, bio, publish). Renders as a team section on the home page; hidden until members are added.
- **Sponsors & partners** — **Admin → Sponsors** (logo, website, tier, publish). Home-page partner wall plus an always-visible **"Partner with us"** CTA (`mailto:partnerships@…`).
- **Venue & travel** — a public `/venue` page with an embedded Google map, full address, and how-to-reach (metro / air / parking), all editable in **Admin → Settings → Venue, travel & safety**. Stay/travel/nearby listings are admin-managed under **Admin → Stay & Travel** and shown on the same page; until added, a friendly "coming soon" note appears.
- **Explicit consent at registration** — every form (MUN, competition, delegation) now has a required "I agree to the Terms and Code of Conduct" checkbox, enforced client- and server-side and stored on the record.
- **Guardian consent for minors** — when a delegate/participant enters an age under 18, the form reveals required parent/guardian name, contact, and a guardian-consent checkbox (also enforced server-side). The delegation form has the coordinator affirm consent on the group's behalf.
- **Code of Conduct & safety** — a public `/code-of-conduct` page (anti-harassment, protection of minors, on-site safety, consequences) with a grievance desk email/phone pulled from settings. Linked from the footer and from the consent checkbox on every form.

## Stage 9 — paid-only delegate panel & a Google-Forms-style registration builder

- **Delegate panel is unlocked only after payment.** The sign-in link is issued solely to emails with a **PAID** registration; an unpaid registrant gets a clear "your panel unlocks once payment is complete" message instead of a link, and `currentDelegate()` resolves only PAID registrations, so the dashboard can't be reached before confirmation.
- **Registration form builder (like Google Forms).** A new **Admin → Form Builder** lets admins add, edit, reorder, require, show/hide and delete custom questions of four types — short answer, paragraph, multiple choice (radios) and checkboxes (with their own options). Published questions render on the delegate registration form; required ones are enforced on both client and server; answers are stored per registration and included (flattened) in the **registrations CSV export**, which now also carries age, gender, city, emergency contact, consent and guardian details.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env        # then fill in the values (see below)

# 3. Database — create the schema and seed admin + tracks + sample content
npm run db:push
npm run db:seed

# 4. Run
npm run dev                 # http://localhost:3000
```

Default seeded admin (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`):
`admin@nesummit.in` / `ChangeMe123!` — **change this in production**.

---

## Environment

All variables are validated at boot by `src/lib/env.ts`; the app refuses to start with an invalid config. See `.env.example` for the annotated list. Highlights:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Signs admin + delegate session cookies (>=16 chars) |
| `NEXT_PUBLIC_BASE_URL` | yes | QR verify links, sitemap, magic-link URLs |
| `RAZORPAY_KEY_ID` / `_SECRET` | for payments | Server credentials |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | for payments | Browser checkout key |
| `RAZORPAY_WEBHOOK_SECRET` | for payments | Verifies the server-to-server webhook |
| `RESEND_API_KEY` | optional | If unset, email is **logged and skipped** (dev-safe) |
| `MAIL_FROM` | optional | Must be on a **Resend-verified domain** |
| `MAIL_ADMIN_TO` | optional | Recipient for admin notifications |

### Resend setup
1. Create an API key at [resend.com](https://resend.com).
2. **Verify your sending domain** in the Resend dashboard and set `MAIL_FROM` to an address on it. The `onboarding@resend.dev` sandbox only delivers to your own account email — fine for a first test, not for delegates.
3. Without `RESEND_API_KEY`, every send no-ops and is logged, so local development never fails on email.

---

## Payment + fulfilment flow

```
Browser                     Server                         Razorpay
  |  POST /api/register        |                               |
  | -------------------------> |  create PENDING registration  |
  |                            | ----- create order ---------> |
  | <---- orderId, keyId ----- |                               |
  |  open Razorpay checkout ---------------------------------> |
  |                            |                               |
  |  on success (handler):     |                               |
  |  POST /api/payment/verify  |                               |
  | -------------------------> |  verify signature -> fulfil   |
  |                            |                               |
  |            +---------------+-- webhook (source of truth) --+
  |            |  POST /api/payment/webhook (payment.captured) |
  |            |  verify x-razorpay-signature -> fulfil        |
```

**`fulfilPaidRegistration()`** (in `src/lib/fulfilment.ts`) is **idempotent** and runs from *both* the client verify call and the webhook. It:
1. marks the registration `PAID` and assigns a unique **delegate ID** (`NDGYS-2026-XXXX`),
2. creates a sequential **Invoice** (`NDGYS/2026/0001`),
3. generates a **QR code** + a branded **PDF invoice**, and
4. emails the delegate (invoice attached) and notifies the admin — via **Resend**.

Because the webhook is the source of truth, fulfilment completes even if the user closes the tab before the verify call returns.

---

## Features

### Public site
Landing page (hero, stats, live committee cards, resources, FAQ, contact) plus `/about`, `/committees` + `/committees/[slug]` (live seats; **waitlist** when full), `/schedule`, `/verify/[id]` (QR check-in confirmation), and legal pages. SEO: per-page metadata, generated `opengraph-image`, `sitemap.ts`, `robots.ts`. Public forms carry a honeypot and are rate-limited.

### Delegate dashboard (`/dashboard`) — passwordless
Email -> **magic link + 6-digit OTP** (via Resend). Tokens are single-use, hashed (SHA-256), expire in 15 min, and the request endpoint is **enumeration-safe**. Pages: overview (status, live countdown, pending-payment CTA), my registration (+ **invoice PDF download**), printable **QR ticket**, editable profile. All `/api/delegate/**` routes are strictly self-scoped via the session cookie.

### Admin console (`/admin`) — RBAC
Roles `SUPER_ADMIN` / `ADMIN` / `VIEWER`. Sidebar dashboard with KPI cards and dependency-free SVG charts (14-day registrations, capacity bars, experience donut) + recent-activity feed. **Registrations**: search / filter / paginate, change status, **CSV export**, add **offline** registrations. **Check-in**: scan/search by delegate ID or email, mark day 1/2. **Messages**: handled toggle + reply. **Announcements**: create with audience targeting (all / paid / track). Every mutation writes an `AdminAction` audit row.

### Security
`src/middleware.ts` guards `/admin/**`, `/dashboard/**`, and their APIs (redirects pages, 401s API). Separate signed cookies for admin vs delegate. In-memory token-bucket rate limiting (`src/lib/ratelimit.ts`, swap the Map for Upstash in production). Razorpay payment **and** webhook signatures verified with timing-safe comparisons.

---

## Testing

```bash
npm run test         # unit + component (Vitest)
npm run typecheck    # tsc --noEmit
npm run test:e2e     # Playwright (needs the app running + a test DB)
```

Unit/component coverage includes: Zod schemas, env validation, QR generation (PNG signature), invoice PDF (valid %PDF buffer), Resend no-op-without-key, delegate token/OTP + JWT round-trip, rate limiter, and Razorpay payment + webhook signature verification. **32 tests pass.**

---

## What's fully built vs. scaffolded

_Stage 4 adds: portfolio selection + auto-assignment, the 10-minute atomic hold with auto-release + countdown, and solo/group competition registration with adaptive forms, per-competition fees, an admin portfolios manager and a competition-entries console._

**Fully implemented & wired:** the entire backend (all lib + API routes), QR + PDF invoicing + Resend, the payment/webhook fulfilment, the passwordless delegate dashboard, the admin dashboard / registrations / check-in / messages / announcements pages, the public committees / about / schedule / verify / legal pages, middleware, seed, and the unit suite.

**Scaffolded / intentionally minimal (extend as needed):**
- Admin **Payments reconciliation** and one-click **Razorpay refund** are described in the data model and email templates (`refundProcessed`) but the refund API route + UI button are left as a follow-up.
- Admin **content CMS** for editing Speakers / Schedule / Resources from the UI: data + seed exist; inline editors are not built (edit via seed or `prisma studio` for now).
- **Team & Settings** (invite/disable admins, global open/close toggle): roles + `requireRole` helper exist; the management screens are not built.
- Speaker/Resource **public detail pages** beyond the landing sections.

---

## Notes

- **Invoices** are rendered with `pdfkit` (built-in Helvetica — no font files to ship) for reliable server-side generation; the QR is embedded directly. (The original plan named `@react-pdf/renderer`; `pdfkit` was chosen for robustness and is tested to emit a valid PDF.)
- **Charts** are hand-rolled SVG to keep the dependency footprint small — swap in a chart library if you prefer.
- The `Track` catalogue lives in both the DB (`Track` table) and `src/lib/validation.ts` (`TRACKS`); the seed keeps them in sync, and runtime reads fees/capacity from the DB so seats update live.

> **Build note:** `next build` and the Playwright e2e suite require the Prisma query-engine binary, which Prisma downloads automatically on `prisma generate`/`npm install` on your machine. (`npm run typecheck` and `npm run test` pass without it.)

## Deploy (Vercel)
1. Push to a Git repo and import into Vercel.
2. Add all env vars from `.env.example` (use production Razorpay + a verified Resend domain).
3. Point a Razorpay webhook at `https://<domain>/api/payment/webhook` (events: `payment.captured`, `order.paid`) and set `RAZORPAY_WEBHOOK_SECRET`.
4. `build` runs `prisma generate && next build`. Run `prisma migrate deploy` (or `db push`) and `db:seed` against your production database once.

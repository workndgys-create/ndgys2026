# Copilot / Claude prompt — Stage 3 super-prompt

Paste this to regenerate the Stage-3 capabilities (live allocations, RBAC, badging, CMS, portfolio editor) on top of the Stage-1/2 codebase.

---

Extend the New Delhi Global Youth Summit 2026 app (Next.js 14 App Router + TypeScript + Tailwind + Prisma/PostgreSQL, Razorpay, jose, Zod, Resend, `qrcode`, `pdfkit`) with: (A) live MUN portfolio allocations on the home page, (B) admin role & access management per level, (C) delegate badge generation, (D) an admin content CMS for events, competitions, event flow and speakers that appears on the home page once published, and (E) an admin portfolio-assignment editor. Match the editorial design system (navy `#1A1A3E`, gold `#C9A24B`, cream `#F7F4EC`, Fraunces + Libre Franklin). Reuse `SectionKicker`, `Reveal`, the card look from `src/components/Tracks.tsx`, `src/components/admin/Shell.tsx`, `src/lib/qr.ts`, `src/lib/invoice.ts`, `src/lib/adminSession.ts`, `src/lib/auth.ts`. Introduce no new dependencies. Output complete files and a Prisma migration.

**Global conventions:** every public item has a `published` boolean + `order` int; home-page sections read live from the DB (`export const dynamic = "force-dynamic"`). Add a `Setting` model (`key` unique, `value`) for runtime flags — seed `home.published`, `allocations.live`, `registration.open` — with a `getSetting(key, fallback)` helper (env fallback). Public views show only `status = "PAID"` delegates with masked names ("Aanya R.") and never expose email/phone. Every admin mutation writes an `AdminAction` audit row.

### A. Live portfolio allocations
- `getPublicAllocations()` in `publicData.ts` → per committee `{ slug, name, capacity, allocatedCount, seatsRemaining, allocations: { portfolio, delegateName, allocatedAt }[] }` from PAID + non-null `portfolio`, grouped by `trackSlug`, canonical `TRACKS` order, names masked, plus `generatedAt`.
- `GET /api/allocations` (nodejs, no-store) → `{ committees, generatedAt, published }`, `published = getFlag("allocations.live")`; empty when off.
- `AllocationsLive.tsx` (client): poll every 30s (pause on hidden, refetch on focus, manual Refresh), pulsing live dot + "updated Ns ago" `aria-live`, committee filter chips + search, per-committee card with fill bar and `portfolio → delegateName` list, gold flash on new rows, skeleton/empty/error, teaser when `published=false`. Accept `initialData`.

### B. RBAC per level
- `src/lib/permissions.ts`: `can(ctx, action)` from a per-role base map (`SUPER_ADMIN` = `*`; `ADMIN` = ops + content, no team/settings; `VIEWER` = read-only) plus optional per-user `extraPermissions`/`deniedPermissions` (JSON string arrays); `effectivePermissions`, `canFromList`.
- Enforce server-side in every `/api/admin/**` mutation; hide nav/actions in `AdminShell` via `GET /api/admin/me` (returns role + effective permissions).
- **Team** `/admin/team` + `GET/POST/PATCH /api/admin/team` (SUPER_ADMIN): list, invite (temp password), change role/active/overrides; never demote/disable the last active super-admin.
- **Settings** `/admin/settings` + `GET/PATCH /api/admin/settings`: toggle the three flags (SUPER_ADMIN writes, others read-only). `/api/register` honors `registration.open`.

### C. Delegate badging
- `src/lib/badge.ts`: `generateBadgePdf(delegate)` → ~100×150mm lanyard badge (navy header, name, committee + portfolio/role, delegate ID, committee colour band, check-in QR) as Buffer; `generateBadgeSheet(delegates[])` → one badge per page (empty-safe). Use pdfkit built-in fonts.
- `GET /api/delegate/badge` (self, 409 until PAID) + "Download badge" on `/dashboard/ticket`.
- `/admin/badges` + `GET /api/admin/badges?id=` (single) / `?track=` (bulk sheet); per-delegate "Badge" link in the registrations table.

### D. Content CMS → live home page
- Schema: `Competition { slug@unique, title, category, summary, description, prize?, date?, ctaUrl?, imageUrl?, published, order }`, `Event { slug@unique, title, kind, startsAt?, endsAt?, venue?, summary, imageUrl?, published, order }`; reuse `Speaker` and `ScheduleItem` (add `published` to the latter).
- Admin CRUD `/admin/{events,competitions,flow,speakers}` (group "Content") + REST `/api/admin/{events,competitions,schedule,speakers}` (+`/[id]`) gated by `content.manage`, audited; a reusable list+modal+publish/delete manager component.
- Public getters `getPublicCompetitions/Events/Speakers/Flow()` (published-only, ordered, gated by `home.published`) and sections `Competitions.tsx`, `EventsFeatured.tsx`, `Speakers.tsx`, `EventFlow.tsx` that render nothing when empty.

### E. Portfolio-assignment editor
- `/admin/allocations`: committee select → list PAID delegates with an editable portfolio field + inline Save (PATCH `registrations/[id]` `{ portfolio }`), assigned count. Extend that PATCH to accept `status` and/or `portfolio`.

### Home composition
`Hero → About → Stats → AllocationsLive → EventsFeatured → Competitions → Speakers → EventFlow → Tracks → Resources → FAQ → Contact → Footer`, each with its own kicker/anchor.

### Tests (Vitest)
`maskName`, allocation grouping/sort, `can()` tiers + overrides, `generateBadgePdf`/`generateBadgeSheet` emit `%PDF`, `getSetting` fallback; keep existing tests green. Keep prisma-importing modules out of unit tests (extract pure logic, e.g. `maskName` → `src/lib/names.ts`).

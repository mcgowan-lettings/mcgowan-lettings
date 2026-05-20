# McGowan Lettings

Premium letting-agent website for David McGowan (McGowan Residential Lettings Ltd). Public marketing site + property listings + a custom admin where David manages properties, blog posts, and form submissions by hand (he has no property-management software). Built by Viktor. **Commit and push straight to `main` — no feature branches, no PRs, for the small fixes that make up most work here.**

## Stack

Next.js 16.2 (App Router, Server Actions) · React 19 · Supabase (Postgres + Auth + Storage) · Resend (transactional email) · Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config`) · TipTap (blog rich-text) · Plyr + Fancyapps (galleries/video) · mediabunny (client-side video transcode) · Vercel hosting (deploy via GitHub integration on push). TypeScript strict. ESLint 9 flat config (`eslint.config.mjs`). No test framework. npm-managed. Path alias `@/*` → `./src/*` — use it, don't write deep relative imports.

## Commands

- `npm run dev` — dev server (localhost:3000)
- `npm run build` — production build (this is also the typecheck gate; there is no separate `tsc` script and no CI — a clean `build` is the bar before pushing)
- `npm run lint` — ESLint
- One-off content scripts: `node --env-file=.env.local scripts/<name>.mjs` (they read `process.env` directly with no dotenv loader, so env must be injected; needs Node 20+ for `--env-file`)

## Tools available

- `gh` CLI
- `vercel` CLI — project is under the `web-admin@` Vercel account; the local CLI **isn't** logged into it, so don't try to `vercel link` or deploy. Deploys happen via the GitHub integration on push to `main`.
- `supabase` CLI — linked to the `mcgowan-lettings` project. Schema lives in the dashboard; `supabase/migrations/` only appears if you run `supabase db pull` (today only `supabase/.temp/` cache exists, gitignored).
- Playwright MCP — before using it, check whether the dev server is running on `localhost:3000` and start it with `npm run dev` (background) if it isn't.

## Auth & security model (get this right — it's the core invariant)

There is **no middleware/proxy and no Supabase RLS enforcement in the app's data path.** Authorization is entirely a code convention:

1. **Every admin mutation is a server action that takes `accessToken: string` as its last argument and calls `await requireAdmin(accessToken)` first.** `requireAdmin` (`src/lib/auth.ts`) verifies the Supabase token via `supabaseAdmin.auth.getUser()` and checks the email against the `ADMIN_EMAILS` allowlist (throws `Unauthorized` / `Forbidden`). Skipping this on a new mutating action is a privilege-escalation hole — the service-role client bypasses everything else.
2. **Admin pages pass the token from the client.** The client reads `supabase.auth.getSession()` and threads `session.access_token` into each action call. `src/app/admin/layout.tsx` is a **client-side gate only** (redirects non-admins for UX) — it is *not* a security boundary. Real enforcement is per-action via convention 1.
3. **`supabaseAdmin` (`src/lib/supabase-server.ts`) uses the service-role key and bypasses RLS.** Use it only in server actions, server components, API routes, and SEO routes — never ship it to the client. Public read pages use it too (data is public anyway); public form actions use it to insert leads. The browser client `supabase` (`src/lib/supabase.ts`) uses the anon key and is for auth (login) + Storage uploads + orphan cleanup.
4. **The Unsplash route (`src/app/api/unsplash/search/route.ts`) is the one API route — gate it with `requireAdmin`** on a `Bearer` token (returns 401/403). It exists to stop the internet burning David's Unsplash quota; any new API route that touches a paid quota or mutates data needs the same.
5. **Storage uploads go browser → Supabase directly with the anon key.** Authorization for those depends on **Supabase bucket policies set in the dashboard** (the `property-images` bucket must be authenticated-write only) — an infra dependency *not* enforced in code.
6. **Public forms (contact, valuation) use a honeypot field named `website`.** If it's non-empty the action **silently returns success** so bots don't retry. Keep this behaviour on any new public form.

## Conventions you must follow

7. **Revalidate after every mutation.** Admin actions `revalidatePath()` the affected routes. The standard set: property changes hit `/properties`, `/`, and `/properties/${id}`; blog changes hit `/blog` and `/blog/${slug}`. Detail/list pages are ISR (see below), so deletes/deactivations that should 404 immediately *must* explicitly revalidate the item path or the stale HTML serves for up to 60s. Mirror the existing pattern in `src/app/actions/admin.ts`.
8. **One Storage bucket: `property-images`.** Property photos (`properties/`), videos (`properties/videos/`), EPCs (`epc/`), **and blog cover images** all live here — blog covers are not in a separate bucket. Delete actions strip storage objects by splitting the public URL on `/property-images/`.
9. **Compress before upload, transcode video client-side.** Images go through `compressImage` (`src/lib/compress-image.ts`: caps 1600px/q0.75, rejects HEIC). Video goes through `src/lib/video-transcode.ts` (mediabunny/WebCodecs → MP4, 2 GB cap) in the browser. Don't push raw uploads straight to Storage.
10. **Sanitize all rich-text with `sanitizeHtml` (`src/lib/sanitize-html.ts`)** before storing/rendering blog content. It deliberately uses `sanitize-html`, **not** `isomorphic-dompurify` — dompurify pulls in jsdom, which crashes the Vercel serverless SSR pass for `"use client"` rich-text components. Don't swap it back.
11. **Serialise any inline JSON-LD with `safeJsonLd` (`src/lib/json-ld.ts`)**, never bare `JSON.stringify` — it escapes `<`/`</script>`/line-separators to prevent script-tag breakout. Used in `layout.tsx`, `properties/[id]`, `blog/[slug]`, `tenants`.
12. **Read aggregate data through the cached helpers.** Google review count comes from `getReviewCount` (`src/lib/get-review-count.ts`, React `cache`-deduped per request; returns `null` on miss so layout omits `aggregateRating` and the carousel falls back to its default). Don't query `site_config` ad hoc.
13. **`cleanupOrphans` runs on every admin page mount** via `useStorageUsage`. It only deletes files >24h old and caps at 500 deletions per pass (`src/lib/cleanup-orphans.ts`). If you change upload flows, respect the 24h grace window — freshly-uploaded-but-not-yet-saved files would otherwise look like orphans and get nuked.

## Rendering / ISR

Public pages are ISR via `export const revalidate`: home / properties list / property detail / blog list / blog post = **60s**; landlords + `areas/[slug]` = **3600s**. `properties/[id]/photos` is `force-dynamic`. `/admin/**` is `noindex` (set in `next.config.ts` headers, also robots). SEO is wired: `src/app/sitemap.ts` (pulls live properties + blog from Supabase), `src/app/robots.ts`, per-route `metadata`, JSON-LD.

## Images

`next.config.ts` uses a **custom loader** (`src/lib/image-loader.ts`) that routes Supabase Storage URLs through Supabase's free image-transform endpoint instead of Vercel's quota'd optimizer (which once 402'd the whole site). Read the file's header before touching image sizing — it intentionally serves originals at/above the 1600px source cap and only resizes downward, and appends `?_w=N` to external URLs to satisfy Next's loader contract without re-cropping. Remote hosts allowed: `*.supabase.co`, `images.unsplash.com`.

## Data model (Supabase tables)

`properties` · `blog_posts` · `contact_submissions` · `valuation_requests` · `site_config` (key/value; `google_review_count` lives here). Field shapes are the source of truth in `PropertyData` / `BlogPostData` in `src/app/actions/admin.ts`. Property bedrooms include a **Studio** option. Schema itself lives in the Supabase dashboard.

## Routes

Public: `/` · `/properties` (+ `/[id]`, `/[id]/photos`) · `/landlords` · `/tenants` · `/contact` · `/valuation` · `/blog` (+ `/[slug]`) · `/areas` (+ `/[slug]`) · `/privacy` · `/terms` · `/complaints`. Admin (client-gated): `/admin` · `/admin/properties` (+ `new`, `[id]/edit`) · `/admin/blog` (+ `new`, `[id]/edit`) · `/admin/submissions` · `/admin/valuations` · `/admin/login`. One API route: `/api/unsplash/search`.

## Environment variables

`.env.example` is the hint sheet. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_EMAILS` (comma-separated allowlist — gates all admin actions). Optional: `UNSPLASH_ACCESS_KEY` (blog stock-photo picker; route 500s without it but nothing else breaks). **`CRON_SECRET` in `.env.example` is vestigial — there is no cron route or `vercel.json`; ignore it.** Resend is constructed lazily (`src/lib/resend.ts`) so a missing key fails loudly on first send rather than at build, and form leads still save to the DB even if the email fails.

## Design system

Defined in `src/app/globals.css` via Tailwind v4 `@theme` — use these tokens, don't hardcode hexes:
- Brand lime: `--color-brand` `#abd300`, `--color-brand-dark` `#96ba00`, `--color-brand-light` `#c0e233` (use `text-brand`, `bg-brand`, etc.)
- Neutrals: `--color-dark` `#1a1a1a`, `--color-dark-soft` `#2a2a2a`, `--color-cream` `#f8f8f6`, `--color-warm-grey` `#f0f0ec`, `--color-text-muted` `#6b6b6b`
- Fonts: headings = Playfair Display (`--font-heading`/`--font-playfair`, serif), body = Plus Jakarta Sans (`--font-body`/`--font-jakarta`), loaded via `next/font` in `layout.tsx`
- Helpers: `.noise-overlay`, `.text-gradient-brand`, `.animate-fade-in-up` / `.animate-fade-in` / `.animate-slide-down`, `.stagger-1..4`. Animations collapse under `prefers-reduced-motion` — keep that.

Style direction: clean, premium, generous whitespace, mobile-first, large property imagery; reference is **modern-facade.co.uk** (David's confirmed favourite). Logo at `public/mcgowan-logo.png`, hero (Manchester aerial) at `public/hero.jpg`, regulatory/syndication badges in `public/logos`, certificates in `public/certificates`.

## Client & content context

David: in lettings since 2000, founded McGowan Lettings 2007 (25+ years). ~18 active properties (manages manually). Areas: **Bury (main)**, plus Bolton, Manchester, Rossendale + ~20 neighbourhoods — "will cover most areas if the house is in good order". Google reviews are a priority feature. Viktor drafts all copy from the current site (mcgowanlettings.co.uk) for David to review. Fuller competitor/audit notes in `RESEARCH.md`. Live status, support-plan, and infra details live in Viktor's Claude memory, not here (they go stale fast).

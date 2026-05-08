# McGowan Lettings — Website Redesign

## Project Overview
Premium letting agent website for David McGowan (McGowan Lettings). Budget: £4,000.
Client is based in Greater Manchester area. Main area is Bury, also covers Bolton, Manchester, Rossendale — but will cover most areas if the house is in good order.
Started McGowan Lettings in 2007, in the industry since 2000 (25+ years experience).
~18 properties, ~250 rental properties total (many archived). No property management software — manages manually.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Supabase (database + auth)
- Tailwind CSS v4
- Vercel (hosting)

## Design Direction (Confirmed by David)
- **Primary reference: modern-facade.co.uk** — David said "professional and user friendly, exactly what I am after"
- Clean, modern, minimal design like Modern Facade
- Hero: Manchester city centre aerial shot (confirmed by David 5 April 2026)
- Logo: green gradient sphere/orb on black square + "mcgowan residential lettings Ltd." text
- Two variants: (1) black bg + lime green panel, (2) green bg + darker green panel
- Brand colours: lime/yellow-green, black, white — build palette around these
- Generous whitespace, large property images
- Mobile-first responsive design
- Secondary references: Winkworth, Benham & Reeves, Dexters (for letting-agent-specific patterns)

## Key Pages
1. **Home** — hero with Manchester aerial + search bar, services overview, featured properties, testimonials, accreditations, CTA
2. **Properties** — card grid with filters (area, price, bedrooms, type), activate/deactivate for admin
3. **Landlords** — Fully Managed vs Let-Only services, valuation CTA
4. **Tenants** — FAQs, how renting works, move-in costs, responsibilities
5. **Contact** — form + WhatsApp button + map
6. **Admin Dashboard** — David's property management (add/edit/archive/reactivate listings)

## Key Features
- Property card grid with large images, price, beds/baths icons
- Property search with filters (area, price range, bedrooms, property type)
- Activate/deactivate toggle for property management (critical)
- Contact form + WhatsApp button
- Google reviews section — display existing reviews + CTA link for customers to leave a new review
- Free Property Valuation CTA
- Regulatory badges (TDS, SafeAgent, TPO)
- Zoopla/PrimeLocation syndication badges
- Responsive — mobile-first

## Content
- Viktor to draft all wording based on current site (mcgowanlettings.co.uk), David will review and add extras
- Areas covered: Bury (main area), Bolton, Manchester, Rossendale + ~20 neighbourhoods (will cover most areas if house is in good order)

## Assets
- Logo: public/mcgowan-logo.png
- Hero image: Manchester city centre aerial shot (confirmed by David)

## Research
See RESEARCH.md for full competitor analysis, current site audit, and design patterns.

## Status
- Logo received
- Design direction confirmed (Modern Facade style)
- Hero image confirmed (city centre picture) — 5 April 2026
- David confirmed areas, experience (since 2000), Google reviews priority — 5 April 2026
- David stepping back for Easter, giving Viktor space to build
- Building homepage mockup now
- Mockup must be approved before deposit is collected (50% = £2,000)

## Frontend Design Guidelines
When building this site, follow these principles:

### Design Quality
- Create a distinctive, premium design — avoid generic template aesthetics
- Use the Modern Facade site as the primary style reference but adapt for letting agent use case
- Every component should feel intentional and polished
- Whitespace is a feature, not wasted space

### Typography
- Use a refined font pairing — serif for headings (Playfair Display or similar), clean sans-serif for body (Inter or similar)
- Clear hierarchy: hero text > section headings > subheadings > body > captions
- Generous line height and letter spacing

### Colour (from logo)
- Primary: lime/yellow-green (~#A0C814 or similar) — accent colour for CTAs, highlights, hover states
- Dark: black/near-black (#1a1a1a) — header, footer, text
- Light: off-white/light grey (#f8f8f6) — backgrounds
- White (#ffffff) — cards, content areas
- Green gradient from logo orb for subtle design accents

### Layout
- Full-width hero sections with overlaid content
- Card-based property listings with hover effects
- Consistent spacing system (8px grid)
- Sticky navigation header
- Sections alternate between light and slightly darker backgrounds

### Imagery
- Large, high-quality property images
- Hero: aerial/skyline shot of Manchester
- Use aspect-ratio consistent containers for property cards

### Interactions
- Subtle hover effects on cards and buttons (scale, shadow, colour shift)
- Smooth scroll between sections
- Clean form inputs with clear focus states
- Loading states for async operations

### Responsive
- Mobile-first approach
- Single column on mobile, 2 columns on tablet, 3-4 on desktop for property grids
- Navigation collapses to hamburger on mobile
- Touch-friendly tap targets (min 44px)

## Security Model
- **Admin allowlist**: All admin DB mutations go through server actions gated by `requireAdmin()` in `src/app/actions/admin.ts`, which checks the user's email against the `ADMIN_EMAILS` env var. The admin UI is also gated via `checkIsAdmin()` in the layout and login page.
- **Storage uploads**: File uploads (images, videos, EPCs) go directly from the browser to Supabase Storage using the anon key. Authorization for these operations depends on **Supabase bucket policies** configured in the dashboard — not the `ADMIN_EMAILS` allowlist. The `property-images` bucket must be restricted to authenticated users only (no public writes). This is an infra dependency not enforced in code.
- **Public forms**: Contact and valuation forms use a honeypot field (`website`) for bot protection. The server actions silently succeed when the honeypot is filled, so bots don't retry.

## Tools available
- `gh` CLI
- `vercel` CLI — project lives under the `web-admin@` Vercel account; the local CLI session isn't logged into it, so don't try to link. Deploys happen via the GitHub integration on push.
- `supabase` CLI — linked to the `mcgowan-lettings` project. Schema lives in the dashboard; `supabase/migrations/` only appears if you run `supabase db pull`.
- Playwright MCP — before using it, check whether the dev server is running on `localhost:3000` and start it with `npm run dev` (background) if it isn't.

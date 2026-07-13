# New Scouting Design Language

Source inspiration: Ares design language from `/Users/neuroswish/Documents/Projects/ares`.

This project should feel like a quiet, mobile-first command center for Joe's scouting and outreach workflow. Preserve the Ares interaction feel and component proportions, but translate the product language to modeling-agency lead research, Telegram intake, contact search, and lightweight CRM follow-up.

## Core Feel

- White-first product surface, not a marketing site.
- Direct, lightweight, operational, and mobile-aware.
- The next action should be obvious: review activity, search a contact, generate leads, or adjust profile settings.
- Use compact context panels instead of large analytics dashboards.
- Keep the agentic system visible through recent activity and concise status signals, not long instructional copy.

## Palette

Base:

- Background: `#ffffff`
- Main text: Tailwind `text-zinc-950`, `#252525`, or `#262626`
- Muted text: `text-zinc-400`, `text-zinc-500`, or `#8e8e8a`
- Borders: `#ececea`, `#e9e8e3`, `#e7e9ef`, or `#eef0f4`
- Soft panels: `#fafafa`, `#f5f5f5`, or `#f4f5f7`

Actions and accents:

- Primary action: `bg-zinc-950 text-white`, hover `bg-zinc-800`
- Secondary accent: restrained blue or teal only for selected state, focus, sync, success, or agent activity
- Warm accents may appear sparingly for follow-up urgency, but should not dominate the interface

Avoid:

- Full-screen tinted backgrounds
- Dominant purple, blue-gradient, beige, slate, espresso, or one-color themes
- Decorative gradient orbs, bokeh, or abstract hero art

## Typography

- Body: `font-[430]` or `font-[440]`, `leading-6` or `leading-7`
- Meta text: `text-xs` or `text-sm`, `font-[500]` to `font-[560]`
- Nav labels: `text-sm font-[560]`
- Card titles: `text-sm` to `text-base`, `font-[600]` to `font-[650]`
- Screen titles: roughly `text-[30px]` to `text-[34px]`, `font-[680]`, tight leading

Rules:

- Use `tracking-normal`.
- Do not scale font size with viewport width.
- Keep copy short and product-like.
- Use monospace only for URLs, IDs, code, emails, or compact metrics.

## Layout

Common shell:

- `min-h-screen bg-white text-zinc-950`
- Content container: `mx-auto w-full max-w-7xl px-4 sm:px-6`
- Fixed mobile bottom navigation should use safe-area padding and `backdrop-blur`.
- When fixed mobile navigation exists, include enough bottom padding for the last content to remain reachable.

Cards and panels:

- Use white cards with light borders and restrained shadows.
- Radius should usually be `rounded-xl` to `rounded-2xl`; keep repeated operational cards at 8px to 16px.
- Hover movement should be minimal: `hover:-translate-y-px` at most.
- Avoid cards inside cards. Use unframed sections, rows, lists, or full-width bands for structure.

Agent activity surfaces:

- Home should show recent useful work and short metrics, not a decorative hero.
- Use brief event rows with clear status labels.
- Keep summaries concise enough to scan on mobile.

Contact and lead surfaces:

- Search should prioritize quick filtering, contact identity, role/company, and latest outreach state.
- Lead generation should feel like a focused request form, with one dominant brand input and compact option controls.
- Outreach drafts should be readable and reviewable before any send action.

## Controls

Buttons:

- Primary action: compact rounded-full or rounded-xl black button, height `h-8` to `h-10`, `font-[650]`.
- Icon buttons: square or circular, `h-8` to `h-12`, muted icons, subtle hover.
- Use lucide icons when available.

Inputs:

- Search: `h-[44px] rounded-xl bg-[#f5f5f5] px-12`, with a light focus border.
- Forms: rounded light-border inputs with compact labels and clear helper text only when necessary.
- Focus states should be visible but not heavy.

Navigation:

- Desktop nav should be compact.
- Mobile bottom nav should be fixed, white/90, border top `#e9e8e3`, `backdrop-blur-xl`, safe-area aware, and easy to tap.
- Use familiar tab icons plus short labels: Home, Search, Lead Gen, Profile.

Modals and overlays:

- Mobile modals should behave like bottom sheets when practical.
- Desktop modals should be centered white panels with restrained shadows.
- Overlays should be translucent zinc, not opaque.

## Product-Specific Guidelines

- Do not present the product as a generic CRM dashboard.
- Joe should always feel close to the actual workflow: Instagram post, brand, lead, outreach draft, reply/follow-up.
- Prefer named contacts, statuses, and recency over abstract charting.
- When displaying AI research, clearly separate supported facts from inferred or tentative items.
- Do not imply emails have been sent unless the workflow actually sent them.

## Review Checklist

- Does the screen still read as white, quiet, and focused?
- Is the primary next action visible without scanning multiple panels?
- Are borders, shadows, and color accents restrained?
- Are text sizes and weights close to the Ares/New Scouting pattern?
- Does mobile navigation respect safe areas and avoid horizontal overflow?
- Did any decorative background, nested-card layout, or dashboard-heavy surface sneak in?

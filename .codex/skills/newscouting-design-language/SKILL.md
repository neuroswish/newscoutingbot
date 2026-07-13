---
name: newscouting-design-language
description: Apply the New Scouting design language, adapted from the Ares repo, to UI design work in this project. Use when designing, redesigning, reviewing, or implementing frontend components, screens, cards, navigation, forms, mobile tabs, profile surfaces, lead generation flows, or CRM/activity views.
---

# New Scouting Design Language

## Workflow

1. Read `docs/design-language.md` before making design decisions.
2. Inspect the relevant existing source files before editing:
   - Global shell and metadata: `src/app/layout.tsx`
   - Main CRM shell, home/search/profile/mobile tabs: `src/components/contacts-dashboard.tsx`
   - Lead generation form: `src/components/lead-scout.tsx`
   - Global tokens and Tailwind utilities: `src/app/globals.css`
3. Translate the Ares feel to New Scouting's domain: agent activity, Instagram intake, brand lead research, outreach drafts, and contact follow-up.
4. Prefer existing components and Tailwind patterns in this repo before adding new abstractions.
5. After UI changes, run the narrowest validation command and do a browser check for desktop and mobile when layout changes are meaningful.

## Design Priorities

- Start from a white, quiet product surface with zinc/neutral text, light borders, restrained shadows, and direct copy.
- Make the primary workflow obvious: review recent agent work, search contacts, generate brand leads, or manage profile settings.
- Keep navigation compact and safe-area aware, especially fixed mobile bottom tabs.
- Use familiar lucide icons for compact actions when an icon exists.
- Keep mobile first-class: no horizontal overflow, reachable bottom content, stable tab dimensions, and comfortable tap targets.

## Avoid

- Decorative gradient/orb backgrounds, heavy color washes, large analytics dashboards, nested cards, and over-explained instructional text.
- One-off palettes that drift away from Ares neutrals plus restrained blue/teal accent usage.
- Marketing-page heroes when the user is asking for an operational product surface.
- Implying outreach happened automatically unless the implementation actually performed it.

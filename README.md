# New Scouting Management CRM

Local demo CRM for importing agency contacts, researching named brand leads, preparing model partnership outreach, and tracking Gmail replies/follow-ups.

## Stack

- Next.js App Router
- Tailwind CSS
- Bun for package management, scripts, and tests
- Supabase-ready backend helpers for the `newscouting` project
- Bot intake prototype for Telegram/WhatsApp-shared Instagram posts

## Folder Boundary

All app files and generated local state are intended to stay inside:

`/Users/neuroswish/Documents/New project/nsm-crm`

Use project-local caches when installing dependencies:

```bash
cd "/Users/neuroswish/Documents/New project/nsm-crm"
HOME="$PWD/.local-home" \
XDG_CACHE_HOME="$PWD/.local-home/.cache" \
BUN_INSTALL_CACHE_DIR="$PWD/.bun-cache" \
NEXT_TELEMETRY_DISABLED=1 \
bun install --cache-dir "$PWD/.bun-cache"
```

## Run Locally

```bash
cd "/Users/neuroswish/Documents/New project/nsm-crm"
HOME="$PWD/.local-home" \
XDG_CACHE_HOME="$PWD/.local-home/.cache" \
BUN_INSTALL_CACHE_DIR="$PWD/.bun-cache" \
NEXT_TELEMETRY_DISABLED=1 \
bun run db:setup

HOME="$PWD/.local-home" \
XDG_CACHE_HOME="$PWD/.local-home/.cache" \
BUN_INSTALL_CACHE_DIR="$PWD/.bun-cache" \
NEXT_TELEMETRY_DISABLED=1 \
bun run dev
```

Open `http://localhost:3000`.

## Gmail Setup

Create a Google OAuth client for a web app and add this redirect URI:

`http://localhost:3000/api/gmail/callback`

The local SQLite URL is already set to `file:../dev.db`, which Prisma resolves from the `prisma/` folder to the root `nsm-crm/dev.db` file.

Then fill in `.env`:

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/gmail/callback"
```

The app requests `gmail.readonly`, searches by selected contact email, and does not store Gmail message bodies.

## Lead Scout Setup

Create an API key from [Exa's dashboard](https://dashboard.exa.ai/api-keys) and add it to `.env`:

```bash
EXA_API_KEY="..."
```

The `Lead Scout` tab searches professional profiles and public web sources through Exa. It lists public contact information when the returned research includes supporting sources, and prepares an editable outreach draft without sending anything.

## Supabase Setup

Create a hosted Supabase project named `newscouting`, then copy the project URL and publishable key into `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

Supabase client helpers live in `src/lib/supabase`. Do not put service-role or secret keys in `NEXT_PUBLIC_*` variables.

## Prototype Workflow

The default `Outreach` tab is a product demo of the intended workflow:

1. Share or paste an Instagram post into the `Bot Intake` tab.
2. Detect the brand from the shared message/post metadata.
3. Review named marketing/social leads, source evidence, and email confidence.
4. Queue reviewed outreach drafts.
5. Monitor replies, non-replies, and follow-up due dates on the CRM board.

In production, inferred emails should be verified before sending, Gmail send scopes should require an explicit review step, and every outreach email should include the agency identity plus an opt-out line.

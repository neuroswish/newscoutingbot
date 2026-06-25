# Supabase Project

This app is prepared to use a hosted Supabase project named `newscouting`.

## Create and Link

1. Create a new Supabase project in the dashboard named `newscouting`.
2. Open the project's Connect dialog for Next.js.
3. Copy the project URL and publishable key into `.env`.
4. Keep service-role and secret keys server-only. Do not prefix them with `NEXT_PUBLIC_`.

Required app env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

When we add database tables, enable RLS on exposed schemas and add policies that match the access model before exposing user or contact data through the Data API.

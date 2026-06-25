"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserEnv } from "./config";
import type { Database } from "./types";

export function createClient() {
  const { publishableKey, url } = getSupabaseBrowserEnv();
  return createBrowserClient<Database>(url, publishableKey);
}

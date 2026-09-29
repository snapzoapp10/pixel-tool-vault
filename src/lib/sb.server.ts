import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase helpers. Always load these with a dynamic import
 * inside a server-function handler.
 */

export function publicDb(): SupabaseClient {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers });
      },
    },
  });
}

export async function adminDb(): Promise<SupabaseClient> {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin as unknown as SupabaseClient;
}

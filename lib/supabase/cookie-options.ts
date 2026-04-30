import type { CookieOptions } from "@supabase/ssr";

/**
 * One config for createBrowserClient, createServerClient, and middleware.
 * Safari is strict about path / SameSite / Secure; mismatches cause missing
 * session on the server and a blank top nav, redirects, or failed navigation.
 */
export const supabaseCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

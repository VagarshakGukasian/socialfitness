import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First write cookies onto the request so the new response can see them
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          // Create a fresh response that forwards all request headers
          // (including the mutated cookies above). Copy any headers that
          // were already set on the previous response so nothing is lost.
          const newResponse = NextResponse.next({ request });
          supabaseResponse.headers.forEach((value, key) => {
            newResponse.headers.set(key, value);
          });
          supabaseResponse = newResponse;
          // Write the refreshed auth cookies onto the response so the
          // browser (including Safari) actually receives them.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}

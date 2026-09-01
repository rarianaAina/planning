import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/installation"];

export default async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  // Supabase pas encore branché : tout renvoie vers la page d'installation.
  if (!url || !key) {
    if (pathname === "/installation") return NextResponse.next();
    return NextResponse.redirect(new URL("/installation", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Rafraîchit le jeton et le repose dans les cookies de la réponse.
  const { data: { user } } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const target = new URL("/login", request.url);
    target.searchParams.set("suivant", pathname + request.nextUrl.search);
    return NextResponse.redirect(target);
  }

  if (user && (pathname === "/login" || pathname === "/installation")) {
    return NextResponse.redirect(new URL("/mois", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tout sauf les fichiers statiques et les images optimisées.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/installation"];

/**
 * Les préchargements de liens et les requêtes RSC ne doivent pas provoquer
 * la création d'une session invitée : seule une vraie navigation le fait.
 */
function isPrefetch(request: NextRequest): boolean {
  return (
    request.method !== "GET" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1"
  );
}

export default async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  // Supabase pas encore branché : tout renvoie vers la page d'installation.
  if (!url || !key) {
    if (pathname === "/installation") return NextResponse.next();
    return NextResponse.redirect(new URL("/installation", request.url));
  }

  // Les cookies posés par Supabase sont accumulés ici, puis appliqués à la
  // réponse finale — qu'elle soit une continuation ou une redirection.
  const pendingCookies: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const withCookies = (response: NextResponse) => {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, options);
    }
    return response;
  };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  // Rafraîchit le jeton et le repose dans les cookies de la réponse.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (user && (pathname === "/login" || pathname === "/installation")) {
    return withCookies(NextResponse.redirect(new URL("/semaine", request.url)));
  }

  if (!user && !isPublic) {
    // Accès sans compte : une session invitée est ouverte à la volée, si bien
    // que l'application est utilisable immédiatement, sans rien saisir.
    if (isPrefetch(request)) {
      return withCookies(NextResponse.next({ request }));
    }

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      // Connexion anonyme désactivée sur le projet, ou indisponible :
      // on retombe sur l'écran de connexion classique.
      const target = new URL("/login", request.url);
      target.searchParams.set("suivant", pathname + request.nextUrl.search);
      target.searchParams.set("invite", "impossible");
      return withCookies(NextResponse.redirect(target));
    }
  }

  // `request` porte déjà les nouveaux cookies : la page rendue en aval voit
  // la session, sans redirection supplémentaire.
  return withCookies(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    /*
     * Tout sauf les fichiers statiques et les images optimisées.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

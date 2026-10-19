import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OWNER_EMAIL, OWNER_NAME, OWNER_PASSWORD } from "@/lib/owner";

/**
 * Les préchargements de liens ne doivent pas ouvrir de session : seule une
 * vraie navigation (ou une Server Action) le fait.
 */
function isPrefetch(request: NextRequest): boolean {
  return (
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

  // Une session qui n'est pas celle de Colombe (ancien invité) est remplacée.
  const signedIn = user?.email === OWNER_EMAIL;

  if (signedIn && pathname === "/installation") {
    return withCookies(NextResponse.redirect(new URL("/semaine", request.url)));
  }

  if (!signedIn && pathname !== "/installation" && !isPrefetch(request)) {
    const error = await openOwnerSession(supabase);
    if (error) {
      const target = new URL("/installation", request.url);
      target.searchParams.set("compte", "impossible");
      return withCookies(NextResponse.redirect(target));
    }
  }

  // `request` porte déjà les nouveaux cookies : la page rendue en aval voit
  // la session, sans redirection supplémentaire.
  return withCookies(NextResponse.next({ request }));
}

/**
 * Ouvre la session de Colombe. Au tout premier accès le compte n'existe pas
 * encore : on le crée, ce qui ouvre directement la session si la
 * confirmation par e-mail est désactivée sur le projet.
 */
async function openOwnerSession(
  supabase: ReturnType<typeof createServerClient>,
): Promise<string | null> {
  const credentials = { email: OWNER_EMAIL, password: OWNER_PASSWORD };

  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (!error) return null;
  if (!/invalid login credentials/i.test(error.message)) return error.message;

  const { data, error: signUpError } = await supabase.auth.signUp({
    ...credentials,
    options: { data: { display_name: OWNER_NAME } },
  });
  if (signUpError) return signUpError.message;
  return data.session ? null : "confirmation par e-mail requise";
}

export const config = {
  matcher: [
    /*
     * Tout sauf les fichiers statiques et les images optimisées.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

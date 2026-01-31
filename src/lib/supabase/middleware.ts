import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Email admin autorisé - IMPORTANT: Modifier uniquement ici pour changer l'admin
const ADMIN_EMAIL = "linkpehoundagbegnon@gmail.com";

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ===========================================
  // PROTECTION ADMIN - Côté serveur (CRITIQUE)
  // ===========================================
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminLoginPath = pathname === "/admin/connexion";

  if (isAdminPath) {
    // Page de connexion admin - accessible sans auth
    if (isAdminLoginPath) {
      // Si déjà connecté en tant qu'admin, rediriger vers dashboard admin
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      // Sinon, laisser accéder à la page de connexion
      return supabaseResponse;
    }

    // Autres pages admin - Vérification stricte
    if (!user) {
      // Non connecté -> redirection vers connexion admin
      const url = request.nextUrl.clone();
      url.pathname = "/admin/connexion";
      return NextResponse.redirect(url);
    }

    // Connecté mais pas admin -> ACCÈS REFUSÉ
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      // Log la tentative d'accès non autorisé (optionnel, pour monitoring)
      console.warn(`[SECURITY] Unauthorized admin access attempt by: ${user.email} at ${new Date().toISOString()}`);
      
      // Redirection vers la page d'accueil avec message
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    // Admin vérifié -> accès autorisé
    return supabaseResponse;
  }

  // ===========================================
  // PROTECTION DASHBOARD UTILISATEUR
  // ===========================================
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ===========================================
  // PAGES D'AUTH - Redirection si déjà connecté
  // ===========================================
  const authPaths = ["/connexion", "/inscription"];
  const isAuthPath = authPaths.some((path) => pathname === path);

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};

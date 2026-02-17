import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
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

  // Do not run code between createServerClient and supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected routes: redirect unauthenticated users to /login
  if (
    !user &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/tutor") ||
      pathname.startsWith("/parent") ||
      pathname.startsWith("/practitioner"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Helper: get the user's home path based on role
  function getHomePath(role: string | undefined) {
    if (role === 'parent') return '/parent/dashboard';
    if (role === 'tutor') return '/tutor/schedule';
    if (role === 'practitioner') return '/practitioner/dashboard';
    return '/admin';
  }

  // Role-based route enforcement: prevent cross-portal access
  if (
    user &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/tutor") ||
      pathname.startsWith("/parent") ||
      pathname.startsWith("/practitioner"))
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const role = profile?.role;
    const home = getHomePath(role);
    const url = request.nextUrl.clone();

    // Tutor trying to access /admin/* or /parent/* or /practitioner/* → redirect to tutor portal
    if (role === 'tutor' && (pathname.startsWith('/admin') || pathname.startsWith('/parent') || pathname.startsWith('/practitioner'))) {
      url.pathname = home;
      return NextResponse.redirect(url);
    }
    // Parent trying to access /admin/* or /tutor/* or /practitioner/* → redirect to parent portal
    if (role === 'parent' && (pathname.startsWith('/admin') || pathname.startsWith('/tutor') || pathname.startsWith('/practitioner'))) {
      url.pathname = home;
      return NextResponse.redirect(url);
    }
    // Practitioner trying to access /admin/* or /tutor/* or /parent/* → redirect to practitioner portal
    if (role === 'practitioner' && (pathname.startsWith('/admin') || pathname.startsWith('/tutor') || pathname.startsWith('/parent'))) {
      url.pathname = home;
      return NextResponse.redirect(url);
    }
    // Admin/super_admin trying to access /tutor/* or /parent/* or /practitioner/* → redirect to admin
    if ((role === 'admin' || role === 'super_admin') && (pathname.startsWith('/tutor') || pathname.startsWith('/parent') || pathname.startsWith('/practitioner'))) {
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages to their dashboard
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password")
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = getHomePath(profile?.role);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from landing page to their dashboard
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = getHomePath(profile?.role);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as is.
  // If you create a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it: NextResponse.next({ request })
  // 2. Copy over the cookies: supabaseResponse.cookies.getAll().forEach(...)
  // See https://supabase.com/docs/guides/auth/server-side/nextjs

  return supabaseResponse;
}

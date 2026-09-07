import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyAndDecodeAdminSession } from '@/lib/security/auth';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session so it doesn't expire on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard all /admin/* routes — redirect to login if not authenticated
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';
  const adminSessionToken = request.cookies.get('admin_session')?.value;
  const sessionUser = await verifyAndDecodeAdminSession(adminSessionToken);
  const isAuthenticated = !!user || !!sessionUser;

  if (isAdminRoute && !isLoginRoute && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-logged-in users away from login page
  if (isLoginRoute && isAuthenticated) {
    if (sessionUser?.role === 'scorer') {
      const resultsUrl = request.nextUrl.clone();
      resultsUrl.pathname = '/admin/results';
      return NextResponse.redirect(resultsUrl);
    }
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/admin/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  // Role-Based Access Control for 'scorer' role:
  // Scorers only have access to /admin/results
  if (isAdminRoute && sessionUser?.role === 'scorer') {
    const isAllowedScorerRoute =
      request.nextUrl.pathname === '/admin/results' ||
      request.nextUrl.pathname.startsWith('/admin/results/');

    if (!isAllowedScorerRoute) {
      const resultsUrl = request.nextUrl.clone();
      resultsUrl.pathname = '/admin/results';
      resultsUrl.searchParams.set('restricted', 'true');
      return NextResponse.redirect(resultsUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

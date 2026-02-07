import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/app/lib/definitions';
 
export const authConfig = {
  // Current capabilities:
  // - Uses a credentials-based sign-in flow (/login).
  // - Protects /dashboard routes by redirecting unauthenticated users to /login.
  // - Redirects authenticated users away from public routes to /dashboard.
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

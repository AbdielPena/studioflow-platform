import type { NextAuthConfig } from "next-auth";

// Edge-compatible config (sin Prisma, sin bcryptjs)
// La config completa con Credentials provider va en packages/auth/index.ts
export default {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth = nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isOnPlatform = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/crm") ||
        nextUrl.pathname.startsWith("/gallery") ||
        nextUrl.pathname.startsWith("/finanzas") ||
        nextUrl.pathname.startsWith("/facturacion") ||
        nextUrl.pathname.startsWith("/inventario-link") ||
        nextUrl.pathname.startsWith("/settings");

      if (isOnPlatform) return isLoggedIn;
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.systemRole = (user as { systemRole?: string }).systemRole;
        token.companyId = (user as { companyId?: string | null }).companyId ?? null;
        token.branchId = (user as { branchId?: string | null }).branchId ?? null;
      }
      if (trigger === "update" && session) {
        if ((session as { companyId?: string }).companyId !== undefined) {
          token.companyId = (session as { companyId?: string }).companyId;
        }
        if ((session as { branchId?: string }).branchId !== undefined) {
          token.branchId = (session as { branchId?: string }).branchId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as { systemRole?: string }).systemRole = token.systemRole as string;
        (session.user as { companyId?: string | null }).companyId =
          (token.companyId as string | null) ?? null;
        (session.user as { branchId?: string | null }).branchId =
          (token.branchId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

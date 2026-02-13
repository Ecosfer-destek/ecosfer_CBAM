import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Prisma, no Node.js modules).
 * Used by middleware for JWT-based route protection.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.role = u.role;
        token.tenantId = u.tenantId;
        token.tenantName = u.tenantName;
        token.permissions = u.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = session.user as any;
        s.role = token.role;
        s.tenantId = token.tenantId;
        s.tenantName = token.tenantName;
        s.permissions = token.permissions;
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts (requires Node.js runtime)
};

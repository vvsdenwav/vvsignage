import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { authRateLimiter } from "./rateLimit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Rate limit login attempts
        const ip = req?.headers?.['x-forwarded-for'] as string || '127.0.0.1';
        if (!authRateLimiter.check(ip)) {
          throw new Error('Too many login attempts. Try again in 15 minutes.');
        }

        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { organization: true }
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        // Log successful login
        await prisma.auditLog.create({
          data: {
            action: 'USER_LOGIN',
            details: `User ${user.username} logged in`,
            userId: user.id,
            userName: user.username,
          }
        });

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          permissions: user.permissions,
          organizationId: user.organizationId,
          orgStatus: user.organization?.status
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.organizationId = (user as any).organizationId;
        token.orgStatus = (user as any).orgStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).orgStatus = token.orgStatus;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-32-chars-long-12345",
  pages: {
    signIn: "/login",
  }
};

export function requireAdmin(session: any) {
  if (!session || !session.user) return false;
  return (session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPER_ADMIN';
}

export function hasPermission(session: any, requiredPermission: string) {
  if (!session || !session.user) return false;
  if ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPER_ADMIN') return true;
  try {
    const perms = JSON.parse((session.user as any).permissions || '[]');
    return perms.includes(requiredPermission);
  } catch (e) {
    return false;
  }
}
